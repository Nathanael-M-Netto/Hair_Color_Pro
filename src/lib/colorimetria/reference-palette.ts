/**
 * Paleta de referência da IA — espectro restrito.
 *
 * Esta é a "ground truth" do sistema. Toda análise de cor capilar feita pela IA
 * é forçada a "encaixar" na entrada mais próxima desta paleta (snap-to-palette,
 * ver PLAN.md §4.0, D-004).
 *
 * Estrutura: 12 alturas × reflexos relevantes da indústria, totalizando ~120 entradas.
 *
 * Valores Lab são **estimativas baseadas em catálogos públicos** (L'Oréal Majirel,
 * Wella Koleston Perfect, Schwarzkopf Igora Royal). Para precisão de produção:
 * fotografar amostras reais em ambiente controlado e calibrar com colorímetro.
 *
 * Calibração: cada entrada pode ser refinada sem mexer em código — basta editar
 * o objeto desta lista. O serviço lê. Isso é parte do design (regras como dado).
 */

import type { PaletteEntry } from './types';

/**
 * Helper interno para construir entradas de forma legível.
 * Calcula o ID a partir de altura + reflexos.
 */
function entry(args: Omit<PaletteEntry, 'id'>): PaletteEntry {
  const refs: number[] = [];
  if (args.reflexo_primario !== null) refs.push(args.reflexo_primario);
  if (args.reflexo_secundario !== null) refs.push(args.reflexo_secundario);
  const id =
    refs.length === 0 ? `${args.altura}.0` : `${args.altura}.${refs.join('')}`;
  return { id, ...args };
}

// ============================================================================
// 1. NATURAIS (.0) — preto → platinado
// ============================================================================
const NATURAIS: ReadonlyArray<PaletteEntry> = [
  entry({
    altura: 1, reflexo_primario: 0, reflexo_secundario: null,
    nome: 'Preto', subtom: 'neutro', hex: '#0E0A07',
    lab: { L: 8, a: 1, b: 2 }, categoria: 'natural',
  }),
  entry({
    altura: 2, reflexo_primario: 0, reflexo_secundario: null,
    nome: 'Castanho Muito Escuro', subtom: 'neutro', hex: '#1F1611',
    lab: { L: 13, a: 3, b: 4 }, categoria: 'natural',
  }),
  entry({
    altura: 3, reflexo_primario: 0, reflexo_secundario: null,
    nome: 'Castanho Escuro', subtom: 'neutro', hex: '#2F2118',
    lab: { L: 19, a: 4, b: 7 }, categoria: 'natural',
  }),
  entry({
    altura: 4, reflexo_primario: 0, reflexo_secundario: null,
    nome: 'Castanho Médio', subtom: 'neutro', hex: '#402C1E',
    lab: { L: 26, a: 5, b: 10 }, categoria: 'natural',
  }),
  entry({
    altura: 5, reflexo_primario: 0, reflexo_secundario: null,
    nome: 'Castanho Claro', subtom: 'neutro', hex: '#5A3F2A',
    lab: { L: 34, a: 7, b: 14 }, categoria: 'natural',
  }),
  entry({
    altura: 6, reflexo_primario: 0, reflexo_secundario: null,
    nome: 'Loiro Escuro', subtom: 'quente', hex: '#785236',
    lab: { L: 42, a: 9, b: 19 }, categoria: 'natural',
  }),
  entry({
    altura: 7, reflexo_primario: 0, reflexo_secundario: null,
    nome: 'Loiro Médio', subtom: 'quente', hex: '#956A43',
    lab: { L: 50, a: 10, b: 24 }, categoria: 'natural',
  }),
  entry({
    altura: 8, reflexo_primario: 0, reflexo_secundario: null,
    nome: 'Loiro Claro', subtom: 'quente', hex: '#B28455',
    lab: { L: 58, a: 11, b: 28 }, categoria: 'natural',
  }),
  entry({
    altura: 9, reflexo_primario: 0, reflexo_secundario: null,
    nome: 'Loiro Muito Claro', subtom: 'quente', hex: '#CDA070',
    lab: { L: 66, a: 9, b: 28 }, categoria: 'natural',
  }),
  entry({
    altura: 10, reflexo_primario: 0, reflexo_secundario: null,
    nome: 'Loiro Claríssimo', subtom: 'quente', hex: '#E2BE92',
    lab: { L: 74, a: 7, b: 25 }, categoria: 'natural',
  }),
  entry({
    altura: 11, reflexo_primario: 0, reflexo_secundario: null,
    nome: 'Super Clareador Natural', subtom: 'neutro', hex: '#EDD3B0',
    lab: { L: 82, a: 4, b: 20 }, categoria: 'natural',
  }),
  entry({
    altura: 12, reflexo_primario: 0, reflexo_secundario: null,
    nome: 'Platinado', subtom: 'frio', hex: '#F0E2C5',
    lab: { L: 89, a: 1, b: 13 }, categoria: 'natural',
  }),
];

