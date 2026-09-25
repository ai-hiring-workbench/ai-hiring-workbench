import { createHash } from "node:crypto";
import { ModelAdapter } from "../adapters/model-adapter.js";
import { StandardRepository } from "../infra/repositories/standard-repo.js";
import {
  SourceDocument,
  SourceClaim,
  RoleRequirement,
  RoleStandardVersion
} from "../domain/types.js";
import {
  validateRuleR01_SourceClaimHasCitation,
  validateRuleR04_NoPendingRequirementOnFreeze,
  validateRuleR05_FrozenStandardImmutable
} from "../domain/rules.js";

export class StandardService {
  constructor(
    private modelAdapter: ModelAdapter,
    private standardRepo: StandardRepository
  ) {}

  async ingestSourceDocument(
    type: SourceDocument["type"],
    title: string,
    publisher: string,
    date: string,
    rawText: string
  ): Promise<{ document: SourceDocument; claims: SourceClaim[] }> {
    const inputHash = createHash("sha256").update(rawText).digest("hex");
    const id = `SRC_${Date.now()}`;
    const textLines = rawText.split("\n").filter(l => l.trim().length > 0);

    const doc: SourceDocument = {
      id,
      type,
      title,
      publisher,
      date,
      inputHash,
      textLines
    };

    this.standardRepo.saveSourceDocument(doc);

    // Extract claims via ModelAdapter (AI-2)
    const claims = await this.modelAdapter.extractClaims(doc);
    for (const claim of claims) {
      validateRuleR01_SourceClaimHasCitation(claim);
    }
    this.standardRepo.saveSourceClaims(claims);

    return { document: doc, claims };
  }

  async buildClaimMatrix(): Promise<{
    claims: SourceClaim[];
    contradictions: Array<{ claimIdA: string; claimIdB: string; explanation: string }>;
  }> {
    const claims = this.standardRepo.getSourceClaims();
    const result = await this.modelAdapter.adjudicateConflicts(claims);
    this.standardRepo.saveSourceClaims(result.claims);
    return {
      claims: result.claims,
      contradictions: result.contradictionsFound
    };
  }

  async draftStandard(taskContextId: string, roleName: string, department: string): Promise<RoleStandardVersion> {
    const taskContext = this.standardRepo.getTaskContext(taskContextId);
    if (!taskContext) {
      throw new Error(`Task context ${taskContextId} not found.`);
    }

    const claims = this.standardRepo.getSourceClaims();
    const requirements = await this.modelAdapter.synthesizeDraftRequirements(taskContext, claims);

    const standardId = `STD_${Date.now()}`;
    const standard: RoleStandardVersion = {
      id: standardId,
      version: "v1.0-DRAFT",
      status: "DRAFT",
      roleName,
      department,
      requirements,
      hash: "PENDING_FREEZE",
      confirmedBy: "SYSTEM"
    };

    this.standardRepo.saveStandard(standard);
    return standard;
  }

  confirmRequirement(standardId: string, requirementId: string, confirmedBy: string, updates?: Partial<RoleRequirement>): RoleStandardVersion {
    const standard = this.standardRepo.getStandard(standardId);
    if (!standard) throw new Error(`Standard ${standardId} not found.`);
    validateRuleR05_FrozenStandardImmutable(standard);

    const updatedReqs = standard.requirements.map(req => {
      if (req.id === requirementId) {
        return {
          ...req,
          ...updates,
          status: "CONFIRMED" as const,
          confirmedBy
        };
      }
      return req;
    });

    const updatedStandard = { ...standard, requirements: updatedReqs };
    this.standardRepo.saveStandard(updatedStandard);
    return updatedStandard;
  }

  freezeStandard(standardId: string, confirmedBy: string): RoleStandardVersion {
    const standard = this.standardRepo.getStandard(standardId);
    if (!standard) throw new Error(`Standard ${standardId} not found.`);
    validateRuleR05_FrozenStandardImmutable(standard);

    // Rule R-04: Block freeze if any requirement is not confirmed
    validateRuleR04_NoPendingRequirementOnFreeze(standard.requirements);

    // Compute cryptographic SHA-256 snapshot hash
    const snapshotPayload = JSON.stringify({
      roleName: standard.roleName,
      department: standard.department,
      requirements: standard.requirements.map(r => ({
        code: r.code,
        name: r.name,
        definition: r.definition,
        evidenceRequired: r.evidenceRequired
      })),
      confirmedBy
    });

    const hash = createHash("sha256").update(snapshotPayload).digest("hex");
    const frozenStandard: RoleStandardVersion = {
      ...standard,
      version: "v1.0-FROZEN",
      status: "FROZEN",
      hash,
      confirmedBy,
      frozenAt: new Date().toISOString()
    };

    this.standardRepo.saveStandard(frozenStandard);
    return frozenStandard;
  }

  getStandard(standardId: string): RoleStandardVersion | null {
    return this.standardRepo.getStandard(standardId);
  }

  getLatestFrozenStandard(roleName?: string): RoleStandardVersion | null {
    return this.standardRepo.getLatestFrozenStandard(roleName);
  }
}
