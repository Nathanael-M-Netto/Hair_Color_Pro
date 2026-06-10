'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowRight, Loader2, Sparkles, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { REFERENCE_PALETTE } from '@/lib/colorimetria/reference-palette';
import type { PaletteEntry, CategoriaPaleta } from '@/lib/colorimetria/types';
import { cn } from '@/lib/utils';

/**
 * Seletor de TOM DESEJADO — modal/sheet com a paleta agrupada por categoria.
 *
 * Como funciona:
 *   1. Usuário tá em /result vendo o tom ATUAL detectado.
 *   2. Clica em "Definir tom desejado" → abre este modal.
 *   3. Modal mostra paleta (66 tons) agrupada por categoria (Naturais, Loiros,
 *      Ruivos, Mogno, Vermelhos, Matte, Pérola, Fundamentais).
 *   4. Usuário seleciona um tom → bota "Gerar plano".
 *   5. POST /api/plan com basePaletteId (atual) + targetPaletteId (escolhido).
 *   6. Salva resultado em sessionStorage + navega pra /plan.
 */

const CATEGORIAS: Array<{ key: CategoriaPaleta; label: string }> = [
  { key: 'natural', label: 'Naturais' },
  { key: 'loiro', label: 'Loiros com reflexo' },
  { key: 'ruivo', label: 'Ruivos' },
  { key: 'mogno', label: 'Mogno' },
  { key: 'vermelho', label: 'Vermelhos' },
  { key: 'matte', label: 'Matte' },
  { key: 'perola', label: 'Pérola' },
  // Cores fantasia (azul, rosa, roxo, verde, lavanda, etc.) — não seguem
  // nomenclatura tradicional; exigem clareamento prévio do cabelo.
  { key: 'fantasia', label: 'Fantasia' },
];

interface TargetTonePickerProps {
  basePaletteId: string;
  subtomAtual: 'frio' | 'neutro' | 'quente';
  brancosPct: number;
  confianca: number;
}

export function TargetTonePicker(props: TargetTonePickerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Agrupa a paleta por categoria — feito uma vez (memo)
  const grouped = useMemo(() => {
    const map = new Map<CategoriaPaleta, PaletteEntry[]>();
    for (const entry of REFERENCE_PALETTE) {
      const list = map.get(entry.categoria) ?? [];
      list.push(entry);
      map.set(entry.categoria, list);
    }
    return map;
  }, []);

  async function handleSubmit() {
    if (!selectedId) {
      toast.error('Escolha um tom desejado.');
      return;
    }
    if (selectedId === props.basePaletteId) {
      toast.info('Você escolheu o mesmo tom atual — vou gerar um plano de refresco.');
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basePaletteId: props.basePaletteId,
          targetPaletteId: selectedId,
          subtomAtual: props.subtomAtual,
          brancosPct: props.brancosPct,
          confianca: props.confianca,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(err.error ?? 'Erro ao gerar plano');
      }

      const result = await res.json();
      sessionStorage.setItem('last-plan', JSON.stringify(result));
      setOpen(false);
      router.push('/plan');
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao gerar plano. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="touch" className="w-full">
          <Target className="h-4 w-4" aria-hidden="true" />
          Definir tom desejado
        </Button>
      </DialogTrigger>

      <DialogContent className="flex h-[85dvh] max-h-[85dvh] max-w-md flex-col gap-0 p-0">
        <DialogHeader className="border-b border-border/60 px-5 pt-5 pb-3">
          <DialogTitle className="text-base">Escolha o tom desejado</DialogTitle>
          <DialogDescription className="text-xs">
            Toque em um tom da paleta. O algoritmo vai calcular o caminho do tom atual até ele.
          </DialogDescription>
        </DialogHeader>

        {/* Lista de categorias rolante */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {CATEGORIAS.map(({ key, label }) => {
            const entries = grouped.get(key);
            if (!entries || entries.length === 0) return null;
            return (
              <section key={key} className="mb-5">
                <h3 className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {label}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {entries.map((e) => {
                    const isSelected = selectedId === e.id;
                    const isCurrent = e.id === props.basePaletteId;
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setSelectedId(e.id)}
                        className={cn(
                          'group flex items-center gap-2 rounded-lg border p-2 text-left transition active:scale-[0.97]',
                          isSelected
                            ? 'border-primary bg-primary/10 ring-1 ring-primary'
                            : 'border-border/60 glass-subtle hover:border-foreground/30',
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className="h-8 w-8 shrink-0 rounded-md border border-border/40"
                          style={{ backgroundColor: e.hex }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-medium">{e.nome}</span>
                          <span className="block font-mono text-[10px] text-muted-foreground">
                            {e.id}
                            {isCurrent && ' · atual'}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* Footer fixo com CTA */}
        <div className="border-t border-border/60 px-5 py-4">
          <Button
            size="touch"
            className="w-full"
            disabled={!selectedId || submitting}
            onClick={handleSubmit}
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" />
                Calculando…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Gerar plano
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