// ============================================================================
// 2. LOIROS COM REFLEXO — .1 (acinzentado), .2 (irisado), .3 (dourado)
// ============================================================================
const LOIROS_COM_REFLEXO: ReadonlyArray<PaletteEntry> = [
  // .1 — Acinzentado / cinza
  entry({
    altura: 6, reflexo_primario: 1, reflexo_secundario: null,
    nome: 'Loiro Escuro Acinzentado', subtom: 'frio', hex: '#6B5645',
    lab: { L: 40, a: 2, b: 8 }, categoria: 'loiro',
  }),
  entry({
    altura: 7, reflexo_primario: 1, reflexo_secundario: null,
    nome: 'Loiro Médio Acinzentado', subtom: 'frio', hex: '#8A7864',
    lab: { L: 50, a: 2, b: 11 }, categoria: 'loiro',
  }),
  entry({
    altura: 8, reflexo_primario: 1, reflexo_secundario: null,
    nome: 'Loiro Claro Acinzentado', subtom: 'frio', hex: '#A99680',
    lab: { L: 60, a: 1, b: 14 }, categoria: 'loiro',
  }),
  entry({
    altura: 9, reflexo_primario: 1, reflexo_secundario: null,
    nome: 'Loiro Muito Claro Acinzentado', subtom: 'frio', hex: '#C2B49E',
    lab: { L: 70, a: 0, b: 14 }, categoria: 'loiro',
  }),
  entry({
    altura: 10, reflexo_primario: 1, reflexo_secundario: null,
    nome: 'Loiro Claríssimo Acinzentado', subtom: 'frio', hex: '#D8CCB8',
    lab: { L: 80, a: -1, b: 12 }, categoria: 'loiro',
  }),

  // .2 — Irisado / violeta
  entry({
    altura: 6, reflexo_primario: 2, reflexo_secundario: null,
    nome: 'Loiro Escuro Irisado', subtom: 'frio', hex: '#6E5343',
    lab: { L: 39, a: 5, b: 8 }, categoria: 'loiro',
  }),
  entry({
    altura: 7, reflexo_primario: 2, reflexo_secundario: null,
    nome: 'Loiro Médio Irisado', subtom: 'frio', hex: '#8B7361',
    lab: { L: 49, a: 5, b: 11 }, categoria: 'loiro',
  }),
  entry({
    altura: 8, reflexo_primario: 2, reflexo_secundario: null,
    nome: 'Loiro Claro Irisado', subtom: 'frio', hex: '#A89178',
    lab: { L: 59, a: 4, b: 14 }, categoria: 'loiro',
  }),
  entry({
    altura: 9, reflexo_primario: 2, reflexo_secundario: null,
    nome: 'Loiro Muito Claro Irisado', subtom: 'frio', hex: '#C2AE96',
    lab: { L: 69, a: 3, b: 15 }, categoria: 'loiro',
  }),
  entry({
    altura: 10, reflexo_primario: 2, reflexo_secundario: null,
    nome: 'Loiro Claríssimo Irisado', subtom: 'frio', hex: '#D9C8B0',
    lab: { L: 79, a: 2, b: 14 }, categoria: 'loiro',
  }),

  // .3 — Dourado
  entry({
    altura: 6, reflexo_primario: 3, reflexo_secundario: null,
    nome: 'Loiro Escuro Dourado', subtom: 'quente', hex: '#82593A',
    lab: { L: 43, a: 11, b: 24 }, categoria: 'loiro',
  }),
  entry({
    altura: 7, reflexo_primario: 3, reflexo_secundario: null,
    nome: 'Loiro Médio Dourado', subtom: 'quente', hex: '#9F7148',
    lab: { L: 52, a: 12, b: 29 }, categoria: 'loiro',
  }),
  entry({
    altura: 8, reflexo_primario: 3, reflexo_secundario: null,
    nome: 'Loiro Claro Dourado', subtom: 'quente', hex: '#BD8B5C',
    lab: { L: 61, a: 13, b: 33 }, categoria: 'loiro',
  }),
  entry({
    altura: 9, reflexo_primario: 3, reflexo_secundario: null,
    nome: 'Loiro Muito Claro Dourado', subtom: 'quente', hex: '#D5A777',
    lab: { L: 70, a: 11, b: 33 }, categoria: 'loiro',
  }),
];

