# 3. Metodologia

## 3.1 Abordagem geral

O desenvolvimento seguiu metodologia **iterativa incremental**, com o produto subdividido em "blocos" funcionais autocontidos. Cada bloco entrega um conjunto coeso de funcionalidades testável em isolamento, viabilizando demonstração progressiva e ajustes de rumo conforme aprendizado.

Os blocos foram definidos previamente em documento de planejamento (`.planning/PLAN.md`), e o progresso é registrado em `.planning/PROGRESSO.md` — funcionando como *bastão de transmissão* entre sessões de trabalho e entre humanos e assistentes de IA usados como pair-programmer.

## 3.2 Blocos de desenvolvimento

| Bloco | Escopo | Status |
|---|---|---|
| A | Setup base — Next.js, TypeScript, Tailwind, pnpm | ✅ Concluído |
| B | Design system — shadcn/ui, tokens cobre/carvão, glass surfaces | ✅ Concluído |
| C | Autenticação Firebase + Firestore | ✅ Concluído |
| C+ | PWA real — manifest, service worker, ícones, splash screens | ✅ Concluído |
| D | Captura de imagem real (câmera) + onboarding | ⏳ Em planejamento |
| E | Segmentação capilar com MediaPipe | ⏳ Em planejamento |
| F | Pipeline de análise + integração IA + tela de resultado | ✅ Concluído |
| G | Telas de revisão (sliders de correção manual) | ⏳ Em planejamento |
| H | Empacotamento nativo com Capacitor (iOS/Android) | ⏳ Futuro |
| I | Testes E2E (Playwright) + Lighthouse CI + telemetria | ⏳ Futuro |

> Observação: a ordem dos blocos não foi estritamente sequencial. O Bloco F (análise + IA) foi adiantado por permitir validação do conceito central do trabalho sem depender da implementação completa de câmera; uma análise por mock de pixels é suficiente para validar a colorimetria.

## 3.3 Stack tecnológica — justificativas

### 3.3.1 Por que Next.js em vez de SPA puro

A alternativa considerada foi **Single Page Application** (uma `page.tsx` Client Component que troca de "telas" via estado local — modelo seguido pelo projeto referência *poker-odds-calculator* analisado neste trabalho). Vantagens dessa abordagem: navegação instantânea por mudança de estado, sem requisições de rede.

Optamos por **Next.js App Router** pelos seguintes motivos:

- Autenticação **server-side** via cookie HttpOnly exige middleware antes da renderização. Em SPA, o cookie estaria acessível ao JavaScript (vulnerável a XSS).
- **SEO** da landing page (Open Graph, sitemap, metadata) requer pré-renderização server-side, indisponível em SPA pura.
- **Server Components** (React 19) permitem renderizar páginas com dados do usuário sem expor o token de acesso ao cliente.
- **View Transitions API** (Chrome 111+, Safari 18+) fornece transições suaves entre rotas sem necessidade de biblioteca de animação no client.

### 3.3.2 Por que Firebase em vez de Supabase

Comparação avaliada:

| Critério | Firebase | Supabase |
|---|---|---|
| Compatibilidade com usuários do app Flutter pré-existente | ✓ direta | ✗ exige re-cadastro |
| Auth + DB integrados | ✓ | parcial (requer service_role) |
| Plano gratuito | 50k leituras/dia, 20k escritas/dia | 500 MB de banco |
| Queries SQL complexas | ✗ NoSQL | ✓ PostgreSQL |
| Row Level Security | Security Rules (declarativas) | RLS PostgreSQL |

A **compatibilidade com a base de usuários existente** pesou mais que a flexibilidade de SQL. O caso de uso (perfil, análises, fórmulas) não exige *joins* complexos — NoSQL é suficiente.

### 3.3.3 Por que Claude em vez de GPT ou Gemini

Comparação avaliada (preços em USD, abril/2025):

