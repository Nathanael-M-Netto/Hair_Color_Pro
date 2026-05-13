# Documentação do TG — Hair Color Pro v2

Documentação acadêmica para defesa do Trabalho de Graduação.

Estrutura espelha um trabalho de conclusão clássico de Ciência da Computação / Engenharia de Software, mas em formato Markdown editável (depois converte pra PDF/Latex via Pandoc).

## Estrutura

| Arquivo | Capítulo | Conteúdo |
|---|---|---|
| `00-RESUMO.md` | Resumo / Abstract | Síntese executiva (~200 palavras) |
| `01-INTRODUCAO.md` | 1 — Introdução | Contexto, motivação, objetivos, justificativa |
| `02-FUNDAMENTACAO.md` | 2 — Fundamentação Teórica | Espaços de cor, ΔE2000, PWAs, IA generativa |
| `03-METODOLOGIA.md` | 3 — Metodologia | Stack, arquitetura, decisões técnicas |
| `04-IMPLEMENTACAO.md` | 4 — Implementação | Pipeline de análise, integração IA, código |
| `05-RESULTADOS.md` | 5 — Resultados e Validação | Capturas, métricas, testes |
| `06-CONCLUSAO.md` | 6 — Conclusão | Síntese, limitações, trabalhos futuros |
| `07-REFERENCIAS.md` | 7 — Referências | Bibliografia ABNT |

## Como converter pra PDF

```bash
# Instalar pandoc
brew install pandoc

# Concatenar e converter
cd docs/tg/
pandoc 0*.md -o tg.pdf --pdf-engine=xelatex \
  -V geometry:margin=2.5cm \
  -V fontsize=11pt \
  -V documentclass=article \
  --toc --number-sections
```

## Como o app sustenta cada capítulo

| Capítulo | Onde no código |
|---|---|
| Espaço Lab + ΔE2000 | `src/lib/colorimetria/color-math.ts` |
| Paleta de referência | `src/lib/colorimetria/reference-palette.ts` |
| Pipeline de análise | `src/lib/colorimetria/image-analysis.ts` |
| Integração IA | `src/lib/ai/report.ts` |
| API de análise | `src/app/api/analyze/route.ts` |
| Auth + Firestore | `src/lib/firebase/*`, `src/lib/firestore/*` |
| PWA install | `public/manifest.webmanifest`, `public/sw.js`, `scripts/generate-*.mjs` |
| Decisões arquiteturais | `../../PROJECT.md` |

## Status de preenchimento

- [x] Estrutura criada com placeholders
- [x] 02-FUNDAMENTACAO.md — conteúdo técnico já redigido (extraído da implementação)
- [x] 04-IMPLEMENTACAO.md — capítulo principal com código real
- [ ] 01-INTRODUCAO.md — esboço; preencher contexto pessoal/orientador
- [ ] 03-METODOLOGIA.md — esboço; refinar com cronograma do TG
- [ ] 05-RESULTADOS.md — preencher após testes finais
- [ ] 06-CONCLUSAO.md — preencher na finalização
- [ ] 07-REFERENCIAS.md — completar bibliografia ABNT
