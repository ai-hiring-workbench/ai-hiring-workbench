import { DatabaseProvider } from "../db-provider.js";
import { CandidateReviewCard, ReviewDecision, StudentEvidenceReport } from "../../domain/types.js";

export class ReviewRepository {
  private db = DatabaseProvider.getInstance().sqlite;

  saveReviewCard(card: CandidateReviewCard): void {
    this.db.execute(
      `INSERT OR REPLACE INTO candidate_review_cards 
       (candidate_id, anonymous_id, standard_version_id, triage_category, triage_reason, is_rescued, is_overestimated_risk, assessments, task_records, project_episodes, generated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        card.candidateId,
        card.anonymousId,
        card.standardVersionId,
        card.triageCategory,
        card.triageReason,
        card.isRescued ? 1 : 0,
        card.isOverestimatedRisk ? 1 : 0,
        JSON.stringify(card.assessments),
        JSON.stringify(card.taskRecords),
        JSON.stringify(card.projectEpisodes),
        card.generatedAt || new Date().toISOString()
      ]
    );
  }

  getReviewCard(candidateId: string): CandidateReviewCard | null {
    const row = this.db.queryOne(`SELECT * FROM candidate_review_cards WHERE candidate_id = ?`, [candidateId]);
    if (!row) return null;
    return {
      candidateId: row.candidate_id,
      anonymousId: row.anonymous_id,
      standardVersionId: row.standard_version_id,
      triageCategory: row.triage_category,
      triageReason: row.triage_reason,
      isRescued: row.is_rescued === 1,
      isOverestimatedRisk: row.is_overestimated_risk === 1,
      assessments: JSON.parse(row.assessments),
      taskRecords: JSON.parse(row.task_records),
      projectEpisodes: JSON.parse(row.project_episodes),
      generatedAt: row.generated_at
    };
  }

  listReviewCards(standardVersionId?: string): CandidateReviewCard[] {
    const rows = standardVersionId
      ? this.db.query(`SELECT * FROM candidate_review_cards WHERE standard_version_id = ?`, [standardVersionId])
      : this.db.query(`SELECT * FROM candidate_review_cards`);

    return rows.map((row: any) => ({
      candidateId: row.candidate_id,
      anonymousId: row.anonymous_id,
      standardVersionId: row.standard_version_id,
      triageCategory: row.triage_category,
      triageReason: row.triage_reason,
      isRescued: row.is_rescued === 1,
      isOverestimatedRisk: row.is_overestimated_risk === 1,
      assessments: JSON.parse(row.assessments),
      taskRecords: JSON.parse(row.task_records),
      projectEpisodes: JSON.parse(row.project_episodes),
      generatedAt: row.generated_at
    }));
  }

  saveDecision(decision: ReviewDecision): void {
    this.db.execute(
      `INSERT OR REPLACE INTO review_decisions (id, candidate_id, standard_version_id, decision, actor, actor_id, timestamp, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        decision.id,
        decision.candidateId,
        decision.standardVersionId,
        decision.decision,
        decision.actor,
        decision.actorId,
        decision.timestamp,
        decision.note || null
      ]
    );
  }

  getDecision(candidateId: string): ReviewDecision | null {
    const row = this.db.queryOne(`SELECT * FROM review_decisions WHERE candidate_id = ? ORDER BY timestamp DESC LIMIT 1`, [candidateId]);
    if (!row) return null;
    return {
      id: row.id,
      candidateId: row.candidate_id,
      standardVersionId: row.standard_version_id,
      decision: row.decision,
      actor: row.actor,
      actorId: row.actor_id,
      timestamp: row.timestamp,
      note: row.note || ""
    };
  }

  saveStudentReport(report: StudentEvidenceReport): void {
    this.db.execute(
      `INSERT OR REPLACE INTO student_evidence_reports 
       (id, student_id, anonymous_id, standard_version_id, rubric_results, interview_prompts, run_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        report.id,
        report.studentId,
        report.anonymousId,
        report.standardVersionId,
        JSON.stringify(report.rubricResults),
        JSON.stringify(report.interviewPrompts),
        report.runId,
        report.createdAt
      ]
    );
  }

  getStudentReport(reportId: string): StudentEvidenceReport | null {
    const row = this.db.queryOne(`SELECT * FROM student_evidence_reports WHERE id = ?`, [reportId]);
    if (!row) return null;
    return {
      id: row.id,
      studentId: row.student_id,
      anonymousId: row.anonymous_id,
      standardVersionId: row.standard_version_id,
      rubricResults: JSON.parse(row.rubric_results),
      interviewPrompts: JSON.parse(row.interview_prompts),
      runId: row.run_id,
      createdAt: row.created_at
    };
  }
}
