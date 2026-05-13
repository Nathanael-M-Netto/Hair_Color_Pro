# Hair Color Pro v2 — Documentação Arquitetural

Documento técnico vivo. Atualizar sempre que decisão arquitetural mudar.
README é pra rodar; este aqui é pra **entender por que cada coisa é do jeito que é**.

---

## Índice

1. [Visão geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Autenticação](#autenticação)
4. [Banco de dados (Firestore)](#banco-de-dados-firestore)
5. [Instalação PWA](#instalação-pwa)
6. [Performance](#performance)
7. [Design system](#design-system)
8. [Decisões arquiteturais](#decisões-arquiteturais)
9. [Troubleshooting](#troubleshooting)
10. [Glossário](#glossário)

---

## Visão geral

App PWA Next.js que ajuda cabeleireiros a diagnosticar cor de cabelo e calcular fórmulas de coloração via foto. Mesmos usuários do app Flutter legado (projeto Firebase compartilhado: `arte-de-colorir-cabelos`).

### Princípios

1. **Domínio puro.** Tudo em `lib/colorimetria/` é função pura testável. Zero dependência externa.
2. **Server-first.** Server Components por padrão. Client só quando precisa de browser API.
3. **Resiliência.** Firestore desabilitado, offline, JWT expirado, network flaky — nada disso deve crashar o app.
4. **App-feel.** Tem que parecer app nativo, não site. Status bar fundida, animações 60fps, tap targets ≥44px, feedback tátil universal.
5. **Performance.** Cada navegação <100ms perceived. Caches em todas as camadas (sessão, Firestore, HTTP).

### Estado do projeto

**Funcionando agora:** Auth (login/cadastro/logout), PWA install real (não atalho), Firestore CRUD (perfil/análises/fórmulas), bottom nav, splash screens iOS, error boundary, 404, OG image dinâmica.

**Roadmap (em ordem):**
- **Bloco D** — câmera real + onboarding + checks de qualidade
- **Bloco E** — MediaPipe segmentação + k-means + ΔE2000
- **Bloco F** — Gemini (relatório textual a partir do diagnóstico determinístico) — **concluído**
- **Bloco G** — telas /review e /result
- **Bloco H** — Capacitor wrap (vira app nativo Android/iOS)
- **Bloco I** — testes E2E, Lighthouse CI, telemetria

---

## Arquitetura

### Stack — alto nível

```
┌────────────────────────────────────────────────────────────────┐
│ Browser / PWA standalone                                        │
│  ├─ Client Components (React 19)                                │
│  ├─ Firebase Web SDK (Auth)                                     │
│  ├─ MediaPipe Tasks Vision (segmentação on-device, Bloco E)     │
│  └─ Service Worker (cache + offline shell)                      │
└────────────────────────────────────────────────────────────────┘
                            ⇅
┌────────────────────────────────────────────────────────────────┐
│ Next.js 15 (Node.js runtime)                                    │
│  ├─ Server Components (auth-aware)                              │
│  ├─ middleware.ts (verifica session cookie)                     │
│  ├─ Route Handlers /api/* (auth/profile)                        │
│  ├─ Firebase Admin SDK (verifySessionCookie + Firestore Admin)  │
│  └─ Cache em memória de claims (60s TTL)                        │
└────────────────────────────────────────────────────────────────┘
                            ⇅
┌────────────────────────────────────────────────────────────────┐
│ Firebase                                                        │
│  ├─ Auth (email/password — usuários compartilhados c/ Flutter)  │
│  └─ Firestore (profiles, analyses, formulas)                    │
└────────────────────────────────────────────────────────────────┘
                            ⇅
┌────────────────────────────────────────────────────────────────┐
│ Google Gemini (relatório textual a partir do diagnóstico)       │
└────────────────────────────────────────────────────────────────┘
```

### Estrutura de rotas

| Rota | Tipo | Auth | Notas |
|---|---|---|---|
| `/` | Static (○) | Pública | Landing pré-renderizada |
| `/auth/login` | Static | Pública | Pre-renderizada (sem dados do usuário) |
| `/auth/register` | Static | Pública | idem |
| `/scanner` | Dynamic (ƒ) | Protegida | Greeting personalizada via session cookie |
| `/history` | Dynamic | Protegida | Lista análises do Firestore |
| `/profile` | Dynamic | Protegida | Lê + edita perfil |
| `/api/auth/session` | Route handler | Pública (cria) | Troca ID token por session cookie |
| `/api/profile` | Route handler | Protegida | GET/PATCH perfil |
| `/opengraph-image` | Dynamic (edge) | Pública | OG image via Satori |
| `/robots.txt` | Static | Pública | Gerado por `src/app/robots.ts` |
| `/sitemap.xml` | Static | Pública | Gerado por `src/app/sitemap.ts` |

---

## Autenticação

### Fluxo completo

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Login                                                        │
└─────────────────────────────────────────────────────────────────┘

  Usuário        Client (browser)         Server                 Firebase
    │                  │                     │                       │
    │ "logar"          │                     │                       │
    ├─────────────────→│                     │                       │
    │                  │ signInWithEmailAndPassword(email, senha)    │
    │                  ├─────────────────────────────────────────────→│
    │                  │←──────────────────────────── credential ────┤
    │                  │ credential.getIdToken()                     │
    │                  │ idToken (1h validade)                       │
    │                  │                     │                       │
    │                  │ POST /api/auth/session { idToken }          │
    │                  ├────────────────────→│                       │
    │                  │                     │ verifyIdToken         │
    │                  │                     ├──────────────────────→│
    │                  │                     │←─── claims ───────────│
    │                  │                     │ createSessionCookie   │
    │                  │                     ├──────────────────────→│
    │                  │                     │←─── sessionCookie ────│
    │                  │                     │ upsertProfile(uid)    │
    │                  │                     │ (Firestore)           │
    │                  │←── Set-Cookie __firebase_session ───────────│
    │                  │ HttpOnly, 5 dias    │                       │
    │                  │                     │                       │
    │                  │ router.push('/scanner')                     │
    │                  │                     │                       │

┌─────────────────────────────────────────────────────────────────┐
│ 2. Cada navegação subsequente                                   │
└─────────────────────────────────────────────────────────────────┘

  Browser → request com cookie __firebase_session
          ↓
  middleware.ts (Node.js runtime)
          ↓
  verifySessionCookie(cookie)  ← cache em memória (60s TTL)
          ↓
  rota renderiza Server Component com `claims.uid` disponível
```

### Por que session cookies, não ID tokens

ID tokens Firebase duram só 1h e precisam refresh constante. Session cookies do Firebase duram até 14 dias (configurado pra 5), são HttpOnly (não acessíveis pelo JS = mais seguros contra XSS), e o Admin SDK valida sem chamar Firebase a cada request.

### Cache da verificação

Implementado em `src/lib/firebase/admin.ts`:

```typescript
const sessionCache = new Map<string, { claims, expiresAt }>();
const SESSION_CACHE_TTL_MS = 60_000;

function hashCookie(s: string): string { /* FNV-1a */ }

export async function verifySessionCookie(cookie: string) {
  const key = hashCookie(cookie);
  const cached = sessionCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.claims;
  // ... verifica + cacheia
}
```

**Por quê:** sem cache, navegar entre `/scanner → /history → /profile` faria 6 chamadas ao Firebase Admin (3 middleware + 3 layout/page). Cada uma com round-trip cripto + verificação. Com cache, 1.

**Trade-off:** revogações de sessão (logout em outro device) levam até 60s pra propagar. Aceitável pro caso de uso (cabeleireiro, não banking).

### Por que `runtime = 'nodejs'` no middleware

`firebase-admin` usa módulos Node nativos (`crypto`, `fs`) que **não funcionam em Edge Runtime**. Custo: cold start ~50ms vs Edge. Aceitável.

### Convenções

- Cookie name: `__firebase_session`
- Verificação de presença = O(1) (defesa em profundidade no layout)
- Verificação de validade = `verifySessionCookie` (chama Firebase Admin)
- Middleware redireciona → `/auth/login?next=<rota>` se não autenticado
- Logado tentando `/auth/*` → redireciona pra `/scanner`

---

## Banco de dados (Firestore)

### Por que Firestore (e não Supabase)

O projeto Firebase `arte-de-colorir-cabelos` **já tem usuários** do app Flutter. Migrar pra Supabase Auth quebraria login de quem já existe. Firebase Auth + Firestore mantém compatibilidade total.

### Estrutura de coleções

```
profiles/{uid}                  ← Firebase UID
  email: string
  nome: string | null
  salao: string | null
  avatarUrl: string | null
  createdAt: Timestamp
  updatedAt: Timestamp

analyses/{autoId}
  userId: string                ← Firebase UID
  paletteEntryId: string        ← ex: "7.3"
  alturaDeTom: number           ← 1-12
  reflexo: number               ← 0-9
  percentualBrancos: number     ← 0-100
  confianca: number             ← 0-1
  imagemPath: string | null     ← Firebase Storage path
  correction: object | null     ← se cabeleireiro corrigiu
  createdAt: Timestamp

formulas/{autoId}
  analysisId: string
  userId: string
  formulaJson: object           ← Formula tipada do domínio
  createdAt: Timestamp
```

### Sem RLS (Row Level Security)

Firestore tem **Security Rules** que poderiam mediar acesso por usuário. Não usamos. Por quê:

1. Todas as escritas passam por **Route Handlers** (`/api/*`) que verificam o session cookie antes
2. Server Components leem usando **Firebase Admin SDK** (service account = bypass total de regras)
3. Regras seriam redundantes — segurança fica concentrada no servidor

Em compensação, as Security Rules ficam em **deny-all** em produção (default seguro: cliente não acessa direto).

### Resiliência

Em `src/lib/firestore/index.ts`, todas as funções são envolvidas em `safeRead` / `safeWrite`:

```typescript
async function safeRead<T>(op, fallback, ctx) {
  try { return await op(); }
  catch (err) {
    if (isFirestoreRecoverable(err)) return fallback;  // 5 NOT_FOUND, 9 FAILED_PRECONDITION, 7 PERMISSION_DENIED
    throw err;
  }
}
```

Resultado: app funciona **mesmo sem Firestore habilitado no Console**. Leituras retornam `null` / `[]`, escritas viram no-op. UX continua, sem crash.

### Por que sem `orderBy` nas queries

Originalmente `getAnalyses` fazia:
```typescript
.where('userId', '==', uid).orderBy('createdAt', 'desc').limit(20)
```

Isso exige um **índice composto** (`userId` + `createdAt`) que precisa ser criado manualmente no Firebase Console. Erro `9 FAILED_PRECONDITION` se faltar.

Solução: filtra no servidor, **ordena em memória**:
```typescript
const snap = await db().collection('analyses').where('userId', '==', uid).get();
return snap.docs.map(...).sort(...).slice(0, 20);
```

Para <1000 análises por usuário, é trivial. Quando passar disso, criar o índice e voltar a ordenar no servidor.

### Como habilitar o Firestore (primeira vez)

Tela "Gerador de esquemas" que pede pra descrever app **é o Data Connect** (PostgreSQL gerenciado, produto diferente). Ignorar.

Link direto pra criar o Firestore Database:
```
https://console.firebase.google.com/project/arte-de-colorir-cabelos/firestore
```

Botão **"Criar banco de dados"** → modo produção → São Paulo (`southamerica-east1`) → Habilitar.

---

## Instalação PWA

### Critérios pra ser instalável (e não virar atalho)

| Critério | Status | Onde |
|---|---|---|
| HTTPS | ✅ (em tunnel/prod) | Cloudflare em dev, Vercel em prod |
| Manifest com `name`, `display`, `start_url` | ✅ | `public/manifest.webmanifest` |
| Ícones PNG ≥192×192 e ≥512×512 | ✅ | `public/icon-{192,512}.png` |
| Service Worker registrado com fetch handler | ✅ | `public/sw.js` + `ServiceWorkerRegister.tsx` |
| `apple-touch-icon` PNG (iOS) | ✅ | `public/apple-touch-icon.png` (180×180) |
| User engagement | — | usuário precisa interagir uma vez |

### Por que SVG não basta como ícone

iOS Safari **ignora silenciosamente** SVG em `<link rel="apple-touch-icon">`. Resultado: ícone genérico de "página web" na tela inicial. Tem que ser PNG.

Chrome Android passa nos critérios de instalação só com PNG ≥192+512.

### Gerando os ícones

`pnpm icons` roda `scripts/generate-icons.mjs` — usa `sharp` pra rasterizar `public/icon.svg` em todos os tamanhos. Gera:

- `icon-{192,512}.png` — Chrome standard
- `icon-maskable-{192,512}.png` — Android themed shapes (safe-zone 80% central)
- `apple-touch-icon.png` (180×180) — iOS
- `favicon-32.png` — abas de browser

### Splash screens iOS

iOS exige um `<link rel="apple-touch-startup-image">` **por resolução** com media query exata. Sem, app instalado mostra branco por 1-2s antes do JS carregar.

`pnpm splash` gera 8 splashes (iPhone 15 Pro Max → SE → iPad Pro 12") compondo fundo `#0E0C0B` sólido + logo centralizado a 30% da menor dimensão.

Os `<link>` tags são declarados em `src/app/layout.tsx` com `APPLE_SPLASH_LINKS`.

### Status bar fuse

Pra eliminar a "costura" visível entre status bar Android e conteúdo:

1. `theme_color: "#0E0C0B"` no manifest = status bar pintada nessa cor
2. `background-color: #0E0C0B` no `<html>` e `<body>` = primeiros pixels do app idênticos
3. Fixed div no topo do `<body>` com `bg-[#0E0C0B]` e height = `max(safe-area-inset-top, 8px)` — garante zero diferença mesmo se Aurora tentar pintar
4. Aurora com `mask-image: linear-gradient(to bottom, transparent 0 160px, black 220px)` — gradient cobre nunca chega perto da status bar

### display_override

```json
{
  "display": "standalone",
  "display_override": ["fullscreen", "standalone", "minimal-ui"]
}
```

Chrome escolhe o mais imersivo suportado:
- **`fullscreen`** — status bar transparente, conteúdo invade (Android 13+)
- **`standalone`** — fallback (Android <13)

### Como o `<InstallHint />` decide o que mostrar

```typescript
const { isStandalone, canInstall, install, platform } = usePwa();

if (!mounted || isStandalone || dismissed) return null;

if (canInstall) {                      // Chrome Android/Desktop em HTTPS
  return <Banner onClick={install} />; // botão real, dispara prompt nativo
}

if (platform === 'ios') {              // iOS Safari (não suporta beforeinstallprompt)
  return <Instructions />;             // "Compartilhar → Adicionar à Tela Inicial"
}

return null;                           // Android sem prompt = silêncio
                                       // (não mostramos "menu → adicionar" pq vira atalho)
```

### Service Worker — estratégia

```javascript
// public/sw.js
self.addEventListener('fetch', (event) => {
  if (req.mode === 'navigate') {
    // HTML: network-first, cache fallback (offline shell)
    event.respondWith(fetch(req).then(cacheIt).catch(fallbackToCache));
  } else {
    // Assets: cache-first, revalidate em background
    event.respondWith(caches.match(req).then(cached => cached || fetchAndCache(req)));
  }
});
```

Passthrough completo pra HMR (`/_next/webpack-hmr`), API routes (`/api/*`), e source maps. Cache em produção é seguro porque o build invalida URLs com hashes.

Versão atualizada com `CACHE_VERSION = 'hcp-v3'`. Bump quando estrutura mudar significativamente — SW antigos limpam o cache no `activate`.

---

## Performance

### Decisões que mais impactam

| Otimização | Ganho aproximado |
|---|---|
| Cache de `verifySessionCookie` (60s TTL) | -50ms/nav em rotas autenticadas |
| Eliminar verificação JWT dupla (middleware OU layout) | -50ms/nav |
| Server Components onde possível (zero JS) | -30kb/rota |
| `AuroraStatic` em rotas internas | -3kb JS + zero animação rodando |
| `optimizePackageImports` (lucide-react etc.) | -200kb bundle |
| `loading.tsx` (skeleton instant) | perceived perf +∞ |
| Prefetch agressivo (`<Link prefetch>`) | navegação instantânea |
| View Transitions API | fade 180ms sem JS |
| `next/dynamic ssr:false` em InstallHint | -4kb first paint |
| `pnpm start` em vez de `pnpm dev` | 5-10× tudo |
| Cache headers em PWA assets | 0 revalidação após primeiro hit |

### Bundle sizes (referência)

```
Route (app)                       Size  First Load JS
┌ ○ /                           1.06 kB         126 kB
├ ƒ /api/auth/session             147 B         115 kB
├ ƒ /api/profile                  147 B         115 kB
├ ○ /auth/login                 3.86 kB         199 kB
├ ○ /auth/register              3.91 kB         199 kB
├ ƒ /history                      147 B         115 kB
├ ƒ /opengraph-image              147 B         115 kB
├ ƒ /profile                    3.58 kB         195 kB
├ ○ /robots.txt                   147 B         115 kB
├ ƒ /scanner                      147 B         115 kB
└ ○ /sitemap.xml                  147 B         115 kB

First Load JS shared by all      115 kB
```

`○ Static` = pre-renderizado, servido como HTML cru — voa.
`ƒ Dynamic` = Server Component executa a cada request.

### Tempos de resposta (localhost, prod)

```
/                      2ms
/auth/login            2ms
/auth/register         2ms
/scanner               1ms    ← com session cache hot
/history               1ms
/profile               1ms
```

Pelo túnel Cloudflare adiciona ~150ms de RTT. Em produção real (Vercel sem túnel), espera ~50-80ms total.

### View Transitions API

Ativada via `experimental.viewTransition: true` em `next.config.mjs`. CSS em `globals.css`:

```css
::view-transition-old(root) { animation: fade-out 180ms; }
::view-transition-new(root) { animation: fade-in  180ms; }
```

Browser captura snapshots antes/depois da navegação e anima entre eles. Chrome 111+, Safari 18+. Em browsers que não suportam, navegação é instantânea (sem animação) — graceful degradation.

### Cache headers

Em `next.config.mjs` → `headers()`:

```
/icon-*.png, /apple-touch-icon.png, /favicon-*.png, /splash-*.png,
/icon*.svg, /manifest.webmanifest
  → Cache-Control: public, max-age=604800,        ← 7d browser
                          s-maxage=2592000,        ← 30d CDN
                          stale-while-revalidate=86400

/sw.js
  → Cache-Control: public, max-age=0, must-revalidate    ← sempre fresh
```

---

## Design system

### Tokens (em `globals.css` via Tailwind v4 `@theme`)

| Token | Valor | Uso |
|---|---|---|
| `--color-background` | `hsl(20, 12%, 5%)` ≈ `#0E0C0B` | Body, status bar |
| `--color-foreground` | `hsl(30, 12%, 96%)` | Texto principal |
| `--color-primary` | `hsl(24, 55%, 52%)` ≈ cobre maduro | CTAs, destaques |
| `--color-primary-foreground` | `hsl(30, 15%, 98%)` | Texto em fundo cobre |
| `--color-muted-foreground` | `hsl(30, 6%, 62%)` | Texto secundário |
| `--color-border` | `hsl(30, 10%, 100% / 0.06)` | Bordas sutis |
| `--color-destructive` | `hsl(8, 65%, 52%)` | Erros, logout |
| `--font-sans` | Geist | UI body |
| `--font-serif` | Instrument Serif (italic) | Acentos editoriais |
| `--font-mono` | Geist Mono | Códigos, labels caps |

### Variantes Glass

```css
.glass         → bg card + blur(20px) + saturate(140%)
.glass-strong  → mais opaco (modais, drawers)
.glass-subtle  → bg branco/3% + blur(10px) (chips, ghost inputs)
```

Fallback automático via `html.no-glass` pra dispositivos sem `backdrop-filter` (Android antigos).

### Botões — convenção de tamanhos

| Size | Altura | Onde usar |
|---|---|---|
| `sm` | 32px | Densidade alta, listagens |
| `default` | 36px | Forms normais |
| `lg` | 44px | Ações de menu |
| `touch` | 48px | **Padrão pra mobile** (≥44px Apple HIG) |
| `xl` | 56px | CTA primário hero |
| `icon` | 36×36px | Botões de ícone só |

### Cor cobre — onde usar

- `text-primary` — links/CTAs principais
- `bg-primary/15` + `ring-1 ring-primary/30` — bolinhas, avatars, badges (toque de cor + ring fino)
- `bg-primary` (CTAs full) — apenas em ações primárias

**Não usar:** mais de 1 elemento sólido `bg-primary` por tela. Cobre é acento, não fundo.

### Animações

- **Sutis e curtas** (150-300ms)
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` (Material standard) ou `ease-in-out`
- **Sempre respeita `prefers-reduced-motion`**
- **`active:scale-[0.97]`** universal em botões (feedback tátil)
- **View Transitions** entre rotas (fade 180ms)
- **Aurora animada** só em landing + auth (animação ambient)
- **Aurora estática** em rotas internas (zero JS overhead)

---

## Decisões arquiteturais

### Por que Next.js App Router em vez de SPA puro

Considerado: poker-odds-calculator faz tudo num `page.tsx` Client Component e troca de telas via `useState`. Navegações são instantâneas.

Por que **não** seguimos esse caminho:
- Auth é server-side (cookie HttpOnly), precisamos de middleware + Server Components
- SEO da landing matters (Open Graph, sitemap)
- App Router permite o melhor dos dois: rotas estáticas pre-renderizadas + Server Components com auth + View Transitions pra fluidez

A latência de navegação que sentíamos no `pnpm dev` desapareceu em `pnpm start` (1-2ms). Era artefato do compile-on-demand do dev mode, não da arquitetura.

### Por que Firebase em vez de Supabase

| Critério | Firebase | Supabase |
|---|---|---|
| Usuários existentes do Flutter | ✅ compartilha | ❌ tem que re-cadastrar |
| Auth + DB no mesmo projeto | ✅ | ⚠️ (service_role hack p/ Firebase Auth) |
| Free tier | 50k reads/dia, 20k writes/dia | 500MB DB |
| Postgres-like queries | ❌ NoSQL | ✅ SQL completo |
| RLS | Security Rules | RLS Postgres |

Decisão: **Firebase**. Compatibilidade com Flutter pesa mais que SQL.

### Por que Tailwind v4 (beta)

- `@theme` inline = zero config file
- Compilação ~5× mais rápida que v3
- Native CSS variables (não precisa preset)
- Trade-off: ainda beta, breaking changes possíveis

### Por que shadcn/ui (não MUI / Chakra)

- Copy-paste, sem dependência runtime
- 100% customizável (não há "tema MUI" preso ao framework)
- Acessível por default (Radix Primitives)
- Trade-off: mais código no repo (vs. import de lib)

### Por que `pnpm` (não npm / yarn)

- Disk space (symlinks ao invés de duplicação)
- Velocidade
- `pnpm approve-builds` é UX melhor que `--ignore-scripts`

### Por que Cloudflare Tunnel pra testar PWA

PWA install no Android Chrome **requer HTTPS** (ou localhost direto). Acessando dev pelo IP da LAN (`10.0.0.x`), Chrome vê como "inseguro" e não oferece instalar — só "atalho".

Cloudflared dá HTTPS público em segundos. Gratuito, sem cadastro pra túneis efêmeros. Alternativas: ngrok, localtunnel, Vercel preview deploy.

### Por que View Transitions API (não framer-motion)

- Nativo do browser (Chrome 111+, Safari 18+) — sem JS pra animar
- Roda na thread do compositor (não bloqueia UI)
- Funciona com qualquer estratégia de navegação (Link, router.push, history.back)
- Graceful degradation em browsers velhos
- framer-motion estava sendo importado mas não usado → removido (-70kb)

---

## Troubleshooting

### "PWA instalado abre como atalho do navegador"

**Causas comuns:**
1. **Não está em HTTPS** — Chrome Android exige. Use `cloudflared tunnel`.
2. **Service Worker não registrado** — verifica DevTools → Application → Service Workers. Tem que estar "activated and running".
3. **Manifest com ícones SVG** — iOS ignora. Use PNG.
4. **Atalho velho ainda instalado** — desinstalar primeiro, depois reinstalar.

**Como debugar:**
- Chrome DevTools desktop: `F12 → Application → Manifest`. Mostra erros de instalabilidade.
- `chrome://flags/#enable-experimental-web-platform-features` ativado pode ajudar.

### "Costura visível entre status bar e app"

**O que verificar:**
1. `theme_color` no manifest === `background-color` do html/body — tem que ser **hex literal idêntico**
2. Aurora ou gradient não está pintando perto do topo. Conferir `mask-image` ou usar `<AuroraStatic>`.
3. O div "status bar fuse" (`fixed inset-x-0 top-0 bg-[#0E0C0B]`) está presente em `RootLayout`.

**Limitação fundamental:** PWA Android Chrome não suporta status bar transparente sobreposta ao conteúdo (modo Flutter `edgeToEdge`). Pra isso, precisa Capacitor (Bloco H) ou Trusted Web Activity.

### "Login lento / 'Erro ao iniciar sessão'"

**Causa típica:** Firestore não habilitado, e `getProfile`/`upsertProfile` quebra. Já está mitigado por `safeRead`/`safeWrite` que retornam fallback em erro. Verifica `/tmp/hcp-prod.log` ou console do server pra warnings `[firestore]`.

**Fix:** habilita Firestore no Console (link em `PROJECT.md → Banco de dados`).

### "TypeScript: 'Cannot find module @/...'"

Path alias quebrado. `tsconfig.json` precisa de:
```json
"paths": { "@/*": ["./src/*"] }
```

### "pnpm dev: 'firebase-admin doesn't work in Edge Runtime'"

Algum arquivo importou `firebase-admin` em rota Edge. Solução: adicionar `export const runtime = 'nodejs'` no topo do arquivo (route.ts, middleware.ts, etc).

### Build falha em `opengraph-image.tsx`

Satori (renderizador OG) tem CSS limitado. Erros comuns:
- `background: <gradient>, <color>` (shorthand) → use `backgroundColor` + `backgroundImage` separados
- Fontes externas não carregam → usa `system serif/sans/monospace` ou inline o font file

### "Costura tá um pouco menor mas ainda visível"

Limitação do PWA Android atual. Solução real: Bloco H (Capacitor) ou aceitar como teto do que dá pra fazer com web pura.

---

## Glossário

| Termo | Significado |
|---|---|
| **Aurora** | Componente de fundo ambiente com gradientes radiais cobre + blobs animados. Versão Client (animada) e Static (Server Component, só CSS). |
| **Bits** | Pasta `components/bits/*` — efeitos visuais curados (Aurora, GradientText, ShinyText). |
| **Bloco** | Unidade de desenvolvimento do roadmap (A, B, C, D...). Cada bloco entrega uma capability completa. |
| **Claims** | Payload decodificado do session cookie Firebase — `uid`, `email`, `name`, etc. |
| **Cloudflared** | Túnel HTTPS pra expor localhost com cert válido. Usado pra testar PWA install em devices reais. |
| **ColorimetriaService** | Domínio puro em `lib/colorimetria/`. Recebe diagnóstico, devolve fórmula. |
| **ΔE2000 / Delta-E** | Métrica de distância entre cores em espaço Lab. Usada pra "snap-to-palette" no Bloco E. |
| **Display override** | Lista priorizada de modos PWA. Chrome escolhe o mais imersivo suportado. |
| **Edge Runtime** | Ambiente JS leve da Vercel/Cloudflare. Sem Node APIs. Não compatível com `firebase-admin`. |
| **Firestore** | NoSQL DB do Firebase. Coleções `profiles`, `analyses`, `formulas`. |
| **Glass surfaces** | `glass`, `glass-strong`, `glass-subtle` — superfícies translúcidas com backdrop-filter. |
| **InstallHint** | Banner flutuante de "Instalar app". Aparece em qualquer rota até virar PWA standalone. |
| **MediaPipe** | Lib do Google pra segmentação de cabelo on-device (Bloco E). |
| **Middleware (Next)** | Roda antes de toda request server-side. Verifica session cookie aqui. |
| **PWA** | Progressive Web App — site instalável que parece app nativo. |
| **Reference palette** | Paleta L'Oréal de cores referência pra colorimetria. Entries tipo "7.3", "4.0". |
| **Route Handler** | API endpoint do Next.js App Router — `app/api/*/route.ts`. |
| **Safari Web App** | Modo standalone do iOS. Sem URL bar, splash custom. Exige `apple-touch-icon`. |
| **Server Component** | Componente React que roda só no servidor. Zero JS no client. Default no App Router. |
| **Service Worker** | Worker do browser pra cache + offline. Critério de instalabilidade PWA. |
| **Session cookie (Firebase)** | Cookie HttpOnly criado por `createSessionCookie`. Dura 5 dias, validado por `verifySessionCookie`. |
| **Splash screens** | PNGs por resolução de iPhone/iPad. iOS exibe enquanto JS carrega. |
| **Status bar fuse** | Div fixo no topo com cor sólida pra eliminar costura visível entre status bar do SO e conteúdo. |
| **Tap target** | Área tocável. ≥44×44px no Apple HIG, ≥48×48dp no Material. |
| **theme_color** | Cor que o SO usa pra pintar status bar/title bar em PWA standalone. |
| **TTL** | Time-to-live. Quanto tempo um cached value continua válido. |
| **View Transitions** | API do browser pra animar entre estados de DOM. Nativa, sem libs. |
