'use client';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';

/**
 * Aurora monocromática — fundo ambiente do app.
 *
 * Variante restrita do efeito Aurora do reactbits.dev:
 * - Apenas tons de cobre/champagne sobre carvão (paleta da marca).
 * - Sem cores adicionais, sem brilho neon, sem WebGL pesado.
 * - Pura CSS animation com gradientes radiais — performático em qualquer device.
 *
 * Comportamento:
 * - Posiciona-se atrás do conteúdo (`fixed inset-0 -z-10`).
 * - Respeita `prefers-reduced-motion`: trava em estado estático.
 */
export interface AuroraProps {
  /** Intensidade da animação (0-1). Default 0.6 — discreto, não distrai. */
  intensidade?: number;
  className?: string;
  /**
   * Modo "estático": só renderiza a camada de gradiente base, sem os blobs
   * animados. Default `false` (animado).
   *
   * Use em rotas internas (/scanner, /history, /profile) onde a animação
   * compete com a UX e adiciona custo de pintura/animation frames. A
   * landing e auth continuam com Aurora animada porque o visual hero é o
   * próprio fundo respirando.
   */
  estatico?: boolean;
}

export function Aurora({ intensidade = 0.6, className, estatico = false }: AuroraProps) {
  const reducedMotion = useReducedMotion();
  // Reduz movimento: ou pelo prefer do usuário, ou explicitamente pedido pela rota
  const semAnimacao = reducedMotion || estatico;

  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none fixed inset-0 -z-10 overflow-hidden', className)}
      style={{
        // Máscara: Aurora começa transparente nos primeiros 160px da tela
        // (cobre toda a faixa onde a status bar do Android encosta + alguns
        // pixels de respiro). Resultado: a zona visualmente adjacente ao
        // system UI é 100% `theme_color` sólido (`#0E0C0B`), sem gradient
        // que possa criar diferença de tom com a barra do dispositivo.
        // O fade in até 220px é onde a Aurora começa, gradualmente.
        WebkitMaskImage:
          'linear-gradient(to bottom, transparent 0, transparent 160px, black 220px, black calc(100% - 32px), transparent 100%)',
        maskImage:
          'linear-gradient(to bottom, transparent 0, transparent 160px, black 220px, black calc(100% - 32px), transparent 100%)',
      }}
    >
      {/* Camada de gradiente base — sempre estática */}
      <div className="absolute inset-0 aurora-bg" />

      {/* Blobs animados — só rodam se não há reduced motion E não estático */}
      {!semAnimacao && (
        <>
          <div
            className="absolute -left-1/4 -top-1/4 h-[60vh] w-[60vh] rounded-full blur-3xl"
            style={{
              background:
                'radial-gradient(circle, hsl(24 55% 52% / 0.16) 0%, transparent 70%)',
              opacity: intensidade,
              animation: 'aurora-drift-a 22s ease-in-out infinite',
            }}
          />
          <div
            className="absolute -right-1/4 top-1/2 h-[70vh] w-[70vh] rounded-full blur-3xl"
            style={{
              background:
                'radial-gradient(circle, hsl(24 35% 35% / 0.20) 0%, transparent 70%)',
              opacity: intensidade,
              animation: 'aurora-drift-b 28s ease-in-out infinite',
            }}
          />
          <div
            className="absolute bottom-0 left-1/2 h-[50vh] w-[50vh] -translate-x-1/2 rounded-full blur-3xl"
            style={{
              background:
                'radial-gradient(circle, hsl(30 18% 75% / 0.06) 0%, transparent 70%)',
              opacity: intensidade,
              animation: 'aurora-drift-c 35s ease-in-out infinite',
            }}
          />
        </>
      )}

      {/* Vinheta sutil para o conteúdo respirar nas bordas */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />

      <style>{`
        @keyframes aurora-drift-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(15vw, 10vh) scale(1.1); }
        }
        @keyframes aurora-drift-b {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-12vw, -8vh) scale(0.95); }
        }
        @keyframes aurora-drift-c {
          0%, 100% { transform: translate(-50%, 0) scale(1); }
          50% { transform: translate(-40%, -15vh) scale(1.05); }
        }
      `}</style>
    </div>
  );
}
