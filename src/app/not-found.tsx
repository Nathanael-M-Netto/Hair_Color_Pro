import Link from 'next/link';
import { Compass, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/glass/GlassCard';
import { AuroraStatic } from '@/components/bits/AuroraStatic';

/**
 * 404 — página não encontrada.
 *
 * Tom amistoso com a identidade visual do app (cobre + glass + serif italic).
 * Nada de "Error 404 Not Found" estilo IIS — texto humano em PT-BR.
 */
export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-6">
      <AuroraStatic intensidade={0.3} />

      <GlassCard padding="lg" className="relative z-10 w-full max-w-sm text-center">
        <span
          aria-hidden="true"
          className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/30"
        >
          <Compass className="h-6 w-6 text-primary" />
        </span>

        <h1 className="font-serif text-3xl italic">Sem sinal por aqui</h1>
        <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">
          Essa página não existe ou foi removida. Vamos te levar de volta pro
          caminho.
        </p>

        <Button asChild size="touch" className="mt-5 w-full">
          <Link href="/">
            Voltar ao início
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </GlassCard>
    </main>
  );
}
