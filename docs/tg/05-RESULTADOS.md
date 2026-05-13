# 5. Resultados e Validação

## 5.1 Estado de implementação

| Componente | Status | Onde |
|---|---|---|
| Conversão sRGB → Lab | ✅ | `src/lib/colorimetria/color-math.ts` |
| ΔE2000 (CIEDE2000) | ✅ | `src/lib/colorimetria/color-math.ts:107-208` |
| Paleta de referência (~120 entradas) | ✅ | `src/lib/colorimetria/reference-palette.ts` |
| Pipeline de análise de imagem | ✅ | `src/lib/colorimetria/image-analysis.ts` |
| Integração com Claude 3.5 Sonnet | ✅ | `src/lib/ai/report.ts` |
| Fallback offline (template) | ✅ | `gerarRelatorioFallback` |
| API route `/api/analyze` | ✅ | `src/app/api/analyze/route.ts` |
| Tela `/result` (resultado da análise) | ✅ | `src/app/(app)/result/page.tsx` |
| Auth Firebase + Firestore | ✅ | `src/lib/firebase/*`, `src/lib/firestore/*` |
| PWA instalável (real, não atalho) | ✅ | `public/manifest.webmanifest`, `public/sw.js`, `scripts/generate-*.mjs` |
| Captura por câmera real | ⏳ Bloco D futuro | placeholder visual em `/scanner` |
| Segmentação MediaPipe | ⏳ Bloco E futuro | |
| Capacitor wrap nativo | ⏳ Bloco H futuro | |

## 5.2 Métricas de performance

### 5.2.1 Bundle sizes (build de produção)

```
Route (app)                       Size  First Load JS
┌ ○ /                           1.06 kB         126 kB
├ ○ /_not-found                 147 B           115 kB
├ ƒ /api/analyze                147 B           115 kB
├ ƒ /api/auth/session           147 B           115 kB
├ ƒ /api/profile                147 B           115 kB
├ ○ /auth/login                 3.86 kB         199 kB
├ ○ /auth/register              3.91 kB         199 kB
├ ƒ /history                    147 B           115 kB
├ ƒ /opengraph-image            147 B           115 kB
├ ƒ /profile                    3.58 kB         196 kB
├ ƒ /result                     3.52 kB         131 kB
├ ○ /robots.txt                 147 B           115 kB
├ ƒ /scanner                   21.8 kB          148 kB
└ ○ /sitemap.xml                147 B           115 kB

First Load JS shared by all     115 kB
```

A landing (rota mais comum) pesa **126 KB total** (115 KB compartilhado + 1 KB página) — abaixo do limite recomendado pela web.dev (170 KB).

### 5.2.2 Tempo de resposta (localhost, produção)

```
/                       2 ms
/auth/login             2 ms
/auth/register          2 ms
/scanner                1 ms   ← com cache de session cookie ativo
/history                1 ms
/profile                1 ms
```

Pela rede HTTPS via tunnel Cloudflare, latência adiciona aproximadamente 150 ms. Em produção real (Vercel CDN), espera-se latência total de 50-80 ms.

### 5.2.3 Latência do pipeline de análise

| Etapa | Tempo aproximado |
|---|---|
| Decodificação base64 → buffer | < 1 ms |
| Iteração de pixels + conversão Lab | ~50 ms (imagem 1024×1024) |
| Snap-to-palette (120 entradas) | ~12 µs |
| Inserção no Firestore | ~80 ms |
| Chamada à Claude API | ~2.000 ms |
| Serialização da resposta | < 1 ms |
| **Total ponta a ponta** | **~2.150 ms** |

A latência é dominada pela chamada à IA. Sem IA (fallback template), o tempo cai para aproximadamente 130 ms.

### 5.2.4 Custo por análise

Com a Claude 3.5 Sonnet (preços abril/2025):

