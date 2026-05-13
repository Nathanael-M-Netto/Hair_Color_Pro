/**
 * Firestore Admin — uso exclusivo em Server Components, API routes e Server Actions.
 * NUNCA importar em Client Components (bundle do browser).
 *
 * Reutiliza a mesma instância do Firebase Admin App inicializada em
 * `src/lib/firebase/admin.ts` para evitar inicializações duplicadas.
 *
 * Resiliência: TODAS as leituras retornam um valor "vazio" (null / []) e
 * TODAS as escritas viram no-op quando o Firestore não está habilitado
 * (erro gRPC code `5 NOT_FOUND`). Isso permite navegar o app inteiro antes
 * de o usuário habilitar o Firestore no Console — basta avisar no log.
 *
 * Como habilitar (uma vez):
 *   https://console.firebase.google.com/project/arte-de-colorir-cabelos/firestore
 *
 * API pública:
 *   getProfile(uid)                       → ProfileDoc | null
 *   upsertProfile(uid, data)              → void
 *   updateProfile(uid, data)              → void
 *   getAnalyses(uid, limit?)              → AnalysisWithId[]
 *   insertAnalysis(data)                  → string (docId)  | '' se desabilitado
 *   getFormulas(userId, analysisId?)      → FormulaWithId[]
 *   insertFormula(data)                   → string (docId)  | '' se desabilitado
 */

import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import type {
  ProfileDoc,
  ProfileInsert,
  ProfileUpdate,
  AnalysisInsert,
  AnalysisWithId,
  FormulaInsert,
  FormulaWithId,
} from './types';

// ── Admin App singleton (compartilhado com firebase/admin.ts) ────────────────

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0]!;
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID ?? 'arte-de-colorir-cabelos',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

function db() {
  return getFirestore(getAdminApp());
}

// ── Resiliência: detector de "Firestore não habilitado" ──────────────────────

let warnedNotEnabled = false;

/**
 * Erros recuperáveis do Firestore que devem virar "vazio" em vez de crash:
 *   5  NOT_FOUND          — database não existe (precisa habilitar no Console)
 *   9  FAILED_PRECONDITION — índice composto faltando (raro nessa arquitetura)
 *   7  PERMISSION_DENIED   — credenciais sem permissão (raro com service account)
 */
function isFirestoreRecoverable(err: unknown): boolean {
  const code = (err as { code?: number })?.code;
  return code === 5 || code === 9 || code === 7;
}

/** Envolve uma operação de leitura; retorna `fallback` se Firestore estiver fora. */
async function safeRead<T>(op: () => Promise<T>, fallback: T, ctx: string): Promise<T> {
  try {
    return await op();
  } catch (err) {
    if (isFirestoreRecoverable(err)) {
      if (!warnedNotEnabled) {
        warnedNotEnabled = true;
        const code = (err as { code?: number })?.code;
        const msg =
          code === 5
            ? 'Firestore Database não habilitado'
            : code === 9
              ? 'índice composto faltando'
              : 'permissão negada';
        console.warn(
          `\n[firestore] ⚠ ${msg} (${ctx}).\n` +
            `   Habilite/configure em: https://console.firebase.google.com/project/` +
            `${process.env.FIREBASE_PROJECT_ID ?? 'arte-de-colorir-cabelos'}/firestore\n` +
            `   Enquanto isso, leituras retornam vazio e escritas são ignoradas.\n`,
        );
      }
      return fallback;
    }
    console.error(`[firestore:${ctx}] erro:`, err);
    throw err;
  }
}

/** Envolve uma operação de escrita; vira no-op se Firestore estiver fora. */
async function safeWrite(op: () => Promise<unknown>, ctx: string): Promise<void> {
  try {
    await op();
  } catch (err) {
    if (isFirestoreRecoverable(err)) {
      if (!warnedNotEnabled) {
        warnedNotEnabled = true;
        console.warn(`\n[firestore] ⚠ escrita ignorada (${ctx}) — Firestore indisponível.\n`);
      }
      return;
    }
    console.error(`[firestore:${ctx}] erro:`, err);
    throw err;
  }
}

// ── Helpers de conversão ─────────────────────────────────────────────────────

/** Converte Timestamp do Firestore para Date JavaScript */
function toDate(ts: unknown): Date {
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts instanceof Date) return ts;
  return new Date(ts as string);
}

/** Converte documento Firestore bruto para AnalysisDoc tipado */
function docToAnalysis(id: string, data: FirebaseFirestore.DocumentData): AnalysisWithId {
  return {
    id,
    userId: data['userId'] as string,
    paletteEntryId: data['paletteEntryId'] as string,
    alturaDeTom: data['alturaDeTom'] as number,
    reflexo: data['reflexo'] as number,
    percentualBrancos: data['percentualBrancos'] as number,
    confianca: data['confianca'] as number,
    imagemPath: (data['imagemPath'] as string | null) ?? null,
    correction: (data['correction'] as Record<string, unknown> | null) ?? null,
    // Campos novos (podem estar ausentes em análises antigas — null como fallback)
    subtom: (data['subtom'] as 'frio' | 'neutro' | 'quente' | null) ?? null,
    labMedio: (data['labMedio'] as { L: number; a: number; b: number } | null) ?? null,
    deltaAoTomMaisProximo: (data['deltaAoTomMaisProximo'] as number | null) ?? null,
    reportTexto: (data['reportTexto'] as string | null) ?? null,
    reportModelo: (data['reportModelo'] as string | null) ?? null,
    createdAt: toDate(data['createdAt']),
  };
}

