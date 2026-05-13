'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Smartphone, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Toggle segmentado de tema: Sistema / Claro / Escuro.
 *
 * `useTheme` é client-only, então o componente renderiza placeholder no
 * SSR pra evitar hydration mismatch. Após `mounted=true`, mostra o estado
 * real persistido.
 *
 * Visual: três botões num "pill" segmentado glass-subtle, com o ativo
 * recebendo bg primary/15 e ring sutil.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const options = [
    { key: 'system', label: 'Sistema', Icon: Smartphone },
    { key: 'light', label: 'Claro', Icon: Sun },
    { key: 'dark', label: 'Escuro', Icon: Moon },
  ] as const;

  const current = mounted ? theme : 'system';

  return (
    <div role="radiogroup" aria-label="Tema visual" className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Tema</p>
      <div className="glass-subtle grid grid-cols-3 gap-1 rounded-xl p-1">
        {options.map(({ key, label, Icon }) => {
          const active = current === key;
          return (
            <button
              key={key}
              role="radio"
              aria-checked={active}
              onClick={() => setTheme(key)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-2.5 transition active:scale-95',
                active
                  ? 'bg-primary/15 text-foreground ring-1 ring-primary/30'
                  : 'text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground/80',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
