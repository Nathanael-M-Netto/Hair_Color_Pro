/**
 * Geração de relatório textual da análise via Google Gemini.
 *
 * Arquitetura:
 *   1. A colorimetria é determinística (`image-analysis.ts`) — produz números
 *      reprodutíveis (altura, subtom, %brancos, ΔE, confiança).
 *   2. A IA NÃO faz reconhecimento de cor — isso é resolvido pela
 *      matemática. A IA usa os números como CONTEXTO e gera:
 *        - Uma explicação em PT-BR do diagnóstico
 *        - Um parecer profissional sobre como tratar
 *        - Avisos contextuais se a confiança for baixa
 *
 * Por que Gemini (e não Anthropic/OpenAI)?
 *   - **Free tier generoso**: ~1500 req/dia gratuitas (suficiente pra TG
 *     e validação inicial)
 *   - **Qualidade adequada em PT-BR**: testado em texto curto técnico
 *   - **Sem necessidade de SDK pesada**: usamos fetch REST direto
 *
 * Modelo: configurável via env `GEMINI_MODEL`. Default `gemini-2.5-flash-lite`.
 *
 * Por que esse split é importante (pro TG):
 *   - Determinismo: mesma foto → mesmo número → variação só no texto
 *   - Custo: zero pelo free tier
 *   - Auditabilidade: dá pra explicar exatamente como o tom foi escolhido
 *   - Resilência: sem internet, a análise ainda funciona; só falta o relatório
 */

import type { ColorAnalysisResult } from '@/lib/colorimetria/image-analysis';
import type { ColoringPlan } from '@/lib/colorimetria/coloring-plan';

// ============================================================================
// Tipos
// ============================================================================

export interface ReportOptions {
  /** Diagnóstico determinístico (saída de `analyzeImageColor`). */
  analysis: ColorAnalysisResult;
  /** Nome do cabeleireiro pra personalizar o relatório. */
  nomeCabeleireiro?: string;
  /** Se true, retorna versão concisa (~120 palavras). Se false, versão completa (~250). */
  conciso?: boolean;
}

export interface ReportResult {
  /** Texto do relatório — formatado em parágrafos curtos. */
  texto: string;
  /** Modelo usado (pra rastreabilidade no banco). */
  modelo: string;
  /** Tokens consumidos (pra controle de uso do free tier). */
  tokensConsumidos: number;
}

// ============================================================================
// Configuração — endpoint REST do Gemini
// ============================================================================

const DEFAULT_MODEL = 'gemini-2.5-flash-lite';

function getApiKey(): string | null {
  return process.env.GEMINI_API_KEY ?? null;
}

function getModelName(): string {
  return process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
}

// ============================================================================
// Construção do prompt — fonte da verdade do que a IA recebe
// ============================================================================

/**
 * Monta o prompt de sistema (vai como `systemInstruction` no Gemini).
 *
 * Princípios:
 *   - Persona: cabeleireira sênior brasileira (~30 anos de cadeira)
 *   - Tom: técnico mas acessível — não usa jargão sem explicar
 *   - Sempre PT-BR
 *   - Estrutura fixa: diagnóstico → recomendação → cuidado
 *   - Nunca inventa números — só usa os que vêm no contexto
 */
