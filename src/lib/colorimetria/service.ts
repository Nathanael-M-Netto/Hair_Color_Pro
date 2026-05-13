/**
 * ColorimetriaService — coração lógico do app.
 *
 * Entrada: um Diagnostico (estado capilar + alvo + contexto do usuário).
 * Saída: uma Formula estruturada (produtos, oxidante, passos, avisos).
 *
 * Princípios não-negociáveis:
 * - Pura. Mesmos inputs sempre geram mesma saída.
 * - Determinística. Zero `Math.random`, zero `Date.now`.
 * - Sem efeitos colaterais. Não loga, não chama rede, não toca DOM.
 * - Lança `ColorimetriaError` com código estável em inputs inválidos.
 * - Consulta tabelas (`rules.ts`), nunca tem regra hardcoded inline.
 *
 * Toda regra implementada aqui está documentada em PLAN.md §5.
 */

import {
  CODIGO_AVISO,
  LIMITES,
  MIX_COBERTURA_BRANCOS,
  NEUTRALIZACAO_POR_DELTA,
  PERCENTUAL_H2O2_POR_VOLUMAGEM,
  PROPORCAO_LABEL,
  PROPORCAO_OX,
  QUANTIDADE_BASE_G,
  TEMPO_PAUSA_MIN,
  VOLUMAGEM_POR_DELTA,
  type CenarioPausa,
  type TipoProporcao,
} from './rules';
import { REFERENCE_PALETTE_BY_ID, getNaturalByAltura } from './reference-palette';
import {
  type Acao,
  type Aviso,
  ColorimetriaError,
  type Diagnostico,
  type Formula,
  type Oxidante,
  type Passo,
  type Produto,
  type Reflexo,
  type Volumagem,
} from './types';

// ============================================================================
// API pública
// ============================================================================

/**
 * Calcula a fórmula completa de coloração para um diagnóstico.
 *
 * @param diagnostico Estado atual + alvo + contexto.
 * @param reflexoDesejado Reflexo escolhido pelo usuário (0-9), ou null para neutro/automático.
 * @returns Fórmula estruturada pronta para renderização.
 * @throws {ColorimetriaError} se inputs forem impossíveis.
 */
export function calcularFormula(
  diagnostico: Diagnostico,
  reflexoDesejado: Reflexo | null,
): Formula {
  validarDiagnostico(diagnostico);

  const delta = diagnostico.desejado - diagnostico.base;
  const acao = determinarAcao(delta, diagnostico.brancos_pct);
  const reflexoFinal = resolverReflexoFinal(reflexoDesejado, delta);

  const volumagem = determinarVolumagem(delta, acao);
  const tipoProporcao = determinarTipoProporcao(
    diagnostico,
    acao,
    reflexoFinal,
  );
  const produtos = construirProdutos(diagnostico, acao, reflexoFinal);
  const oxidante = construirOxidante(produtos, volumagem, tipoProporcao);
  const passos = construirPassos(diagnostico, acao);
  const avisos = coletarAvisos(diagnostico, delta, acao, reflexoDesejado, reflexoFinal);

  const resultadoEsperado = inferirResultadoEsperado(diagnostico, acao, reflexoFinal);

  return {
    diagnostico,
    acao,
    produtos,
    oxidante,
    passos,
    tempo_pausa_total_min: somarTempoPausa(passos),
    avisos,
    resultado_esperado_paleta_id: resultadoEsperado,
  };
}

// ============================================================================
// Validação
// ============================================================================

