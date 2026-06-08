'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/glass/GlassCard';
import { AuroraStatic } from '@/components/bits/AuroraStatic';

/**
 * Error boundary global do App Router — Next.js captura QUALQUER erro
 * não-tratado em Server Components / Client Components e renderiza isso
 * em vez de tela em branco.
 *
 * Recebe `error` (com `digest` em produção pra correlação com logs do servidor).
 *
 * Recuperação: NÃO usamos `reset()` (re-render do mesmo segmento), porque erros
 * de rede/chunk costumam deixar o payload do router quebrado — o reset reexecuta
 * o mesmo fetch falho e fica preso. Em vez disso, recarregamos a página por
 * inteiro (hard reload) e voltamos ao início por navegação dura — ambos sempre
 * recuperam quando a conexão volta.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log no console pra debug; em produção plugaria Sentry/etc aqui
    console.error('[error-boundary]', error);
  }, [error]);

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-6">
      <AuroraStatic intensidade={0.3} />

      <GlassCard padding="lg" className="relative z-10 w-full max-w-sm text-center">
        <span
          aria-hidden="true"
          className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-destructive/15 ring-1 ring-destructive/30"
        >
          <AlertCircle className="h-6 w-6 text-destructive" />
        </span>

        <h1 className="text-base font-semibold">Algo deu errado</h1>
        <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">
          Tivemos um problema ao carregar essa tela. Tenta de novo — geralmente é
          coisa rápida.
        </p>

        {/* Em dev, mostra detalhes do erro. Em prod, esconde. */}
        {process.env.NODE_ENV === 'development' && (
          <pre className="mt-3 max-h-32 overflow-auto rounded-lg bg-black/30 p-2 text-left text-[10px] text-destructive/80">
            {error.message}
          </pre>
        )}

        <div className="mt-5 flex flex-col gap-2">
          <Button size="touch" onClick={() => window.location.reload()} className="w-full">
            <RefreshCw aria-hidden="true" />
            Tentar de novo
          </Button>
          <Button
            variant="outline"
            size="touch"
            className="w-full"
            onClick={() => {
              window.location.href = '/';
            }}
          >
            <Home aria-hidden="true" />
            Voltar ao início
          </Button>
        </div>

        {error.digest && (
          <p className="mt-4 font-mono text-[9px] text-muted-foreground/40">
            ref: {error.digest}
          </p>
        )}
      </GlassCard>
    </main>
  );
}
