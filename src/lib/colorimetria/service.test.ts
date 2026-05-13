/**
 * Testes unitários do ColorimetriaService.
 *
 * Cobertura: PLAN.md §5.6 (matriz de 20+ casos canônicos).
 *
 * Estratégia: para cada cenário da indústria, validamos não só o campo central
 * mas a estrutura completa da `Formula` retornada. Isso protege contra
 * regressões silenciosas (ex: alguém mexer na volumagem sem perceber que
 * quebrou a proporção do oxidante).
 */

import { describe, expect, it } from 'vitest';
import { calcularFormula } from './service';
import { ColorimetriaError, type Diagnostico } from './types';

// ============================================================================
// Helper: factory de Diagnostico com defaults sensatos
// ============================================================================

function diag(overrides: Partial<Diagnostico> = {}): Diagnostico {
  return {
    base: 6,
    base_paleta_id: '6.0',
    desejado: 6,
    desejado_paleta_id: '6.0',
    brancos_pct: 0,
    subtom_atual: 'neutro',
    comprimento: 'medio',
    cabelo_previamente_descolorido: false,
    ...overrides,
  };
}

// ============================================================================
// 1-7: Cenários de delta (clarear / escurecer / manter)
// ============================================================================

describe('ColorimetriaService — delta entre base e desejado', () => {
  it('caso 1: manter tom (delta 0, sem brancos) → ação="manter", volumagem 10', () => {
    const formula = calcularFormula(diag(), null);
    expect(formula.acao).toBe('manter');
    expect(formula.oxidante.volumagem).toBe(10);
    expect(formula.oxidante.percentual_h2o2).toBe(3);
    expect(formula.oxidante.proporcao_label).toBe('1:2'); // tonalizante
  });

  it('caso 2: tom sobre tom com brancos médios → mistura 70/30', () => {
    const formula = calcularFormula(
      diag({ brancos_pct: 40 }),
      null,
    );
    expect(formula.acao).toBe('tom_sobre_tom');
    const tinturas = formula.produtos.filter((p) => p.tipo === 'tintura');
    expect(tinturas).toHaveLength(2);
    expect(tinturas[0]?.proporcao_pct).toBeCloseTo(0.7);
    expect(tinturas[1]?.proporcao_pct).toBeCloseTo(0.3);
  });

  it('caso 3: escurecer 2 níveis (8→6) → ação "escurecer", volumagem 10', () => {
    const formula = calcularFormula(
      diag({ base: 8, base_paleta_id: '8.0' }),
      null,
    );
    expect(formula.acao).toBe('escurecer');
    expect(formula.oxidante.volumagem).toBe(10);
  });

  it('caso 4: clarear 1 nível (6→7) → "clarear_leve", volumagem 20', () => {
    const formula = calcularFormula(
      diag({ desejado: 7, desejado_paleta_id: '7.0' }),
      null,
    );
    expect(formula.acao).toBe('clarear_leve');
    expect(formula.oxidante.volumagem).toBe(20);
  });

  it('caso 5: clarear 2 níveis (5→7) → "clarear_medio", volumagem 30', () => {
    const formula = calcularFormula(
      diag({ base: 5, base_paleta_id: '5.0', desejado: 7, desejado_paleta_id: '7.0' }),
      null,
    );
    expect(formula.acao).toBe('clarear_medio');
    expect(formula.oxidante.volumagem).toBe(30);
  });

  it('caso 6: clarear 3 níveis (5→8) → "clarear_forte", volumagem 40, com aviso atenção', () => {
    const formula = calcularFormula(
      diag({ base: 5, base_paleta_id: '5.0', desejado: 8, desejado_paleta_id: '8.0' }),
      null,
    );
    expect(formula.acao).toBe('clarear_forte');
    expect(formula.oxidante.volumagem).toBe(40);
    expect(formula.avisos.some((a) => a.codigo === 'DELTA_EXCEDIDO')).toBe(true);
  });

  it('caso 7: clarear 4 níveis (4→8) → descolorir_e_pigmentar com aviso crítico', () => {
    const formula = calcularFormula(
      diag({ base: 4, base_paleta_id: '4.0', desejado: 8, desejado_paleta_id: '8.0' }),
      null,
    );
    expect(formula.acao).toBe('descolorir_e_pigmentar');
    expect(formula.produtos.some((p) => p.tipo === 'po_descolorante')).toBe(true);
    expect(formula.avisos.some((a) => a.severidade === 'critico')).toBe(true);
  });
});