function validarDiagnostico(d: Diagnostico): void {
  if (d.base < LIMITES.ALTURA_MIN || d.base > LIMITES.ALTURA_MAX) {
    throw new ColorimetriaError(
      'BASE_FORA_ESCALA',
      `Altura base ${d.base} fora da escala 1-12.`,
    );
  }
  if (d.desejado < LIMITES.ALTURA_MIN || d.desejado > LIMITES.ALTURA_MAX) {
    throw new ColorimetriaError(
      'DESEJADO_FORA_ESCALA',
      `Altura desejada ${d.desejado} fora da escala 1-12.`,
    );
  }
  if (
    d.brancos_pct < LIMITES.BRANCOS_MIN ||
    d.brancos_pct > LIMITES.BRANCOS_MAX ||
    !Number.isFinite(d.brancos_pct)
  ) {
    throw new ColorimetriaError(
      'BRANCOS_FORA_ESCALA',
      `Porcentagem de brancos ${d.brancos_pct} fora da escala 0-100.`,
    );
  }
  if (!REFERENCE_PALETTE_BY_ID.has(d.base_paleta_id)) {
    throw new ColorimetriaError(
      'BASE_PALETA_INVALIDA',
      `base_paleta_id "${d.base_paleta_id}" não existe na paleta de referência.`,
    );
  }
  if (!REFERENCE_PALETTE_BY_ID.has(d.desejado_paleta_id)) {
    throw new ColorimetriaError(
      'DESEJADO_PALETA_INVALIDA',
      `desejado_paleta_id "${d.desejado_paleta_id}" não existe na paleta de referência.`,
    );
  }
}

// ============================================================================
// Determinação da ação canônica
// ============================================================================

function determinarAcao(delta: number, brancos_pct: number): Acao {
  if (delta > LIMITES.DELTA_MAX_SEM_DESCOLORACAO) return 'descolorir_e_pigmentar';
  if (delta === 3) return 'clarear_forte';
  if (delta === 2) return 'clarear_medio';
  if (delta === 1) return 'clarear_leve';
  if (delta < 0) return 'escurecer';
  // delta === 0
  return brancos_pct >= 15 ? 'tom_sobre_tom' : 'manter';
}

// ============================================================================
// Reflexo final (resolve neutralização automática)
// ============================================================================

function resolverReflexoFinal(
  escolhido: Reflexo | null,
  delta: number,
): Reflexo | null {
  // Se usuário escolheu algo explícito (mesmo .0), respeitar.
  if (escolhido !== null && escolhido !== 0) return escolhido;

  // Se escolheu .0 ou null, e está clareando, sugerir neutralizador.
  if (delta > 0) {
    const sugestao = NEUTRALIZACAO_POR_DELTA.get(delta);
    if (sugestao) return sugestao.reflexo;
  }
  return escolhido;
}

// ============================================================================
// Volumagem
// ============================================================================

function determinarVolumagem(delta: number, acao: Acao): Volumagem {
  if (acao === 'descolorir_e_pigmentar') {
    // Descoloração usa 30 vol no pó; tintura aplicada depois usa 20 vol.
    // Aqui retornamos a volumagem da TINTA aplicada após a descoloração.
    return 20;
  }
  const v = VOLUMAGEM_POR_DELTA.get(delta);
  if (v === undefined) {
    // Não deveria acontecer dado validação prévia, mas defensivo.
    throw new ColorimetriaError(
      'DELTA_SEM_VOLUMAGEM',
      `Delta ${delta} não mapeado em VOLUMAGEM_POR_DELTA.`,
    );
  }
  return v;
}

// ============================================================================
// Tipo de proporção
// ============================================================================

function determinarTipoProporcao(
  diagnostico: Diagnostico,
  acao: Acao,
  _reflexoFinal: Reflexo | null,
): TipoProporcao {
  // Super clareadores (altura 11, 12 alvo)
  if (diagnostico.desejado >= 11) return 'super_clareador';

  // Tonalizante puro: mesma altura, sem brancos significativos
  if (acao === 'manter') return 'tonalizante';

  // Cobertura forte de brancos
  if (diagnostico.brancos_pct > 70) return 'cobertura_brancos_forte';

  return 'padrao';
}

// ============================================================================
// Produtos (montagem da lista de tintas + pré-pigmentação opcional)
// ============================================================================

