'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Input de senha com botão de "olho" pra alternar visibilidade.
 *
 * Comportamento:
 *   - Por default, `type="password"` (texto mascarado)
 *   - Toca no ícone Eye → `type="text"` (texto visível)
 *   - Toca de novo → volta pra password
 *   - O botão NÃO submete o form (`type="button"`) — comum esquecer
 *
 * Acessibilidade:
 *   - `aria-label` no botão muda conforme estado ("Mostrar senha" / "Esconder")
 *   - `aria-pressed` indica o estado atual pro leitor de tela
 *   - Botão fica dentro do mesmo container do input, alinhado à direita
 *
 * Funciona como drop-in replacement do `<Input type="password">`:
 *   <PasswordInput {...field} autoComplete="current-password" />
 */
export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);

    return (
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          type={visible ? 'text' : 'password'}
          // Padding à direita pra não sobrepor o botão (~h-9 w-9 = 36px)
          className={cn('pr-10', className)}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Esconder senha' : 'Mostrar senha'}
          aria-pressed={visible}
          tabIndex={-1}
          className={cn(
            'absolute inset-y-0 right-0 grid w-10 place-items-center',
            'text-muted-foreground transition active:scale-90',
            'hover:text-foreground',
            'focus-visible:outline-none focus-visible:text-foreground',
          )}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';