| Modelo | Input ($/Mtok) | Output ($/Mtok) | PT-BR quality | Politicy training |
|---|---|---|---|---|
| Claude 3.5 Sonnet | 3.00 | 15.00 | excelente | opt-out por default |
| GPT-4o | 2.50 | 10.00 | bom | opt-out por default |
| Gemini 1.5 Pro | 1.25 | 5.00 | razoável | opt-out por default |

Critérios decisivos:

- **Qualidade em PT-BR**: testes empíricos mostraram Claude com vocabulário técnico-profissional mais natural em português brasileiro.
- **Privacidade**: Anthropic adota política de não-treinar com dados de API por padrão; outros exigem configuração explícita.
- **API estável**: SDK Node.js oficial, sem mudanças quebrantes recentes.

Custo por análise (~500 tokens de saída): aproximadamente **$0.0075 USD** por relatório. Em escala de salão (5 análises/dia/profissional), o custo mensal por usuário é insignificante.

### 3.3.4 Por que PWA em vez de aplicativo nativo

O caminho nativo (Capacitor wrap, descrito como Bloco H futuro) resolveria definitivamente questões como **edge-to-edge real** no Android e **haptic feedback**. Optamos por PWA primeiro pelos seguintes motivos:

- **Iteração rápida**: deploy a qualquer alteração de código em segundos, sem necessidade de submeter à loja de aplicativos.
- **Distribuição direta**: usuários instalam pelo navegador, sem App Store / Play Store.
- **Compatibilidade**: roda em qualquer dispositivo com navegador moderno (iOS Safari 16.4+, Chrome Android, Edge, Firefox, Samsung Internet).
- **Manutenção zero**: atualizações são deploy de servidor, não atualização de app no dispositivo.

A versão nativa via Capacitor é trabalho futuro previsto, partilhando 100% do código Next.js.

## 3.4 Arquitetura

### 3.4.1 Diagrama de alto nível

```
┌────────────────────────────────────────────────────────────────────┐
│ Dispositivo do usuário (Browser ou PWA standalone)                 │
│  ├─ React 19 Client Components (forms, banners, animações)         │
│  ├─ Firebase Web SDK (signInWithEmailAndPassword)                  │
│  ├─ Service Worker (cache offline, install criteria)               │
│  └─ MediaPipe Tasks Vision (futuro — segmentação on-device)        │
└────────────────────────────────────────────────────────────────────┘
                                ⇅ HTTPS
┌────────────────────────────────────────────────────────────────────┐
│ Next.js 15 (Node.js runtime — Vercel / similar)                    │
│  ├─ middleware.ts (verifica session cookie em cada request)        │
│  ├─ Server Components (renderiza UI com claims do usuário)         │
│  ├─ Route Handler /api/auth/session (cria session cookie)          │
│  ├─ Route Handler /api/profile (CRUD perfil)                       │
│  ├─ Route Handler /api/analyze (pipeline de análise + IA)          │
│  ├─ Firebase Admin SDK (verifySessionCookie + Firestore Admin)     │
│  └─ Cache em memória (claims, 60s TTL)                             │
└────────────────────────────────────────────────────────────────────┘
                                ⇅
┌────────────────────────────────────────────────────────────────────┐
│ Firebase (projeto arte-de-colorir-cabelos — compartilhado c/Flutter│
│  ├─ Auth (email/password)                                          │
│  └─ Firestore (profiles, analyses, formulas)                       │
└────────────────────────────────────────────────────────────────────┘
                                ⇅
┌────────────────────────────────────────────────────────────────────┐
│ Anthropic API (Claude 3.5 Sonnet)                                  │
│  └─ Geração de relatório textual a partir de contexto numérico     │
└────────────────────────────────────────────────────────────────────┘
```

### 3.4.2 Fluxo do diagnóstico

