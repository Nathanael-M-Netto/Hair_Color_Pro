# Hair Color Pro v2

Assistente profissional de colorimetria capilar com diagnóstico por IA — pra cabeleireiros que precisam de fórmula precisa em segundos.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript 5.7 estrito · Tailwind v4 · shadcn/ui · Firebase Auth + Firestore · PWA · Capacitor 6 (roadmap).

> **Origem.** Nasceu no salão **Jotta Lean Cabelos** — cada regra de colorimetria implementada resolve um problema real da cadeira.
>
> A versão Flutter anterior (referência histórica do projeto) está arquivada em
> [`_legacy-flutter-v1.zip`](./_legacy-flutter-v1.zip) — código-fonte completo
> sem artefatos de build, ~350 KB. Não é necessário pra rodar a v2.

---

## Quick start

```bash
cd v2
pnpm install
cp .env.local.example .env.local   # preencher credenciais Firebase
pnpm build && pnpm start           # produção (rápido)
# ou
pnpm dev                           # dev com Fast Refresh (mais lento)
```

Pré-requisitos: **Node 20+**, **pnpm 11+**.

A primeira vez vai pedir aprovação de build scripts nativos (sharp, firebase):

```bash
pnpm approve-builds --all
```

### Testar como PWA no celular

PWA install só funciona em HTTPS (Chrome bloqueia em HTTP). Pra testar localmente do celular:

```bash
brew install cloudflared        # uma vez
cloudflared tunnel --url http://localhost:3000
# → te dá uma URL https://*.trycloudflare.com pública
```

