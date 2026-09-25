import { ModelAdapter } from "../adapters/model-adapter.js";
import { StandardRepository } from "../infra/repositories/standard-repo.js";
import { CandidateRepository } from "../infra/repositories/candidate-repo.js";
import { SearchExpressionSet } from "../domain/types.js";

export class SearchService {
  constructor(
    private modelAdapter: ModelAdapter,
    private standardRepo: StandardRepository,
    private candidateRepo: CandidateRepository
  ) {}

  async generateSearchExpressions(standardVersionId: string): Promise<SearchExpressionSet> {
    const standard = this.standardRepo.getStandard(standardVersionId);
    if (!standard) {
      throw new Error(`Standard ${standardVersionId} not found.`);
    }

    const searchSet = await this.modelAdapter.generateSearchExpressions(standard.id, standard.requirements);
    this.candidateRepo.saveSearchExpression(searchSet);
    return searchSet;
  }

  getSearchExpression(standardVersionId: string): SearchExpressionSet | null {
    return this.candidateRepo.getSearchExpression(standardVersionId);
  }
}