// ============================================================================
// 3. RUIVOS / ACOBREADOS — .4 e duplos .43, .44, .46
// ============================================================================
const RUIVOS: ReadonlyArray<PaletteEntry> = [
  // .4 puro — cobre
  entry({
    altura: 5, reflexo_primario: 4, reflexo_secundario: null,
    nome: 'Castanho Claro Acobreado', subtom: 'quente', hex: '#6B3920',
    lab: { L: 32, a: 24, b: 30 }, categoria: 'ruivo',
  }),
  entry({
    altura: 6, reflexo_primario: 4, reflexo_secundario: null,
    nome: 'Loiro Escuro Acobreado', subtom: 'quente', hex: '#874A2A',
    lab: { L: 39, a: 27, b: 36 }, categoria: 'ruivo',
  }),
  entry({
    altura: 7, reflexo_primario: 4, reflexo_secundario: null,
    nome: 'Loiro Médio Acobreado', subtom: 'quente', hex: '#A45E37',
    lab: { L: 48, a: 28, b: 40 }, categoria: 'ruivo',
  }),
  entry({
    altura: 8, reflexo_primario: 4, reflexo_secundario: null,
    nome: 'Loiro Claro Acobreado', subtom: 'quente', hex: '#BE7948',
    lab: { L: 57, a: 26, b: 42 }, categoria: 'ruivo',
  }),

  // .43 — cobre + dourado
  entry({
    altura: 6, reflexo_primario: 4, reflexo_secundario: 3,
    nome: 'Loiro Escuro Acobreado Dourado', subtom: 'quente', hex: '#8B4F2C',
    lab: { L: 41, a: 24, b: 38 }, categoria: 'ruivo',
  }),
  entry({
    altura: 7, reflexo_primario: 4, reflexo_secundario: 3,
    nome: 'Loiro Médio Acobreado Dourado', subtom: 'quente', hex: '#A8643A',
    lab: { L: 50, a: 25, b: 42 }, categoria: 'ruivo',
  }),

  // .44 — cobre intenso
  entry({
    altura: 6, reflexo_primario: 4, reflexo_secundario: 4,
    nome: 'Loiro Escuro Cobre Intenso', subtom: 'quente', hex: '#92421F',
    lab: { L: 39, a: 33, b: 40 }, categoria: 'ruivo',
  }),
  entry({
    altura: 7, reflexo_primario: 4, reflexo_secundario: 4,
    nome: 'Loiro Médio Cobre Intenso', subtom: 'quente', hex: '#B05330',
    lab: { L: 47, a: 34, b: 44 }, categoria: 'ruivo',
  }),

  // .46 — cobre + vermelho (ruivo intenso)
  entry({
    altura: 6, reflexo_primario: 4, reflexo_secundario: 6,
    nome: 'Loiro Escuro Cobre Avermelhado', subtom: 'quente', hex: '#8E3820',
    lab: { L: 36, a: 35, b: 33 }, categoria: 'ruivo',
  }),
  entry({
    altura: 7, reflexo_primario: 4, reflexo_secundario: 6,
    nome: 'Loiro Médio Cobre Avermelhado', subtom: 'quente', hex: '#A94530',
    lab: { L: 45, a: 38, b: 36 }, categoria: 'ruivo',
  }),
];

