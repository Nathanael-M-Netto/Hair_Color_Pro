/**
 * Firebase Admin SDK — uso exclusivo em Server Components, API routes e middleware.
 * NUNCA importar em Client Components (bundle do browser).
 *
 * Variáveis de ambiente obrigatórias (sem NEXT_PUBLIC_ — segredos do servidor):
 *   FIREBASE_PROJECT_ID       = arte-de-colorir-cabelos
 *   FIREBASE_CLIENT_EMAIL     = firebase-adminsdk-xxxxx@arte-de-colorir-cabelos.iam.gserviceaccount.com
 *   FIREBASE_PRIVATE_KEY      = -----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
 *
 * Como obter as credenciais:
 *   Firebase Console → Project Settings → Service accounts → Generate new private key
 *   Baixar o JSON e extrair project_id, client_email, private_key.
 */

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

let adminApp: App;

function getAdminApp(): App {
  if (adminApp) return adminApp;

  // Re-usa se já inicializado (Hot Reload do Next.js)
  if (getApps().length > 0) {
    adminApp = getApps()[0]!;
    return adminApp;
  }

  adminApp = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID ?? 'arte-de-colorir-cabelos',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // A private key vem com \n literais — converter para newlines reais
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });

  return adminApp;
}

/**
 * Verifica um Firebase ID Token e retorna os claims decodificados.
 * Retorna `null` se o token for inválido ou expirado.
 *
 * @example
 *   const claims = await verifyIdToken(token)
 *   if (!claims) return { error: 'Não autenticado' }
 *   const uid = claims.uid
 */
export async function verifyIdToken(token: string) {
  try {
    const auth = getAdminAuth(getAdminApp());
    return await auth.verifyIdToken(token, true);
  } catch {
    return null;
  }
}

/**
 * Cria um session cookie Firebase de longa duração (5 dias) a partir de um ID token.
 * Usar em `/api/auth/session` após login bem-sucedido.
 */
export async function createSessionCookie(idToken: string, expiresInMs: number) {
  const auth = getAdminAuth(getAdminApp());
  return auth.createSessionCookie(idToken, { expiresIn: expiresInMs });
}

/**
 * Cache em memória para verificações de session cookie.
 *
 * Por quê? `verifySessionCookie` é chamado em CADA request pelo middleware
 * + em cada Server Component que protege rota. Sem cache, navegar entre
 * /scanner → /history → /profile faz 6 verificações de JWT em segundos.
 *
 * Estratégia: hash o cookie em vez de usá-lo como key (segurança), TTL
 * curto (60s) pra que revogações de sessão sejam reconhecidas em até 1min.
 * Em produção com várias instâncias serverless o cache é por-instância —
 * mas mesmo um warm container reutiliza muito.
 */
const sessionCache = new Map<string, { claims: Awaited<ReturnType<typeof verifyIdToken>>; expiresAt: number }>();
const SESSION_CACHE_TTL_MS = 60 * 1000; // 60s
// TTL menor para o caminho "degradado" (revogação não confirmada por falha de
// rede). Mantém o usuário logado, mas força nova tentativa de checagem completa
// em poucos segundos — evita confiar por muito tempo numa sessão não revalidada.
const SESSION_CACHE_TTL_DEGRADED_MS = 15 * 1000; // 15s

/** Hash simples (FNV-1a) — não precisa ser criptográfico, só evitar guardar a cookie inteira em mem */
function hashCookie(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

/**
 * Verifica um session cookie Firebase e retorna os claims.
 * Resultado é cacheado em memória por 60s para evitar round-trips em
 * navegações sucessivas. Retorna `null` se o cookie for inválido ou expirado.
 */
export async function verifySessionCookie(sessionCookie: string) {
  const key = hashCookie(sessionCookie);
  const cached = sessionCache.get(key);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.claims;
  }

  const auth = getAdminAuth(getAdminApp());

  // Limpa entradas antigas oportunisticamente — evita memory leak em long-runs
  const gc = () => {
    if (sessionCache.size > 100) {
      for (const [k, v] of sessionCache) {
        if (v.expiresAt <= now) sessionCache.delete(k);
      }
    }
  };

  try {
    // Checagem completa (checkRevoked=true) faz uma chamada de rede ao Firebase
    // para confirmar que a sessão não foi revogada.
    const claims = await auth.verifySessionCookie(sessionCookie, true);
    sessionCache.set(key, { claims, expiresAt: now + SESSION_CACHE_TTL_MS });
    gc();
    return claims;
  } catch {
    // A checagem com checkRevoked pode falhar por instabilidade de REDE — e não
    // por a sessão ser inválida. Antes, isso deslogava o usuário (e cacheava o
    // null por 60s, causando logouts em rajada ao navegar pelo app).
    //
    // Aqui revalidamos LOCALMENTE (checkRevoked=false, sem rede): isso confere
    // assinatura e expiração da cookie. Se passar, confiamos na sessão e seguimos
    // (TTL curto, pra reabrir a checagem completa logo). Só deslogamos de fato se
    // a validação local também falhar — aí a cookie é realmente inválida/expirada.
    try {
      const claims = await auth.verifySessionCookie(sessionCookie, false);
      sessionCache.set(key, { claims, expiresAt: now + SESSION_CACHE_TTL_DEGRADED_MS });
      gc();
      return claims;
    } catch {
      sessionCache.set(key, { claims: null, expiresAt: now + SESSION_CACHE_TTL_MS });
      return null;
    }
  }
}
