'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowRight, Loader2, Pencil, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { REFERENCE_PALETTE } from '@/lib/colorimetria/reference-palette';
import type { CategoriaPaleta, PaletteEntry, Subtom } from '@/lib/colorimetria/types';
import { cn } from '@/lib/utils';

/**
 * Entrada MANUAL do tom — alternativa à câmera.
 *
 * Por que existe:
 *   - Profissional que não quer (ou não pode) usar a câmera.
 *   - Rede de segurança quando a câmera é negada/indisponível.
 *   - Quando o profissional JÁ conhece a base do cliente e quer ir direto
 *     pro diagnóstico/plano sem fotografar.
 *
 * Fluxo:
 *   1. Escolhe o tom base na paleta (agrupada por categoria).
 *   2. Ajusta o subtom (default = subtom do tom) e o % de brancos.
 *   3. POST /api/analyze com `{ manual: {...} }` — o servidor monta o
 *      diagnóstico a partir da paleta (confiança total, sem medição) e gera
 *      o relatório igual ao fluxo da câmera.
 *   4. Salva em sessionStorage e navega pra /result.
 */

const CATEGORIAS: Array<{ key: CategoriaPaleta; label: string }> = [
  { key: 'natural', label: 'Naturais' },
  { key: 'loiro', label: 'Loiros com reflexo' },
  { key: 'ruivo', label: 'Ruivos' },
  { key: 'mogno', label: 'Mogno' },
  { key: 'vermelho', label: 'Vermelhos' },
  { key: 'matte', label: 'Matte' },
  { key: 'perola', label: 'Pérola' },
  { key: 'fantasia', label: 'Fantasia' },
];

const SUBTONS: Array<{ key: Subtom; label: string }> = [
  { key: 'frio', label: 'Frio' },
  { key: 'neutro', label: 'Neutro' },
  { key: 'quente', label: 'Quente' },
];

export function ManualEntry() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [subtom, setSubtom] = useState<Subtom>('neutro');
  const [brancos, setBrancos] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<CategoriaPaleta, PaletteEntry[]>();
    for (const entry of REFERENCE_PALETTE) {
      const list = map.get(entry.categoria) ?? [];
      list.push(entry);
      map.set(entry.categoria, list);
    }
    return map;
  }, []);

  // Ao escolher um tom, alinha o subtom ao subtom natural daquele tom
  // (o profissional ainda pode sobrescrever depois).
  function selectTone(entry: PaletteEntry) {
    setSelectedId(entry.id);
    setSubtom(entry.subtom);
  }

  async function handleSubmit() {
    if (!selectedId) {
      toast.error('Escolha o tom base do cabelo.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manual: { paletteEntryId: selectedId, subtom, brancosPct: brancos },
          conciso: false,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(err.error ?? 'Erro ao gerar diagnóstico');
      }

      const result = await res.json();
      sessionStorage.setItem('last-analysis', JSON.stringify(result));
      setOpen(false);
      router.push('/result');
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao gerar diagnóstico. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="touch" variant="ghost" className="w-full max-w-sm text-muted-foreground">
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Inserir tom manualmente
        </Button>
      </DialogTrigger>

      <DialogContent className="flex h-[88dvh] max-h-[88dvh] max-w-md flex-col gap-0 p-0">
        <DialogHeader className="border-b border-border/60 px-5 pt-5 pb-3">
          <DialogTitle className="text-base">Inserir tom manualmente</DialogTitle>
          <DialogDescription className="text-xs">
            Escolha a base atual do cabelo. Útil quando você não quer usar a câmera.
          </DialogDescription>
        </DialogHeader>

        {/* Paleta rolante */}
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
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => selectTone(e)}
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

        {/* Ajustes finos + CTA fixos no rodapé */}
        <div className="space-y-4 border-t border-border/60 px-5 py-4">
          {/* Subtom */}
          <div>
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Subtom
            </p>
            <div className="grid grid-cols-3 gap-2">
              {SUBTONS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSubtom(key)}
                  className={cn(
                    'rounded-lg border py-2 text-xs font-medium transition active:scale-[0.97]',
                    subtom === key
                      ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
                      : 'border-border/60 glass-subtle text-muted-foreground hover:border-foreground/30',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* % brancos */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Cabelos brancos
              </p>
              <span className="font-mono text-xs font-medium text-primary">{brancos}%</span>
            </div>
            <Slider
              value={[brancos]}
              onValueChange={([v]) => setBrancos(v ?? 0)}
              min={0}
              max={100}
              step={5}
              aria-label="Percentual de cabelos brancos"
            />
          </div>

          <Button
            size="touch"
            className="w-full"
            disabled={!selectedId || submitting}
            onClick={handleSubmit}
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" />
                Gerando…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Gerar diagnóstico
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
