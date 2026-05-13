'use client';

import dynamic from 'next/dynamic';

/**
 * Wrapper Client Component que faz lazy-load do `<InstallHint />`.
 *
 * Por que esse wrapper? Next 15 proíbe `ssr: false` em `next/dynamic`
 * usado dentro de Server Components. Movendo o `dynamic()` pra dentro de
 * um Client Component, conseguimos defer sem SSR — o banner só carrega
 * depois do main bundle, não bloqueia o first paint.
 *
 * Resultado prático: HTML inicial não inclui o JS do InstallHint, que
 * pesa ~3-4kb (usa matchMedia, sessionStorage, usePathname, etc). Carrega
 * em background depois do hydration completar.
 */
const InstallHint = dynamic(
  () => import('@/components/app/InstallHint').then((m) => m.InstallHint),
  { ssr: false, loading: () => null },
);

export function InstallHintLazy() {
  return <InstallHint />;
}