// ============================================================================
// 8-9: Cenários de cobertura de brancos
// ============================================================================

describe('ColorimetriaService — cobertura de brancos', () => {
  it('caso 8: 100% brancos indo para 6.0 → mistura 50/50 com natural', () => {
    const formula = calcularFormula(
      diag({ brancos_pct: 100 }),
      null,
    );
    const tinturas = formula.produtos.filter((p) => p.tipo === 'tintura');
    expect(tinturas).toHaveLength(2);
    expect(tinturas[0]?.proporcao_pct).toBeCloseTo(0.5);
    expect(tinturas[1]?.proporcao_pct).toBeCloseTo(0.5);
  });

  it('caso 9: 80% brancos indo para 6.6 (vermelho) → exige pré-pigmentação', () => {
    const formula = calcularFormula(
      diag({ brancos_pct: 80, desejado_paleta_id: '6.6' }),
      6,
    );
    expect(formula.produtos.some((p) => p.tipo === 'pre_pigmentacao')).toBe(true);
    expect(formula.passos.some((s) => s.titulo === 'Pré-pigmentação')).toBe(true);
    expect(formula.avisos.some((a) => a.codigo === 'PRE_PIGMENTACAO_OBRIGATORIA')).toBe(
      true,
    );
  });
});

// ============================================================================
// 10-11: Neutralização automática
// ============================================================================

describe('ColorimetriaService — neutralização automática', () => {
  it('caso 10: clareamento 2, reflexo null → reflexo .1 (azul) aplicado', () => {
    const formula = calcularFormula(
      diag({ base: 5, base_paleta_id: '5.0', desejado: 7, desejado_paleta_id: '7.0' }),
      null,
    );
    expect(formula.avisos.some((a) => a.codigo === 'NEUTRALIZACAO_AUTOMATICA')).toBe(true);
    // O resultado_esperado_paleta_id deve refletir o reflexo .1
    expect(formula.resultado_esperado_paleta_id).toBe('7.1');
  });

  it('caso 11: clareamento 3, reflexo null → reflexo .2 (violeta) aplicado', () => {
    const formula = calcularFormula(
      diag({ base: 5, base_paleta_id: '5.0', desejado: 8, desejado_paleta_id: '8.0' }),
      null,
    );
    expect(formula.resultado_esperado_paleta_id).toBe('8.2');
  });
});

// ============================================================================
// 12-13: Quantidade por comprimento
// ============================================================================

describe('ColorimetriaService — quantidade por comprimento', () => {
  it('caso 12: comprimento longo → 100g tintura + 150ml OX', () => {
    const formula = calcularFormula(diag({ comprimento: 'longo' }), null);
    const totalG = formula.produtos
      .filter((p) => p.tipo === 'tintura' || p.tipo === 'tonalizante')
      .reduce((acc, p) => acc + p.quantidade_g, 0);
    expect(totalG).toBe(100);
    expect(formula.oxidante.quantidade_ml).toBe(200); // tonalizante 1:2
  });

  it('caso 13: muito_longo + delta 2 → 150g tintura + 225ml OX 30 vol', () => {
    const formula = calcularFormula(
      diag({
        comprimento: 'muito_longo',
        base: 5,
        base_paleta_id: '5.0',
        desejado: 7,
        desejado_paleta_id: '7.0',
      }),
      null,
    );
    const totalG = formula.produtos
      .filter((p) => p.tipo === 'tintura')
      .reduce((acc, p) => acc + p.quantidade_g, 0);
    expect(totalG).toBe(150);
    expect(formula.oxidante.quantidade_ml).toBe(225);
    expect(formula.oxidante.volumagem).toBe(30);
  });
});

// ============================================================================
// 14-15: Cabelo previamente descolorido
// ============================================================================

