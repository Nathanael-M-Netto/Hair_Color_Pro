import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionCookie } from '@/lib/firebase/admin';
import { getAnalyses } from '@/lib/firestore';
import { REFERENCE_PALETTE_BY_ID } from '@/lib/colorimetria/reference-palette';
import { GlassCard } from '@/components/glass/GlassCard';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, ChevronRight } from 'lucide-react';
import { AuroraStatic } from '@/components/bits/AuroraStatic';

/**
 * Tela de histórico de análises.
 *
 * Lê o Firebase session cookie para identificar o usuário, depois
 * busca as últimas 20 análises no Firestore (coleção `analyses`).
 *
 * Pendente (Bloco G): cards ricos com TiltedCard, preview de cor, link para fórmula.
 */
export default async function HistoryPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__firebase_session')?.value;
  if (!sessionCookie) redirect('/auth/login');

  const claims = await verifySessionCookie(sessionCookie);
  if (!claims) redirect('/auth/login');

  let analyses: Awaited<ReturnType<typeof getAnalyses>> = [];
  let fetchError = false;

  try {
    analyses = await getAnalyses(claims.uid, 20);
  } catch {
    fetchError = true;
  }

  return (
    <main className="relative min-h-dvh">
      <AuroraStatic intensidade={0.25} />

      <div className="pt-safe-or-6 relative z-10 mx-auto max-w-lg px-5 pb-28">
        {/* Header — contagem dinâmica + tagline */}
        <header className="mb-5 pt-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {analyses.length === 0
              ? 'Nenhuma análise'
              : `${analyses.length} ${analyses.length === 1 ? 'análise' : 'análises'}`}
          </p>
          <h1 className="mt-1 text-2xl font-light leading-tight">
            Seu <span className="font-normal italic">histórico</span>
          </h1>
        </header>

        {/* Estado de erro */}
        {fetchError && (
          <GlassCard padding="md" className="text-center">
            <p className="text-sm text-destructive">Erro ao carregar histórico.</p>
          </GlassCard>
        )}

        {/* Estado vazio — visualmente convidativo */}
        {!fetchError && analyses.length === 0 && (
          <GlassCard padding="lg" className="text-center">
            <span
              aria-hidden="true"
              className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/30"
            >
              <Clock className="h-6 w-6 text-primary" />
            </span>
            <p className="text-sm font-medium">Nenhuma análise ainda</p>
            <p className="mx-auto mt-1.5 max-w-[16rem] text-xs leading-relaxed text-muted-foreground">
              Faça sua primeira análise no scanner — ela aparece aqui em segundos.
            </p>
          </GlassCard>
        )}

        {/* Lista de análises — cards clicáveis que abrem /history/[id] */}
        {!fetchError && analyses.length > 0 && (
          <ul className="space-y-3" role="list">
            {analyses.map((analysis) => {
              // Lookup do hex real da paleta — fallback pra cinza neutro se id desconhecido
              const paletteEntry = REFERENCE_PALETTE_BY_ID.get(analysis.paletteEntryId);
              const hex = paletteEntry?.hex ?? '#3a3633';
              const nomeTom = paletteEntry?.nome ?? `Tom ${analysis.alturaDeTom.toFixed(1)}`;

              return (
                <li key={analysis.id}>
                  <Link
                    href={`/history/${analysis.id}`}
                    aria-label={`Abrir análise de ${nomeTom}`}
                    className="block transition active:scale-[0.99]"
                  >
                    <GlassCard
                      padding="md"
                      className="flex items-center gap-3 hover:bg-foreground/[0.04]"
                    >
                      {/* Swatch redondo com a cor REAL detectada pela análise */}
                      <div
                        className="h-12 w-12 shrink-0 rounded-full border border-border/40 shadow-md"
                        style={{ backgroundColor: hex }}
                        aria-hidden="true"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{nomeTom}</span>
                          <Badge variant="copper" className="shrink-0 text-[9px]">
                            {Math.round(analysis.confianca * 100)}%
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          <span className="font-mono">{analysis.paletteEntryId}</span>
                          {' · '}
                          {analysis.percentualBrancos}% brancos
                        </p>
                        <time
                          dateTime={analysis.createdAt.toISOString()}
                          className="mt-1 block text-[10px] text-muted-foreground/60"
                        >
                          {analysis.createdAt.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </time>
                      </div>

                      <ChevronRight
                        className="h-4 w-4 shrink-0 text-muted-foreground/50"
                        aria-hidden="true"
                      />
                    </GlassCard>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

/** Skeleton de carregamento — usado pelo Suspense boundary em rotas mais lentas */
export function HistorySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  );
}
