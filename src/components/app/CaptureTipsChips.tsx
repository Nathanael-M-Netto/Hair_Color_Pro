'use client';

import { Sun, Ruler, Info, Scissors } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/**
 * Chips de instrução de captura com popovers explicativos.
 *
 * UX: a chip parece passiva (informativa) mas é tocável. Ao tocar, abre um
 * popover detalhado explicando o porquê daquela orientação. Isso resolve o
 * dilema entre "instruções claras mas verbosas" vs "interface limpa".
 *
 * Acessibilidade:
 *   - Os triggers são <button>, então recebem foco via teclado
 *   - Cada popover tem role="dialog" via Radix Primitives
 *   - Mín 32px de altura (tap target adequado pra ação não-crítica)
 */
export function CaptureTipsChips() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {/* Só cabelo — chip mais importante, primeiro */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Aponte só pro cabelo. Toque para entender"
            className="glass-subtle inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11px] text-foreground transition active:scale-95 hover:bg-primary/15"
          >
            <Scissors className="h-3 w-3 text-primary" aria-hidden="true" />
            Só cabelo
            <Info className="h-2.5 w-2.5 text-muted-foreground/60" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" sideOffset={8} className="w-72">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/30"
            >
              <Scissors className="h-4 w-4 text-primary" />
            </span>
            <div className="text-xs leading-relaxed">
              <p className="font-medium text-foreground">Aponte só pro cabelo</p>
              <p className="mt-1.5 text-muted-foreground">
                O círculo precisa conter <span className="text-foreground/80">apenas cabelo</span>{' '}
                — sem pele, roupa, parede ou outros objetos no enquadramento.
              </p>
              <p className="mt-1.5 text-muted-foreground">
                Pixels que não são cabelo viram ruído na análise e podem fazer o algoritmo
                detectar um tom errado.
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Luz natural */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Por que luz natural? Toque para entender"
            className="glass-subtle inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] text-muted-foreground transition active:scale-95 hover:bg-white/[0.06] hover:text-foreground"
          >
            <Sun className="h-3 w-3" aria-hidden="true" />
            Luz natural
            <Info className="h-2.5 w-2.5 text-muted-foreground/50" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" sideOffset={8} className="w-72">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/30"
            >
              <Sun className="h-4 w-4 text-primary" />
            </span>
            <div className="text-xs leading-relaxed">
              <p className="font-medium text-foreground">Por que luz natural?</p>
              <p className="mt-1.5 text-muted-foreground">
                <span className="text-foreground/80">Luz branca difusa</span> (perto
                de uma janela ou ambiente bem iluminado) reproduz a cor real do
                cabelo. Evite:
              </p>
              <ul className="mt-1.5 space-y-1 text-muted-foreground">
                <li className="flex gap-1.5">
                  <span className="text-destructive">×</span>
                  Sol direto — superexpõe e queima a cor
                </li>
                <li className="flex gap-1.5">
                  <span className="text-destructive">×</span>
                  Luz amarelada (incandescente) — falsa quentura
                </li>
                <li className="flex gap-1.5">
                  <span className="text-destructive">×</span>
                  Flash do celular — reflexo concentrado
                </li>
              </ul>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* 30 cm */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Por que 30 cm de distância? Toque para entender"
            className="glass-subtle inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] text-muted-foreground transition active:scale-95 hover:bg-white/[0.06] hover:text-foreground"
          >
            <Ruler className="h-3 w-3" aria-hidden="true" />
            30 cm
            <Info className="h-2.5 w-2.5 text-muted-foreground/50" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" sideOffset={8} className="w-72">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/30"
            >
              <Ruler className="h-4 w-4 text-primary" />
            </span>
            <div className="text-xs leading-relaxed">
              <p className="font-medium text-foreground">Por que 30 cm?</p>
              <p className="mt-1.5 text-muted-foreground">
                Distância suficiente pra capturar uma{' '}
                <span className="text-foreground/80">área grande de cabelo</span> e
                analisar o tom predominante — não fios individuais.
              </p>
              <p className="mt-1.5 text-muted-foreground">
                Mais perto que isso, a câmera só vê detalhe; mais longe, perde
                resolução pra detectar reflexos finos.
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
