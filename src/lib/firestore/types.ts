/**
 * Tipos TypeScript para documentos Firestore.
 *
 * Estrutura de coleções:
 *   profiles/{uid}           — perfil do usuário (uid = Firebase UID)
 *   analyses/{analysisId}    — análise de colorimetria (auto-ID)
 *   formulas/{formulaId}     — fórmula gerada para uma análise (auto-ID)
 *
 * Nota: Firestore usa Timestamps nas leituras, mas aceita Date | Timestamp | FieldValue
 * nas escritas. Por isso, nos tipos de Insert usamos `Date` para simplicidade.
 */

// ── Perfil ───────────────────────────────────────────────────────────────────

export interface ProfileDoc {
  /** E-mail do Firebase Auth */
  email: string;
  nome: string | null;
  /** Nome do salão (opcional) */
  salao: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ProfileInsert = Omit<ProfileDoc, 'createdAt' | 'updatedAt'>;
export type ProfileUpdate = Partial<Pick<ProfileDoc, 'nome' | 'salao' | 'avatarUrl'>>;

// ── Análise ──────────────────────────────────────────────────────────────────

export interface AnalysisDoc {
  /** Firebase UID do dono da análise */
  userId: string;
  /**
   * ID da entrada na REFERENCE_PALETTE detectada pela IA.
   * Exemplo: "7.3", "4.0", "10.1"
   */
  paletteEntryId: string;
  alturaDeTom: number;    // 1–12
  reflexo: number;        // 0–9
  percentualBrancos: number; // 0–100
  confianca: number;      // 0–1
  /** Caminho no Firebase Storage */
  imagemPath: string | null;
  /** Correção humana aplicada pelo cabeleireiro após análise da IA */
  correction: Record<string, unknown> | null;
  /** Subtom detectado — armazenado pra reconstruir o /result a partir do histórico. */
  subtom: 'frio' | 'neutro' | 'quente' | null;
  /** Coordenadas Lab médias dos pixels analisados (snapshot pra histórico). */
  labMedio: { L: number; a: number; b: number } | null;
  /** ΔE ao tom mais próximo da paleta — métrica técnica pra detalhes. */
  deltaAoTomMaisProximo: number | null;
  /** Relatório textual gerado pela IA (ou template fallback) na hora da análise. */
  reportTexto: string | null;
  /** Nome do modelo que gerou o relatório (ex: "gemini-2.5-flash-lite", "fallback-template-v1"). */
  reportModelo: string | null;
  createdAt: Date;
}

export type AnalysisInsert = Omit<AnalysisDoc, 'createdAt'>;

// ── Fórmula ──────────────────────────────────────────────────────────────────

export interface FormulaDoc {
  /** ID do documento na coleção `analyses` */
  analysisId: string;
  /** Firebase UID */
  userId: string;
  /** JSON serializado do tipo Formula do domínio (src/lib/colorimetria/types.ts) */
  formulaJson: Record<string, unknown>;
  createdAt: Date;
}

export type FormulaInsert = Omit<FormulaDoc, 'createdAt'>;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Análise com o ID do documento incluído (para listas) */
export interface AnalysisWithId extends AnalysisDoc {
  id: string;
}

/** Fórmula com o ID do documento incluído */
export interface FormulaWithId extends FormulaDoc {
  id: string;
}
