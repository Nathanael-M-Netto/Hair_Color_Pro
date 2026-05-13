import { AuroraStatic } from '@/components/bits/AuroraStatic';

/**
 * Loading boundary global para rotas (app)/* — renderizado INSTANTANEAMENTE
 * pelo Next.js enquanto o Server Component da rota real está sendo gerado.
 *
 * Isso transforma a UX "tela branca por 300ms" em "tela do app com skeleton",
 * que percebe como navegação instantânea mesmo quando o servidor leva tempo.
 *
 * Mantemos a Aurora pra continuidade visual — quando o conteúdo chega, só
 * substitui os skeletons sem flash.
 */
export default function AppLoading() {
  return (
    <main className="relative min-h-dvh">
      <AuroraStatic intensidade={0.25} />

      <div className="pt-safe-or-6 relative z-10 mx-auto max-w-lg px-5 pb-28">
        {/* Header placeholder */}
        <div className="mb-5 pt-2 space-y-1.5">
          <div className="h-4 w-32 rounded bg-foreground/[0.08] animate-pulse" />
          <div className="h-3 w-44 rounded bg-foreground/[0.06] animate-pulse" />
        </div>

        {/* Conteúdo placeholder — 3 cards skeleton */}
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="glass h-20 rounded-xl animate-pulse"
              style={{ animationDelay: `${i * 75}ms` }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
