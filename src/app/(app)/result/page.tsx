'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Camera, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { AuroraStatic } from '@/components/bits/AuroraStatic';
import { GlassCard } from '@/components/glass/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TargetTonePicker } from '@/components/app/TargetTonePicker';
import { ManualEntry } from '@/components/app/ManualEntry';
import {
  MetricInfo,
  POPOVER_BRANCOS,
  POPOVER_CONFIANCA,
  POPOVER_SUBTOM,
} from '@/components/app/MetricInfo';

/**
 * Tela de resultado da análise de cor.
 *
 * Como chega aqui:
 *   - /scanner faz a captura, POST /api/analyze, e router.push('/result?id=...')
 *   - No Bloco D vai funcionar com câmera real
 *   - Por enquanto, permite chamar /result?demo=1 pra ver com dados mock
 *
 * Layout:
 *   ┌───────────────────────────────┐
 *   │ ← Voltar  · Resultado         │
 *   ├───────────────────────────────┤
 *   │ Swatch + Nome + Altura.Reflexo│
 *   │ Subtom · Confiança · Brancos  │
 *   ├───────────────────────────────┤
 *   │ 📝 Parecer profissional       │
 *   │ (texto gerado pela IA)        │
 *   ├───────────────────────────────┤
 *   │ [Refazer]  [Nova análise]     │
 *   └───────────────────────────────┘
 */

interface AnalysisData {
  paletteEntryId: string;
  paletteEntryNome: string;
  altura: number;
  subtom: 'frio' | 'neutro' | 'quente';
  brancosPct: number;
  confianca: number;
  deltaAoTomMaisProximo: number;
  hex: string;
}

interface ResultData {
  analysisId: string | null;
  analysis: AnalysisData;
  report: { texto: string; modelo: string; tokensConsumidos: number };
}

// Dados mock pra modo demo (sem precisar da câmera implementada)
const DEMO_DATA: ResultData = {
  analysisId: null,
  analysis: {
    paletteEntryId: '6.0',
    paletteEntryNome: 'Loiro Escuro',
    altura: 6,
    subtom: 'quente',
    brancosPct: 12,
    confianca: 0.87,
    deltaAoTomMaisProximo: 2.4,
    hex: '#785236',
  },
  report: {
    texto:
      'A análise identificou o cabelo como Loiro Escuro (altura 6, código 6.0), com subtom quente — presença de dourado/cobre na base natural. A confiança do algoritmo é de 87%, indicando que o tom detectado é altamente confiável.\n\nPresença discreta de brancos (12%) — fácil cobertura sem necessidade de pré-pigmentação. Na prática, partimos de uma base 6.0 pra calcular qualquer transformação. O subtom quente sugere afinidade com reflexos dourados, cobre ou mogno — reflexos cinzas podem precisar de pré-pigmentação pra neutralizar o calor de fundo.\n\nA confiança é alta — você pode prosseguir com a formulação. Em coloração comercial, este tom equivale ao nível 6 das principais marcas profissionais (L\'Oréal Majirel 6.0, Wella Koleston 6/0, Schwarzkopf Igora Royal 6-00).',
    modelo: 'fallback-template-v1',
    tokensConsumidos: 0,
  },
};

export default function ResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === '1';

  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Modo demo: mostra dados mock direto (UX/dev)
    if (isDemo) {
      setData(DEMO_DATA);
      setLoading(false);
      return;
    }

    // TODO Bloco D: ler análise real do sessionStorage / state global
    // Por enquanto, sem foto não tem análise — redireciona pro scanner.
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem('last-analysis') : null;
    if (!stored) {
      router.replace('/scanner');
      return;
    }

    try {
      setData(JSON.parse(stored) as ResultData);
    } catch {
      setError('Análise corrompida no armazenamento. Faça uma nova análise.');
    } finally {
      setLoading(false);
    }
  }, [isDemo, router]);

  if (loading) {
    return (
      <main className="relative flex min-h-dvh items-center justify-center">
        <AuroraStatic intensidade={0.3} />
        <Loader2 className="relative z-10 h-6 w-6 animate-spin text-primary" />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="relative flex min-h-dvh flex-col items-center justify-center px-6">
        <AuroraStatic intensidade={0.3} />
        <GlassCard padding="lg" className="relative z-10 w-full max-w-sm text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
          <p className="text-sm">{error ?? 'Análise não encontrada.'}</p>
          <Button asChild size="touch" className="mt-4 w-full">
            <Link href="/scanner">
              <Camera />
              Voltar ao scanner
            </Link>
          </Button>
        </GlassCard>
      </main>
    );
  }

  return <ResultView data={data} onAdjusted={setData} />;
}

