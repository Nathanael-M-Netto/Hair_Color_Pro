'use client';

import { useEffect, useState } from 'react';
import { Sun, Ruler, Scissors, Sparkles, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/glass/GlassCard';

/**
 * Onboarding mostrado na PRIMEIRA visita ao /scanner.
 *
 * Persistência: `localStorage` (não sessionStorage) — onboarding é por
 * usuário/device, não por sessão. Se o usuário tocar "Pular", nunca mais
 * aparece (até limpar dados do site / reinstalar PWA).
 *
 * Layout: card centralizado sobre overlay escuro, exibe 3 slides com as
 * mesmas dicas das chips mas em formato narrativo. Não bloqueia o uso da
 * câmera — usuário pode fechar com X e usar mesmo assim.
 *
 * SSR-safe: renderiza `null` no SSR, evita hydration mismatch via flag
 * `mounted`. localStorage só é lido no client.
 */

const STORAGE_KEY = 'hcp-scanner-onboarding-seen-v1';

const SLIDES = [
  {
    Icon: Scissors,
    title: 'Aponte só pro cabelo',
    desc: 'Posicione o círculo da câmera contendo apenas cabelo — sem pele, roupa ou fundo. Quanto mais "limpo" o enquadramento, mais preciso o diagnóstico.',
  },
  {
    Icon: Sun,
    title: 'Luz natural difusa',
    desc: 'Faça a foto perto de uma janela ou em ambiente bem iluminado. Evite sol direto, luz amarelada de lâmpada incandescente, e flash do celular.',
  },
  {
    Icon: Ruler,
    title: 'Mais ou menos 30 cm',
    desc: 'Distância suficiente pra capturar uma área generosa de cabelo. Mais perto, a câmera só vê detalhe; mais longe, perde resolução pra detectar reflexos.',
  },
] as const;

export function ScannerOnboarding() {
  const [show, setShow] = useState(false);
  const [slide, setSlide] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setShow(true);
      }
    } catch {
      /* localStorage indisponível (private mode antigo) — pula */
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  if (!mounted || !show) return null;

  const isLast = slide === SLIDES.length - 1;
  const current = SLIDES[slide]!;
  const Icon = current.Icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="pt-safe-or-6 pb-safe-or-6 fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/85 px-6 backdrop-blur-md animate-in fade-in duration-300"
    >
      {/* Botão pular no topo direito */}
      <button
        onClick={dismiss}
        aria-label="Pular tutorial"
        className="absolute right-5 top-[max(1.25rem,env(safe-area-inset-top))] grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition active:scale-90 hover:bg-foreground/5 hover:text-foreground"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Header com marca + indicador de slide */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <span
          aria-hidden="true"
          className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/30"
        >
          <Sparkles className="h-4 w-4 text-primary" />
        </span>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Antes de começar
        </p>
      </div>

      {/* Card do slide atual */}
      <GlassCard padding="lg" className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <span
            aria-hidden="true"
            className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/30"
          >
            <Icon className="h-6 w-6 text-primary" />
          </span>

          <h2 id="onboarding-title" className="font-serif text-2xl italic">
            {current.title}
          </h2>

          <p className="mx-auto mt-3 max-w-[18rem] text-sm leading-relaxed text-muted-foreground">
            {current.desc}
          </p>
        </div>
      </GlassCard>

      {/* Dots indicadores */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setSlide(i)}
            aria-label={`Ir para o slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === slide ? 'w-6 bg-primary' : 'w-1.5 bg-foreground/20 hover:bg-foreground/30'
            }`}
          />
        ))}
      </div>

      {/* CTA — "Próximo" ou "Entendi" no último slide */}
      <Button
        size="touch"
        className="mt-6 w-full max-w-sm"
        onClick={() => (isLast ? dismiss() : setSlide(slide + 1))}
      >
        {isLast ? 'Começar' : 'Próximo'}
        <ChevronRight aria-hidden="true" />
      </Button>

      {!isLast && (
        <button
          onClick={dismiss}
          className="mt-3 text-xs text-muted-foreground transition hover:text-foreground"
        >
          Pular tutorial
        </button>
      )}
    </div>
  );
}
