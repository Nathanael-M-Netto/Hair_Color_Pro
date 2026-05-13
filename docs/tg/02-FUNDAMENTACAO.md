# 2. Fundamentação Teórica

## 2.1 Colorimetria capilar profissional

### 2.1.1 Escala internacional de altura de tom

A indústria de coloração capilar adota uma escala numérica padronizada de **altura de tom** que vai de **1 (preto)** a **12 (platinado)**, descrevendo o nível de luminosidade do cabelo:

| Altura | Nome industrial PT-BR | Coordenadas Lab aproximadas (D65) |
|---|---|---|
| 1 | Preto | L=8, a=1, b=2 |
| 2 | Castanho Muito Escuro | L=13, a=3, b=4 |
| 3 | Castanho Escuro | L=19, a=4, b=7 |
| 4 | Castanho Médio | L=26, a=5, b=10 |
| 5 | Castanho Claro | L=34, a=7, b=14 |
| 6 | Loiro Escuro | L=42, a=9, b=19 |
| 7 | Loiro Médio | L=50, a=10, b=24 |
| 8 | Loiro Claro | L=58, a=11, b=28 |
| 9 | Loiro Muito Claro | L=66, a=9, b=28 |
| 10 | Loiro Claríssimo | L=74, a=7, b=25 |
| 11 | Super Clareador Natural | L=82, a=4, b=20 |
| 12 | Platinado | L=89, a=1, b=13 |

Cada altura natural é denotada como `X.0` (ponto zero). Reflexos secundários são representados pelo segundo dígito: `7.3` é "Loiro Médio Dourado" (altura 7 com reflexo 3 = dourado).

### 2.1.2 Reflexos e nomenclatura

O segundo dígito da nomenclatura identifica o reflexo, padronizado entre os principais fabricantes:

| Código | Reflexo | Característica |
|---|---|---|
| .0 | natural | sem reflexo dominante |
| .1 | cinza / azul | frio, neutralizante de quentura |
| .2 | violeta / irisado | frio, neutraliza amarelo |
| .3 | dourado | quente, amplifica luminosidade |
| .4 | cobre | quente, vibração avermelhada |
| .5 | mogno | terroso, marrom-avermelhado |
| .6 | vermelho | vibrante, alta saturação |
| .7 | matte / verde | neutralizante de vermelho |
| .8 | pérola / bege | frio sutil, luminoso |
| .9 | profundo | escurecedor, alta densidade |

### 2.1.3 Subtom

O **subtom** é a tendência cromática perceptível do cabelo, classificada em três categorias: **frio** (acinzentado, esverdeado), **neutro** (equilibrado), ou **quente** (dourado, avermelhado). Determina afinidade do cliente com famílias de reflexos e impacta diretamente a escolha do produto final.

### 2.1.4 Cobertura de brancos

O percentual de fios brancos no cabelo (de 0% a 100%) define se a fórmula precisa de **pré-pigmentação** (acima de ~50%), **mix com tom natural** (entre 20% e 50%), ou se pode ser aplicada diretamente sem ajuste de cobertura (abaixo de 20%).

## 2.2 Espaços de cor e a métrica CIEDE2000

### 2.2.1 sRGB e o problema da percepção

O espaço **sRGB** (Stokes et al., 1996; IEC 61966-2-1) é o padrão de fato para representação digital de cor: três canais Red, Green, Blue, cada um com 8 bits (256 valores). É o espaço de cor em que câmeras fotografam, navegadores renderizam e telas emitem luz.

Contudo, sRGB é **perceptualmente não-uniforme**: a distância euclidiana entre duas cores em sRGB não corresponde à diferença percebida pelo olho humano. Por exemplo, a diferença entre `(0,0,0)` e `(10,10,10)` é claramente visível, mas a diferença entre `(245,245,245)` e `(255,255,255)` é quase indistinguível — embora ambas tenham a mesma distância euclidiana.

### 2.2.2 CIE XYZ e CIE Lab

