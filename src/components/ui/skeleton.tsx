import { cn } from '@/lib/utils';

/**
 * Skeleton — placeholder de carregamento.
 * Usa shimmer via animate-pulse sobre superfície glass-subtle.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-secondary/50', className)}
      {...props}
    />
  );
}

export { Skeleton };
