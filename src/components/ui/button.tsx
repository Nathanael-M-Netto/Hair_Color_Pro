import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Button — shadcn New York, adaptado para o design system cobre/carvão.
 *
 * Variant extra: `glass` — superfície translúcida sobre Aurora ou cards.
 * Não use `glass` em contextos sem background rico; a transparência não terá efeito.
 */
const buttonVariants = cva(
  // Base: foco acessível, mínimo tátil 44px (HIG), transição suave, feedback ao toque
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium',
    'ring-offset-background transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-40',
    // Feedback tátil em todos os botões — confirma o toque visualmente
    'active:scale-[0.97]',
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-input bg-white/[0.02] text-foreground shadow-sm hover:bg-secondary/60 hover:text-foreground hover:border-foreground/20',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost:
          'bg-transparent text-foreground hover:bg-secondary/60 hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline active:scale-100',
        /** Superfície glass translúcida — ideal sobre Aurora e fundos ricos */
        glass:
          'glass-subtle text-foreground hover:bg-white/5 active:bg-white/10',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-xl px-8',
        xl: 'h-14 rounded-2xl px-10 text-base',
        // tap targets para mobile: mínimo 44x44 (Apple HIG / WCAG 2.5.5)
        touch: 'h-12 rounded-xl px-6 text-sm',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Quando true, renderiza o filho diretamente via Slot (composição) */
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
