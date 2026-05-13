'use client';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';

/**
 * Texto com varredura sutil de brilho cobre→champagne.
 *
 * Uso: títulos hero, CTAs principais. Aplicar com PARCIMÔNIA — no máximo
 * 1 elemento ShinyText por tela.
 *
 * Respeita `prefers-reduced-motion`: vira texto sólido em foreground normal.
 */
export interface ShinyTextProps {
  children: React.ReactNode;
  /** Velocidade da varredura em segundos. Default 4s — lento, elegante. */
  speed?: number;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

export function ShinyText({
  children,
  speed = 4,
  className,
  as: Component = 'span',
}: ShinyTextProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return (
      <Component className={cn('text-foreground', className)}>{children}</Component>
    );
  }

  return (
    <Component
      className={cn('inline-block bg-clip-text text-transparent', className)}
      style={{
        backgroundImage: `linear-gradient(
          120deg,
          hsl(30 12% 96%) 0%,
          hsl(30 12% 96%) 35%,
          hsl(24 55% 75%) 50%,
          hsl(30 12% 96%) 65%,
          hsl(30 12% 96%) 100%
        )`,
        backgroundSize: '200% 100%',
        animation: `shiny-text ${speed}s ease-in-out infinite`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      {children}
      <style>{`
        @keyframes shiny-text {
          0%, 100% { background-position: 200% 0; }
          50% { background-position: -200% 0; }
        }
      `}</style>
    </Component>
  );
}