function buildSystemPrompt(): string {
  return [
    'Você é uma cabeleireira profissional sênior, especialista em colorimetria capilar,',
    'com 30 anos de experiência em salões brasileiros de alto padrão.',
    '',
    'Seu papel é INTERPRETAR um diagnóstico determinístico de cor capilar gerado por',
    "algoritmo (ΔE2000 contra paleta L'Oréal/Wella/Schwarzkopf), e produzir um relatório",
    'profissional em português brasileiro pro cabeleireiro que tirou a foto.',
    '',
    'REGRAS RÍGIDAS:',
    '1. NUNCA invente números — use apenas os que recebeu no contexto.',
    '2. NUNCA contradiga o algoritmo — explique o resultado, não conteste.',
    '3. SEMPRE em PT-BR, tom direto, técnico mas acessível.',
    '4. Use vocabulário de salão (altura de tom, reflexo, subtom, base) com naturalidade.',
    '5. NÃO use markdown headers (# ##) — use parágrafos curtos separados por linha em branco.',
    '6. NÃO inclua disclaimers tipo "sou uma IA" — fale como cabeleireira.',
    '',
    'ESTRUTURA DO RELATÓRIO (3 parágrafos curtos):',
    '1. Diagnóstico: o que o algoritmo viu (tom, subtom, brancos, confiança).',
    '2. Interpretação: o que isso significa na prática pra coloração.',
    '3. Cuidado/aviso: se confiança baixa, sugerir refazer a foto; senão, dica relevante.',
  ].join('\n');
}

/**
 * Monta o prompt do usuário com os números da análise.
 * Dados saem do `ColorAnalysisResult` — single source of truth.
 */
function buildUserPrompt(opts: ReportOptions): string {
  const { analysis, nomeCabeleireiro, conciso } = opts;
  const conf = (analysis.confianca * 100).toFixed(0);

  const cabec = nomeCabeleireiro ? `Cabeleireiro(a): ${nomeCabeleireiro}.\n\n` : '';

  const tamanho = conciso ? '~120 palavras' : '~250 palavras';

  return [
    cabec + 'Análise determinística da foto capilar:',
    '',
    `• Tom detectado: ${analysis.paletteEntry.nome} (código ${analysis.paletteEntry.id})`,
    `• Altura de tom: ${analysis.altura} numa escala 1-12`,
    `• Subtom: ${analysis.subtom}`,
    `• Cabelos brancos: ${analysis.brancosPct}%`,
    `• Confiança do algoritmo: ${conf}% (ΔE2000 = ${analysis.deltaAoTomMaisProximo.toFixed(2)})`,
    `• Coordenadas Lab médias: L=${analysis.labMedio.L.toFixed(1)}, a=${analysis.labMedio.a.toFixed(1)}, b=${analysis.labMedio.b.toFixed(1)}`,
    `• Pixels válidos analisados: ${analysis.pixelsAnalisados}`,
    '',
    `Gere o relatório (${tamanho}, 3 parágrafos curtos) seguindo a estrutura definida.`,
  ].join('\n');
}

// ============================================================================
// Tipagem mínima da resposta da API Gemini
// ============================================================================

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  modelVersion?: string;
  error?: { code: number; message: string; status: string };
}

// ============================================================================
// API pública — gera o relatório
// ============================================================================

/**
 * Gera o relatório textual da análise via Google Gemini.
 *
 * Falha graciosamente: se a API falhar (sem key, rate limit, network), devolve
 * um relatório padrão gerado por template (sem IA). UX continua, sem crash.
 */