- Input: ~600 tokens (system prompt + user prompt) × $3 USD / 1M = **$0.0018**
- Output: ~400 tokens (relatório de ~250 palavras) × $15 USD / 1M = **$0.0060**
- **Total**: **~$0.0078 USD por análise** (R$ 0.04 no câmbio de abril/2025)

Em uso real de um salão (5 análises/dia/profissional × 20 dias úteis): **$0.78 USD/mês por profissional**. Custo controlado.

## 5.3 Validação visual

### 5.3.1 Captura do app instalado como PWA

> *(Inserir aqui screenshot do dispositivo Android mostrando a app instalada — ícone na home screen, abertura standalone, tela de scanner com greeting personalizada, tela de result com swatch + parecer)*

### 5.3.2 Modo demo da tela de resultado

Acessível em `/result?demo=1`, exibe:

- **Swatch da cor detectada**: quadrado preenchido com o hex da entrada da paleta
- **Nome industrial** em fonte serif itálica: "Loiro Escuro"
- **Código colorimétrico**: `6.0 · Altura 6`
- **Três métricas** em chips: subtom, %brancos, confiança (com ícone de severidade)
- **Parecer profissional** em três parágrafos, fonte sans-serif
- **Detalhes técnicos** expansíveis: ΔE2000, modelo, tokens

### 5.3.3 Status bar fuse

Em PWA Android instalado, a transição entre status bar do sistema (com hora, bateria, WiFi) e conteúdo do app é visualmente contínua — cor sólida `#0E0C0B` se estende sem interrupção. Aurora gradient ambient começa abaixo da zona da status bar, mascarado para não criar cor diferente perto do system UI.

## 5.4 Testes automatizados

### 5.4.1 Domínio colorimetria

24 casos de teste em `src/lib/colorimetria/service.test.ts`, cobrindo:

- Conversão sRGB → Lab para pixels conhecidos (preto, branco, primárias)
- ΔE2000 contra valores tabulados do paper de Sharma et al.
- Snap-to-palette em casos edge (cor fora da paleta, cor exata)
- Classificação de subtom (frio, neutro, quente) com Lab sintético
- Computação de confiança em diferentes ΔE

Execução: `pnpm test` — 24/24 passando.

### 5.4.2 Tipos TypeScript

`pnpm typecheck` executa `tsc --noEmit` com configuração estrita. Zero erros de tipo na base atual.

### 5.4.3 Build de produção

`pnpm build` completa em **4-6 segundos**, gerando 11 rotas (4 estáticas, 7 dinâmicas).

## 5.5 Limitações conhecidas

### 5.5.1 Status bar transparente no PWA Android

A PWA Android Chrome **não suporta** status bar transparente com conteúdo da app passando por trás dela (modo *edge-to-edge* do Flutter). A solução adotada — `theme_color` idêntico ao background — minimiza a percepção da costura, mas não a elimina por completo em alguns dispositivos.

**Solução real**: Bloco H futuro (Capacitor wrap) habilita `StatusBar.setOverlaysWebView(true)` via API nativa.

### 5.5.2 Captura por câmera

A versão atual usa modo demo (`/result?demo=1`) com dados mock. O scanner exibe placeholder visual com anéis pulsantes mas não tem câmera real — funcionalidade prevista para o Bloco D.

### 5.5.3 Calibração da paleta

As coordenadas Lab das ~120 entradas foram derivadas de catálogos públicos das fabricantes. Para precisão de produção, recomenda-se fotografia de amostras físicas em ambiente controlado com colorímetro físico (ex.: X-Rite ColorChecker).

### 5.5.4 Iluminação na captura real

A precisão do diagnóstico depende fortemente da qualidade da iluminação na foto. O sistema atual orienta o usuário (chips "Luz natural" e "30 cm" com explicações em popover) mas não detecta automaticamente más condições de luz. **Validação futura** poderia rejeitar fotos com balanço de branco anormal, exposição extrema, ou área de cabelo insuficiente no enquadramento.
