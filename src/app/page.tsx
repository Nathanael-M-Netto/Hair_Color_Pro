import Link from 'next/link';
import { Aurora } from '@/components/bits/Aurora';
import { GradientText } from '@/components/bits/GradientText';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';

/**
 * Landing — splash de app mobile.
 *
 * Princípios:
 *   1. Cabe em uma tela 375×667 sem scroll (iPhone SE)
 *   2. Dois CTAs claros: primário "Começar grátis", secundário "Já tenho conta"
 *   3. Nada de footer carregado — assinatura discreta em uma linha
 *   4. Quando aberto no navegador (não-standalone), oferece instalação
 *      como app via `<InstallHint />`
 *
 * Hierarquia visual:
 *   Marca (safe-area-top)
 *   ─────────────────────
 *           Hero
 *           [CTA primário]
 *           [CTA secundário]
 *           [Hint de instalação]
 *           [Assinatura]
 *   ─────────────────────  (safe-area-bottom)
 */
export default function LandingPage() {
  return (
    <main className="relative flex h-dvh flex-col overflow-hidden">
      <Aurora intensidade={0.4} />

      {/* ── Marca (topo, respeita notch) ───────────────────────────
       *   pt-safe-or-10: garante respiro generoso entre a status bar
       *   do dispositivo e a marca, evitando a sensação de "encostado". */}
      <header className="pt-safe-or-10 relative z-10 flex items-center justify-center px-6 pb-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/30"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-foreground/80">
            Hair Color Pro
          </span>
        </div>
      </header>

      {/* ── Hero (cresce para preencher o espaço disponível) ────── */}
      <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 text-center">
        <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
          Colorimetria com IA
        </p>

        <h1 className="text-balance text-[2.4rem] font-light leading-[1.02] tracking-tight sm:text-5xl">
          Diagnóstico
          <br />
          de cor na
          <br />
          <GradientText className="font-normal italic" as="span">
            ponta do dedo.
          </GradientText>
        </h1>

        <p className="mt-5 max-w-[18rem] text-pretty text-[13px] leading-relaxed text-muted-foreground">
          Aponte a câmera, receba a fórmula completa em segundos.
        </p>
      </section>

      {/* ── CTAs fixos na base ────────────────────────────────────
       *   O banner de instalação flutuante é renderizado pelo RootLayout
       *   e aparece em qualquer rota até a app virar PWA standalone. */}
      <footer className="pb-safe-or-10 relative z-10 flex flex-col items-stretch gap-3 px-6 pt-4">
        {/* Primário: Cadastro — prefetch agressivo (mesmo em dev) pra navegação instantânea */}
        <Button asChild size="xl" className="w-full">
          <Link href="/auth/register" prefetch>
            Começar grátis
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>

        {/* Secundário: Login — outlined, claramente um botão (não um link) */}
        <Button asChild variant="outline" size="touch" className="w-full">
          <Link href="/auth/login" prefetch>
            Já tenho conta
          </Link>
        </Button>

        {/* Assinatura discreta — centralizada */}
        <p className="mt-1 text-center font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground/50">
          Nascido no <span className="text-foreground/70">Jotta Lean Cabelos</span>
        </p>
      </footer>
    </main>
  );
}
