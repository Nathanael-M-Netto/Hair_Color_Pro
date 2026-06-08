'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

/**
 * Banner persistente de status offline.
 *
 * Por quê: as funções centrais do app dependem de internet — a análise de cor
 * e o relatório (servidor + Gemini), o cálculo do plano e o histórico
 * (Firestore). Offline, o usuário consegue abrir telas já carregadas, mas não
 * gerar novos diagnósticos. O banner deixa isso explícito em vez de o app
 * "travar" silenciosamente.
 *
 * Detecção: `navigator.onLine` + eventos `online`/`offline`. É um sinal do
 * browser (perda de interface de rede); não garante alcançar o servidor, mas
 * cobre o caso comum de ficar sem conexão.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update(); // estado inicial
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pt-safe fixed inset-x-0 top-0 z-[60] border-b border-warning/30 bg-warning/15 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-lg items-start gap-2.5 px-4 py-2.5">
        <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
        <p className="text-[11px] leading-snug text-foreground/90">
          <span className="font-medium">Sem conexão.</span> Você pode navegar pelas telas já
          abertas, mas a <span className="font-medium">análise de cor</span>, o{' '}
          <span className="font-medium">plano</span> e o{' '}
          <span className="font-medium">histórico</span> precisam de internet.
        </p>
      </div>
    </div>
  );
}