export async function gerarRelatorio(opts: ReportOptions): Promise<ReportResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return gerarRelatorioFallback(opts);
  }

  const model = getModelName();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  try {
    const res = await fetch(`${url}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: buildSystemPrompt() }] },
        contents: [
          {
            role: 'user',
            parts: [{ text: buildUserPrompt(opts) }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          // ~120 palavras ≈ 200 tokens; ~250 ≈ 400. Damos margem.
          maxOutputTokens: opts.conciso ? 400 : 800,
          topP: 0.95,
        },
      }),
      // Timeout via AbortSignal (Node 20+ tem timeout nativo via undici)
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => '');
      console.error(
        `[ai/report] Gemini retornou ${res.status} (${res.statusText}). Body: ${errorBody.slice(0, 500)}`,
      );
      return gerarRelatorioFallback(opts);
    }

    const data = (await res.json()) as GeminiResponse;

    if (data.error) {
      console.error('[ai/report] Gemini retornou erro:', data.error);
      return gerarRelatorioFallback(opts);
    }

    const texto = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
    if (!texto) {
      console.warn('[ai/report] Gemini retornou texto vazio, usando fallback.');
      return gerarRelatorioFallback(opts);
    }

    return {
      texto,
      modelo: data.modelVersion ?? model,
      tokensConsumidos: data.usageMetadata?.totalTokenCount ?? 0,
    };
  } catch (err) {
    console.error('[ai/report] erro Gemini, usando fallback:', err);
    return gerarRelatorioFallback(opts);
  }
}

// ============================================================================
// Relatório do PLANO (tom atual → tom desejado)
// ============================================================================

export interface PlanReportOptions {
  /** Plano determinístico calculado por `calcularPlano`. */
  plan: ColoringPlan;
  /** Diagnóstico original (pra contexto de subtom + brancos). */
  analysis: ColorAnalysisResult;
  /** Nome do cabeleireiro pra personalizar. */
  nomeCabeleireiro?: string;
}

function buildPlanSystemPrompt(): string {
  return [
    'Você é uma cabeleireira sênior brasileira (30 anos de cadeira), especialista',
    'em colorimetria. Recebeu um PLANO DE COLORAÇÃO determinístico calculado por',
    "algoritmo (delta de altura, ΔE2000, regras de salão L'Oréal/Wella).",
    '',
    'Seu papel é PRODUZIR O RELATÓRIO DO PLANO em português brasileiro, em formato',
    'profissional acessível.',
    '',
    'REGRAS RÍGIDAS:',
    '1. NUNCA invente números — use apenas os que recebeu no contexto.',
    '2. NUNCA contradiga o algoritmo — explique, não conteste.',
    '3. SEMPRE em PT-BR, tom direto, técnico mas acessível.',
    '4. Use vocabulário de salão (altura, reflexo, subtom, volumagem, OX, pré-pigmentação).',
    '5. NÃO use markdown headers — apenas parágrafos curtos separados por linha em branco.',
    '6. NÃO se identifique como IA.',
    '',
    'ESTRUTURA DO RELATÓRIO (3 parágrafos curtos, ~250 palavras total):',
    '',
    '1. CAMINHO: o que está sendo feito (clarear/escurecer/refresco), de qual tom pra qual,',
    '   delta de altura, mudança de reflexo se houver.',
    '',
    '2. EXECUÇÃO: produto recomendado (volumagem do OX, tempo de pausa, proporção',
    '   com natural se brancos altos). Pode mencionar marca genericamente (ex: "uma',
    '   tintura comercial 7.3 com OX 30 vol") — não cite marcas específicas.',
    '',
    '3. CUIDADOS: avisos relevantes do plano (riscos químicos, pré-pigmentação,',
    '   subtom). Se houver aviso de severidade "critico", colocar em destaque.',
  ].join('\n');
}

function buildPlanUserPrompt(opts: PlanReportOptions): string {
  const { plan, analysis, nomeCabeleireiro } = opts;
  const cabec = nomeCabeleireiro ? `Cabeleireiro(a): ${nomeCabeleireiro}.\n\n` : '';

  const avisosFmt = plan.avisos
    .map((a) => `  [${a.severidade.toUpperCase()}] ${a.mensagem}`)
    .join('\n');

  const direcao =
    plan.deltaAltura > 0
      ? `CLAREAR ${plan.deltaAltura} nível(is)`
      : plan.deltaAltura < 0
        ? `ESCURECER ${Math.abs(plan.deltaAltura)} nível(is)`
        : 'MANTER altura';

  return [
    cabec + 'PLANO DE COLORAÇÃO determinístico:',
    '',
    `• Tom atual: ${plan.base.nome} (${plan.base.id}, altura ${plan.base.altura}, subtom ${plan.base.subtom})`,
    `• Tom desejado: ${plan.target.nome} (${plan.target.id}, altura ${plan.target.altura}, subtom ${plan.target.subtom})`,
    `• Direção: ${direcao}`,
    `• Mudou reflexo: ${plan.mudouReflexo ? 'sim' : 'não'}`,
    `• Mudou subtom: ${plan.mudouSubtom ? `sim (${plan.base.subtom} → ${plan.target.subtom})` : 'não'}`,
    `• Ação canônica: ${plan.acao}`,
    `• Volumagem recomendada: ${plan.volumagemRecomendada} vol`,
    `• Tempo de pausa: ${plan.tempoPausaMin} min`,
    `• Brancos no cabelo: ${analysis.brancosPct}%`,
    `• Confiança da análise base: ${(analysis.confianca * 100).toFixed(0)}%`,
    '',
    'AVISOS DO PLANO (NUNCA OMITIR avisos "critico"):',
    avisosFmt,
    '',
    'Gere o relatório seguindo a estrutura definida.',
  ].join('\n');
}

/**
 * Gera o relatório textual do PLANO de coloração via Gemini.
 * Fallback offline com template determinístico se a API falhar.
 */
export async function gerarRelatorioPlano(opts: PlanReportOptions): Promise<ReportResult> {
  const apiKey = getApiKey();
  if (!apiKey) return gerarRelatorioPlanoFallback(opts);

  const model = getModelName();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  try {
    const res = await fetch(`${url}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: buildPlanSystemPrompt() }] },
        contents: [{ role: 'user', parts: [{ text: buildPlanUserPrompt(opts) }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
          topP: 0.95,
        },
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      console.error(`[ai/report] Gemini plano retornou ${res.status}.`);
      return gerarRelatorioPlanoFallback(opts);
    }

    const data = (await res.json()) as GeminiResponse;
    if (data.error) {
      console.error('[ai/report] Gemini plano error:', data.error);
      return gerarRelatorioPlanoFallback(opts);
    }

    const texto = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
    if (!texto) return gerarRelatorioPlanoFallback(opts);

    return {
      texto,
      modelo: data.modelVersion ?? model,
      tokensConsumidos: data.usageMetadata?.totalTokenCount ?? 0,
    };
  } catch (err) {
    console.error('[ai/report] erro Gemini plano:', err);
    return gerarRelatorioPlanoFallback(opts);
  }
}