// ============================================================================
// View principal — renderização do resultado
// ============================================================================

function ResultView({
  data,
  onAdjusted,
}: {
  data: ResultData;
  onAdjusted: (r: ResultData) => void;
}) {
  const { analysis, report } = data;
  const confPct = Math.round(analysis.confianca * 100);

  return (
    <main className="relative min-h-dvh">
      <AuroraStatic intensidade={0.3} />

      <div className="pt-safe-or-6 relative z-10 mx-auto max-w-lg px-5 pb-28">
        {/* Header */}
        <header className="mb-5 flex items-center gap-2 pt-2">
          <Link
            href="/scanner"
            aria-label="Voltar ao scanner"
            className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition active:scale-90 hover:bg-foreground/5 hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <div className="flex-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Resultado
            </p>
            <h1 className="text-base font-semibold">Análise concluída</h1>
          </div>
        </header>

        {/* Card de diagnóstico principal */}
        <GlassCard padding="lg" className="mb-4">
          <div className="flex items-start gap-4">
            {/* Swatch da cor detectada */}
            <div
              className="h-20 w-20 shrink-0 rounded-2xl border border-border shadow-lg"
              style={{ backgroundColor: analysis.hex }}
              aria-label={`Cor detectada: ${analysis.paletteEntryNome}`}
            />

            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Tom detectado
              </p>
              <h2 className="mt-0.5 truncate font-serif text-2xl italic leading-tight">
                {analysis.paletteEntryNome}
              </h2>
              <p className="mt-1 font-mono text-xs text-primary">
                {analysis.paletteEntryId} · Altura {analysis.altura}
              </p>
            </div>
          </div>

          {/* Métricas em chips */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            <MetricInfo
              label="Subtom"
              value={traduzirSubtom(analysis.subtom)}
              popoverTitle={POPOVER_SUBTOM.title}
              popoverContent={POPOVER_SUBTOM.content}
            />
            <MetricInfo
              label="Brancos"
              value={`${analysis.brancosPct}%`}
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

          {/* Ajuste manual — a detecção é um ponto de partida; o profissional
              confere e corrige tom, subtom ou % de brancos quando necessário. */}
          <div className="mt-4">
            {confPct < 60 && (
              <p className="mb-2 text-center text-[11px] text-warning">
                Confiança baixa — confira e ajuste o diagnóstico se necessário.
              </p>
            )}
            <ManualEntry
              initial={{
                paletteEntryId: analysis.paletteEntryId,
                subtom: analysis.subtom,
                brancosPct: analysis.brancosPct,
              }}
              label="Ajustar diagnóstico"
              triggerVariant="outline"
              title="Ajustar diagnóstico"
              description="Corrija o tom, o subtom ou o percentual de brancos detectados."
              submitLabel="Salvar correção"
              onResult={(r) => onAdjusted(r as ResultData)}
            />
          </div>
        </GlassCard>

        {/* Card de relatório IA */}
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
            {report.modelo.startsWith('fallback') && (
              <Badge variant="glass" className="ml-auto text-[9px]">
                offline
              </Badge>
            )}
          </div>
          <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
            {report.texto.split('\n\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </GlassCard>

        {/* Detalhes técnicos (colapsado por enquanto, expansível depois) */}
        <GlassCard padding="md" variant="subtle" className="mb-4">
          <details>
            <summary className="cursor-pointer text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Detalhes técnicos
            </summary>
            <dl className="mt-3 space-y-1.5 text-[11px]">
              <Detail label="ΔE2000 ao tom mais próximo" value={analysis.deltaAoTomMaisProximo.toFixed(2)} />
              <Detail label="Modelo do relatório" value={report.modelo} />
              <Detail label="Tokens consumidos" value={String(report.tokensConsumidos)} />
              {data.analysisId && <Detail label="ID da análise" value={data.analysisId} mono />}
            </dl>
          </details>
        </GlassCard>

        {/* CTAs — primário: definir tom desejado (gera plano) */}
        <div className="flex flex-col gap-2">
          <TargetTonePicker
            basePaletteId={analysis.paletteEntryId}
            subtomAtual={analysis.subtom}
            brancosPct={analysis.brancosPct}
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
// Subcomponentes
// ============================================================================

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? 'truncate font-mono' : 'truncate'}>{value}</dd>
    </div>
  );
}

function traduzirSubtom(s: 'frio' | 'neutro' | 'quente'): string {
  return s;
}
