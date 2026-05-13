import { forwardRef, type HTMLAttributes } from 'react';
import { Card, cardVariants } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * GlassCard — wrapper de superfície glass com API de padding declarativo.
 *
 * Delega toda a lógica de surface (glass / glass-strong / glass-subtle)
 * ao componente `Card` de `@/components/ui/card`. Isso garante fonte única
 * de verdade: alterar `cardVariants` em `card.tsx` atualiza ambos.
 *
 * API pública (inalterada — sem breaking changes):
 *   variant  — 'default' | 'strong' | 'subtle'  (default = 'default')
 *   padding  — 'none' | 'sm' | 'md' | 'lg'       (default = 'md')
 *
 * Para novas telas, prefira `<Card>` do shadcn/ui diretamente.
 * `GlassCard` permanece para compatibilidade com o código existente.
 *
 * Mapeamento de variant:
 *   GlassCard 'default'  →  Card 'glass'   (superfície translúcida padrão)
 *   GlassCard 'strong'   →  Card 'strong'  (mais opaco — modais, drawers)
 *   GlassCard 'subtle'   →  Card 'subtle'  (ultra-leve — chips, ghost inputs)
 */

export type GlassVariant = 'default' | 'strong' | 'subtle';

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: GlassVariant;
  /** Padding interno. `none` desliga; `lg` para cards heroicos. */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

// Traduz o vocabulário de GlassCard para o vocabulário de cardVariants.
// Exportado para que consumers possam fazer o mapeamento sem instanciar GlassCard.
export const GLASS_VARIANT_TO_CARD = {
  default: 'glass',
  strong: 'strong',
  subtle: 'subtle',
} as const satisfies Record<GlassVariant, NonNullable<Parameters<typeof cardVariants>[0]>['variant']>;

const PADDING_CLASS = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-8',
} as const;

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ variant = 'default', padding = 'md', className, ...rest }, ref) => (
    <Card
      ref={ref}
      variant={GLASS_VARIANT_TO_CARD[variant]}
      className={cn(PADDING_CLASS[padding], className)}
      {...rest}
    />
  ),
);
GlassCard.displayName = 'GlassCard';