/** Converte documento Firestore bruto para FormulaWithId tipado */
function docToFormula(id: string, data: FirebaseFirestore.DocumentData): FormulaWithId {
  return {
    id,
    analysisId: data['analysisId'] as string,
    userId: data['userId'] as string,
    formulaJson: data['formulaJson'] as Record<string, unknown>,
    createdAt: toDate(data['createdAt']),
  };
}

// ── Profiles ─────────────────────────────────────────────────────────────────

/**
 * Retorna o perfil de um usuário pelo Firebase UID.
 * Retorna `null` se o documento não existir OU se o Firestore estiver desabilitado.
 */
export async function getProfile(uid: string): Promise<ProfileDoc | null> {
  return safeRead(
    async () => {
      const snap = await db().collection('profiles').doc(uid).get();
      if (!snap.exists) return null;
      const data = snap.data()!;
      return {
        email: data['email'] as string,
        nome: (data['nome'] as string | null) ?? null,
        salao: (data['salao'] as string | null) ?? null,
        avatarUrl: (data['avatarUrl'] as string | null) ?? null,
        createdAt: toDate(data['createdAt']),
        updatedAt: toDate(data['updatedAt']),
      } satisfies ProfileDoc;
    },
    null,
    'getProfile',
  );
}

/** Cria ou atualiza um perfil (merge). No-op se Firestore desabilitado. */
export async function upsertProfile(uid: string, data: ProfileInsert): Promise<void> {
  await safeWrite(async () => {
    const now = FieldValue.serverTimestamp();
    await db()
      .collection('profiles')
      .doc(uid)
      .set({ ...data, createdAt: now, updatedAt: now }, { merge: true });
  }, 'upsertProfile');
}

/** Atualiza campos parciais. No-op se Firestore desabilitado. */
export async function updateProfile(uid: string, data: ProfileUpdate): Promise<void> {
  await safeWrite(async () => {
    await db()
      .collection('profiles')
      .doc(uid)
      .update({ ...data, updatedAt: FieldValue.serverTimestamp() });
  }, 'updateProfile');
}

// ── Analyses ─────────────────────────────────────────────────────────────────

/**
 * Retorna as análises de um usuário, ordenadas da mais recente para a mais antiga.
 *
 * Ordenação feita em memória (não no servidor) — assim a query só precisa do
 * índice single-field automático em `userId`, evitando a necessidade de criar
 * índice composto (`userId` + `createdAt`) manualmente no Console.
 *
 * Trade-off: para >1000 análises por usuário, isso pode ficar lento. Quando
 * chegar nesse ponto, criar o índice composto e voltar a ordenar no servidor.
 */
export async function getAnalyses(uid: string, limit = 20): Promise<AnalysisWithId[]> {
  return safeRead(
    async () => {
      const snap = await db().collection('analyses').where('userId', '==', uid).get();
      const all = snap.docs.map((doc) => docToAnalysis(doc.id, doc.data()));
      all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return all.slice(0, limit);
    },
    [],
    'getAnalyses',
  );
}

/** Insere uma análise. Retorna `''` se Firestore desabilitado. */
export async function insertAnalysis(data: AnalysisInsert): Promise<string> {
  return safeRead(
    async () => {
      const ref = await db()
        .collection('analyses')
        .add({ ...data, createdAt: FieldValue.serverTimestamp() });
      return ref.id;
    },
    '',
    'insertAnalysis',
  );
}

/**
 * Retorna uma análise específica pelo ID + verifica posse (userId casa).
 * Retorna `null` se: id não existe, ou pertence a outro usuário, ou Firestore off.
 *
 * A verificação de posse é defesa-em-profundidade: a rota dinâmica
 * /history/[id] já roda dentro de (app)/ que exige sessão, mas confirmar
 * que o doc pertence ao uid evita IDOR (acesso indevido a recursos por id).
 */
export async function getAnalysisById(
  uid: string,
  analysisId: string,
): Promise<AnalysisWithId | null> {
  return safeRead(
    async () => {
      const snap = await db().collection('analyses').doc(analysisId).get();
      if (!snap.exists) return null;
      const data = snap.data()!;
      if (data['userId'] !== uid) return null; // posse não confere
      return docToAnalysis(snap.id, data);
    },
    null,
    'getAnalysisById',
  );
}

// ── Formulas ─────────────────────────────────────────────────────────────────

/** Retorna fórmulas. Retorna `[]` se Firestore desabilitado. */
export async function getFormulas(
  userId: string,
  analysisId?: string,
): Promise<FormulaWithId[]> {
  return safeRead(
    async () => {
      // Mesma estratégia de getAnalyses: filtra por userId no servidor,
      // ordena em memória — não precisa de índice composto.
      const snap = await db().collection('formulas').where('userId', '==', userId).get();
      let all = snap.docs.map((doc) => docToFormula(doc.id, doc.data()));
      if (analysisId) all = all.filter((f) => f.analysisId === analysisId);
      all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return all;
    },
    [],
    'getFormulas',
  );
}

/** Insere fórmula. Retorna `''` se Firestore desabilitado. */
export async function insertFormula(data: FormulaInsert): Promise<string> {
  return safeRead(
    async () => {
      const ref = await db()
        .collection('formulas')
        .add({ ...data, createdAt: FieldValue.serverTimestamp() });
      return ref.id;
    },
    '',
    'insertFormula',
  );
}
