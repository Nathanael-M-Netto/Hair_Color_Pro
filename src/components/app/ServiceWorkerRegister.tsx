'use client';

import { useEffect } from 'react';

/**
 * Registra o Service Worker (`/sw.js`) na primeira renderização.
 *
 * Necessário para que a PWA seja instalável de verdade no Chrome/Edge
 * (sem SW, o navegador só oferece "atalho" em vez de "instalar app").
 *
 * Comportamento:
 *   - Só registra se o browser suporta SW (todos modernos suportam)
 *   - Falha silenciosamente em ambientes sem suporte (não quebra a app)
 *   - Em dev, o SW respeita HMR — vide passthroughs em public/sw.js
 *
 * Renderiza `null` — é apenas side-effect.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    // `load` evita competir com o critical rendering path
    const onLoad = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch((err) => {
          // Não logamos como erro em prod — falha de registro é graceful
          if (process.env.NODE_ENV === 'development') {
            console.warn('[sw] registro falhou:', err);
          }
        });
    };

    if (document.readyState === 'complete') {
      onLoad();
    } else {
      window.addEventListener('load', onLoad);
      return () => window.removeEventListener('load', onLoad);
    }
  }, []);

  return null;
}
