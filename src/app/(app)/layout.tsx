import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { AppNav } from '@/components/app/AppNav';

/**
 * Layout protegido — todas as rotas dentro de `(app)/` passam por aqui.
 *
 * Auth: confia no `middleware.ts` que já fez `verifySessionCookie`
 * antes de chegar aqui. Esse layout só faz uma checagem barata de
 * presença do cookie como defesa-em-profundidade (se alguém burlar o
 * middleware, ainda não renderiza).
 *
 * Páginas individuais que precisam dos `claims` (uid, email) chamam
 * `verifySessionCookie` — que agora é cacheado em memória (60s TTL),
 * tornando a chamada repetida quase gratuita.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__firebase_session')?.value;

  // Cookie ausente: middleware deveria ter redirecionado, mas defendemos
  // mesmo assim — esta é uma checagem `O(1)`, não custa nada.
  if (!sessionCookie) {
    redirect('/auth/login');
  }

  return (
    <div className="relative min-h-dvh">
      <main className="min-h-dvh">{children}</main>
      <AppNav />
    </div>
  );
}
