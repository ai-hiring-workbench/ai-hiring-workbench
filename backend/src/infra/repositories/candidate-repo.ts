import { DatabaseProvider } from "../db-provider.js";
import { Candidate, CandidateMaterial, SearchExpressionSet } from "../../domain/types.js";

export class CandidateRepository {
  private db = DatabaseProvider.getInstance().sqlite;

  saveCandidate(cand: Candidate): void {
    this.db.execute(
      `INSERT OR REPLACE INTO candidates (id, anonymous_id, source_type, created_at)
       VALUES (?, ?, ?, ?)`,
      [cand.id, cand.anonymousId, cand.sourceType, cand.createdAt || new Date().toISOString()]
    );
  }

  getCandidate(id: string): Candidate | null {
    const row = this.db.queryOne(`SELECT * FROM candidates WHERE id = ?`, [id]);
    if (!row) return null;
    return {
      id: row.id,
      anonymousId: row.anonymous_id,
      sourceType: row.source_type,
      createdAt: row.created_at
    };
  }

  saveMaterial(mat: CandidateMaterial): void {
    this.db.execute(
      `INSERT OR REPLACE INTO candidate_materials (id, candidate_id, type, version, input_hash, storage_key, text_lines, parse_status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        mat.id,
        mat.candidateId,
        mat.type,
        mat.version,
        mat.inputHash,
        mat.storageKey || null,
        JSON.stringify(mat.textLines),
        mat.parseStatus,
        new Date().toISOString()
      ]
    );
  }

  getMaterial(candidateId: string): CandidateMaterial | null {
    const row = this.db.queryOne(`SELECT * FROM candidate_materials WHERE candidate_id = ? ORDER BY version DESC LIMIT 1`, [candidateId]);
    if (!row) return null;
    return {
      id: row.id,
      candidateId: row.candidate_id,
      type: row.type,
      version: row.version,
      inputHash: row.input_hash,
      storageKey: row.storage_key,
      textLines: JSON.parse(row.text_lines),
      parseStatus: row.parse_status
    };
  }

  saveSearchExpression(se: SearchExpressionSet): void {
    this.db.execute(
      `INSERT OR REPLACE INTO search_expression_sets 
       (id, standard_version_id, title_terms, task_terms, skill_terms, exclusion_terms, boolean_query, human_edited, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        se.id,
        se.standardVersionId,
        JSON.stringify(se.titleTerms),
        JSON.stringify(se.taskTerms),
        JSON.stringify(se.skillTerms),
        JSON.stringify(se.exclusionTerms),
        se.booleanQuery,
        se.humanEdited ? 1 : 0,
        new Date().toISOString()
      ]
    );
  }

  getSearchExpression(standardVersionId: string): SearchExpressionSet | null {
    const row = this.db.queryOne(`SELECT * FROM search_expression_sets WHERE standard_version_id = ? ORDER BY created_at DESC LIMIT 1`, [standardVersionId]);
    if (!row) return null;
    return {
      id: row.id,
      standardVersionId: row.standard_version_id,
      titleTerms: JSON.parse(row.title_terms),
      taskTerms: JSON.parse(row.task_terms),
      skillTerms: JSON.parse(row.skill_terms),
      exclusionTerms: JSON.parse(row.exclusion_terms),
      booleanQuery: row.boolean_query,
      humanEdited: row.human_edited === 1
    };
  }
}
