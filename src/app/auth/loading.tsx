import { AuroraStatic } from '@/components/bits/AuroraStatic';

/**
 * Loading boundary para /auth/* — renderizado entre /auth/login e /auth/register
 * pra que a transição entre as duas pareça instantânea.
 *
 * Usa AuroraStatic (Server Component, zero JS) pra não bloquear o paint.
 */
export default function AuthLoading() {
  return (
    <div className="relative min-h-dvh">
      <AuroraStatic intensidade={0.35} />
      <div className="pt-safe-or-10 pb-safe-or-6 mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 pt-20">
        <div className="glass w-full rounded-2xl p-8">
          <div className="mb-5 flex flex-col items-center gap-2">
            <div className="h-5 w-24 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-3 w-32 rounded bg-white/[0.04] animate-pulse" />
          </div>
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-16 rounded bg-white/[0.04] animate-pulse" />
                <div className="h-11 rounded-lg bg-white/[0.04] animate-pulse" />
              </div>
            ))}
            <div className="mt-4 h-12 rounded-xl bg-primary/30 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