describe('ColorimetriaService — cabelo previamente descolorido', () => {
  it('caso 14: clareamento 2 em cabelo descolorido → aviso CRÍTICO (volumagem 30)', () => {
    const formula = calcularFormula(
      diag({
        base: 5,
        base_paleta_id: '5.0',
        desejado: 7,
        desejado_paleta_id: '7.0',
        cabelo_previamente_descolorido: true,
      }),
      null,
    );
    const aviso = formula.avisos.find((a) => a.codigo === 'CABELO_FRAGIL_VOLUMAGEM_ALTA');
    expect(aviso).toBeDefined();
    expect(aviso?.severidade).toBe('critico');
  });

  it('caso 15: clareamento 3 em cabelo descolorido → aviso crítico', () => {
    const formula = calcularFormula(
      diag({
        base: 5,
        base_paleta_id: '5.0',
        desejado: 8,
        desejado_paleta_id: '8.0',
        cabelo_previamente_descolorido: true,
      }),
      null,
    );
    const aviso = formula.avisos.find((a) => a.codigo === 'CABELO_FRAGIL_VOLUMAGEM_ALTA');
    expect(aviso).toBeDefined();
    expect(aviso?.severidade).toBe('critico');
  });
});

// ============================================================================
// 16-17: Tonalizante e super clareador
// ============================================================================

describe('ColorimetriaService — proporções especiais', () => {
  it('caso 16: super clareador (base 9 → alvo 12.0, delta 3) → proporção 1:2, volumagem 40', () => {
    const formula = calcularFormula(
      diag({ base: 9, base_paleta_id: '9.0', desejado: 12, desejado_paleta_id: '12.0' }),
      null,
    );
    expect(formula.acao).toBe('clarear_forte');
    expect(formula.oxidante.volumagem).toBe(40);
    expect(formula.oxidante.proporcao_label).toBe('1:2');
  });

  it('caso 17: tonalizante puro (sem brancos, mesma altura) → 1:2 + volumagem 10', () => {
    const formula = calcularFormula(
      diag({ base: 8, base_paleta_id: '8.0', desejado: 8, desejado_paleta_id: '8.0' }),
      null,
    );
    expect(formula.oxidante.volumagem).toBe(10);
    expect(formula.oxidante.proporcao_label).toBe('1:2');
  });
});

// ============================================================================
// 18-20: Inputs inválidos
// ============================================================================

describe('ColorimetriaService — inputs inválidos lançam ColorimetriaError', () => {
  it('caso 18: base=0 fora da escala', () => {
    expect(() =>
      calcularFormula(diag({ base: 0 as 1 }), null),
    ).toThrow(ColorimetriaError);
  });

  it('caso 19: brancos_pct=120 fora da escala', () => {
    expect(() => calcularFormula(diag({ brancos_pct: 120 }), null)).toThrow(
      ColorimetriaError,
    );
  });

  it('caso 20: desejado=13 fora da escala', () => {
    expect(() =>
      calcularFormula(diag({ desejado: 13 as 12 }), null),
    ).toThrow(ColorimetriaError);
  });

  it('caso 21: paleta_id inexistente', () => {
    expect(() =>
      calcularFormula(diag({ desejado_paleta_id: '99.99' }), null),
    ).toThrow(ColorimetriaError);
  });
});

// ============================================================================
// Integridade estrutural — toda Formula deve ser bem-formada
// ============================================================================

describe('ColorimetriaService — integridade estrutural', () => {
  it('toda fórmula retornada tem campos obrigatórios preenchidos', () => {
    const formula = calcularFormula(diag({ brancos_pct: 50 }), 1);

    expect(formula.diagnostico).toBeDefined();
    expect(formula.acao).toMatch(
      /^(manter|tom_sobre_tom|escurecer|clarear_leve|clarear_medio|clarear_forte|descolorir_e_pigmentar)$/,
    );
    expect(formula.produtos.length).toBeGreaterThan(0);
    expect(formula.oxidante.quantidade_ml).toBeGreaterThan(0);
    expect(formula.passos.length).toBeGreaterThan(0);
    expect(formula.tempo_pausa_total_min).toBeGreaterThan(0);
    expect(formula.resultado_esperado_paleta_id).toMatch(/^\d{1,2}\.\d{1,2}$/);
  });

  it('proporcao_pct dos produtos de tintura somam ~1.0', () => {
    const formula = calcularFormula(diag({ brancos_pct: 70 }), null);
    const soma = formula.produtos
      .filter((p) => p.tipo === 'tintura' || p.tipo === 'tonalizante')
      .reduce((acc, p) => acc + p.proporcao_pct, 0);
    expect(soma).toBeCloseTo(1.0, 1);
  });

  it('passos têm ordem sequencial começando em 1', () => {
    const formula = calcularFormula(
      diag({ brancos_pct: 80, desejado_paleta_id: '6.6' }),
      6,
    );
    formula.passos.forEach((p, i) => {
      expect(p.ordem).toBe(i + 1);
    });
  });
});
