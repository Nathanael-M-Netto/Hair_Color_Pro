'use client';

import { useEffect, useState } from 'react';

/**
 * Hook que reflete a preferência `prefers-reduced-motion` do sistema operacional.
 *
 * **Regra**: todo efeito visual em `src/components/bits/*` deve consumir este hook
 * e retornar uma versão estática quando `true`. Acessibilidade não é opcional.
 *
 * @returns `true` se o usuário preferiu reduzir movimento.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);

    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    query.addEventListener('change', handler);
    return () => query.removeEventListener('change', handler);
  }, []);

  return reduced;
}
