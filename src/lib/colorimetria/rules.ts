/**
 * Tabelas canônicas de regras de colorimetria capilar.
 *
 * Princípio: **dados, não código**. Todas as regras que um cabeleireiro pode
 * querer ajustar vivem aqui como estruturas declarativas. O ColorimetriaService
 * apenas consulta. Para refinar o sistema, edite estas tabelas — não a lógica.
 *
 * Fonte: PLAN.md §5.2 (manuais L'Oréal Professionnel, Wella, Schwarzkopf).
 */

import type {
  Comprimento,
  PercentualH2O2,
  Reflexo,
  Volumagem,
} from './types';

// ============================================================================
// Volumagem em função do delta
// ============================================================================

/**
 * Volumagem recomendada de acordo com o delta (desejado - base).
 *
 * - Delta negativo (escurecer): 10 vol — sem clareamento.
 * - Delta 0 (manter/tom sobre tom): 10 vol.
 * - Delta 1: 20 vol — clareamento suave.
 * - Delta 2: 30 vol.
 * - Delta 3: 40 vol (reserva técnica; gera aviso).
 * - Delta ≥ 4: NÃO está aqui — dispara fluxo `descolorir_e_pigmentar`.
 */
export const VOLUMAGEM_POR_DELTA = new Map<number, Volumagem>([
  [-12, 10],
  [-11, 10],
  [-10, 10],
  [-9, 10],
  [-8, 10],
  [-7, 10],
  [-6, 10],
  [-5, 10],
  [-4, 10],
  [-3, 10],
  [-2, 10],
  [-1, 10],
  [0, 10],
  [1, 20],
  [2, 30],
  [3, 40],
]);

/** Mapeia volumagem para o percentual de H₂O₂. */
export const PERCENTUAL_H2O2_POR_VOLUMAGEM: Readonly<Record<Volumagem, PercentualH2O2>> = {
  10: 3,
  20: 6,
  30: 9,
  40: 12,
};

// ============================================================================
// Quantidade de tintura por comprimento
// ============================================================================

/**
 * Gramas-base de tintura por comprimento. Estes valores são o **total** de
 * pigmento a usar — quando há mistura de cobertura, são divididos entre os
 * dois produtos (ver MIX_COBERTURA_BRANCOS).
 */
export const QUANTIDADE_BASE_G: Readonly<Record<Comprimento, number>> = {
  curto: 50,
  medio: 70,
  longo: 100,
  muito_longo: 150,
};

// ============================================================================
// Proporção tintura:oxidante
// ============================================================================

export type TipoProporcao =
  | 'padrao'
  | 'cobertura_brancos_forte'
  | 'super_clareador'
  | 'tonalizante';

/**
 * Multiplicador (volume OX em ml) / (gramas de tintura).
 * Ex: padrão = 1.5 → 60g + 90ml.
 */
export const PROPORCAO_OX: Readonly<Record<TipoProporcao, number>> = {
  padrao: 1.5,
  cobertura_brancos_forte: 1.0,
  super_clareador: 2.0,
  tonalizante: 2.0,
};

/** Label legível da proporção (para UI). */
export const PROPORCAO_LABEL: Readonly<Record<TipoProporcao, string>> = {
  padrao: '1:1.5',
  cobertura_brancos_forte: '1:1',
  super_clareador: '1:2',
  tonalizante: '1:2',
};

// ============================================================================
// Cobertura de cabelos brancos
// ============================================================================

export interface MixCobertura {
  /** Porcentagem do total de tintura que é do tom desejado (0-1). */
  pct_desejado: number;
  /** Porcentagem do total de tintura que é do tom natural (.0) (0-1). */
  pct_natural: number;
  /**
   * Códigos de reflexo do desejado que **obrigam** pré-pigmentação quando os
   * brancos estão nesta faixa. Ex: cobre/vermelho/mogno em alto % de brancos.
   */
  exige_pre_pigmentacao_se_reflexo_em: ReadonlyArray<Reflexo>;
}

export interface FaixaCobertura {
  /** Limite superior da faixa de % brancos (inclusivo). */
  brancos_max: number;
  mix: MixCobertura;
}

