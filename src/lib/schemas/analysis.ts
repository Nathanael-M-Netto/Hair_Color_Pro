/**
 * Schemas Zod para o módulo de IA.
 *
 * Todo dado que cruza um boundary (API ↔ client, IA ↔ código) passa por aqui.
 * Falhas de schema = falhas explícitas e tipadas, nunca dado corrompido
 * propagando silenciosamente.
 *
 * Referência: PLAN.md §4.3 (contrato da API de IA).
 */

import { z } from 'zod';
import { REFERENCE_PALETTE_BY_ID } from '@/lib/colorimetria/reference-palette';

// ============================================================================
// Validação customizada: paleta_id precisa existir na REFERENCE_PALETTE
// ============================================================================

const PaletaIdSchema = z
  .string()
  .regex(/^\d{1,2}(\.\d{1,2})?$/, 'Formato de paleta_id inválido')
  .refine((id) => REFERENCE_PALETTE_BY_ID.has(id), {
    message: 'paleta_id não existe na paleta de referência',
  });

// ============================================================================
// Resultado da análise de IA
// ============================================================================

export const AnalysisResultSchema = z.object({
  /** ID da entrada da paleta de referência (ex: "6.3"). */
  paleta_id: PaletaIdSchema,

  /** Altura de tom 1-12. */
  altura_tom: z.number().int().min(1).max(12),

  /** Reflexo primário 0-9. `null` para tom natural puro. */
  reflexo_primario: z.number().int().min(0).max(9).nullable(),

  /** Reflexo secundário 0-9 (cores duplas). */
  reflexo_secundario: z.number().int().min(0).max(9).nullable(),

  /** Subtom percebido. */
  subtom: z.enum(['frio', 'neutro', 'quente']),

  /** Porcentagem de cabelos brancos detectados (0-100, inteiro). */
  porcentagem_brancos: z.number().int().min(0).max(100),

  /** Confiança da previsão (0-1) — baseada em ΔE para a paleta. */
  confianca: z.number().min(0).max(1),

  /** ΔE CIEDE2000 do snap (para auditoria/telemetria). */
  delta_e: z.number().min(0),

  /** De onde veio a previsão final. */
  fonte: z.enum(['snap_local', 'modelo_remoto', 'consenso']),

  /** Top 3 candidatos da paleta — usados na revisão para "Era esse?". */
  candidatos: z
    .array(
      z.object({
        paleta_id: PaletaIdSchema,
        delta_e: z.number().min(0),
      }),
    )
    .max(3),

  /** Avisos sobre qualidade da imagem (warm cast, escuridão, etc.). */
  warnings: z.array(z.string()).default([]),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

// ============================================================================
// Correção do usuário (human-in-the-loop)
// ============================================================================

export const AnalysisCorrectionSchema = z.object({
  altura_tom: z.number().int().min(1).max(12),
  reflexo_primario: z.number().int().min(0).max(9).nullable(),
  subtom: z.enum(['frio', 'neutro', 'quente']),
  porcentagem_brancos: z.number().int().min(0).max(100),
  /** True se o usuário aceitou a previsão sem mudança. */
  aceito_sem_alteracao: z.boolean(),
});

export type AnalysisCorrection = z.infer<typeof AnalysisCorrectionSchema>;
