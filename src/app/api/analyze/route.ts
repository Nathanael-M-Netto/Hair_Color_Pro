/**
 * POST /api/analyze
 *
 * Recebe pixels de uma foto capilar, executa o pipeline:
 *   1. Análise determinística (`analyzeImageColor`) → tom + subtom + %brancos
 *   2. Geração de relatório textual via Claude (ou fallback template)
 *   3. Persiste no Firestore (`analyses` collection)
 *   4. Devolve resultado completo pro client renderizar
 *
 * Por que tudo isso é Server-side?
 *   - Análise é cara em CPU (loop por ~500k pixels) — não bloqueia main thread do device
 *   - Claude API key NÃO pode vazar pro browser (server-only secret)
 *   - Persiste no Firestore via Admin SDK (sem expor service account)
 *   - Auth: verifica session cookie antes de tudo
 *
 * Input esperado (JSON):
 *   {
 *     width: number,
 *     height: number,
 *     pixelsBase64: string,    // RGBA contínuo, base64-encoded
 *     conciso?: boolean,       // opcional, relatório curto (~120 palavras)
 *   }
 *
 * Output:
 *   {
 *     analysisId: string | null,    // null se Firestore desabilitado
 *     analysis: ColorAnalysisResult,
 *     report: { texto, modelo, tokensConsumidos }
 *   }
 *
 * runtime = 'nodejs' obrigatório: usa firebase-admin + análise CPU-bound.
 */

export const runtime = 'nodejs';
// 30s é mais que suficiente: análise <500ms, Claude <2s, Firestore <100ms.
export const maxDuration = 30;

import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { verifySessionCookie } from '@/lib/firebase/admin';
import { insertAnalysis, getProfile } from '@/lib/firestore';
import { analyzeImageColor, type ImagePixels } from '@/lib/colorimetria/image-analysis';
import { gerarRelatorio } from '@/lib/ai/report';

// ============================================================================
// Validação do payload
// ============================================================================

const requestSchema = z.object({
  width: z.number().int().min(64).max(4096),
  height: z.number().int().min(64).max(4096),
  /**
   * Base64 dos bytes RGBA contínuos. Encoding base64 é ~33% maior que binário
   * mas evita configurar multipart parsing. Limite empirico: ~6MB de body
   * (cabe imagem 1024×1024 RGBA = 4MB cru → 5.3MB base64).
   */
  pixelsBase64: z.string().min(100),
  conciso: z.boolean().optional(),
});

// ============================================================================
// Helper de auth
// ============================================================================

async function authenticate() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__firebase_session')?.value;
  if (!sessionCookie) return null;
  const claims = await verifySessionCookie(sessionCookie);
  return claims;
}

// ============================================================================
// Handler
// ============================================================================

export async function POST(request: NextRequest) {
  // 1. Auth
  const claims = await authenticate();
  if (!claims) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  // 2. Validação do body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Payload inválido', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { width, height, pixelsBase64, conciso } = parsed.data;

  // 3. Decodifica os pixels
  let pixels: ImagePixels;
  try {
    const buffer = Buffer.from(pixelsBase64, 'base64');
    if (buffer.length !== width * height * 4) {
      return NextResponse.json(
        {
          error: `Tamanho dos pixels não bate: esperado ${width * height * 4} bytes (RGBA), recebido ${buffer.length}`,
        },
        { status: 422 },
      );
    }
    pixels = { width, height, data: new Uint8ClampedArray(buffer) };
  } catch {
    return NextResponse.json({ error: 'Pixels base64 inválidos' }, { status: 422 });
  }

  // 4. Análise determinística (sem IA — pura matemática)
  const analysis = analyzeImageColor(pixels);

  // 5. Pega nome do cabeleireiro pro relatório (best-effort, não crítico)
  let nomeCabeleireiro: string | undefined;
  try {
    const profile = await getProfile(claims.uid);
    nomeCabeleireiro = profile?.nome ?? (claims.name as string | undefined);
  } catch {
    // Firestore indisponível — segue sem nome no relatório
  }

  // 6. Relatório via Claude (com fallback template)
  const report = await gerarRelatorio({
    analysis,
    nomeCabeleireiro,
    conciso: conciso ?? false,
  });

  // 7. Persiste no Firestore (no-op se desabilitado — resiliente).
  //    Snapshot completo: análise + relatório textual, pra reabrir depois
  //    pelo /history sem ter que regenerar via IA (e gastar tokens).
  const analysisId = await insertAnalysis({
    userId: claims.uid,
    paletteEntryId: analysis.paletteEntry.id,
    alturaDeTom: analysis.altura,
    reflexo: analysis.paletteEntry.reflexo_primario ?? 0,
    percentualBrancos: analysis.brancosPct,
    confianca: analysis.confianca,
    imagemPath: null, // futuro: upload pro Firebase Storage
    correction: null,
    subtom: analysis.subtom,
    labMedio: analysis.labMedio,
    deltaAoTomMaisProximo: analysis.deltaAoTomMaisProximo,
    reportTexto: report.texto,
    reportModelo: report.modelo,
  });

  return NextResponse.json({
    analysisId: analysisId || null,
    analysis: {
      paletteEntryId: analysis.paletteEntry.id,
      paletteEntryNome: analysis.paletteEntry.nome,
      altura: analysis.altura,
      subtom: analysis.subtom,
      brancosPct: analysis.brancosPct,
      confianca: analysis.confianca,
      deltaAoTomMaisProximo: analysis.deltaAoTomMaisProximo,
      labMedio: analysis.labMedio,
      hex: analysis.paletteEntry.hex,
    },
    report,
  });
}