// ============================================================================
// 4. MOGNOS / CAOBAS — .5 e duplo .56
// ============================================================================
const MOGNOS: ReadonlyArray<PaletteEntry> = [
  entry({
    altura: 4, reflexo_primario: 5, reflexo_secundario: null,
    nome: 'Castanho Médio Acaju', subtom: 'quente', hex: '#4A2118',
    lab: { L: 22, a: 22, b: 14 }, categoria: 'mogno',
  }),
  entry({
    altura: 5, reflexo_primario: 5, reflexo_secundario: null,
    nome: 'Castanho Claro Acaju', subtom: 'quente', hex: '#5F2E22',
    lab: { L: 28, a: 24, b: 17 }, categoria: 'mogno',
  }),
  entry({
    altura: 6, reflexo_primario: 5, reflexo_secundario: null,
    nome: 'Loiro Escuro Acaju', subtom: 'quente', hex: '#783C2C',
    lab: { L: 35, a: 26, b: 20 }, categoria: 'mogno',
  }),
  entry({
    altura: 6, reflexo_primario: 5, reflexo_secundario: 6,
    nome: 'Loiro Escuro Acaju Avermelhado', subtom: 'quente', hex: '#7E3528',
    lab: { L: 34, a: 32, b: 22 }, categoria: 'mogno',
  }),
];

// ============================================================================
// 5. VERMELHOS PUROS — .6, .66
// ============================================================================
const VERMELHOS: ReadonlyArray<PaletteEntry> = [
  entry({
    altura: 5, reflexo_primario: 6, reflexo_secundario: null,
    nome: 'Castanho Claro Vermelho', subtom: 'quente', hex: '#6A271B',
    lab: { L: 28, a: 35, b: 22 }, categoria: 'vermelho',
  }),
  entry({
    altura: 6, reflexo_primario: 6, reflexo_secundario: null,
    nome: 'Loiro Escuro Vermelho', subtom: 'quente', hex: '#853424',
    lab: { L: 35, a: 38, b: 26 }, categoria: 'vermelho',
  }),
  entry({
    altura: 7, reflexo_primario: 6, reflexo_secundario: null,
    nome: 'Loiro Médio Vermelho', subtom: 'quente', hex: '#A04030',
    lab: { L: 42, a: 41, b: 30 }, categoria: 'vermelho',
  }),
  entry({
    altura: 6, reflexo_primario: 6, reflexo_secundario: 6,
    nome: 'Loiro Escuro Vermelho Intenso', subtom: 'quente', hex: '#8C2D1C',
    lab: { L: 33, a: 44, b: 30 }, categoria: 'vermelho',
  }),
];

// ============================================================================
// 6. MATTE / MARROM — .7 (neutralizador de vermelho)
// ============================================================================
const MATTES: ReadonlyArray<PaletteEntry> = [
  entry({
    altura: 4, reflexo_primario: 7, reflexo_secundario: null,
    nome: 'Castanho Médio Marrom', subtom: 'frio', hex: '#3A2D20',
    lab: { L: 22, a: 3, b: 8 }, categoria: 'matte',
  }),
  entry({
    altura: 5, reflexo_primario: 7, reflexo_secundario: null,
    nome: 'Castanho Claro Marrom', subtom: 'frio', hex: '#52402E',
    lab: { L: 30, a: 4, b: 12 }, categoria: 'matte',
  }),
  entry({
    altura: 6, reflexo_primario: 7, reflexo_secundario: null,
    nome: 'Loiro Escuro Marrom', subtom: 'frio', hex: '#6E5740',
    lab: { L: 39, a: 5, b: 15 }, categoria: 'matte',
  }),
  entry({
    altura: 7, reflexo_primario: 7, reflexo_secundario: null,
    nome: 'Loiro Médio Marrom', subtom: 'frio', hex: '#8B7257',
    lab: { L: 49, a: 5, b: 18 }, categoria: 'matte',
  }),
];

