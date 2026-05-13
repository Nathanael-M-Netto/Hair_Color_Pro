/**
 * Matemática de cor — conversão sRGB ↔ CIE Lab e cálculo de diferença ΔE.
 *
 * Implementações seguem a IEC 61966-2-1 (sRGB) e CIE 15:2004 (Lab D65).
 * ΔE CIEDE2000 segue Sharma, Wu, Dalal (2005).
 *
 * Tudo aqui é puro: zero efeitos colaterais, zero dependências externas.
 * Funções são otimizadas para chamadas em loop (snap-to-palette processa
 * ~120 entradas × N pixels por imagem).
 */

import type { LabColor } from './types';

// ============================================================================
// Constantes de conversão (CIE 1931, iluminante D65)
// ============================================================================

const D65_WHITEPOINT = { X: 95.047, Y: 100.0, Z: 108.883 } as const;

// ============================================================================
// sRGB ↔ XYZ ↔ Lab
// ============================================================================

/**
 * Converte um componente sRGB (0-1) para linear-RGB (0-1).
 * Aplica a curva inversa de gama do sRGB.
 */
function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Converte um pixel sRGB (0-255 cada canal) para coordenadas Lab D65.
 *
 * @param r Componente vermelho 0-255.
 * @param g Componente verde 0-255.
 * @param b Componente azul 0-255.
 */
export function rgbToLab(r: number, g: number, b: number): LabColor {
  // 1. Normalizar para 0-1
  const rN = r / 255;
  const gN = g / 255;
  const bN = b / 255;

  // 2. sRGB → linear-RGB
  const rLin = srgbToLinear(rN);
  const gLin = srgbToLinear(gN);
  const bLin = srgbToLinear(bN);

  // 3. linear-RGB → XYZ (matriz sRGB→XYZ D65)
  const X = (rLin * 0.4124564 + gLin * 0.3575761 + bLin * 0.1804375) * 100;
  const Y = (rLin * 0.2126729 + gLin * 0.7151522 + bLin * 0.072175) * 100;
  const Z = (rLin * 0.0193339 + gLin * 0.119192 + bLin * 0.9503041) * 100;

  // 4. XYZ → Lab (normaliza pelo whitepoint D65)
  const xR = X / D65_WHITEPOINT.X;
  const yR = Y / D65_WHITEPOINT.Y;
  const zR = Z / D65_WHITEPOINT.Z;

  const epsilon = 216 / 24389; // ~0.008856
  const kappa = 24389 / 27; // ~903.3

  const fX = xR > epsilon ? Math.cbrt(xR) : (kappa * xR + 16) / 116;
  const fY = yR > epsilon ? Math.cbrt(yR) : (kappa * yR + 16) / 116;
  const fZ = zR > epsilon ? Math.cbrt(zR) : (kappa * zR + 16) / 116;

  const L = 116 * fY - 16;
  const a = 500 * (fX - fY);
  const bLab = 200 * (fY - fZ);

  return { L, a, b: bLab };
}

/**
 * Croma (saturação cromática) — distância Euclidiana de (a, b) à origem.
 * Útil para detectar cinza/branco (Chroma baixo) vs cor saturada.
 */
export function chroma(lab: LabColor): number {
  return Math.sqrt(lab.a * lab.a + lab.b * lab.b);
}

/**
 * Matiz (hue) em graus, 0-360. Convenção: 0° = vermelho, 90° = amarelo,
 * 180° = verde, 270° = azul.
 */
export function hue(lab: LabColor): number {
  const h = (Math.atan2(lab.b, lab.a) * 180) / Math.PI;
  return h < 0 ? h + 360 : h;
}

// ============================================================================
// ΔE CIEDE2000 — diferença perceptual entre duas cores Lab
// ============================================================================

/**
 * Distância perceptual entre duas cores Lab segundo CIEDE2000.
 *
 * Interpretação prática:
 * - ΔE < 1: indistinguível a olho nu.
 * - ΔE 1-2: diferença perceptível por especialista.
 * - ΔE 2-5: diferença perceptível por leigo.
 * - ΔE > 5: cores claramente distintas.
 * - ΔE > 12 (limiar do nosso snap): provavelmente cor fora da paleta.
 *
 * Implementação literal do paper de Sharma/Wu/Dalal (2005), Eqs. 2-22.
 */