A CIE (Commission Internationale de l'Éclairage) define em 1931 o espaço **XYZ**, baseado em medições de resposta espectral do olho humano. Em 1976, a CIE introduz o **CIE L\*a\*b\* (Lab)**, um espaço derivado por transformação não-linear de XYZ, projetado para ser **perceptualmente uniforme**:

- **L\*** (luminosidade): 0 (preto) a 100 (branco)
- **a\***: eixo verde-vermelho (-128 a +127)
- **b\***: eixo azul-amarelo (-128 a +127)

Iguais distâncias euclidianas em Lab correspondem **aproximadamente** a iguais diferenças perceptuais. A transformação de sRGB para Lab requer dois passos:

1. **sRGB → linear-RGB**: aplica a curva inversa de gama (γ ≈ 2.2)
   ```
   c_lin = ((c + 0.055) / 1.055)^2.4   se c > 0.04045
   c_lin = c / 12.92                    caso contrário
   ```
2. **linear-RGB → XYZ → Lab** sob iluminante D65 (luz do dia, 6504 K)

A implementação completa está em [`src/lib/colorimetria/color-math.ts`](../../src/lib/colorimetria/color-math.ts).

### 2.2.3 ΔE2000 — diferença perceptual de cor

A **distância euclidiana em Lab** (ΔE76, ou simplesmente "Delta E") melhorou a uniformidade perceptual, mas estudos posteriores (Luo et al., 2001) mostraram que ainda apresenta erros sistemáticos em regiões específicas do espaço — particularmente em tons cinza-azulados e em altas cromaticidades.

A CIE publica em 2000 a métrica **CIEDE2000** (ΔE₀₀), refinada por Sharma, Wu e Dalal (2005) em uma série de equações que aplicam correções rotacionais, ponderações por luminosidade e ajuste por croma:

$$
\Delta E_{00} = \sqrt{\left(\frac{\Delta L'}{k_L S_L}\right)^2 + \left(\frac{\Delta C'}{k_C S_C}\right)^2 + \left(\frac{\Delta H'}{k_H S_H}\right)^2 + R_T \frac{\Delta C'}{k_C S_C} \frac{\Delta H'}{k_H S_H}}
$$

Interpretação prática:

| ΔE₀₀ | Diferença perceptual |
|---|---|
| < 1 | Indistinguível a olho nu |
| 1 a 2 | Perceptível apenas por especialista |
| 2 a 5 | Perceptível por leigo |
| 5 a 12 | Cores claramente distintas |
| > 12 | Provavelmente cor fora do escopo de comparação |

CIEDE2000 é o **padrão da indústria** para colorimetria computacional desde 2001 e é a métrica utilizada pelo presente trabalho para o algoritmo de **snap-to-palette** — identificar o tom da paleta de referência mais próximo da cor capturada pela câmera.

## 2.3 Progressive Web Apps (PWA)

### 2.3.1 Definição

Uma **Progressive Web App** (Russell, Berriman, 2015) é uma aplicação web que utiliza um conjunto específico de tecnologias para entregar experiência similar à de aplicativos nativos: instalação na tela inicial, execução offline, acesso a APIs do dispositivo (câmera, geolocalização), e renderização em modo **standalone** (sem barra de endereços do navegador).

### 2.3.2 Critérios técnicos de instalabilidade

O Chrome Android define critérios para que um site seja instalável como PWA real (não atalho do navegador):

1. **HTTPS obrigatório** (exceto localhost)
2. **Manifest** válido com `name`, `display`, `start_url`, e ícones PNG ≥ 192×192 e ≥ 512×512
3. **Service Worker** registrado com handler de evento `fetch`
4. **Engajamento mínimo** do usuário (heurística do navegador)

iOS Safari adota critérios similares mas com requisitos adicionais: `apple-touch-icon` em formato PNG (SVG é silenciosamente ignorado), e meta tag `apple-mobile-web-app-capable`.

### 2.3.3 Service Worker

O **Service Worker** é um worker JavaScript que roda em paralelo à página principal, interceptando requisições de rede. Permite implementar estratégias de cache (`cache-first`, `network-first`, `stale-while-revalidate`) e operação offline.

No presente trabalho, o Service Worker (`public/sw.js`) implementa:
- **Network-first** para navegações HTML (rotas), com fallback para cache
- **Cache-first** para assets estáticos (JS, CSS, imagens), com revalidação em background
- **Passthrough** para APIs (`/api/*`) e endpoints de HMR do Next.js

### 2.3.4 Display modes

O manifest declara em `display` o modo de exibição preferido quando o PWA é instalado:

- **`browser`**: abre como aba normal do navegador (não-PWA)
- **`minimal-ui`**: barra de URL mínima
- **`standalone`**: sem nenhuma UI do navegador (modo padrão de PWA)
- **`fullscreen`**: ocupa toda a tela, escondendo inclusive a status bar do sistema

O presente trabalho declara `display_override: ["fullscreen", "standalone", "minimal-ui"]`, permitindo que o Chrome escolha o modo mais imersivo suportado pelo dispositivo.

## 2.4 Inteligência artificial generativa

### 2.4.1 Modelos de linguagem grandes

**Large Language Models** (LLMs) são redes neurais transformer (Vaswani et al., 2017) treinadas em corpora massivos de texto, capazes de gerar texto em linguagem natural condicionado a um prompt de entrada. Os modelos atualmente em estado da arte (2024-2025) — GPT-4o (OpenAI), Claude 3.5/4 Sonnet (Anthropic), Gemini 1.5/2 Pro (Google) — atingem performance comparável a humanos em tarefas de compreensão, redação e raciocínio.

### 2.4.2 Modelos multimodais

Modelos **multimodais** (ou *vision-language*) aceitam imagens como parte do prompt e podem realizar tarefas que combinam visão e linguagem: descrever uma cena, identificar objetos, extrair texto de imagens, ou — relevante para este trabalho — realizar análise visual completa de uma fotografia.

A capacidade de **reconhecimento de cor** está dentro do escopo desses modelos, mas com importantes ressalvas:

- **Não-determinismo**: respostas variam entre execuções com mesmo prompt
- **Custo**: tipicamente cobrado por token de entrada e saída
- **Latência**: latência de rede + inferência (~1-5 segundos)
- **Auditabilidade**: difícil explicar exatamente por que o modelo decidiu por uma cor específica

### 2.4.3 Papel da IA neste trabalho

A decisão arquitetural central deste TG é **NÃO delegar o reconhecimento de cor à IA**, mas reservar o modelo de linguagem (Google Gemini) para a tarefa em que LLMs realmente excedem alternativas algorítmicas: **geração de texto profissional em linguagem natural**.

O pipeline opera assim:

```
Foto → Pixels → Análise determinística → Diagnóstico numérico → IA → Parecer textual
                  (CIEDE2000, ~50ms)      (tom, subtom, brancos, ΔE, confiança)    (~2s, 500 tokens)
```

A IA recebe os números do diagnóstico como contexto e gera um parecer no padrão de uma cabeleireira sênior, em português brasileiro, com três parágrafos (diagnóstico, interpretação, cuidado).

Essa separação garante: determinismo no reconhecimento, custo controlado (apenas tokens de saída textual), resiliência (relatório por template quando a API falha), e auditabilidade (todo número exibido é resultado de cálculo, não de "alucinação" da IA).

## 2.5 Stack tecnológica adotada

### 2.5.1 Next.js 15 (App Router)

Framework React de produção, fornece roteamento baseado em arquivos (App Router), renderização do lado do servidor (SSR), componentes do servidor (Server Components, React 19), middleware antes de cada request, e API routes integradas. Versão 15.5 utilizada.

### 2.5.2 TypeScript 5.7 estrito

Toda base de código tipada com `strict: true` e `noUncheckedIndexedAccess: true`, eliminando classes inteiras de erros em tempo de compilação.

### 2.5.3 Tailwind CSS v4

Sistema de design por *utility classes* com tokens definidos inline via diretiva `@theme` em CSS puro (eliminando arquivo de configuração separado). Compilação ~5× mais rápida que a versão anterior.

### 2.5.4 Firebase (Auth + Firestore)

Plataforma BaaS (Backend as a Service) do Google, escolhida por compatibilidade com a base de usuários do aplicativo Flutter pré-existente no mesmo projeto `arte-de-colorir-cabelos`.

### 2.5.5 Google Gemini

Modelo de linguagem do Google, acessado via REST API (Generative Language API). Escolhido pela combinação de qualidade adequada na geração de texto técnico em português brasileiro com **plano gratuito de aproximadamente 1500 requisições/dia** — adequado tanto para validação acadêmica quanto para uso real em escala de salão. A implementação dispensa SDK oficial: utiliza `fetch` nativo do Node.js contra o endpoint REST, mantendo o bundle de dependências enxuto.
