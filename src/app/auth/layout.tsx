import Link from 'next/link';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { Aurora } from '@/components/bits/Aurora';

/**
 * Layout das páginas de autenticação.
 *
 * Comportamento:
 *   - Topo: botão "voltar" + marca minimalista (safe-area-top)
 *   - Centro: card de login/cadastro centralizado verticalmente
 *   - Em telas pequenas onde o conteúdo é maior que a viewport (Cadastro
 *     com 4 campos no iPhone SE), permite scroll interno suave em vez de
 *     truncar o botão de submit.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh">
      <Aurora intensidade={0.45} />

      {/* Header: voltar + marca */}
      <header className="pt-safe-or-6 absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 pb-2">
        <Link
          href="/"
          aria-label="Voltar para a tela inicial"
          className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition active:scale-90 hover:bg-foreground/5 hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="grid h-6 w-6 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/30"
          >
            <Sparkles className="h-3 w-3 text-primary" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/80">
            Hair Color Pro
          </span>
        </div>
        {/* Spacer simétrico ao botão de voltar */}
        <div className="h-9 w-9" aria-hidden="true" />
      </header>

      {/* Conteúdo principal */}
      <div className="pt-safe-or-10 pb-safe-or-6 mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 pt-20">
        {children}
      </div>
    </div>
  );
}
