'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Loader2,
  TriangleAlert,
  Info,
  Beaker,
  Clock,
  Camera,
} from 'lucide-react';
import { AuroraStatic } from '@/components/bits/AuroraStatic';
import { GlassCard } from '@/components/glass/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * Tela do PLANO de coloração — mostra o caminho do tom atual ao desejado.
 *
 * Lê de sessionStorage 'last-plan' (escrito pelo TargetTonePicker).
 * Se vazio, redireciona pra /scanner.
 */

interface PlanData {
  plan: {
    baseId: string;
    baseNome: string;
    baseHex: string;
    targetId: string;
    targetNome: string;
    targetHex: string;
    deltaAltura: number;
    mudouReflexo: boolean;
    mudouSubtom: boolean;
    acao: string;
    volumagemRecomendada: number;
    tempoPausaMin: number;
    avisos: Array<{ severidade: 'info' | 'atencao' | 'critico'; codigo: string; mensagem: string }>;
    resumo: string;
  };
  report: { texto: string; modelo: string; tokensConsumidos: number };
}

export default function PlanPage() {
  const router = useRouter();
  const [data, setData] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem('last-plan');
    if (!stored) {
      router.replace('/scanner');
      return;
    }
    try {
      setData(JSON.parse(stored) as PlanData);
    } catch {
      router.replace('/scanner');
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <main className="relative flex min-h-dvh items-center justify-center">
        <AuroraStatic intensidade={0.3} />
        <Loader2 className="relative z-10 h-6 w-6 animate-spin text-primary" />
      </main>
    );
  }

  if (!data) {
    return null; // Já redirecionou
  }

  const { plan, report } = data;
  const direcaoLabel =
    plan.deltaAltura > 0
      ? `Clarear ${plan.deltaAltura} nível${plan.deltaAltura > 1 ? 'is' : ''}`
      : plan.deltaAltura < 0
        ? `Escurecer ${Math.abs(plan.deltaAltura)} nível${Math.abs(plan.deltaAltura) > 1 ? 'is' : ''}`
        : plan.mudouReflexo
          ? 'Mudar reflexo'
          : 'Refrescar cor';

  return (
    <main className="relative min-h-dvh">
      <AuroraStatic intensidade={0.3} />

      <div className="pt-safe-or-6 relative z-10 mx-auto max-w-lg px-5 pb-28">
        {/* Header */}
        <header className="mb-5 flex items-center gap-2 pt-2">
          <Link
            href="/result"
            aria-label="Voltar pro resultado"
            className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition active:scale-90 hover:bg-foreground/5 hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <div className="flex-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Plano
            </p>
            <h1 className="text-base font-semibold">{direcaoLabel}</h1>
          </div>
        </header>

        {/* Card visual do caminho A → B */}
        <GlassCard padding="lg" className="mb-4">
          <div className="flex items-center justify-between gap-3">
            {/* Tom atual */}
            <div className="flex flex-1 flex-col items-center text-center">
              <div
                className="h-16 w-16 rounded-2xl border border-border shadow-md"
                style={{ backgroundColor: plan.baseHex }}
              />
              <p className="mt-2 font-mono text-[10px] text-muted-foreground">Atual</p>
              <p className="truncate text-xs font-medium">{plan.baseNome}</p>
              <p className="font-mono text-[10px] text-primary">{plan.baseId}</p>
            </div>

            {/* Seta */}
            <div className="flex flex-col items-center gap-1">
              <ArrowRight className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                {direcaoLabel.split(' ')[0]}
              </span>
            </div>

            {/* Tom desejado */}
            <div className="flex flex-1 flex-col items-center text-center">
              <div
                className="h-16 w-16 rounded-2xl border border-primary/40 shadow-lg shadow-primary/20"
                style={{ backgroundColor: plan.targetHex }}
              />
              <p className="mt-2 font-mono text-[10px] text-muted-foreground">Desejado</p>
              <p className="truncate text-xs font-medium">{plan.targetNome}</p>
              <p className="font-mono text-[10px] text-primary">{plan.targetId}</p>
            </div>
          </div>

          {/* Resumo */}
          <p className="mt-4 text-center text-xs italic text-muted-foreground">{plan.resumo}</p>
        </GlassCard>

        {/* Métricas técnicas em chips */}
        <div className="mb-4 grid grid-cols-2 gap-2">
          <Metric
            icon={<Beaker className="h-3 w-3" />}
            label="Volumagem"
            value={`${plan.volumagemRecomendada} vol`}
          />
          <Metric
            icon={<Clock className="h-3 w-3" />}
            label="Tempo"
            value={`${plan.tempoPausaMin} min`}
          />
        </div>

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
              Parecer da coloração
            </h3>
            {report.modelo.startsWith('fallback') && (
              <Badge variant="glass" className="ml-auto text-[9px]">
                offline
              </Badge>
            )}
          </div>
          <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
            {report.texto.split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </GlassCard>

        {/* Avisos do plano */}
        {plan.avisos.length > 0 && (
          <div className="mb-4 space-y-2">
            {plan.avisos.map((aviso, i) => (
              <AvisoCard key={i} aviso={aviso} />
            ))}
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-col gap-2">
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

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="glass-subtle rounded-xl p-3 text-center">
      <p className="flex items-center justify-center gap-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function AvisoCard({
  aviso,
}: {
  aviso: { severidade: 'info' | 'atencao' | 'critico'; codigo: string; mensagem: string };
}) {
  const { severidade, mensagem } = aviso;

  const config = {
    info: { Icon: Info, color: 'text-primary', bg: 'bg-primary/10', ring: 'ring-primary/30' },
    atencao: {
      Icon: TriangleAlert,
      color: 'text-warning',
      bg: 'bg-warning/10',
      ring: 'ring-warning/30',
    },
    critico: {
      Icon: AlertCircle,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
      ring: 'ring-destructive/40',
    },
  }[severidade];

  const { Icon, color, bg, ring } = config;

  return (
    <div className={`rounded-xl ${bg} ring-1 ${ring} p-3`}>
      <div className="flex items-start gap-2.5">
        <Icon className={`h-4 w-4 shrink-0 ${color}`} aria-hidden="true" />
        <p className="text-xs leading-relaxed text-foreground/90">{mensagem}</p>
      </div>
    </div>
  );
}