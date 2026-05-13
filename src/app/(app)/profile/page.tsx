import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifySessionCookie } from '@/lib/firebase/admin';
import { getProfile } from '@/lib/firestore';
import { ProfileForm } from '@/components/app/ProfileForm';
import { AuroraStatic } from '@/components/bits/AuroraStatic';

/**
 * Tela de perfil do usuário.
 *
 * Header rico: avatar com inicial + nome + e-mail. Funde com a estética
 * do scanner pra dar continuidade visual entre as abas.
 */
export default async function ProfilePage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__firebase_session')?.value;

  if (!sessionCookie) redirect('/auth/login');

  const claims = await verifySessionCookie(sessionCookie);
  if (!claims) redirect('/auth/login');

  const profile = await getProfile(claims.uid);

  // Inicial do nome pro avatar (fallback: primeira letra do e-mail)
  const displayName =
    profile?.nome ?? (claims.name as string | undefined) ?? claims.email ?? '?';
  const initial = displayName.trim().charAt(0).toUpperCase();

  return (
    <main className="relative min-h-dvh">
      <AuroraStatic intensidade={0.2} />

      <div className="pt-safe-or-6 relative z-10 mx-auto max-w-lg px-5 pb-28">
        {/* Header com avatar */}
        <header className="mb-6 flex items-center gap-3 pt-2">
          <span
            aria-hidden="true"
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary/15 font-serif text-2xl italic text-primary ring-1 ring-primary/30"
          >
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold">
              {profile?.nome ?? 'Seu perfil'}
            </h1>
            <p className="truncate text-[11px] text-muted-foreground">{claims.email ?? ''}</p>
            {profile?.salao && (
              <p className="mt-0.5 truncate text-[10px] text-muted-foreground/70">
                {profile.salao}
              </p>
            )}
          </div>
        </header>

        <ProfileForm
          userId={claims.uid}
          initialNome={profile?.nome ?? ''}
          initialSalao={profile?.salao ?? ''}
        />
      </div>
    </main>
  );
}
