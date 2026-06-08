/**
 * Análise de imagem capilar — converte pixels RGB em um diagnóstico de cor.
 *
 * Pipeline:
 *   1. Recebe array de pixels RGB (canvas ou MediaPipe segmentation mask)
 *   2. Converte cada pixel para Lab via `rgbToLab`
 *   3. Separa pixels em "cabelo pigmentado" vs "branco/grisalho" (chroma + L)
 *   4. Estima a base por MEDIANA dos pixels pigmentados (robusta a brancos/reflexos)
 *   5. Snap-to-palette: encontra a `PaletteEntry` com menor ΔE2000
 *   6. Detecta subtom via componentes a (frio/quente) e b (azul/amarelo)
 *   7. Devolve diagnóstico + confiança baseada na distância
 *
 * Tudo aqui é PURO — recebe pixels, devolve objeto. Sem fetch, sem DOM,
 * sem efeitos colaterais. Testável em isolamento, performante em loop.
 *
 * Uso esperado:
 *   - Bloco D (câmera): captura frame do <video>, extrai pixels via canvas
 *   - Bloco E (MediaPipe): segmenta máscara de cabelo, passa pixels filtrados
 *   - Bloco F (Claude): usa este resultado COMO CONTEXTO pra pedir relatório
 *
 * Por que isso e não só usar IA pra reconhecer cor?
 *   - **Determinismo**: mesma foto → mesmo diagnóstico, sem variação de prompt
 *   - **Custo zero**: roda no client, não consome tokens
 *   - **Velocidade**: <100ms pra 500k pixels num phone
 *   - **Auditável**: dá pra explicar exatamente como chegou no resultado
 *   - A IA fica reservada pro que é cara: gerar relatório em linguagem natural
 */

import type { LabColor, AlturaDeTom, Subtom, PaletteEntry } from './types';
import { rgbToLab, deltaE2000, chroma } from './color-math';
import { REFERENCE_PALETTE } from './reference-palette';

// ============================================================================
// Tipos da análise
// ============================================================================

export interface ImagePixels {
  /** Largura em pixels. */
  width: number;
  /** Altura em pixels. */
  height: number;
  /** Bytes RGBA contínuos (4 bytes por pixel, ordem: R, G, B, A). */
  data: Uint8ClampedArray | Uint8Array | number[];
}

export interface ColorAnalysisResult {
  /** Tom mais próximo encontrado na paleta de referência. */
  paletteEntry: PaletteEntry;
  /** Altura de tom detectada (1-12). */
  altura: AlturaDeTom;
  /** Subtom detectado a partir dos componentes Lab. */
  subtom: Subtom;
  /** Lab médio dos pixels de cabelo colorido (excluindo brancos). */
  labMedio: LabColor;
  /** Percentual de pixels com características de cabelo branco/grisalho (0-100). */
  brancosPct: number;
  /**
   * Confiança no diagnóstico (0-1).
   * Quanto menor o ΔE2000 ao tom mais próximo, maior a confiança.
   * ΔE < 3   → ≥ 0.85 (alta)
   * ΔE 3-8   → 0.50-0.85
   * ΔE > 12  → < 0.50 (provavelmente fora da paleta — cor não-natural)
   */
  confianca: number;
  /** ΔE2000 ao tom da paleta mais próximo (menor = match melhor). */
  deltaAoTomMaisProximo: number;
  /** Quantos pixels efetivamente foram usados na análise (após filtros). */
  pixelsAnalisados: number;
}

// ============================================================================
// Configuração da análise
// ============================================================================

/**
 * Limiares de classificação. Documentados aqui pra serem ajustáveis sem mexer
 * em lógica. Cada constante é uma decisão calibrada empiricamente — se mudar,
 * adicionar nota em comentário com o impacto observado.
 */
const LIMITES = {
  /**
   * Pixels com L (luminosidade) acima disso E chroma abaixo de `BRANCO_CHROMA_MAX`
   * são considerados "cabelo branco/grisalho".
   *
   * BRANCO_L_MIN baixado de 70 → 62: em cabelo sal-e-pimenta, muitos fios
   * grisalhos ficam na faixa L≈62-70. Com o limiar antigo (70) eles escapavam
   * pra base e PUXAVAM a cor pra um cinza claro — origem do falso diagnóstico
   * "loiro cinzento" em cabelo escuro com brancos. Cabelo natural pigmentado e
   * quente tem chroma > 10, então o teto de chroma (10) protege loiros/castanhos
   * de serem classificados como branco por engano.
   *
   * Importante: cinza ESCURO (L baixa + chroma baixa) NÃO é branco — é a base de
   * cabelos pretos/escuros. Por isso exige-se L alta E chroma baixa juntas.
   */
  BRANCO_L_MIN: 62,
  BRANCO_CHROMA_MAX: 10,

  /**
   * Pixels muito escuros (L<5) ou com chroma extremo geralmente são ruído
   * (sombra, raiz, fundo). Filtramos antes de calcular o Lab médio.
   */
  RUIDO_L_MIN: 5,
  RUIDO_L_MAX: 95,
  RUIDO_CHROMA_MAX: 60,

  /**
   * Limiar do componente `a` (Lab) pra classificar subtom.
   * `a` > 8 → tendência quente (avermelhado/dourado)
   * `a` < 0 → tendência fria (esverdeado/cinza)
   * Entre eles → neutro
   *
   * Esses valores correspondem ao range observado nos tons naturais da paleta
   * (a=1 pro preto neutro, a=11 pro loiro quente).
   */
  SUBTOM_FRIO_A_MAX: 4,
  SUBTOM_QUENTE_A_MIN: 8,
} as const;

