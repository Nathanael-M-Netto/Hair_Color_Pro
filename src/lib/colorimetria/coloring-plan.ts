/**
 * Plano de coloração — calcula o "caminho" do tom atual ao tom desejado.
 *
 * Premissa: dado um diagnóstico (tom atual) + um tom desejado da paleta,
 * gera um plano técnico determinístico:
 *   - Delta de altura (clarear / escurecer / manter)
 *   - Mudança de reflexo (se houver)
 *   - Mudança de subtom (frio → quente requer mais cuidado)
 *   - Ação canônica (manter / tom_sobre_tom / clarear_X / descolorir)
 *   - Avisos (cabelo branco precisa de pré-pigmentação, etc.)
 *   - Volumagem recomendada
 *
 * Tudo determinístico — a IA recebe esse plano e gera o relatório textual.
 * NÃO inventa números, NÃO contradiz o cálculo.
 */

import type { PaletteEntry, Acao, Volumagem, Subtom } from './types';
import { REFERENCE_PALETTE_BY_ID } from './reference-palette';

// ============================================================================
// Tipos
// ============================================================================

export interface ColoringPlanInput {
  /** ID da entrada da paleta correspondente ao tom ATUAL (vem da análise). */
  basePaletteId: string;
  /** ID da entrada da paleta correspondente ao tom DESEJADO (escolha do user). */
  targetPaletteId: string;
  /** Subtom detectado na análise. */
  subtomAtual: Subtom;
  /** Percentual de brancos (0-100). */
  brancosPct: number;
}

export interface ColoringPlanWarning {
  /** 'info' = informativo · 'atencao' = cuidado importante · 'critico' = bloqueia/recomenda salão */
  severidade: 'info' | 'atencao' | 'critico';
  codigo: string;
  mensagem: string;
}

export interface ColoringPlan {
  base: PaletteEntry;
  target: PaletteEntry;
  /**
   * Diferença de altura (target - base):
   *   > 0 = precisa clarear
   *   < 0 = precisa escurecer
   *   = 0 = mesma altura
   */
  deltaAltura: number;
  /** Mudança de reflexo (true se primary reflexo é diferente). */
  mudouReflexo: boolean;
  /** Mudança de subtom (frio → quente, etc.). */
  mudouSubtom: boolean;
  /** Ação canônica derivada. */
  acao: Acao;
  /** Volumagem do oxidante recomendada (10, 20, 30 ou 40). */
  volumagemRecomendada: Volumagem;
  /** Tempo de pausa aproximado em minutos (regra de salão por ação). */
  tempoPausaMin: number;
  /** Lista de avisos contextualizados. */
  avisos: ColoringPlanWarning[];
  /** Resumo textual em uma frase (UI). */
  resumo: string;
}

// ============================================================================
// Regras (dados, não código)
// ============================================================================

/**
 * Volumagem em função do delta de altura.
 * Regra padrão de salão (Wella/L'Oréal manuais):
 *   - mesmo nível            → 20 vol (oxidação leve, fixa pigmento)
 *   - clarear 1 nível        → 20 vol
 *   - clarear 2 níveis       → 30 vol
 *   - clarear 3+ níveis      → 40 vol (limite químico de tintura comum)
 *   - escurecer              → 20 vol (deposita pigmento sem clarear)
 */
const VOLUMAGEM_POR_DELTA: ReadonlyArray<{ deltaMin: number; vol: Volumagem }> = [
  { deltaMin: 3, vol: 40 },
  { deltaMin: 2, vol: 30 },
  { deltaMin: 1, vol: 20 },
  { deltaMin: 0, vol: 20 },
  { deltaMin: -10, vol: 20 },
];

/**
 * Tempo de pausa aproximado por ação. Valores médios — ajustes finos
 * dependem do fabricante e do estado do cabelo.
 */
const TEMPO_POR_ACAO: Record<Acao, number> = {
  manter: 0,
  tom_sobre_tom: 30,
  escurecer: 35,
  clarear_leve: 35,
  clarear_medio: 45,
  clarear_forte: 50,
  descolorir_e_pigmentar: 60,
};

// ============================================================================
// Cálculo principal
// ============================================================================

export function calcularPlano(input: ColoringPlanInput): ColoringPlan {
  const base = REFERENCE_PALETTE_BY_ID.get(input.basePaletteId);
  const target = REFERENCE_PALETTE_BY_ID.get(input.targetPaletteId);

  if (!base) {
    throw new Error(`Paleta: tom base "${input.basePaletteId}" não encontrado.`);
  }
  if (!target) {
    throw new Error(`Paleta: tom desejado "${input.targetPaletteId}" não encontrado.`);
  }

  const deltaAltura = target.altura - base.altura;
  const mudouReflexo = base.reflexo_primario !== target.reflexo_primario;
  const mudouSubtom = input.subtomAtual !== target.subtom;

  const acao = derivarAcao(deltaAltura, mudouReflexo, input.brancosPct);
  const volumagemRecomendada = derivarVolumagem(deltaAltura);
  const tempoPausaMin = TEMPO_POR_ACAO[acao];
  const avisos = derivarAvisos(deltaAltura, input.brancosPct, mudouSubtom, base, target);
  const resumo = montarResumo(deltaAltura, mudouReflexo, base, target);

  return {
    base,
    target,
    deltaAltura,
    mudouReflexo,
    mudouSubtom,
    acao,
    volumagemRecomendada,
    tempoPausaMin,
    avisos,
    resumo,
  };
}

