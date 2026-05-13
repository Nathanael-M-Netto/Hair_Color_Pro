'use client';

import { Share, Plus, Download, X } from 'lucide-react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { usePwa } from '@/hooks/use-pwa';
import { cn } from '@/lib/utils';

/**
 * Banner flutuante de instalação — substitui o botão discreto anterior.
 *
 * Inspirado no padrão de PWAs ricas (poker-odds-calculator etc): banner
 * persistente, chamativo, fixo na base, com animação de "respiração" sutil.
 * Aparece em QUALQUER rota até a app ser instalada — não fica preso à landing.
 *
 * Comportamento por plataforma:
 *   1. canInstall (Chrome Android/Desktop HTTPS) → banner "Instalar app"
 *      com botão grande que dispara o prompt nativo do sistema.
 *   2. iOS Safari → banner instrutivo "Toque em ⎘ → Adicionar à Tela Inicial"
 *   3. Standalone (já instalado) → null
 *   4. Usuário fechou (X) → null naquela sessão (sessionStorage)
 */
// Rotas onde a AppNav (bottom nav) está visível — o banner precisa subir
// pra não sobrepor a nav. As páginas (app)/* todas usam esse layout.
// `/history/[id]` também tem AppNav porque está dentro de (app)/ — o prefix match
// `/history` pega tanto a lista quanto a tela de detalhe.
const ROUTES_WITH_BOTTOM_NAV = ['/scanner', '/history', '/profile', '/result', '/plan'];

export function InstallHint() {
  const { isStandalone, canInstall, install, platform, mounted } = usePwa();
  const pathname = usePathname();
  const hasBottomNav = ROUTES_WITH_BOTTOM_NAV.some((r) => pathname.startsWith(r));
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('install-banner-dismissed') === '1';
  });

  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem('install-banner-dismissed', '1');
    } catch {
      /* sessionStorage pode falhar em modo privado — segue sem persistir */
    }
  }

  if (!mounted || isStandalone || dismissed) return null;

  // Chrome Android/Desktop — prompt nativo disponível: banner clicável grande
  if (canInstall) {
    return (
      <BannerShell onDismiss={dismiss} hasBottomNav={hasBottomNav}>
        <button
          onClick={async () => {
            const accepted = await install();
            if (accepted) dismiss();
          }}
          className="flex flex-1 items-center gap-3 text-left"
        >
          <span
            aria-hidden="true"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/30"
          >
            <Download className="h-5 w-5" />
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-semibold leading-tight">Instalar app</span>
            <span className="text-[11px] leading-tight text-muted-foreground">
              Abrir como app nativo, sem navegador
            </span>
          </span>
        </button>
      </BannerShell>
    );
  }

  // iOS Safari — banner instrutivo
  if (platform === 'ios') {
    return (
      <BannerShell onDismiss={dismiss} hasBottomNav={hasBottomNav}>
        <div className="flex flex-1 items-center gap-3">
          <span
            aria-hidden="true"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30"
          >
            <Share className="h-5 w-5" />
          </span>
          <p className="text-[11px] leading-tight text-muted-foreground">
            Para instalar como app, toque em{' '}
            <Share className="inline h-3 w-3 align-text-bottom text-foreground/80" />{' '}
            <span className="text-foreground/80">Compartilhar</span> e em{' '}
            <span className="text-foreground/80">Adicionar à Tela Inicial</span>{' '}
            <Plus className="inline h-3 w-3 align-text-bottom" />
          </p>
        </div>
      </BannerShell>
    );
  }

  return null;
}

/**
 * Shell visual compartilhado: bg glass, borda sutil, animação de respiração
 * (escala leve oscilando), botão X discreto. Sai com `aria-live="polite"`
 * pra leitores de tela mas sem interromper.
 */
function BannerShell({
  children,
  onDismiss,
  hasBottomNav,
}: {
  children: React.ReactNode;
  onDismiss: () => void;
  hasBottomNav: boolean;
}) {
  return (
    <div
      data-install-banner
      role="region"
      aria-label="Instalar como aplicativo"
      style={{
        // Em rotas com AppNav (scanner/history/profile), sobe ~80px pra
        // não cobrir a barra de navegação. Em landing/auth, fica colado
        // na base com respiro pro home indicator.
        bottom: hasBottomNav
          ? 'calc(env(safe-area-inset-bottom) + 5rem)'
          : 'calc(env(safe-area-inset-bottom) + 0.75rem)',
      }}
      className={cn(
        'pointer-events-auto fixed inset-x-3 z-30',
        'mx-auto max-w-md',
        // Visual: glass forte, borda cobre sutil, sombra elevada, respirando
        'glass-strong rounded-2xl border-primary/20 px-3 py-2.5',
        'shadow-xl shadow-black/50 ring-1 ring-primary/10',
        'animate-[install-pulse_3s_ease-in-out_infinite]',
        'flex items-center gap-2',
      )}
    >
      {children}
      <button
        onClick={onDismiss}
        aria-label="Dispensar banner de instalação"
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground transition active:scale-90 hover:bg-white/5 hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
