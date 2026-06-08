import { describe, it, expect } from 'vitest';
import { analyzeImageColor, mediana, type ImagePixels } from './image-analysis';

/**
 * Testes da análise de imagem capilar.
 *
 * Foco: o caso que motivou a reformulação do algoritmo — cabelo escuro com
 * muitos fios brancos (sal e pimenta), que antes era diagnosticado como
 * "loiro cinzento" por causa da MÉDIA dos pixels. A estimativa por MEDIANA
 * resolve isso.
 */

type RGB = [number, number, number];

function pixelsFrom(colors: RGB[]): ImagePixels {
  const data = new Uint8ClampedArray(colors.length * 4);
  colors.forEach(([r, g, b], i) => {
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = 255;
  });
  return { width: colors.length, height: 1, data };
}

const repeat = <T,>(value: T, n: number): T[] => Array.from({ length: n }, () => value);

describe('mediana', () => {
  it('tamanho ímpar → elemento central', () => expect(mediana([3, 1, 2])).toBe(2));
  it('tamanho par → média dos dois centrais', () => expect(mediana([1, 2, 3, 4])).toBe(2.5));
  it('array vazio → 0 (defensivo)', () => expect(mediana([])).toBe(0));
  it('é robusta a outliers (ao contrário da média)', () =>
    expect(mediana([10, 11, 12, 13, 900])).toBe(12));
});

describe('analyzeImageColor — cabelo escuro grisalho (sal e pimenta)', () => {
  const escuro: RGB = [35, 28, 25]; // castanho muito escuro
  const branco: RGB = [236, 233, 230]; // fio branco

  it('NÃO confunde escuro + branco com loiro cinzento', () => {
    const pixels = pixelsFrom([...repeat(escuro, 50), ...repeat(branco, 50)]);
    const r = analyzeImageColor(pixels);

    // A base deve permanecer ESCURA (altura baixa) — não virar loiro (altura alta).
    expect(r.altura).toBeLessThanOrEqual(4);
    // Cerca de metade dos fios são brancos.
    expect(r.brancosPct).toBeGreaterThanOrEqual(40);
    expect(r.brancosPct).toBeLessThanOrEqual(60);
  });

  it('quanto mais brancos, maior o %brancos — sem clarear a base', () => {
    const pixels = pixelsFrom([...repeat(escuro, 30), ...repeat(branco, 70)]);
    const r = analyzeImageColor(pixels);
    expect(r.brancosPct).toBeGreaterThanOrEqual(60);
    expect(r.altura).toBeLessThanOrEqual(4); // base segue escura
  });
});

describe('analyzeImageColor — cabelo uniforme (sanidade)', () => {
  it('castanho uniforme → base média, zero brancos', () => {
    const castanho: RGB = [92, 64, 46];
    const r = analyzeImageColor(pixelsFrom(repeat(castanho, 100)));
    expect(r.brancosPct).toBe(0);
    expect(r.altura).toBeGreaterThanOrEqual(2);
    expect(r.altura).toBeLessThanOrEqual(8);
  });
});