// ============================================================================
// Helpers
// ============================================================================

function derivarAcao(deltaAltura: number, mudouReflexo: boolean, _brancosPct: number): Acao {
  // Mesmo nível, mesmo reflexo → só fixa cor
  if (deltaAltura === 0 && !mudouReflexo) return 'manter';

  // Mesmo nível, reflexo diferente → tom sobre tom
  if (deltaAltura === 0) return 'tom_sobre_tom';

  // Escurecer
  if (deltaAltura < 0) return 'escurecer';

  // Clarear — granularidade pela magnitude do salto
  if (deltaAltura === 1) return 'clarear_leve';
  if (deltaAltura === 2) return 'clarear_medio';
  if (deltaAltura <= 3) return 'clarear_forte';

  // 4+ níveis: tintura comum não consegue. Precisa descolorante.
  // Se cabelo já tem muitos brancos, ainda mais delicado.
  return 'descolorir_e_pigmentar';
}

function derivarVolumagem(deltaAltura: number): Volumagem {
  for (const regra of VOLUMAGEM_POR_DELTA) {
    if (deltaAltura >= regra.deltaMin) return regra.vol;
  }
  return 20;
}

function derivarAvisos(
  deltaAltura: number,
  brancosPct: number,
  mudouSubtom: boolean,
  base: PaletteEntry,
  target: PaletteEntry,
): ColoringPlanWarning[] {
  const avisos: ColoringPlanWarning[] = [];

  // Clareamento extremo (≥4 níveis)
  if (deltaAltura >= 4) {
    avisos.push({
      severidade: 'critico',
      codigo: 'CLAREAMENTO_EXTREMO',
      mensagem: `Salto de ${deltaAltura} níveis exige descoloração antes do tom. Tintura comum não atinge esse clareamento. Considere encaminhar pra profissional experiente — risco de quebra capilar.`,
    });
  }

  // Brancos altos com mudança grande
  if (brancosPct >= 50 && Math.abs(deltaAltura) >= 2) {
    avisos.push({
      severidade: 'atencao',
      codigo: 'BRANCOS_COM_MUDANCA',
      mensagem: `Cabelo com ${brancosPct}% de brancos + transformação grande exige pré-pigmentação antes da coloração principal pra cobertura uniforme.`,
    });
  } else if (brancosPct >= 30) {
    avisos.push({
      severidade: 'info',
      codigo: 'BRANCOS_MODERADOS',
      mensagem: `Com ${brancosPct}% de brancos, recomenda-se mix do tom desejado com o natural correspondente (${target.altura}.0) na proporção 1:1.`,
    });
  }

  // Mudança de subtom radical (frio → quente ou vice-versa)
  if (mudouSubtom && (base.subtom === 'frio' && target.subtom === 'quente')) {
    avisos.push({
      severidade: 'atencao',
      codigo: 'SUBTOM_FRIO_QUENTE',
      mensagem: 'Transição de subtom frio pra quente pode revelar fundo de descoloração amarelado durante o processo. Avalie pré-pigmentação dourada.',
    });
  } else if (mudouSubtom && (base.subtom === 'quente' && target.subtom === 'frio')) {
    avisos.push({
      severidade: 'atencao',
      codigo: 'SUBTOM_QUENTE_FRIO',
      mensagem: 'Neutralizar subtom quente exige reflexo cinza/violeta no toque final pra evitar laranja residual.',
    });
  }

  // Tom desejado vermelho/cobre vibrante sobre castanho escuro
  if ((target.categoria === 'vermelho' || target.categoria === 'ruivo') && base.altura <= 4) {
    avisos.push({
      severidade: 'info',
      codigo: 'VERMELHO_SOBRE_ESCURO',
      mensagem: 'Vermelhos vibrantes sobre base escura geralmente exigem clareamento prévio pra atingir saturação ideal.',
    });
  }

  // Resultado: nenhum aviso = caminho limpo
  if (avisos.length === 0) {
    avisos.push({
      severidade: 'info',
      codigo: 'CAMINHO_LIMPO',
      mensagem: 'Transformação direta, sem complicações químicas previstas. Pode aplicar a fórmula no cabelo seco e limpo.',
    });
  }

  return avisos;
}

function montarResumo(
  deltaAltura: number,
  mudouReflexo: boolean,
  base: PaletteEntry,
  target: PaletteEntry,
): string {
  if (deltaAltura === 0 && !mudouReflexo) {
    return `Refresco de cor — fixar o ${base.nome} atual.`;
  }
  if (deltaAltura === 0) {
    return `Mudança de reflexo no mesmo nível — de ${base.nome} pra ${target.nome}.`;
  }
  if (deltaAltura > 0) {
    return `Clarear ${deltaAltura} nível${deltaAltura > 1 ? 'is' : ''} — de ${base.nome} pra ${target.nome}.`;
  }
  return `Escurecer ${Math.abs(deltaAltura)} nível${Math.abs(deltaAltura) > 1 ? 'is' : ''} — de ${base.nome} pra ${target.nome}.`;
}
