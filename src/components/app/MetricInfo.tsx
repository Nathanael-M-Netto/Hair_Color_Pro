'use client';

import * as React from 'react';
import { AlertCircle, Check, Info, TriangleAlert } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

/**
 * Métrica colorida (chip) com popover explicativo ao toque.
 *
 * Substitui o `Metric` inline do /result e /history/[id], padronizando:
 *   - 3 níveis de severidade visual (ok / atencao / critico)
 *   - Ícone de severidade no chip
 *   - Toque → popover descrevendo o que a métrica representa
 *
 * Quando a métrica tem `popoverTitle` + `popoverContent`, vira tocável e o
 * trigger é o próprio chip. Sem esses props, é só visual (não-interativo).
 */

export type MetricSeverity = 'ok' | 'atencao' | 'critico';

export interface MetricInfoProps {
  label: string;
  value: string;
  severity?: MetricSeverity;
  /** Título do popover. Se omitido, métrica não é tocável. */
  popoverTitle?: string;
  /** Conteúdo do popover — pode ser JSX rico (parágrafos, listas). */
  popoverContent?: React.ReactNode;
}

const SEVERITY_CONFIG = {
  ok: { Icon: Check, color: 'text-primary' },
  atencao: { Icon: TriangleAlert, color: 'text-warning' },
  critico: { Icon: AlertCircle, color: 'text-destructive' },
} as const;

export function MetricInfo({
  label,
  value,
  severity = 'ok',
  popoverTitle,
  popoverContent,
}: MetricInfoProps) {
  const { Icon, color } = SEVERITY_CONFIG[severity];
  const hasPopover = popoverTitle && popoverContent;

  const chip = (
    <div
      className={cn(
        'glass-subtle rounded-xl p-2.5 text-center transition',
        hasPopover && 'cursor-pointer active:scale-95 hover:bg-foreground/[0.04]',
      )}
    >
      <p className="flex items-center justify-center gap-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
        {label}
        {hasPopover && (
          <Info className="h-2.5 w-2.5 text-muted-foreground/50" aria-hidden="true" />
        )}
      </p>
      <div className="mt-1 flex items-center justify-center gap-1">
        <Icon className={cn('h-3 w-3', color)} aria-hidden="true" />
        <span className="text-xs font-medium capitalize">{value}</span>
      </div>
    </div>
  );

  if (!hasPopover) return chip;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${label}: ${value}. Toque para saber mais.`}
          className="w-full"
        >
          {chip}
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" sideOffset={8} className="w-72">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className={cn(
              'grid h-9 w-9 shrink-0 place-items-center rounded-full ring-1',
              severity === 'critico'
                ? 'bg-destructive/15 ring-destructive/30 text-destructive'
                : severity === 'atencao'
                  ? 'bg-warning/15 ring-warning/30 text-warning'
                  : 'bg-primary/15 ring-primary/30 text-primary',
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
          <div className="text-xs leading-relaxed">
            <p className="font-medium text-foreground">{popoverTitle}</p>
            <div className="mt-1.5 space-y-1.5 text-muted-foreground">{popoverContent}</div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// Conteúdos pré-prontos dos popovers — reaproveitados em /result e /history/[id]
// Mantidos aqui pra ter UMA fonte de verdade da explicação técnica das métricas.
// ============================================================================

export const POPOVER_SUBTOM = {
  title: 'O que é subtom?',
  content: (
    <>
      <p>
        Tendência cromática perceptível do cabelo, classificada em três famílias:
      </p>
      <ul className="space-y-1 pl-1">
        <li>
          <span className="text-foreground/80">Frio</span> — acinzentado, esverdeado, pouca pigmentação avermelhada.
        </li>
        <li>
          <span className="text-foreground/80">Neutro</span> — equilibrado entre frio e quente.
        </li>
        <li>
          <span className="text-foreground/80">Quente</span> — presença de dourado, cobre ou avermelhado.
        </li>
      </ul>
      <p>
        Determina a afinidade do cliente com reflexos: subtom frio combina com
        cinzas e pérolas; quente com dourados e cobres.
      </p>
    </>
  ),
};

export const POPOVER_BRANCOS = {
  title: 'Percentual de cabelos brancos',
  content: (
    <>
      <p>
        Estimativa de fios brancos/grisalhos no enquadramento, calculada por
        contagem de pixels com luminosidade alta (L &gt; 70) e cromaticidade
        baixa.
      </p>
      <ul className="space-y-1 pl-1">
        <li>
          <span className="text-foreground/80">&lt; 30%</span> — cobertura
          direta sem pré-tratamento.
        </li>
        <li>
          <span className="text-foreground/80">30-50%</span> — mix do tom
          desejado com natural correspondente (proporção 1:1).
        </li>
        <li>
          <span className="text-foreground/80">&gt; 50%</span> — exige
          pré-pigmentação antes da coloração principal.
        </li>
      </ul>
    </>
  ),
};

export const POPOVER_CONFIANCA = {
  title: 'Confiança da análise',
  content: (
    <>
      <p>
        Indica quão próximo o algoritmo encontrou um tom canônico da paleta
        L&apos;Oréal/Wella/Schwarzkopf. Baseada na métrica ΔE2000 (distância
        perceptual de cor padrão da indústria).
      </p>
      <ul className="space-y-1 pl-1">
        <li>
          <span className="text-foreground/80">≥ 85% (alta)</span> — tom
          praticamente exato, pode prosseguir com a formulação.
        </li>
        <li>
          <span className="text-foreground/80">50-85% (média)</span> — tom
          plausível, mas pode ter nuance. Se possível, refaça em luz melhor.
        </li>
        <li>
          <span className="text-foreground/80">&lt; 50% (baixa)</span> — foto
          provavelmente ruim (luz, foco, área de cabelo insuficiente) ou cor
          fora do espectro natural. Refaça a análise.
        </li>
      </ul>
    </>
  ),
};
