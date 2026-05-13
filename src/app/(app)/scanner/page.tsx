import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionCookie } from '@/lib/firebase/admin';
import { AuroraStatic } from '@/components/bits/AuroraStatic';
import { CaptureTipsChips } from '@/components/app/CaptureTipsChips';
import { CameraCapture } from '@/components/app/CameraCapture';
import { ScannerOnboarding } from '@/components/app/ScannerOnboarding';

/**
 * Scanner — entrada do fluxo de análise.
 *
 * Server Component: greeting personalizada (via session cookie cacheado) +
 * Aurora estática + chips de dicas (CaptureTipsChips é Client mas leve).
 *
 * O <CameraCapture /> é Client e cuida de TODO o ciclo:
 *   ativar câmera → preview ao vivo dentro do círculo → captura → POST /api/analyze
 *   → sessionStorage → router.push('/result')
 *
 * Separação Server/Client: o pai renderiza estrutura SSR-friendly (zero JS),
 * o filho roda lógica de browser. Bundle do /scanner = 21.8 kB porque o
 * CameraCapture importa Sonner + alguns icons; abaixo desse threshold seria
 * possível mas não compensa o esforço.
 */
export default async function ScannerPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__firebase_session')?.value;
  if (!sessionCookie) redirect('/auth/login');

  const claims = await verifySessionCookie(sessionCookie);
  if (!claims) redirect('/auth/login');

  // Primeiro nome — vem do displayName do Firebase Auth ou email
  const fullName = (claims.name as string | undefined) ?? claims.email ?? 'cabeleireiro';
  const firstName = fullName.split(' ')[0]?.split('@')[0] ?? fullName;

  return (
    <main className="relative flex h-dvh flex-col overflow-hidden">
      <AuroraStatic intensidade={0.35} />

      {/* Header: greeting personalizada */}
      <header className="pt-safe-or-6 relative z-10 px-5 pb-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Pronto para analisar
        </p>
        <h1 className="mt-1 text-2xl font-light leading-tight">
          Olá, <span className="font-normal italic text-foreground">{firstName}</span>
        </h1>
      </header>

      {/* Camera (Client) — renderiza viewfinder, chips de dicas e CTAs.
          As chips são injetadas como slot pra ficarem entre o viewfinder
          e os CTAs sem layout positioning ginástico. */}
      <CameraCapture chipsSlot={<CaptureTipsChips />} />

      {/* Onboarding 3 slides — só aparece na PRIMEIRA visita
          (controlado via localStorage 'hcp-scanner-onboarding-seen-v1'). */}
      <ScannerOnboarding />
    </main>
  );
}
