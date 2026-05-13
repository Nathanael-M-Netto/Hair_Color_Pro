'use client';

import { HelpCircle, Sparkles, Camera, Palette, Brain, Heart } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

/**
 * Botão "?" + Dialog "Sobre o Hair Color Pro".
 *
 * Pra ficar no canto superior direito de telas internas (perfil principalmente).
 * Conteúdo: pitch do projeto, explicação do funcionamento, créditos.
 *
 * Componente totalmente client (Dialog do Radix exige). Renderiza só um botão
 * de 36×36 px — peso desprezível, pode ser usado livremente.
 */
export function AboutDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Sobre o Hair Color Pro"
          className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition active:scale-90 hover:bg-foreground/5 hover:text-foreground"
        >
          <HelpCircle className="h-5 w-5" aria-hidden="true" />
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[85dvh] max-w-md overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/30"
            >
              <Sparkles className="h-4 w-4 text-primary" />
            </span>
            <DialogTitle className="font-serif text-xl italic">
              Hair Color Pro
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Assistente de colorimetria capilar com IA
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2 text-sm leading-relaxed">
          {/* O que é */}
          <section>
            <h3 className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <Heart className="h-3 w-3 text-primary" />O projeto
            </h3>
            <p className="text-foreground/90">
              O Hair Color Pro nasceu no salão{' '}
              <span className="text-foreground italic">Jotta Lean Cabelos</span> —
              da necessidade real de profissionais terem uma ferramenta digital
              tão precisa quanto o olho clínico de quem trabalha com coloração há
              anos. Cada regra implementada aqui resolve um problema que aparece
              na cadeira do cliente.
            </p>
          </section>

          {/* Como funciona — 3 etapas */}
          <section>
            <h3 className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <Brain className="h-3 w-3 text-primary" />
              Como funciona
            </h3>
            <ol className="space-y-3">
              <Step
                Icon={Camera}
                title="1. Captura"
                desc="Você aponta a câmera pro cabelo, em luz natural difusa. O app congela o frame no momento que você toca em analisar."
              />
              <Step
                Icon={Palette}
                title="2. Diagnóstico"
                desc="Um algoritmo determinístico converte os pixels para o espaço Lab (CIE) e compara com uma paleta de ~120 tons profissionais via métrica ΔE2000 — mesma técnica usada em colorímetros industriais."
              />
              <Step
                Icon={Sparkles}
                title="3. Parecer"
                desc="Os números do diagnóstico (altura de tom, subtom, brancos, confiança) viram contexto pra IA gerar um parecer profissional em português — como uma cabeleireira sênior explicaria."
              />
            </ol>
          </section>

          {/* Caminho da coloração */}
          <section>
            <h3 className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Plano de coloração
            </h3>
            <p className="text-foreground/90">
              Depois da análise, você escolhe o tom desejado da paleta e o app
              calcula o caminho: clarear ou escurecer, volumagem do oxidante
              recomendada, tempo de pausa, avisos de pré-pigmentação. Tudo com
              base em regras de salão, não em chutes da IA.
            </p>
          </section>

          {/* Princípio técnico */}
          <section>
            <h3 className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Princípio
            </h3>
            <p className="text-foreground/90">
              A IA <span className="italic">não</span> faz o reconhecimento de
              cor — quem faz é o algoritmo determinístico. A IA cuida do que ela
              faz melhor: traduzir números técnicos em linguagem profissional.
              Resultado: mesma foto sempre dá mesmo diagnóstico, com explicação
              que muda só na redação. Auditável, rápido, barato.
            </p>
          </section>

          {/* Versão / créditos */}
          <section className="border-t border-border/40 pt-3 text-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
              v2 · Trabalho de Graduação
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Nascido no{' '}
              <span className="text-foreground/80 italic">Jotta Lean Cabelos</span>
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Step({
  Icon,
  title,
  desc,
}: {
  Icon: typeof Camera;
  title: string;
  desc: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/30"
      >
        <Icon className="h-3.5 w-3.5 text-primary" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
      </div>
    </li>
  );
}
