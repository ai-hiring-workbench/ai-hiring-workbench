/**
 * The 4 Discrete Evidence States (Student Port & Candidate Evidence Model)
 * Replaces uncalibrated percentage match scores and admission probabilities.
 */
export const EvidenceState = {
  SUPPORTED: "SUPPORTED",                         // Verified with direct verbatim line citations
  PARTIAL: "PARTIAL",                             // Task executed, but lacking evaluation metrics or unclear individual contribution
  MATERIAL_INSUFFICIENT: "MATERIAL_INSUFFICIENT", // Vaguely referenced without concrete deliverables
  NO_EVIDENCE: "NO_EVIDENCE"                      // Unmentioned in materials (Null Competency: zero penalty)
} as const;

export type EvidenceStateType = typeof EvidenceState[keyof typeof EvidenceState];

/**
 * Validates whether a given string is a legitimate EvidenceState.
 */
export function isValidEvidenceState(state: string): state is EvidenceStateType {
  return Object.values(EvidenceState).includes(state as EvidenceStateType);
}