/** Relatório do plano por template — fallback determinístico sem IA. */
export function gerarRelatorioPlanoFallback(opts: PlanReportOptions): ReportResult {
  const { plan, analysis, nomeCabeleireiro } = opts;
  const olá = nomeCabeleireiro ? `${nomeCabeleireiro}, ` : '';

  const direcaoTexto =
    plan.deltaAltura > 0
      ? `clareamento de ${plan.deltaAltura} nível${plan.deltaAltura > 1 ? 'is' : ''}`
      : plan.deltaAltura < 0
        ? `escurecimento de ${Math.abs(plan.deltaAltura)} nível${Math.abs(plan.deltaAltura) > 1 ? 'is' : ''}`
        : plan.mudouReflexo
          ? `mudança de reflexo no mesmo nível`
          : 'refresco de cor na mesma altura';

  const reflexoTexto = plan.mudouReflexo
    ? ` Reflexo mudará de "${plan.base.reflexo_primario ?? 0}" pra "${plan.target.reflexo_primario ?? 0}".`
    : '';

  const brancosTexto =
    analysis.brancosPct >= 50
      ? `Atenção aos ${analysis.brancosPct}% de brancos — recomenda-se pré-pigmentação antes da aplicação principal.`
      : analysis.brancosPct >= 30
        ? `Com ${analysis.brancosPct}% de brancos, mix do tom desejado com natural ${plan.target.altura}.0 na proporção 1:1 melhora a uniformidade.`
        : `Brancos baixos (${analysis.brancosPct}%) — cobertura direta sem pré-tratamento.`;

  const avisosCriticos = plan.avisos.filter((a) => a.severidade === 'critico');
  const cuidadoTexto =
    avisosCriticos.length > 0
      ? `ATENÇÃO: ${avisosCriticos.map((a) => a.mensagem).join(' ')}`
      : `Tempo de pausa aproximado: ${plan.tempoPausaMin} minutos. Aplicar no cabelo seco e limpo, sem condicionador prévio.`;

  const texto = [
    `${olá}o plano é ${direcaoTexto}: do ${plan.base.nome} (${plan.base.id}) pro ${plan.target.nome} (${plan.target.id}).${reflexoTexto}`,
    '',
    `Recomendação técnica: tintura comercial ${plan.target.id} com oxidante ${plan.volumagemRecomendada} volumes (${plan.volumagemRecomendada === 10 ? '3' : plan.volumagemRecomendada === 20 ? '6' : plan.volumagemRecomendada === 30 ? '9' : '12'}% H₂O₂). ${brancosTexto}`,
    '',
    cuidadoTexto,
  ].join('\n');

  return {
    texto,
    modelo: 'fallback-template-v1',
    tokensConsumidos: 0,
  };
}

