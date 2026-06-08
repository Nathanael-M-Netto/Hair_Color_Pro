'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Registra o Service Worker (`/sw.js`) e gerencia o fluxo de ATUALIZAÇÃO.
 *
 * Necessário para que a PWA seja instalável de verdade no Chrome/Edge
 * (sem SW, o navegador só oferece "atalho" em vez de "instalar app").
 *
 * Atualização (resposta à dúvida "o usuário precisa reinstalar?" → NÃO):
 *   - A cada deploy, o navegador baixa o novo /sw.js em background.
 *   - O novo SW fica em "waiting" (não chamamos skipWaiting no install).
 *   - Mostramos um toast "Nova versão disponível"; ao tocar em "Atualizar",
 *     mandamos SKIP_WAITING pro SW, ele assume e a página recarrega 1x.
 *   - Sem reinstalar, sem loja de apps. Só um toque.
 *
 * Renderiza `null` — é apenas side-effect.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    // Só recarrega quando a troca de controlador veio de uma atualização que o
    // usuário confirmou — assim o clients.claim() do PRIMEIRO install não
    // dispara um reload indesejado.
    let updateConfirmed = false;
    const onControllerChange = () => {
      if (!updateConfirmed) return;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    const promptUpdate = (worker: ServiceWorker) => {
      toast('Nova versão disponível', {
        description: 'Atualize para carregar as últimas melhorias do app.',
        duration: Infinity,
        action: {
          label: 'Atualizar',
          onClick: () => {
            updateConfirmed = true;
            worker.postMessage({ type: 'SKIP_WAITING' });
          },
        },
      });
    };

    const onLoad = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          // Já havia uma versão nova esperando antes deste load.
          if (reg.waiting && navigator.serviceWorker.controller) {
            promptUpdate(reg.waiting);
          }

          // Nova versão detectada durante esta sessão.
          reg.addEventListener('updatefound', () => {
            const installing = reg.installing;
            if (!installing) return;
            installing.addEventListener('statechange', () => {
              // 'installed' + já existe controlador = é uma ATUALIZAÇÃO (não o
              // primeiro install). Aí sim oferecemos o update.
              if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                promptUpdate(installing);
              }
            });
          });
        })
        .catch((err) => {
          // Falha de registro é graceful — não quebra a app.
          if (process.env.NODE_ENV === 'development') {
            console.warn('[sw] registro falhou:', err);
          }
        });
    };

    if (document.readyState === 'complete') {
      onLoad();
    } else {
      window.addEventListener('load', onLoad);
    }

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      window.removeEventListener('load', onLoad);
    };
  }, []);

  return null;
}
