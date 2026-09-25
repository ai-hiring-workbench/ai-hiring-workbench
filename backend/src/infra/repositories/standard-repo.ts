import { DatabaseProvider } from "../db-provider.js";
import {
  EnterpriseTaskContext,
  SourceDocument,
  SourceClaim,
  RoleRequirement,
  RoleStandardVersion
} from "../../domain/types.js";

export class StandardRepository {
  private db = DatabaseProvider.getInstance().sqlite;

  // Task Context
  saveTaskContext(context: EnterpriseTaskContext): void {
    const id = context.id || `TASK_${Date.now()}`;
    this.db.execute(
      `INSERT OR REPLACE INTO enterprise_task_contexts 
       (id, department, target_role, business_problem, target_users, deliverables, constraints, open_questions, confirmed_by, confirmed_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        context.department,
        context.targetRole,
        context.businessProblem,
        JSON.stringify(context.targetUsers),
        JSON.stringify(context.deliverables),
        JSON.stringify(context.constraints),
        JSON.stringify(context.openQuestions || []),
        context.confirmedBy || null,
        context.confirmedAt || null,
        new Date().toISOString()
      ]
    );
  }

  getTaskContext(id: string): EnterpriseTaskContext | null {
    const row = this.db.queryOne(`SELECT * FROM enterprise_task_contexts WHERE id = ?`, [id]);
    if (!row) return null;
    return {
      id: row.id,
      department: row.department,
      targetRole: row.target_role,
      businessProblem: row.business_problem,
      targetUsers: JSON.parse(row.target_users),
      deliverables: JSON.parse(row.deliverables),
      constraints: JSON.parse(row.constraints),
      openQuestions: row.open_questions ? JSON.parse(row.open_questions) : [],
      confirmedBy: row.confirmed_by,
      confirmedAt: row.confirmed_at
    };
  }

  // Source Documents
  saveSourceDocument(doc: SourceDocument): void {
    this.db.execute(
      `INSERT OR REPLACE INTO source_documents (id, type, title, publisher, date, input_hash, raw_text, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [doc.id, doc.type, doc.title, doc.publisher, doc.date, doc.inputHash, doc.textLines.join("\n"), new Date().toISOString()]
    );
  }

  getSourceDocument(id: string): SourceDocument | null {
    const row = this.db.queryOne(`SELECT * FROM source_documents WHERE id = ?`, [id]);
    if (!row) return null;
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      publisher: row.publisher,
      date: row.date,
      inputHash: row.input_hash,
      textLines: row.raw_text.split("\n")
    };
  }

  // Source Claims
  saveSourceClaims(claims: SourceClaim[]): void {
    for (const c of claims) {
      this.db.execute(
        `INSERT OR REPLACE INTO source_claims (id, source_id, claim_type, statement, source_excerpt_ids, quote_snapshot, has_contradiction, contradiction_note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          c.id,
          c.sourceId,
          c.claimType,
          c.statement,
          JSON.stringify(c.sourceExcerptIds),
          c.quoteSnapshot,
          c.hasContradiction ? 1 : 0,
          c.contradictionNote || null
        ]
      );
    }
  }

  getSourceClaims(sourceId?: string): SourceClaim[] {
    const rows = sourceId
      ? this.db.query(`SELECT * FROM source_claims WHERE source_id = ?`, [sourceId])
      : this.db.query(`SELECT * FROM source_claims`);

    return rows.map((r: any) => ({
      id: r.id,
      sourceId: r.source_id,
      claimType: r.claim_type,
      statement: r.statement,
      sourceExcerptIds: JSON.parse(r.source_excerpt_ids),
      quoteSnapshot: r.quote_snapshot,
      hasContradiction: r.has_contradiction === 1,
      contradictionNote: r.contradiction_note
    }));
  }

  // Standards & Requirements
  saveStandard(std: RoleStandardVersion): void {
    this.db.execute(
      `INSERT OR REPLACE INTO role_standards (id, version, status, role_name, department, hash, confirmed_by, frozen_at, superseded_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        std.id,
        std.version,
        std.status,
        std.roleName,
        std.department,
        std.hash,
        std.confirmedBy,
        std.frozenAt || null,
        std.supersededBy || null,
        new Date().toISOString()
      ]
    );

    for (const req of std.requirements) {
      this.db.execute(
        `INSERT OR REPLACE INTO role_requirements (id, standard_id, code, name, definition, evidence_required, status, confirmed_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.id, std.id, req.code, req.name, req.definition, req.evidenceRequired, req.status, req.confirmedBy || null]
      );
    }
  }

  getStandard(id: string): RoleStandardVersion | null {
    const row = this.db.queryOne(`SELECT * FROM role_standards WHERE id = ?`, [id]);
    if (!row) return null;

    const reqRows = this.db.query(`SELECT * FROM role_requirements WHERE standard_id = ?`, [id]);
    const requirements: RoleRequirement[] = reqRows.map((r: any) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      definition: r.definition,
      evidenceRequired: r.evidence_required,
      status: r.status,
      confirmedBy: r.confirmed_by
    }));

    return {
      id: row.id,
      version: row.version,
      status: row.status,
      roleName: row.role_name,
      department: row.department,
      hash: row.hash,
      confirmedBy: row.confirmed_by,
      frozenAt: row.frozen_at,
      supersededBy: row.superseded_by,
      requirements
    };
  }

  getLatestFrozenStandard(roleName?: string): RoleStandardVersion | null {
    const sql = roleName
      ? `SELECT id FROM role_standards WHERE status = 'FROZEN' AND role_name = ? ORDER BY frozen_at DESC LIMIT 1`
      : `SELECT id FROM role_standards WHERE status = 'FROZEN' ORDER BY frozen_at DESC LIMIT 1`;
    const row = this.db.queryOne(sql, roleName ? [roleName] : []);
    if (!row) return null;
    return this.getStandard(row.id);
  }
}