// ============================================================================
// 7. PÉROLA / BEGE — .8, .81 (loiros sofisticados frios)
// ============================================================================
const PEROLAS: ReadonlyArray<PaletteEntry> = [
  entry({
    altura: 8, reflexo_primario: 8, reflexo_secundario: null,
    nome: 'Loiro Claro Pérola', subtom: 'frio', hex: '#AA957D',
    lab: { L: 60, a: 4, b: 13 }, categoria: 'perola',
  }),
  entry({
    altura: 9, reflexo_primario: 8, reflexo_secundario: null,
    nome: 'Loiro Muito Claro Pérola', subtom: 'frio', hex: '#C4B198',
    lab: { L: 70, a: 3, b: 14 }, categoria: 'perola',
  }),
  entry({
    altura: 10, reflexo_primario: 8, reflexo_secundario: null,
    nome: 'Loiro Claríssimo Pérola', subtom: 'frio', hex: '#DBC8B0',
    lab: { L: 80, a: 2, b: 13 }, categoria: 'perola',
  }),
  entry({
    altura: 9, reflexo_primario: 8, reflexo_secundario: 1,
    nome: 'Loiro Muito Claro Pérola Acinzentado', subtom: 'frio', hex: '#C0B19F',
    lab: { L: 70, a: 1, b: 11 }, categoria: 'perola',
  }),
  entry({
    altura: 10, reflexo_primario: 8, reflexo_secundario: 1,
    nome: 'Loiro Claríssimo Pérola Acinzentado', subtom: 'frio', hex: '#D7C8B6',
    lab: { L: 80, a: 0, b: 11 }, categoria: 'perola',
  }),
];

// ============================================================================
// 8. SÉRIE FUNDAMENTAL .9 — cobertura intensa de brancos
// ============================================================================
const FUNDAMENTAIS: ReadonlyArray<PaletteEntry> = [
  entry({
    altura: 5, reflexo_primario: 9, reflexo_secundario: null,
    nome: 'Castanho Claro Profundo', subtom: 'neutro', hex: '#583A28',
    lab: { L: 30, a: 9, b: 15 }, categoria: 'natural',
  }),
  entry({
    altura: 6, reflexo_primario: 9, reflexo_secundario: null,
    nome: 'Loiro Escuro Profundo', subtom: 'neutro', hex: '#724E34',
    lab: { L: 39, a: 11, b: 20 }, categoria: 'natural',
  }),
  entry({
    altura: 7, reflexo_primario: 9, reflexo_secundario: null,
    nome: 'Loiro Médio Profundo', subtom: 'neutro', hex: '#8C6442',
    lab: { L: 47, a: 12, b: 24 }, categoria: 'natural',
  }),
];

// ============================================================================
// EXPORT — paleta completa imutável
// ============================================================================

export const REFERENCE_PALETTE: ReadonlyArray<PaletteEntry> = [
  ...NATURAIS,
  ...LOIROS_COM_REFLEXO,
  ...RUIVOS,
  ...MOGNOS,
  ...VERMELHOS,
  ...MATTES,
  ...PEROLAS,
  ...FUNDAMENTAIS,
];

/**
 * Mapa rápido id → entrada, para lookup O(1).
 * Útil quando o serviço precisa expandir um paleta_id de string para a entrada.
 */
export const REFERENCE_PALETTE_BY_ID: ReadonlyMap<string, PaletteEntry> = new Map(
  REFERENCE_PALETTE.map((p) => [p.id, p]),
);

/**
 * Lookup de tom natural (.0 puro) por altura.
 * Usado em cobertura de brancos (mix com natural correspondente).
 */
export function getNaturalByAltura(altura: number): PaletteEntry {
  const found = REFERENCE_PALETTE_BY_ID.get(`${altura}.0`);
  if (!found) {
    throw new Error(`Paleta: tom natural ${altura}.0 não encontrado`);
  }
  return found;
}