1. **Captura** — Usuário tira foto pela câmera do dispositivo (Bloco D, em planejamento).
2. **Pré-processamento client** — Imagem é redimensionada, extraídos pixels RGBA via Canvas API.
3. **(Opcional) Segmentação** — MediaPipe identifica máscara dos pixels que pertencem ao cabelo (Bloco E, futuro).
4. **POST `/api/analyze`** — Client envia `{width, height, pixelsBase64}` com cookie de sessão.
5. **Análise determinística** — Servidor converte cada pixel para Lab, calcula Lab médio, faz snap-to-palette via CIEDE2000.
6. **Persistência** — Resultado salvo na coleção `analyses` do Firestore.
7. **Geração de relatório** — Diagnóstico numérico enviado como contexto à Claude API, que devolve parecer em texto.
8. **Resposta** — Cliente recebe `{analysis, report}` e renderiza tela `/result`.

A latência total é dominada pelo passo 7 (IA): cerca de 2 segundos. Os passos 5 e 6 somam menos de 100 ms.

## 3.5 Padrões de código adotados

### 3.5.1 Idioma

- **Domínio em português**: `calcularFormula`, `diagnostico`, `alturaDeTom`. Vocabulário do salão é mantido na código.
- **APIs genéricas em inglês**: `useEffect`, `getDoc`, `verifySessionCookie`. Termos da plataforma.

### 3.5.2 TypeScript estrito

`strict: true` e `noUncheckedIndexedAccess: true` no `tsconfig.json`. Não se usa `any` — apenas `unknown` com *narrowing* explícito.

### 3.5.3 Funções puras no domínio

`src/lib/colorimetria/*` contém apenas funções puras: sem efeitos colaterais, sem dependências externas, totalmente testáveis. Cobertura por testes Vitest (24 casos no `service.test.ts`).

### 3.5.4 Regras como dados

Parâmetros calibráveis (limiares de ΔE, percentuais de subtom, fórmulas químicas) são declarados como objetos em arquivos próprios (`rules.ts`, `reference-palette.ts`), não codificados em lógica. Permite ajuste fino por especialista de domínio sem necessidade de modificar código.

### 3.5.5 Componentização

- **`src/components/ui/`** — primitivos do design system (shadcn/ui)
- **`src/components/app/`** — componentes específicos da aplicação (AppNav, ProfileForm, InstallHint)
- **`src/components/bits/`** — efeitos visuais (Aurora, GradientText, ShinyText)
- **`src/components/glass/`** — wrappers de superfícies translúcidas

### 3.5.6 Server Components por padrão

Componentes são *Server Components* a menos que necessitem de:
- Hooks de browser (`useState`, `useEffect`, `useRef`)
- Event handlers (`onClick`, `onChange`)
- APIs de browser (`window`, `document`, `localStorage`)
- Bibliotecas que importam essas APIs

Quando essa necessidade existe, o componente é marcado com a diretiva `'use client'` no topo. Esse padrão minimiza o JavaScript enviado ao cliente.

## 3.6 Ferramentas e ambiente

| Ferramenta | Versão | Uso |
|---|---|---|
| Node.js | 20+ | Runtime |
| pnpm | 11+ | Gerenciador de pacotes |
| Vitest | 2.1 | Testes unitários |
| Playwright | 1.49 | Testes E2E (planejado) |
| Prettier | 3.4 | Formatação |
| Sharp | 0.34 | Geração de ícones e splash screens |
| Cloudflared | 2026 | Túnel HTTPS para teste de PWA em dispositivo móvel |
| Vercel | n/a | Hospedagem de produção (planejado) |

## 3.7 Versionamento e organização

O projeto é versionado em Git. O código Flutter legado (`../lib`, `../android`, `../web`) coexiste com a versão Next.js em `v2/` durante o desenvolvimento. Após aprovação, `v2/` será promovida à raiz.

Documentos de planejamento residem em `.planning/`:

- `PLAN.md` — plano técnico completo (~820 linhas)
- `ARQUITETURA_JUSTIFICATIVA.md` — racional das decisões
- `PROGRESSO.md` — registro de "feito vs faltando" entre sessões

Documentação técnica para desenvolvedores em `v2/`:

- `README.md` — quick start, scripts, estrutura
- `PROJECT.md` — documentação arquitetural profunda

Este documento (`docs/tg/`) destina-se à defesa acadêmica do TG.