function construirProdutos(
  diagnostico: Diagnostico,
  acao: Acao,
  reflexoFinal: Reflexo | null,
): Produto[] {
  const produtos: Produto[] = [];

  // Caso especial: descoloração prévia
  if (acao === 'descolorir_e_pigmentar') {
    produtos.push({
      tipo: 'po_descolorante',
      nome: 'Pó descolorante (azul ou roxo)',
      quantidade_g: QUANTIDADE_BASE_G[diagnostico.comprimento],
      proporcao_pct: 1.0,
      obs: 'Aplicar antes da tintura para atingir o tom desejado',
    });
  }

  // Tintura(s) — possivelmente em mistura para cobertura de brancos
  const totalG = QUANTIDADE_BASE_G[diagnostico.comprimento];
  const mix = encontrarMixCobertura(diagnostico.brancos_pct);

  const nomeTomDesejado = nomeDoTom(diagnostico.desejado_paleta_id);
  const tomDesejadoComReflexo = anexarReflexo(diagnostico.desejado_paleta_id, reflexoFinal);

  if (mix.pct_natural === 0) {
    // Tom desejado puro
    produtos.push({
      tipo: acao === 'manter' ? 'tonalizante' : 'tintura',
      nome: nomeTomDesejado,
      quantidade_g: arredondar5(totalG),
      proporcao_pct: 1.0,
      obs: null,
    });
  } else {
    // Mistura: parte tom desejado + parte tom natural correspondente
    const tomNatural = getNaturalByAltura(diagnostico.desejado);
    produtos.push({
      tipo: 'tintura',
      nome: nomeTomDesejado,
      quantidade_g: arredondar5(totalG * mix.pct_desejado),
      proporcao_pct: mix.pct_desejado,
      obs: 'Aplicar misturado com o tom natural correspondente',
    });
    produtos.push({
      tipo: 'tintura',
      nome: `Tintura ${tomNatural.id} — ${tomNatural.nome}`,
      quantidade_g: arredondar5(totalG * mix.pct_natural),
      proporcao_pct: mix.pct_natural,
      obs: 'Tom fundamental para cobrir brancos sem rebote',
    });
  }

  // Pré-pigmentação obrigatória (alto % brancos + reflexo quente)
  const exigePrePig =
    reflexoFinal !== null &&
    mix.exige_pre_pigmentacao_se_reflexo_em.includes(reflexoFinal);
  if (exigePrePig) {
    produtos.unshift({
      tipo: 'pre_pigmentacao',
      nome: `Pigmento direto ${tomDesejadoComReflexo}`,
      quantidade_g: 20,
      proporcao_pct: 0,
      obs: 'Aplicar puro (sem oxidante) por 15 minutos antes da fórmula principal',
    });
  }

  return produtos;
}

// ============================================================================
// Oxidante
// ============================================================================

function construirOxidante(
  produtos: Produto[],
  volumagem: Volumagem,
  tipoProporcao: TipoProporcao,
): Oxidante {
  const totalTinturaG = produtos
    .filter((p) => p.tipo === 'tintura' || p.tipo === 'tonalizante')
    .reduce((acc, p) => acc + p.quantidade_g, 0);

  const multiplicador = PROPORCAO_OX[tipoProporcao];
  const quantidadeMl = arredondar5(totalTinturaG * multiplicador);

  return {
    volumagem,
    percentual_h2o2: PERCENTUAL_H2O2_POR_VOLUMAGEM[volumagem],
    quantidade_ml: quantidadeMl,
    proporcao_label: PROPORCAO_LABEL[tipoProporcao],
  };
}

// ============================================================================
// Passos (sequência ordenada de instruções)
// ============================================================================

