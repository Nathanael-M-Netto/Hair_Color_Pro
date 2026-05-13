import { cn } from '@/lib/utils';

/**
 * Aurora estática — versão Server Component (zero JS) da Aurora.
 *
 * Diferenças vs `<Aurora>` (Client Component):
 *   - Sem hooks (`useReducedMotion`), sem animação de blobs
 *   - Sem JS no client → não adiciona ao bundle
 *   - Só gradient + mask via CSS puro
 *   - Renderizado direto no HTML inicial (SSR), pinta antes de qualquer JS rodar
 *
 * Use em rotas internas (/scanner, /history, /profile) onde o fundo é
 * ambiente, não precisa de animação. Mantém o visual da marca sem custo
 * de runtime. Use `<Aurora>` (animada) apenas na landing/auth, onde o
 * efeito é parte da identidade visual hero.
 */
export interface AuroraStaticProps {
  /** Intensidade do gradient (0-1). Default 0.3 — sutil. */
  intensidade?: number;
  className?: string;
}

export function AuroraStatic({ intensidade = 0.3, className }: AuroraStaticProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none fixed inset-0 -z-10 overflow-hidden', className)}
      style={{
        opacity: intensidade,
        // Mesma máscara da Aurora animada — mantém zona sólida no topo
        // pra não criar costura com a status bar.
        WebkitMaskImage:
          'linear-gradient(to bottom, transparent 0, transparent 160px, black 220px, black calc(100% - 32px), transparent 100%)',
        maskImage:
          'linear-gradient(to bottom, transparent 0, transparent 160px, black 220px, black calc(100% - 32px), transparent 100%)',
      }}
    >
      <div className="absolute inset-0 aurora-bg" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
    </div>
  );
}
