'use client';

import { Toaster as SonnerToaster } from 'sonner';

/**
 * Toaster — wrapper do Sonner com tema adaptado ao design system cobre/carvão.
 *
 * Adicionar `<Toaster />` no layout raiz uma única vez.
 * Usar `import { toast } from 'sonner'` em qualquer componente para disparar.
 *
 * Exemplos:
 *   toast.success('Fórmula salva')
 *   toast.error('Sem conexão')
 *   toast.warning('Luz insuficiente — tente em ambiente mais iluminado')
 */
export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      position="bottom-center"
      gap={8}
      toastOptions={{
        classNames: {
          toast:
            'glass-strong border border-border text-foreground text-sm shadow-2xl rounded-xl px-4 py-3',
          title: 'font-medium text-foreground',
          description: 'text-muted-foreground text-xs',
          actionButton: 'bg-primary text-primary-foreground text-xs rounded-md px-2 py-1',
          cancelButton: 'bg-secondary text-secondary-foreground text-xs rounded-md px-2 py-1',
          success: '!border-success/20',
          error: '!border-destructive/20',
          warning: '!border-warning/20',
        },
      }}
    />
  );
}