/**
 * Tabela de mistura para cobertura de brancos.
 * A regra é: encontrar a primeira faixa cuja `brancos_max` >= brancos_pct.
 */
export const MIX_COBERTURA_BRANCOS: ReadonlyArray<FaixaCobertura> = [
  {
    brancos_max: 30,
    mix: { pct_desejado: 1.0, pct_natural: 0.0, exige_pre_pigmentacao_se_reflexo_em: [] },
  },
  {
    brancos_max: 50,
    mix: { pct_desejado: 0.7, pct_natural: 0.3, exige_pre_pigmentacao_se_reflexo_em: [] },
  },
  {
    brancos_max: 70,
    mix: {
      pct_desejado: 0.5,
      pct_natural: 0.5,
      exige_pre_pigmentacao_se_reflexo_em: [4, 5, 6],
    },
  },
  {
    brancos_max: 100,
    mix: {
      pct_desejado: 0.5,
      pct_natural: 0.5,
      exige_pre_pigmentacao_se_reflexo_em: [4, 5, 6],
    },
  },
];

// ============================================================================
// Neutralização — lei das cores complementares
// ============================================================================

/**
 * Mapeia o delta de clareamento → reflexo neutralizador sugerido quando o
 * usuário escolheu reflexo .0 (natural) ou nenhum reflexo, e a base é mais
 * escura que o alvo (delta > 0). Resolve pigmento residual exposto.
 */
export const NEUTRALIZACAO_POR_DELTA = new Map<
  number,
  { reflexo: Reflexo; descricao: string }
>([
  [1, { reflexo: 7, descricao: 'Verde (.7) para neutralizar vermelho residual' }],
  [2, { reflexo: 1, descricao: 'Azul (.1) para neutralizar laranja residual' }],
  [3, { reflexo: 2, descricao: 'Violeta (.2) para neutralizar amarelo residual' }],
  // Delta >= 4 cai no fluxo descolorir_e_pigmentar; neutralização vem do tom alvo.
]);

// ============================================================================
// Tempo de pausa
// ============================================================================

export type CenarioPausa =
  | 'tom_sobre_tom'
  | 'escurecer'
  | 'clarear_leve'
  | 'clarear_medio'
  | 'clarear_forte'
  | 'cobertura_brancos'
  | 'descolorir_e_pigmentar'
  | 'pre_pigmentacao';

/** Tempo em minutos por cenário. Soma dos cenários compõe tempo_pausa_total_min. */
export const TEMPO_PAUSA_MIN: Readonly<Record<CenarioPausa, number>> = {
  tom_sobre_tom: 30,
  escurecer: 30,
  clarear_leve: 35,
  clarear_medio: 40,
  clarear_forte: 45,
  cobertura_brancos: 45,
  descolorir_e_pigmentar: 50,
  pre_pigmentacao: 15,
};

// ============================================================================
// Limites de validação
// ============================================================================

export const LIMITES = {
  ALTURA_MIN: 1,
  ALTURA_MAX: 12,
  BRANCOS_MIN: 0,
  BRANCOS_MAX: 100,
  /** Acima deste delta, descoloração prévia é obrigatória. */
  DELTA_MAX_SEM_DESCOLORACAO: 3,
} as const;

// ============================================================================
// Códigos de aviso (estáveis, para i18n e telemetria)
// ============================================================================

export const CODIGO_AVISO = {
  DELTA_EXCEDIDO: 'DELTA_EXCEDIDO',
  DESCOLORACAO_PREVIA_NECESSARIA: 'DESCOLORACAO_PREVIA_NECESSARIA',
  CABELO_FRAGIL_VOLUMAGEM_ALTA: 'CABELO_FRAGIL_VOLUMAGEM_ALTA',
  PRE_PIGMENTACAO_OBRIGATORIA: 'PRE_PIGMENTACAO_OBRIGATORIA',
  SUBTOM_DIVERGENTE: 'SUBTOM_DIVERGENTE',
  TESTE_MECHA_RECOMENDADO: 'TESTE_MECHA_RECOMENDADO',
  NEUTRALIZACAO_AUTOMATICA: 'NEUTRALIZACAO_AUTOMATICA',
  COBERTURA_BRANCOS_ALTA: 'COBERTURA_BRANCOS_ALTA',
} as const;