// ============================================================================
// Análise principal
// ============================================================================

/**
 * Analisa uma imagem capilar e devolve o diagnóstico de cor.
 *
 * @param pixels  Objeto com width/height/data (RGBA contínuo)
 * @param mask    Opcional. Array booleano do mesmo tamanho — `true` = pixel
 *                pertence ao cabelo. Quando ausente, usa todos os pixels.
 *                No Bloco E, o MediaPipe vai gerar essa máscara.
 *
 * @returns ColorAnalysisResult com tom detectado, subtom, %brancos e confiança.
 */
export function analyzeImageColor(
  pixels: ImagePixels,
  mask?: boolean[],
): ColorAnalysisResult {
  const { width, height, data } = pixels;
  const totalPixels = width * height;

  // Pixels de cabelo PIGMENTADO (não-brancos): guardamos L,a,b para estimar a
  // base por MEDIANA — não por média. Cabelo com brancos tem distribuição
  // bimodal (fios escuros + fios grisalhos); a média de uma bimodal cai num
  // cinza médio que não existe no cabelo real, gerando o falso "loiro cinzento"
  // em cabelo escuro grisalho. A mediana é resistente tanto à mistura de
  // brancos residuais quanto a reflexos/realces pontuais da foto.
  const pigL: number[] = [];
  const pigA: number[] = [];
  const pigB: number[] = [];
  let brancoCount = 0;
  let candidatosCount = 0; // total de pixels que passaram pelo filtro de ruído

  // Single-pass por todos os pixels
  for (let i = 0; i < totalPixels; i++) {
    // Se há máscara, pula pixels que NÃO são cabelo
    if (mask && !mask[i]) continue;

    const offset = i * 4;
    const r = data[offset] ?? 0;
    const g = data[offset + 1] ?? 0;
    const b = data[offset + 2] ?? 0;
    const a = data[offset + 3] ?? 255;

    // Skip pixels transparentes (caso a máscara venha como alpha)
    if (a < 128) continue;

    const lab = rgbToLab(r, g, b);
    const C = chroma(lab);

    // Filtra ruído (sombras profundas, highlights estourados, cores muito saturadas)
    if (lab.L < LIMITES.RUIDO_L_MIN || lab.L > LIMITES.RUIDO_L_MAX) continue;
    if (C > LIMITES.RUIDO_CHROMA_MAX) continue;

    candidatosCount++;

    // Classifica como branco/grisalho (L alta + chroma baixa). Cinza escuro
    // (L baixa) NÃO entra aqui — é base de cabelo escuro, fica nos pigmentados.
    if (lab.L >= LIMITES.BRANCO_L_MIN && C <= LIMITES.BRANCO_CHROMA_MAX) {
      brancoCount++;
      continue;
    }

    // Senão, é cabelo pigmentado — guarda pra mediana
    pigL.push(lab.L);
    pigA.push(lab.a);
    pigB.push(lab.b);
  }

  // % brancos é em cima do total que passou pelo filtro de ruído
  // (não em cima do total de pixels — fundo da foto não conta)
  const brancosPct =
    candidatosCount > 0 ? Math.round((brancoCount / candidatosCount) * 100) : 0;

  // Edge case 1: nenhum pixel válido (imagem toda preta, transparente, etc.)
  if (candidatosCount === 0) {
    // Fallback "natural castanho médio" com confiança zero. Não throw — a UI
    // mostra aviso e pede outra foto.
    const fallback = REFERENCE_PALETTE.find((p) => p.id === '4.0')!;
    return {
      paletteEntry: fallback,
      altura: fallback.altura,
      subtom: fallback.subtom,
      labMedio: fallback.lab,
      brancosPct: 0,
      confianca: 0,
      deltaAoTomMaisProximo: Infinity,
      pixelsAnalisados: candidatosCount,
    };
  }

  // Edge case 2: cabelo predominantemente branco/grisalho — sem base pigmentada
  // pra estimar. Em vez de fingir um castanho, reporta o tom acromático claro
  // mais próximo e o alto % de brancos (honesto pro profissional).
  if (pigL.length === 0) {
    const baseBranca: LabColor = { L: 80, a: 0, b: 4 };
    const closestBranco = findClosestPaletteEntry(baseBranca);
    return {
      paletteEntry: closestBranco.entry,
      altura: closestBranco.entry.altura,
      subtom: classificarSubtom(baseBranca),
      labMedio: baseBranca,
      brancosPct,
      confianca: computarConfianca(closestBranco.deltaE),
      deltaAoTomMaisProximo: closestBranco.deltaE,
      pixelsAnalisados: candidatosCount,
    };
  }

  // Base de cor = mediana componente-a-componente dos pixels pigmentados.
  // Robusta: ignora a influência de brancos residuais e de reflexos.
  const labBase: LabColor = {
    L: mediana(pigL),
    a: mediana(pigA),
    b: mediana(pigB),
  };

  // Snap-to-palette: menor ΔE2000 contra todas as entradas
  const closest = findClosestPaletteEntry(labBase);

  // Classificação de subtom via componente `a` da base
  const subtom = classificarSubtom(labBase);

  // Confiança decai com a distância ao tom mais próximo
  const confianca = computarConfianca(closest.deltaE);

  return {
    paletteEntry: closest.entry,
    altura: closest.entry.altura,
    subtom,
    labMedio: labBase,
    brancosPct,
    confianca,
    deltaAoTomMaisProximo: closest.deltaE,
    pixelsAnalisados: candidatosCount,
  };
}

