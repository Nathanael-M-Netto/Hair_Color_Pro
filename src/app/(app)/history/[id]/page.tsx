import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Camera } from 'lucide-react';
import { verifySessionCookie } from '@/lib/firebase/admin';
import { getAnalysisById } from '@/lib/firestore';
import { REFERENCE_PALETTE_BY_ID } from '@/lib/colorimetria/reference-palette';
import { AuroraStatic } from '@/components/bits/AuroraStatic';
import { GlassCard } from '@/components/glass/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TargetTonePicker } from '@/components/app/TargetTonePicker';
import {
  MetricInfo,
  POPOVER_BRANCOS,
  POPOVER_CONFIANCA,
  POPOVER_SUBTOM,
} from '@/components/app/MetricInfo';

/**
 * Tela de detalhe de uma análise antiga (vinda do histórico).
 *
 * Server Component:
 *   - Verifica session cookie (mesmo padrão das outras rotas autenticadas)
 *   - Lê doc da coleção `analyses` no Firestore via `getAnalysisById`
 *   - `getAnalysisById` valida que o uid bate (defesa contra IDOR)
 *
 * UI espelha a tela /result, mas o snapshot vem do banco (não sessionStorage).
 * O `TargetTonePicker` continua disponível — usuário pode gerar um plano
 * NOVO a partir de uma análise antiga (útil em retorno do cliente).
 */
export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Auth — mesmo padrão das outras páginas (app)
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__firebase_session')?.value;
  if (!sessionCookie) redirect('/auth/login');

  const claims = await verifySessionCookie(sessionCookie);
  if (!claims) redirect('/auth/login');

  // Busca análise — getAnalysisById já verifica posse
  const analysis = await getAnalysisById(claims.uid, id);
  if (!analysis) notFound();

  // Resolve entrada da paleta pra hex e nome bonito
  const paletteEntry = REFERENCE_PALETTE_BY_ID.get(analysis.paletteEntryId);
  const hex = paletteEntry?.hex ?? '#3a3633';
  const nomeTom = paletteEntry?.nome ?? `Tom ${analysis.alturaDeTom.toFixed(1)}`;

  const confPct = Math.round(analysis.confianca * 100);
  const subtom = analysis.subtom ?? 'neutro';

  // Texto do relatório — se a análise é antiga (antes do schema novo), mostra
  // um placeholder técnico. Senão, mostra o relatório armazenado.
  const reportTexto =
    analysis.reportTexto ??
    `Análise registrada em ${analysis.createdAt.toLocaleDateString('pt-BR')}: ${nomeTom} (${analysis.paletteEntryId}), confiança ${confPct}%. Esta análise foi feita antes da inclusão de relatórios persistidos — sem texto disponível.`;
  const reportModelo = analysis.reportModelo ?? 'sem-relatorio';

  const formattedDate = analysis.createdAt.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <main className="relative min-h-dvh">
      <AuroraStatic intensidade={0.3} />

      <div className="pt-safe-or-6 relative z-10 mx-auto max-w-lg px-5 pb-28">
        {/* Header com botão voltar pro histórico */}
        <header className="mb-5 flex items-center gap-2 pt-2">
          <Link
            href="/history"
            aria-label="Voltar ao histórico"
            className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition active:scale-90 hover:bg-foreground/5 hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Análise salva
            </p>
            <h1 className="truncate text-base font-semibold">{nomeTom}</h1>
          </div>
        </header>

        {/* Card de diagnóstico principal — espelha o /result */}
        <GlassCard padding="lg" className="mb-4">
          <div className="flex items-start gap-4">
            <div
              className="h-20 w-20 shrink-0 rounded-2xl border border-border shadow-lg"
              style={{ backgroundColor: hex }}
              aria-label={`Cor detectada: ${nomeTom}`}
            />
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Tom detectado
              </p>
              <h2 className="mt-0.5 truncate font-serif text-2xl italic leading-tight">
                {nomeTom}
              </h2>
              <p className="mt-1 font-mono text-xs text-primary">
                {analysis.paletteEntryId} · Altura {analysis.alturaDeTom}
              </p>
            </div>
          </div>

          {/* Métricas — clicáveis, abrem popover explicativo */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            <MetricInfo
              label="Subtom"
              value={subtom}
              popoverTitle={POPOVER_SUBTOM.title}
              popoverContent={POPOVER_SUBTOM.content}
            />
            <MetricInfo
              label="Brancos"
              value={`${analysis.percentualBrancos}%`}
              popoverTitle={POPOVER_BRANCOS.title}
              popoverContent={POPOVER_BRANCOS.content}
            />
            <MetricInfo
              label="Confiança"
              value={`${confPct}%`}
              severity={confPct < 50 ? 'critico' : confPct < 75 ? 'atencao' : 'ok'}
              popoverTitle={POPOVER_CONFIANCA.title}
              popoverContent={POPOVER_CONFIANCA.content}
            />
          </div>

          <p className="mt-4 text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">
            Realizada em {formattedDate}
          </p>
        </GlassCard>

        {/* Relatório */}
        <GlassCard padding="lg" className="mb-4">
          <div className="mb-3 flex items-center gap-2">
            <span
              aria-hidden="true"
              className="grid h-6 w-6 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/30"
            >
              <Sparkles className="h-3 w-3 text-primary" />
            </span>
            <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Parecer profissional
            </h3>
            {(reportModelo.startsWith('fallback') || reportModelo === 'sem-relatorio') && (
              <Badge variant="glass" className="ml-auto text-[9px]">
                {reportModelo === 'sem-relatorio' ? 'sem texto' : 'offline'}
              </Badge>
            )}
          </div>
          <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
            {reportTexto.split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </GlassCard>

        {/* Detalhes técnicos colapsado */}
        <GlassCard padding="md" variant="subtle" className="mb-4">
          <details>
            <summary className="cursor-pointer text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Detalhes técnicos
            </summary>
            <dl className="mt-3 space-y-1.5 text-[11px]">
              <Detail
                label="ΔE2000 ao tom mais próximo"
                value={analysis.deltaAoTomMaisProximo?.toFixed(2) ?? '—'}
              />
              {analysis.labMedio && (
                <Detail
                  label="Lab médio"
                  value={`L=${analysis.labMedio.L.toFixed(1)} a=${analysis.labMedio.a.toFixed(1)} b=${analysis.labMedio.b.toFixed(1)}`}
                  mono
                />
              )}
              <Detail label="Modelo do relatório" value={reportModelo} />
              <Detail label="ID da análise" value={analysis.id} mono />
            </dl>
          </details>
        </GlassCard>

        {/* CTAs — pode gerar um plano novo a partir dessa análise antiga */}
        <div className="flex flex-col gap-2">
          <TargetTonePicker
            basePaletteId={analysis.paletteEntryId}
            subtomAtual={subtom}
            brancosPct={analysis.percentualBrancos}
            confianca={analysis.confianca}
          />
          <Button asChild size="touch" variant="outline" className="w-full">
            <Link href="/scanner">
              <Camera />
              Nova análise
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

// ============================================================================
// Subcomponentes (espelham os de /result)
// ============================================================================


function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? 'truncate font-mono' : 'truncate'}>{value}</dd>
    </div>
  );
}