function construirPassos(diagnostico: Diagnostico, acao: Acao): Passo[] {
  const passos: Passo[] = [];
  let ordem = 1;

  const cenario: CenarioPausa = mapearCenarioPausa(acao);

  // Passo de pré-pigmentação (só se aplicável — checagem feita pelo caller via avisos)
  if (deveTerPrePigmentacao(diagnostico)) {
    passos.push({
      ordem: ordem++,
      titulo: 'Pré-pigmentação',
      descricao:
        'Aplicar o pigmento direto correspondente ao reflexo desejado nos cabelos brancos. Sem oxidante. Deixar agir o tempo indicado.',
      tempo_min: TEMPO_PAUSA_MIN.pre_pigmentacao,
    });
  }

  // Passo de descoloração (se delta > 3)
  if (acao === 'descolorir_e_pigmentar') {
    passos.push({
      ordem: ordem++,
      titulo: 'Descoloração prévia',
      descricao:
        'Misturar o pó descolorante com o oxidante na proporção 1:2. Aplicar com pincel mecha por mecha, evitando a raiz. Acompanhar o clareamento até atingir o nível desejado.',
      tempo_min: 30,
    });
  }

  // Passo principal: mistura + aplicação
  passos.push({
    ordem: ordem++,
    titulo: 'Mistura e aplicação',
    descricao:
      diagnostico.brancos_pct > 30
        ? 'Misturar as tinturas conforme proporções indicadas. Adicionar o oxidante. Aplicar primeiro na raiz dos fios com brancos (15 min), depois estender ao comprimento.'
        : 'Misturar a tintura com o oxidante até obter um creme homogêneo. Aplicar mecha por mecha do comprimento à raiz, garantindo cobertura uniforme.',
    tempo_min: TEMPO_PAUSA_MIN[cenario],
  });

  // Passo de finalização
  passos.push({
    ordem: ordem++,
    titulo: 'Finalização',
    descricao:
      'Emulsionar com pouca água massageando suavemente. Enxaguar até a água sair limpa. Aplicar máscara de hidratação ou tratamento pós-coloração.',
    tempo_min: 10,
  });

  return passos;
}

function mapearCenarioPausa(acao: Acao): CenarioPausa {
  switch (acao) {
    case 'manter':
    case 'tom_sobre_tom':
      return 'tom_sobre_tom';
    case 'escurecer':
      return 'escurecer';
    case 'clarear_leve':
      return 'clarear_leve';
    case 'clarear_medio':
      return 'clarear_medio';
    case 'clarear_forte':
      return 'clarear_forte';
    case 'descolorir_e_pigmentar':
      return 'descolorir_e_pigmentar';
  }
}

// ============================================================================
// Avisos
// ============================================================================

function coletarAvisos(
  diagnostico: Diagnostico,
  delta: number,
  acao: Acao,
  reflexoEscolhido: Reflexo | null,
  reflexoFinal: Reflexo | null,
): Aviso[] {
  const avisos: Aviso[] = [];

  // Delta excedido
  if (delta > LIMITES.DELTA_MAX_SEM_DESCOLORACAO) {
    avisos.push({
      severidade: 'critico',
      codigo: CODIGO_AVISO.DESCOLORACAO_PREVIA_NECESSARIA,
      mensagem:
        'Diferença de mais de 3 níveis exige descoloração prévia. Tintura direta não atingirá o tom desejado.',
    });
  } else if (delta === 3) {
    avisos.push({
      severidade: 'atencao',
      codigo: CODIGO_AVISO.DELTA_EXCEDIDO,
      mensagem:
        'Clareamento de 3 níveis usa oxidante 40 vol. Risco moderado de ressecamento; hidratação posterior é essencial.',
    });
  }

  // Cabelo descolorido + volumagem alta
  if (diagnostico.cabelo_previamente_descolorido) {
    const volImpl = VOLUMAGEM_POR_DELTA.get(delta);
    if (volImpl && volImpl >= 30) {
      avisos.push({
        severidade: 'critico',
        codigo: CODIGO_AVISO.CABELO_FRAGIL_VOLUMAGEM_ALTA,
        mensagem:
          'Cabelo previamente descolorido com oxidante alto pode causar quebra severa. Considere reduzir para 20 vol ou aplicar reconstrução prévia.',
      });
    } else if (volImpl && volImpl >= 20) {
      avisos.push({
        severidade: 'atencao',
        codigo: CODIGO_AVISO.CABELO_FRAGIL_VOLUMAGEM_ALTA,
        mensagem:
          'Cabelo previamente descolorido — recomenda-se teste de mecha antes da aplicação total.',
      });
    }
  }

  // Pré-pigmentação obrigatória
  if (deveTerPrePigmentacao(diagnostico)) {
    avisos.push({
      severidade: 'atencao',
      codigo: CODIGO_AVISO.PRE_PIGMENTACAO_OBRIGATORIA,
      mensagem:
        'Alto percentual de brancos com reflexo quente exige pré-pigmentação para evitar rebote da cor.',
    });
  }

  // Cobertura alta de brancos
  if (diagnostico.brancos_pct >= 70) {
    avisos.push({
      severidade: 'info',
      codigo: CODIGO_AVISO.COBERTURA_BRANCOS_ALTA,
      mensagem:
        'Cobertura de brancos acima de 70%: aplicar primeiro na raiz e deixar 15 min antes de estender ao comprimento.',
    });
  }

  // Neutralização automática aplicada
  if ((reflexoEscolhido === null || reflexoEscolhido === 0) && reflexoFinal !== null) {
    const sugestao = NEUTRALIZACAO_POR_DELTA.get(delta);
    if (sugestao) {
      avisos.push({
        severidade: 'info',
        codigo: CODIGO_AVISO.NEUTRALIZACAO_AUTOMATICA,
        mensagem: `Reflexo neutralizador aplicado automaticamente: ${sugestao.descricao}.`,
      });
    }
  }

  // Teste de mecha em primeira coloração com volumagem alta
  if (!diagnostico.cabelo_previamente_descolorido && acao === 'clarear_forte') {
    avisos.push({
      severidade: 'info',
      codigo: CODIGO_AVISO.TESTE_MECHA_RECOMENDADO,
      mensagem: 'Faça um teste de mecha 48h antes para avaliar reação alérgica e resultado.',
    });
  }

  return avisos;
}