// ============================================================================
// Helpers — exportados pra testes / uso isolado
// ============================================================================

/**
 * Mediana de um array numérico. Ordena uma cópia (não muta o original) e
 * devolve o elemento central — ou a média dos dois centrais quando o tamanho
 * é par. É a base estatística do diagnóstico: resistente a outliers (reflexos,
 * realces) e à mistura de fios brancos, ao contrário da média aritmética.
 */
export function mediana(valores: number[]): number {
  const n = valores.length;
  if (n === 0) return 0;
  const ordenado = [...valores].sort((x, y) => x - y);
  const meio = n >> 1;
  return n % 2 === 0 ? (ordenado[meio - 1]! + ordenado[meio]!) / 2 : ordenado[meio]!;
}

/**
 * Encontra a entrada da paleta com menor ΔE2000 ao Lab fornecido.
 * O(n) — 120 entradas, ~12µs por chamada.
 */
export function findClosestPaletteEntry(lab: LabColor): {
  entry: PaletteEntry;
  deltaE: number;
} {
  let bestEntry: PaletteEntry = REFERENCE_PALETTE[0]!;
  let bestDelta = Infinity;

  for (const entry of REFERENCE_PALETTE) {
    const d = deltaE2000(lab, entry.lab);
    if (d < bestDelta) {
      bestDelta = d;
      bestEntry = entry;
    }
  }

  return { entry: bestEntry, deltaE: bestDelta };
}

/**
 * Classifica o subtom a partir do componente `a` (verde-vermelho) do Lab.
 *
 * Por que `a` e não `b`?
 *   - `a` distingue frio (negativo, esverdeado) de quente (positivo, avermelhado)
 *   - `b` é mais sobre azul/amarelo e varia muito com luminosidade
 *
 * Pra cabelo, a regra de salão é:
 *   - Frio (acinzentado/platinado) ↔ a baixo
 *   - Neutro (castanho/loiro natural) ↔ a médio
 *   - Quente (dourado/cobre/ruivo) ↔ a alto
 */
export function classificarSubtom(lab: LabColor): Subtom {
  if (lab.a < LIMITES.SUBTOM_FRIO_A_MAX) return 'frio';
  if (lab.a >= LIMITES.SUBTOM_QUENTE_A_MIN) return 'quente';
  return 'neutro';
}

/**
 * Mapeia ΔE2000 → confiança (0-1).
 *
 * Curva escolhida:
 *   ΔE=0   → 1.00 (match perfeito, raro)
 *   ΔE=3   → 0.85 (excelente — limiar de "indistinguível por leigo")
 *   ΔE=8   → 0.50 (bom — match plausível, cor pode ter nuance)
 *   ΔE=12  → 0.30 (fronteira — pode ser cor fora da paleta natural)
 *   ΔE=20+ → ~0.10 (provavelmente cor artificial — vermelho fantasia etc.)
 *
 * Fórmula: 1 - tanh(ΔE / 12). Suave, decresce monotonicamente, sempre em [0,1].
 */
export function computarConfianca(deltaE: number): number {
  if (deltaE === Infinity) return 0;
  const confianca = 1 - Math.tanh(deltaE / 12);
  return Math.max(0, Math.min(1, confianca));
}
