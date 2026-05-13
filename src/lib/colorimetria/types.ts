/**
 * Tipos do domínio de colorimetria capilar.
 *
 * Referência teórica: PLAN.md §5.2 ("Fundamentos teóricos").
 * Todo termo aqui segue a convenção brasileira de salões profissionais.
 *
 * Princípios:
 * - Tipos refletem a indústria. `altura` é 1-12, `reflexo` é 0-9.
 * - Nenhum tipo "string livre" em campos que devem ser fechados (union types).
 * - Valores que mudam (gramas, ml) são `number`; categorias são unions.
 */

// ============================================================================
// Escalas e categorias
// ============================================================================

/** Altura de tom — escala internacional 1 (preto) a 12 (platinado). */
export type AlturaDeTom = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/**
 * Código de reflexo (segundo dígito após o ponto na nomenclatura industrial).
 * 0 = natural, 1 = cinza/azul, 2 = violeta, 3 = dourado, 4 = cobre,
 * 5 = mogno, 6 = vermelho, 7 = matte/verde, 8 = pérola/bege, 9 = profundo.
 */
export type Reflexo = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** Volumagem do oxidante em volumes (e seu % H₂O₂ correspondente). */
export type Volumagem = 10 | 20 | 30 | 40;
export type PercentualH2O2 = 3 | 6 | 9 | 12;

/** Subtom percebido — afeta escolha de reflexo recomendado. */
export type Subtom = 'frio' | 'neutro' | 'quente';

/** Comprimento do cabelo — afeta quantidade de produto. */
export type Comprimento = 'curto' | 'medio' | 'longo' | 'muito_longo';

/** Categorias da paleta de referência (filtro de UI + escopo da IA). */
export type CategoriaPaleta =
  | 'natural'
  | 'loiro'
  | 'ruivo'
  | 'mogno'
  | 'vermelho'
  | 'matte'
  | 'perola'
  /**
   * Cores fantasia / pastéis / vibrantes — azul, rosa, roxo, verde, etc.
   * Não seguem a nomenclatura tradicional `altura.reflexo` (IDs começam com `F.`).
   * Geralmente exigem clareamento prévio do cabelo natural (≥ altura 9-10)
   * pra atingirem saturação visível — aplicados como tonalizante direto.
   */
  | 'fantasia';

/** Ação canônica derivada do delta e dos brancos. */
export type Acao =
  | 'manter'
  | 'tom_sobre_tom'
  | 'escurecer'
  | 'clarear_leve'
  | 'clarear_medio'
  | 'clarear_forte'
  | 'descolorir_e_pigmentar';

// ============================================================================
// Paleta de referência (espectro restrito)
// ============================================================================

/** Coordenadas CIE Lab (D65, observador padrão 2°). */
export interface LabColor {
  /** Luminosidade 0-100. */
  L: number;
  /** Eixo verde-vermelho. Negativo = verde, positivo = vermelho. */
  a: number;
  /** Eixo azul-amarelo. Negativo = azul, positivo = amarelo. */
  b: number;
}

/** Uma entrada da paleta de referência da IA. */
export interface PaletteEntry {
  /** ID único no formato "altura.reflexos", ex: "6.0", "7.43". */
  id: string;
  altura: AlturaDeTom;
  /** Primeiro reflexo. `null` quando é tom natural puro (.0). */
  reflexo_primario: Reflexo | null;
  /** Segundo reflexo opcional, para tons duplos (ex: 7.46). */
  reflexo_secundario: Reflexo | null;
  /** Nome industrial em PT-BR, espelhando catálogos profissionais. */
  nome: string;
  subtom: Subtom;
  /** Coordenadas Lab (ground truth para snap-to-palette). */
  lab: LabColor;
  /** Hex puramente para preview na UI — NÃO usar em cálculos. */
  hex: string;
  categoria: CategoriaPaleta;
}

// ============================================================================
// Diagnóstico (input do ColorimetriaService)
// ============================================================================

/**
 * Estado capilar atual + alvo + contexto do usuário.
 * É o input central de `calcularFormula`.
 */
export interface Diagnostico {
  /** Altura atual do cabelo. */
  base: AlturaDeTom;
  /** ID da entrada da paleta correspondente à base (ex: "6.0"). */
  base_paleta_id: string;

  /** Altura alvo desejada. */
  desejado: AlturaDeTom;
  /** ID da entrada da paleta do tom desejado (ex: "8.1"). */
  desejado_paleta_id: string;

  /** Porcentagem de cabelos brancos. 0-100, inteiro. */
  brancos_pct: number;

  /** Subtom da pele/cabelo identificado. */
  subtom_atual: Subtom;

  /** Comprimento — define quantidade de produto. */
  comprimento: Comprimento;

  /** Sinaliza que o cabelo já passou por clareamento/descoloração químico anterior. */
  cabelo_previamente_descolorido: boolean;
}

// ============================================================================
// Fórmula (output do ColorimetriaService)
// ============================================================================

export type TipoProduto = 'tintura' | 'tonalizante' | 'pre_pigmentacao' | 'po_descolorante';

export interface Produto {
  tipo: TipoProduto;
  /** Nome industrial, ex: "Tintura 8.1 - Loiro Claro Acinzentado". */
  nome: string;
  /** Quantidade em gramas. Sempre arredondado para múltiplo de 5g. */
  quantidade_g: number;
  /** Percentual deste produto no total de tintura (útil para mix de cobertura). */
  proporcao_pct: number;
  /** Observação livre — pode ser null. */
  obs: string | null;
}

export interface Oxidante {
  volumagem: Volumagem;
  percentual_h2o2: PercentualH2O2;
  /** Quantidade total de oxidante em ml. */
  quantidade_ml: number;
  /** Label legível da proporção, ex: "1:1.5". */
  proporcao_label: string;
}

export interface Passo {
  ordem: number;
  /** Título curto, ex: "Pré-pigmentação". */
  titulo: string;
  /** Descrição detalhada da etapa. */
  descricao: string;
  /** Tempo em minutos desta etapa. */
  tempo_min: number;
}

export type AvisoSeveridade = 'info' | 'atencao' | 'critico';

export interface Aviso {
  severidade: AvisoSeveridade;
  /** Texto humano em PT-BR. */
  mensagem: string;
  /** Código estável para i18n e telemetria, ex: "DELTA_EXCEDIDO". */
  codigo: string;
}

export interface Formula {
  diagnostico: Diagnostico;
  acao: Acao;
  produtos: Produto[];
  oxidante: Oxidante;
  passos: Passo[];
  /** Soma dos tempos dos passos principais (exclui pré-pigmentação). */
  tempo_pausa_total_min: number;
  avisos: Aviso[];
  /** Paleta_id que o resultado deve atingir (pode divergir de desejado em delta>3). */
  resultado_esperado_paleta_id: string;
}

// ============================================================================
// Erros do domínio
// ============================================================================

/** Erro lançado por validações do serviço quando inputs são impossíveis. */
export class ColorimetriaError extends Error {
  public readonly codigo: string;

  constructor(codigo: string, mensagem: string) {
    super(mensagem);
    this.name = 'ColorimetriaError';
    this.codigo = codigo;
  }
}