// ============================================================================
// Resultado esperado (paleta_id final que a fórmula deve produzir)
// ============================================================================

function inferirResultadoEsperado(
  diagnostico: Diagnostico,
  acao: Acao,
  reflexoFinal: Reflexo | null,
): string {
  // Casos especiais não atingem exatamente o desejado de primeira:
  if (acao === 'descolorir_e_pigmentar') {
    // Após descoloração + tintura, o resultado fica perto do desejado mas
    // pode ter 1 nível abaixo do alvo na primeira aplicação.
    const alturaResultado = Math.max(diagnostico.desejado - 1, 1);
    return `${alturaResultado}.${reflexoFinal ?? 0}`;
  }
  return anexarReflexo(diagnostico.desejado_paleta_id, reflexoFinal);
}

// ============================================================================
// Helpers internos
// ============================================================================

function deveTerPrePigmentacao(d: Diagnostico): boolean {
  if (d.brancos_pct < 50) return false;
  const desejado = REFERENCE_PALETTE_BY_ID.get(d.desejado_paleta_id);
  if (!desejado) return false;
  const reflexosQuentes: ReadonlyArray<Reflexo> = [4, 5, 6];
  return (
    (desejado.reflexo_primario !== null &&
      reflexosQuentes.includes(desejado.reflexo_primario)) ||
    (desejado.reflexo_secundario !== null &&
      reflexosQuentes.includes(desejado.reflexo_secundario))
  );
}

function encontrarMixCobertura(brancos_pct: number) {
  // Sempre encontra (última faixa vai até 100). Defensivo apenas.
  const faixa = MIX_COBERTURA_BRANCOS.find((f) => brancos_pct <= f.brancos_max);
  if (!faixa) {
    throw new ColorimetriaError(
      'COBERTURA_SEM_FAIXA',
      `Sem faixa de cobertura para brancos_pct=${brancos_pct}.`,
    );
  }
  return faixa.mix;
}

function nomeDoTom(paletaId: string): string {
  const entry = REFERENCE_PALETTE_BY_ID.get(paletaId);
  if (!entry) return `Tintura ${paletaId}`;
  return `Tintura ${entry.id} — ${entry.nome}`;
}

function anexarReflexo(paletaId: string, reflexo: Reflexo | null): string {
  if (reflexo === null) return paletaId;
  const altura = paletaId.split('.')[0];
  return `${altura}.${reflexo}`;
}

function arredondar5(n: number): number {
  return Math.round(n / 5) * 5;
}

function somarTempoPausa(passos: Passo[]): number {
  // Total exclui pré-pigmentação (que ocorre antes) e finalização (não é pausa).
  return passos
    .filter((p) => p.titulo !== 'Pré-pigmentação' && p.titulo !== 'Finalização')
    .reduce((acc, p) => acc + p.tempo_min, 0);
}
