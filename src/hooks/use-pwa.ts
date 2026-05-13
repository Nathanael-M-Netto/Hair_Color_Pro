'use client';

import { useEffect, useState } from 'react';

/**
 * Tipagem do evento `beforeinstallprompt` (não está nos types padrão do DOM).
 * Disparado pelo Chrome/Edge quando o PWA pode ser instalado.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

type Platform = 'ios' | 'android' | 'desktop' | 'unknown';

/**
 * Detecta plataforma pelo userAgent. Usado para mostrar instruções
 * específicas (no iOS o `beforeinstallprompt` não existe — instalação é
 * manual via Compartilhar → Adicionar à Tela Inicial).
 */
function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'desktop';
}

interface UsePwaReturn {
  /** True quando o app está rodando como PWA standalone (instalado). */
  isStandalone: boolean;
  /** Plataforma detectada — define a UI de instalação. */
  platform: Platform;
  /** True se o prompt nativo de instalação está disponível (Chrome/Edge Android/Desktop). */
  canInstall: boolean;
  /** Dispara o prompt nativo. Retorna true se o usuário aceitou. No-op se !canInstall. */
  install: () => Promise<boolean>;
  /** True após o componente montar — evita hydration mismatch em SSR. */
  mounted: boolean;
}

/**
 * Hook que detecta se a app está rodando como PWA standalone (instalada na
 * tela inicial) ou no navegador, e expõe o gatilho nativo de instalação
 * quando disponível.
 *
 * @example
 *   const { isStandalone, canInstall, install, platform } = usePwa()
 *   if (isStandalone) return <AppContent />
 *   return <InstallBanner onInstall={install} platform={platform} canInstall={canInstall} />
 */
export function usePwa(): UsePwaReturn {
  const [isStandalone, setIsStandalone] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setPlatform(detectPlatform());

    // Detecta modo standalone (PWA instalado ou Safari "Adicionar à Tela Inicial")
    const mql = window.matchMedia('(display-mode: standalone)');
    const updateStandalone = () => {
      const navStandalone = (navigator as Navigator & { standalone?: boolean }).standalone;
      setIsStandalone(mql.matches || navStandalone === true);
    };
    updateStandalone();
    mql.addEventListener('change', updateStandalone);

    // Captura o evento de instalação (Chrome/Edge — Android e desktop)
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    // Limpa o evento se o app foi instalado
    const onInstalled = () => {
      setInstallEvent(null);
      setIsStandalone(true);
    };
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      mql.removeEventListener('change', updateStandalone);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!installEvent) return false;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    setInstallEvent(null);
    return outcome === 'accepted';
  };

  return {
    isStandalone,
    platform,
    canInstall: installEvent !== null,
    install,
    mounted,
  };
}