Abre essa URL no Chrome do celular, recebe banner "Instalar app", confirma. Detalhes do fluxo PWA em [`PROJECT.md`](./PROJECT.md#instalação-pwa).

---

## Scripts

| Comando | O que faz |
|---|---|
| `pnpm dev` | Servidor dev com Fast Refresh — mais lento por compilar sob demanda |
| `pnpm build` | Build de produção otimizado (geralmente 4-6s) |
| `pnpm start` | Serve o build de produção — **muito mais rápido** que `dev` |
| `pnpm typecheck` | `tsc --noEmit` — valida tipos sem emitir |
| `pnpm test` | Testes unitários (vitest) |
| `pnpm test:watch` | Vitest em modo watch |
| `pnpm test:e2e` | Playwright (após configurar) |
| `pnpm format` | Prettier em `src/**` |
| `pnpm icons` | Regera ícones PWA (192/512/maskable/apple-touch/favicon) a partir de `public/icon.svg` |
| `pnpm splash` | Regera 8 splash screens iOS (15 Pro Max → SE → iPad Pro) |
| `pnpm cap:sync` | Build + Capacitor sync (iOS/Android — roadmap) |
| `pnpm cap:ios` | Abre Xcode (após sync) |
| `pnpm cap:android` | Abre Android Studio |

---

## Variáveis de ambiente

Tudo em `.env.local` (gitignored). Veja `.env.local.example` pra estrutura.

| Variável | Onde usada | Origem |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Client SDK (login/cadastro) | Console Firebase → Project Settings → Web app |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Client SDK | idem |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Client + Admin | idem (`arte-de-colorir-cabelos`) |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Client SDK | idem |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Client SDK | idem |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Client SDK | idem |
| `FIREBASE_PROJECT_ID` | Admin SDK (server-side) | service account JSON |
| `FIREBASE_CLIENT_EMAIL` | Admin SDK | service account JSON |
| `FIREBASE_PRIVATE_KEY` | Admin SDK | service account JSON (com `\n` literais entre aspas) |
| `GEMINI_API_KEY` | Gera relatório textual da análise (free tier ~1500 req/dia) | https://aistudio.google.com/apikey |
| `GEMINI_MODEL` | Nome do modelo Gemini | default `gemini-2.5-flash-lite` |

> **Importante.** O service account JSON é gerado em Firebase Console → Service accounts → Generate new private key. Extrai `project_id`, `client_email` e `private_key` dele. A `private_key` precisa ficar entre aspas duplas no `.env.local` com os `\n` como literal string (não newlines reais).

---

## Estrutura

```
v2/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # root layout + metadata + splash links
│   │   ├── page.tsx                  # landing (Server Component, pre-renderizado)
│   │   ├── globals.css               # design tokens (@theme) + utilities
│   │   ├── error.tsx                 # error boundary global
│   │   ├── not-found.tsx             # 404 customizada
│   │   ├── loading.tsx               # (opcional, fallback global)
│   │   ├── opengraph-image.tsx       # OG image dinâmica via Satori
│   │   ├── robots.ts                 # robots.txt gerado
│   │   ├── sitemap.ts                # sitemap.xml gerado
│   │   ├── auth/                     # rotas públicas (login + cadastro)
│   │   │   ├── layout.tsx            # header voltar + marca
│   │   │   ├── loading.tsx           # skeleton
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (app)/                    # rotas autenticadas (group)
│   │   │   ├── layout.tsx            # checa cookie + AppNav
│   │   │   ├── loading.tsx           # skeleton compartilhado
│   │   │   ├── scanner/page.tsx      # placeholder do scanner
│   │   │   ├── history/page.tsx      # análises do usuário
│   │   │   └── profile/page.tsx      # perfil + logout
│   │   └── api/                      # Route Handlers (server-only)
│   │       ├── auth/session/route.ts # ID token → session cookie
│   │       └── profile/route.ts      # CRUD do perfil (Firestore)
│   ├── components/
│   │   ├── ui/                       # shadcn/ui (Button, Input, Form, etc.)
│   │   ├── app/                      # componentes específicos do app
│   │   │   ├── AppNav.tsx            # bottom nav
│   │   │   ├── ProfileForm.tsx       # form de edição do perfil
│   │   │   ├── InstallHint.tsx       # banner PWA install
│   │   │   ├── InstallHintLazy.tsx   # wrapper client-only lazy
│   │   │   └── ServiceWorkerRegister.tsx
│   │   ├── bits/                     # efeitos visuais
│   │   │   ├── Aurora.tsx            # ambient animado (Client)
│   │   │   ├── AuroraStatic.tsx      # ambient estático (Server, zero JS)
│   │   │   ├── GradientText.tsx
│   │   │   └── ShinyText.tsx
│   │   └── glass/GlassCard.tsx       # wrapper de Card com presets glass
│   ├── lib/
│   │   ├── firebase/                 # Firebase SDKs
│   │   │   ├── client.ts             # Web SDK (browser)
│   │   │   └── admin.ts              # Admin SDK (server, com cache)
│   │   ├── firestore/                # CRUD typed (Firestore Admin)
│   │   │   ├── index.ts              # getProfile, getAnalyses, etc.
│   │   │   └── types.ts              # ProfileDoc, AnalysisDoc, FormulaDoc
│   │   ├── colorimetria/             # domínio puro (coração do app)
│   │   │   ├── types.ts
│   │   │   ├── rules.ts              # regras como dados, não código
│   │   │   ├── color-math.ts         # ΔE2000, RGB↔Lab, etc.
│   │   │   ├── reference-palette.ts  # paleta L'Oréal
│   │   │   ├── service.ts            # orquestra diagnóstico → fórmula
│   │   │   └── service.test.ts       # 20+ casos
│   │   ├── schemas/                  # Zod schemas (validação de borda)
│   │   ├── ai/                       # Gemini — relatório textual da análise
│   │   └── utils.ts                  # `cn()` helper
│   ├── hooks/
│   │   ├── use-auth.ts               # onAuthStateChanged wrapper
│   │   ├── use-pwa.ts                # detecta standalone + beforeinstallprompt
│   │   └── use-reduced-motion.ts
│   └── middleware.ts                 # auth middleware (Node.js runtime)
├── public/                           # estáticos (sem otimização Next)
│   ├── manifest.webmanifest          # PWA manifest
│   ├── sw.js                         # service worker
│   ├── icon.svg / icon-maskable.svg  # fontes dos PNGs
│   ├── icon-{192,512}.png            # PWA icons (Chrome)
│   ├── icon-maskable-{192,512}.png   # Android themed shapes
│   ├── apple-touch-icon.png          # iOS (180×180)
│   ├── favicon-32.png
│   └── splash-iphone-*.png           # 8 splash screens iOS
├── scripts/
│   ├── generate-icons.mjs            # SVG → PNGs (sharp)
│   └── generate-splash.mjs           # SVG → 8 splash screens
├── package.json
├── tsconfig.json
├── next.config.mjs                   # cache headers + optimizePackageImports
├── postcss.config.mjs                # Tailwind v4
├── vitest.config.ts
├── PROJECT.md                        # documentação arquitetural profunda
└── README.md                         # este
```

---

## Convenções

- **Idioma:** domínio em português (`calcularFormula`, `alturaDeTom`); APIs genéricas em inglês (`useEffect`).
- **TypeScript estrito** com `noUncheckedIndexedAccess`. Nunca `any` — use `unknown` + narrowing.
- **Funções puras** em `lib/colorimetria/*`. Sem side effects, sem dependências externas.
- **Regras como dados** (`rules.ts`) — nunca hardcoded inline.
- **Server Components por padrão**, Client só quando precisar (`'use client'` explicit).
- **shadcn/ui** componentes em `components/ui/`. Custom em `components/app/`. Efeitos em `components/bits/`.
- **Tailwind v4:** tokens em `globals.css` via `@theme`, sem `tailwind.config.ts`.
- **Backdrop-filter** com fallback `html.no-glass`.
- **`prefers-reduced-motion`** respeitado em todas as animações.

---

## Stack (versões fixadas)

| Camada | Tecnologia | Por quê |
|---|---|---|
| Framework | Next.js 15.5 (App Router) | SSR + Static + RSC + middleware |
| UI | React 19 + TypeScript 5.7 | Server Components + Suspense |
| Estilo | Tailwind v4 (beta) | `@theme` inline, sem config file |
| Componentes | shadcn/ui (New York) | Copy-paste, customizável |
| Auth | Firebase Auth | Compartilha usuários com app Flutter |
| Database | Firestore (Admin SDK) | Compatível com Auth, sem RLS |
| AI | Google Gemini (free tier) | Relatório textual a partir do diagnóstico |
| Segmentação | MediaPipe Tasks Vision | Cliente, sem servidor (Bloco E) |
| PWA | manifest + Service Worker | Instalável, offline shell |
| Testes | Vitest + Playwright | Unit + E2E |
| Native (futuro) | Capacitor 6 | iOS/Android wrappers (Bloco H) |

---

## Como retomar o desenvolvimento

Leia, **nesta ordem**:

1. [`PROJECT.md`](./PROJECT.md) — arquitetura completa, fluxos, decisões
2. `../.planning/PROGRESSO.md` — estado atual dos blocos
3. `../.planning/PLAN.md` — plano completo (820+ linhas)

---

## Estado atual

| Bloco | Status |
|---|---|
| A — Setup base | ✅ |
| B — shadcn/ui + glass system | ✅ |
| C — Firebase Auth + Firestore | ✅ |
| C+ — PWA install + status bar fuse + splash | ✅ |
| D — Câmera + onboarding | ⏳ Pendente |
| E — MediaPipe segmentation + k-means + ΔE2000 | ⏳ |
| F — Gemini + `/api/analyze` + tela `/result` | ✅ |
| G — Telas /review (sliders) + /result (fórmula) | ⏳ |
| H — Capacitor wrap (iOS/Android) | ⏳ |
| I — E2E + Lighthouse + telemetria | ⏳ |

Detalhes técnicos completos em [`PROJECT.md`](./PROJECT.md).