// ============================================================================
// Fallback offline — template puro, sem IA (relatório DA ANÁLISE)
// ============================================================================

/**
 * Relatório por template — usado quando:
 *   - GEMINI_API_KEY não configurada (dev/preview)
 *   - API do Gemini indisponível (rate limit, outage, modelo inexistente)
 *   - Network sem conexão
 *
 * Não fica bonito como IA, mas é determinístico e sempre funciona.
 */
export function gerarRelatorioFallback(opts: ReportOptions): ReportResult {
  const { analysis, nomeCabeleireiro } = opts;
  const conf = Math.round(analysis.confianca * 100);
  const olá = nomeCabeleireiro ? `${nomeCabeleireiro}, ` : '';

  const subtomTexto =
    analysis.subtom === 'frio'
      ? 'um subtom frio (acinzentado, pouca pigmentação avermelhada)'
      : analysis.subtom === 'quente'
        ? 'um subtom quente (presença de dourado/cobre)'
        : 'um subtom neutro (equilibrado entre frio e quente)';

  const brancosTexto =
    analysis.brancosPct === 0
      ? 'Não foi detectada presença significativa de fios brancos.'
      : analysis.brancosPct < 30
        ? `Presença discreta de brancos (${analysis.brancosPct}%) — fácil cobertura sem necessidade de pré-pigmentação.`
        : analysis.brancosPct < 70
          ? `Presença moderada de brancos (${analysis.brancosPct}%) — recomendado mix com tom natural pra cobertura uniforme.`
          : `Alta concentração de brancos (${analysis.brancosPct}%) — exigirá pré-pigmentação ou tonalizante específico.`;

  const aviso =
    conf < 50
      ? 'Atenção: a confiança da análise está baixa. Recomendo refazer a foto com luz natural mais difusa e o cabelo bem distribuído no enquadramento.'
      : conf < 75
        ? 'A confiança é razoável mas pode melhorar. Se possível, refaça a foto em melhor iluminação pra um diagnóstico mais preciso.'
        : 'A análise tem alta confiança — pode prosseguir com a formulação.';

  const texto = [
    `${olá}o cabelo analisado foi identificado como ${analysis.paletteEntry.nome} (altura ${analysis.altura}, código ${analysis.paletteEntry.id}), com ${subtomTexto}. A confiança do algoritmo é de ${conf}%.`,
    '',
    `${brancosTexto} Na prática, isso significa que partimos de uma base ${analysis.altura}.${analysis.paletteEntry.reflexo_primario ?? 0} pra calcular qualquer transformação — clarear, escurecer ou aplicar reflexo. O subtom ${analysis.subtom} influencia diretamente qual reflexo combina com a pele do cliente.`,
    '',
    aviso,
  ].join('\n');

  return {
    texto,
    modelo: 'fallback-template-v1',
    tokensConsumidos: 0,
  };
}