export function deltaE2000(c1: LabColor, c2: LabColor): number {
  // Pesos de aplicação (geralmente 1)
  const kL = 1;
  const kC = 1;
  const kH = 1;

  // Eq. 2: chromas
  const C1 = Math.sqrt(c1.a * c1.a + c1.b * c1.b);
  const C2 = Math.sqrt(c2.a * c2.a + c2.b * c2.b);

  // Eq. 3: média de croma
  const Cmean = (C1 + C2) / 2;

  // Eq. 4: G (boost no eixo a)
  const Cmean7 = Math.pow(Cmean, 7);
  const G = 0.5 * (1 - Math.sqrt(Cmean7 / (Cmean7 + Math.pow(25, 7))));

  // Eq. 5: a'
  const a1Prime = c1.a * (1 + G);
  const a2Prime = c2.a * (1 + G);

  // Eq. 6: C'
  const C1Prime = Math.sqrt(a1Prime * a1Prime + c1.b * c1.b);
  const C2Prime = Math.sqrt(a2Prime * a2Prime + c2.b * c2.b);

  // Eq. 7: h'
  const h1Prime = hueDegrees(a1Prime, c1.b);
  const h2Prime = hueDegrees(a2Prime, c2.b);

  // Eq. 8-9: ΔL', ΔC'
  const dLPrime = c2.L - c1.L;
  const dCPrime = C2Prime - C1Prime;

  // Eq. 10: Δh'
  let dhPrime: number;
  if (C1Prime * C2Prime === 0) {
    dhPrime = 0;
  } else {
    const diff = h2Prime - h1Prime;
    if (Math.abs(diff) <= 180) {
      dhPrime = diff;
    } else if (diff > 180) {
      dhPrime = diff - 360;
    } else {
      dhPrime = diff + 360;
    }
  }

  // Eq. 11: ΔH'
  const dHPrime = 2 * Math.sqrt(C1Prime * C2Prime) * Math.sin((dhPrime * Math.PI) / 360);

  // Eq. 12: médias
  const LMean = (c1.L + c2.L) / 2;
  const CPrimeMean = (C1Prime + C2Prime) / 2;

  // Eq. 14: h̄'
  let hPrimeMean: number;
  if (C1Prime * C2Prime === 0) {
    hPrimeMean = h1Prime + h2Prime;
  } else if (Math.abs(h1Prime - h2Prime) <= 180) {
    hPrimeMean = (h1Prime + h2Prime) / 2;
  } else if (h1Prime + h2Prime < 360) {
    hPrimeMean = (h1Prime + h2Prime + 360) / 2;
  } else {
    hPrimeMean = (h1Prime + h2Prime - 360) / 2;
  }

  // Eq. 15: T
  const T =
    1 -
    0.17 * Math.cos(degToRad(hPrimeMean - 30)) +
    0.24 * Math.cos(degToRad(2 * hPrimeMean)) +
    0.32 * Math.cos(degToRad(3 * hPrimeMean + 6)) -
    0.2 * Math.cos(degToRad(4 * hPrimeMean - 63));

  // Eq. 16: Δθ
  const dTheta = 30 * Math.exp(-Math.pow((hPrimeMean - 275) / 25, 2));

  // Eq. 17: RC
  const CPrimeMean7 = Math.pow(CPrimeMean, 7);
  const RC = 2 * Math.sqrt(CPrimeMean7 / (CPrimeMean7 + Math.pow(25, 7)));

  // Eq. 18: SL
  const SL =
    1 + (0.015 * Math.pow(LMean - 50, 2)) / Math.sqrt(20 + Math.pow(LMean - 50, 2));

  // Eq. 19: SC
  const SC = 1 + 0.045 * CPrimeMean;

  // Eq. 20: SH
  const SH = 1 + 0.015 * CPrimeMean * T;

  // Eq. 21: RT
  const RT = -Math.sin(degToRad(2 * dTheta)) * RC;

  // Eq. 22: ΔE_2000 final
  const termL = dLPrime / (kL * SL);
  const termC = dCPrime / (kC * SC);
  const termH = dHPrime / (kH * SH);

  return Math.sqrt(termL * termL + termC * termC + termH * termH + RT * termC * termH);
}

// ============================================================================
// Helpers internos
// ============================================================================

function hueDegrees(a: number, b: number): number {
  if (a === 0 && b === 0) return 0;
  const h = (Math.atan2(b, a) * 180) / Math.PI;
  return h < 0 ? h + 360 : h;
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
