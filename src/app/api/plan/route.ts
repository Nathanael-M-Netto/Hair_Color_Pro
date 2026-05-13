/**
 * POST /api/plan
 *
 * Recebe { basePaletteId, targetPaletteId, subtomAtual, brancosPct, confianca }
 * e devolve:
 *   - Plano determinístico (calcularPlano)
 *   - Relatório textual gerado por Gemini (com fallback offline)
 *
 * O cliente já tem o `basePaletteId` da análise anterior (sessionStorage); aqui
 * só passa o `targetPaletteId` escolhido pelo usuário e os campos relevantes.
 */

export const runtime = 'nodejs';
export const maxDuration = 30;

import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { verifySessionCookie } from '@/lib/firebase/admin';
import { getProfile } from '@/lib/firestore';
import { calcularPlano } from '@/lib/colorimetria/coloring-plan';
import { gerarRelatorioPlano } from '@/lib/ai/report';
import { REFERENCE_PALETTE_BY_ID } from '@/lib/colorimetria/reference-palette';

const requestSchema = z.object({
  basePaletteId: z.string().min(1).max(10),
  targetPaletteId: z.string().min(1).max(10),
  subtomAtual: z.enum(['frio', 'neutro', 'quente']),
  brancosPct: z.number().int().min(0).max(100),
  /** Confiança da análise base (0-1). Apenas pra contexto, não afeta cálculo. */
  confianca: z.number().min(0).max(1),
});

async function authenticate() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__firebase_session')?.value;
  if (!sessionCookie) return null;
  return verifySessionCookie(sessionCookie);
}

export async function POST(request: NextRequest) {
  const claims = await authenticate();
  if (!claims) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

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

  const { basePaletteId, targetPaletteId, subtomAtual, brancosPct, confianca } = parsed.data;

  // Validar que ambos os IDs existem na paleta antes de qualquer cálculo
  if (!REFERENCE_PALETTE_BY_ID.has(basePaletteId)) {
    return NextResponse.json(
      { error: `Tom base "${basePaletteId}" não existe na paleta.` },
      { status: 422 },
    );
  }
  if (!REFERENCE_PALETTE_BY_ID.has(targetPaletteId)) {
    return NextResponse.json(
      { error: `Tom desejado "${targetPaletteId}" não existe na paleta.` },
      { status: 422 },
    );
  }

  // Calcular plano determinístico (puro, sem IA)
  const plan = calcularPlano({
    basePaletteId,
    targetPaletteId,
    subtomAtual,
    brancosPct,
  });

  // Best-effort: pegar nome do cabeleireiro pra personalizar relatório
  let nomeCabeleireiro: string | undefined;
  try {
    const profile = await getProfile(claims.uid);
    nomeCabeleireiro = profile?.nome ?? (claims.name as string | undefined);
  } catch {
    /* Firestore indisponível — segue sem nome */
  }

  // Gerar relatório do plano via IA (fallback automático se falhar)
  const report = await gerarRelatorioPlano({
    plan,
    analysis: {
      // Mocka o ColorAnalysisResult mínimo necessário pro report
      // (só usa brancosPct e confianca aqui)
      paletteEntry: plan.base,
      altura: plan.base.altura,
      subtom: subtomAtual,
      labMedio: plan.base.lab,
      brancosPct,
      confianca,
      deltaAoTomMaisProximo: 0,
      pixelsAnalisados: 0,
    },
    nomeCabeleireiro,
  });

  return NextResponse.json({
    plan: {
      baseId: plan.base.id,
      baseNome: plan.base.nome,
      baseHex: plan.base.hex,
      targetId: plan.target.id,
      targetNome: plan.target.nome,
      targetHex: plan.target.hex,
      deltaAltura: plan.deltaAltura,
      mudouReflexo: plan.mudouReflexo,
      mudouSubtom: plan.mudouSubtom,
      acao: plan.acao,
      volumagemRecomendada: plan.volumagemRecomendada,
      tempoPausaMin: plan.tempoPausaMin,
      avisos: plan.avisos,
      resumo: plan.resumo,
    },
    report,
  });
}
