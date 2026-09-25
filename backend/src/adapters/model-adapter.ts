import {
  EnterpriseTaskContext,
  SourceDocument,
  SourceClaim,
  RoleRequirement,
  SearchExpressionSet,
  TaskRecord,
  ProjectEpisode,
  RequirementAssessment
} from "../domain/types.js";

export interface ModelAdapterOptions {
  apiKey?: string;
  baseUrl?: string;
  chatModel?: string;
  reasonerModel?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface ModelAdapter {
  // 1. Task clarification (AI-1)
  clarifyTask(department: string, targetRole: string, rawDescription: string): Promise<EnterpriseTaskContext>;

  // 2. Claim extraction (AI-2)
  extractClaims(source: SourceDocument): Promise<SourceClaim[]>;

  // 3. Claim conflict adjudication (AI-3 via DeepSeek-R1)
  adjudicateConflicts(claims: SourceClaim[]): Promise<{
    claims: SourceClaim[];
    contradictionsFound: Array<{ claimIdA: string; claimIdB: string; explanation: string }>;
  }>;

  // 4. Standard requirement draft synthesis (AI-4)
  synthesizeDraftRequirements(taskContext: EnterpriseTaskContext, claims: SourceClaim[]): Promise<RoleRequirement[]>;

  // 5. Search expression generation (AI-5)
  generateSearchExpressions(standardVersionId: string, requirements: RoleRequirement[]): Promise<SearchExpressionSet>;

  // 6. Candidate fact extraction with line anchors (AI-6)
  extractCandidateFacts(candidateId: string, rawTextLines: string[]): Promise<{
    taskRecords: TaskRecord[];
    projectEpisodes: ProjectEpisode[];
  }>;

  // 7. Evidence linking & capability assessment (AI-7 via DeepSeek-R1)
  linkEvidence(
    candidateId: string,
    rawTextLines: string[],
    episodes: ProjectEpisode[],
    tasks: TaskRecord[],
    requirements: RoleRequirement[]
  ): Promise<RequirementAssessment[]>;

  // 8. Interview prompt synthesis based on evidence gaps (AI-8)
  synthesizeInterviewPrompts(
    roleName: string,
    assessments: RequirementAssessment[],
    rawResumeLines: string[]
  ): Promise<string[]>;
}
