import { cn } from '@/lib/utils';

/**
 * Texto com gradiente cobre→champagne estático.
 *
 * Diferente do ShinyText, NÃO anima. Use no número do tom detectado e em
 * 1 estatística por tela. Acessível por padrão (sem dependência de motion).
 */
export interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

export function GradientText({
  children,
  className,
  as: Component = 'span',
}: GradientTextProps) {
  return (
    <Component className={cn('text-gradient-copper inline-block font-medium', className)}>
      {children}
    </Component>
  );
}
