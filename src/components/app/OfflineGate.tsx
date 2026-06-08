'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { WifiOff, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/glass/GlassCard';
import { AuroraStatic } from '@/components/bits/AuroraStatic';

/**
 * OfflineGate — bloqueio de tela cheia quando o dispositivo está sem internet.
 *
 * O Hair Color Pro é online-only: análise (Gemini), plano, histórico, login e
 * cadastro dependem de rede. Em vez de deixar o app meio-funcionar e cair em
 * telas de erro quebradas, este portão cobre TODA a interface enquanto não há
 * conexão e oferece uma recuperação que funciona de verdade.
 *
 * Comportamento:
 *   - Aparece quando `navigator.onLine` é falso ou no evento `offline`.
 *   - "Tentar novamente" faz uma checagem REAL de conectividade (HEAD a um
 *     recurso do próprio domínio) — `navigator.onLine` sozinho indica apenas que
 *     há interface de rede, não que a internet responde — e só recarrega se a
 *     rede realmente voltou.
 *   - Se a página foi ABERTA offline, ao reconectar recarrega sozinha para
 *     buscar o conteúdo real que não pôde ser carregado.
 *   - Fundo opaco: esconde qualquer tela de erro/estado quebrado por trás.
 */
export function OfflineGate() {
  const [offline, setOffline] = useState(false);
  const [checking, setChecking] = useState(false);
  const openedOfflineRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const initial = !navigator.onLine;
    openedOfflineRef.current = initial;
    setOffline(initial);

    const onOffline = () => setOffline(true);
    const onOnline = () => {
      // Aberto offline → recarrega para puxar o conteúdo que faltou carregar.
      if (openedOfflineRef.current) {
        window.location.reload();
        return;
      }
      setOffline(false);
    };
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      mountedRef.current = false;
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  const retry = useCallback(() => {
    setChecking(true);
    // Confirma conectividade real — a rede pode reportar "online" sem internet.
    fetch(`/icon-192.png?ping=${Date.now()}`, { method: 'HEAD', cache: 'no-store' })
      .then(() => window.location.reload())
      .catch(() => {
        if (mountedRef.current) setChecking(false);
      });
  }, []);

  if (!offline) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Sem conexão com a internet"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background px-6"
    >
      <AuroraStatic intensidade={0.3} />
      <GlassCard padding="lg" className="relative z-10 w-full max-w-sm text-center">
        <span
          aria-hidden="true"
          className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-warning/15 ring-1 ring-warning/30"
        >
          <WifiOff className="h-6 w-6 text-warning" />
        </span>
        <h2 className="text-base font-semibold">Sem conexão</h2>
        <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">
          O Hair Color Pro precisa de internet para funcionar — análise, plano,
          histórico e login dependem de conexão. Reconecte-se e tente novamente.
        </p>
        <Button size="touch" onClick={retry} disabled={checking} className="mt-5 w-full">
          {checking ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              Verificando…
            </>
          ) : (
            <>
              <RefreshCw aria-hidden="true" />
              Tentar novamente
            </>
          )}
        </Button>
      </GlassCard>
    </div>
  );
}
