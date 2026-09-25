import { ModelAdapter } from "../adapters/model-adapter.js";
import { StandardRepository } from "../infra/repositories/standard-repo.js";
import { EnterpriseTaskContext } from "../domain/types.js";

export class TaskService {
  constructor(
    private modelAdapter: ModelAdapter,
    private standardRepo: StandardRepository
  ) {}

  async clarifyTask(department: string, targetRole: string, rawDescription: string): Promise<EnterpriseTaskContext> {
    const context = await this.modelAdapter.clarifyTask(department, targetRole, rawDescription);
    const id = `TASK_${Date.now()}`;
    const taskContext: EnterpriseTaskContext = { ...context, id };
    this.standardRepo.saveTaskContext(taskContext);
    return taskContext;
  }

  confirmTask(contextId: string, confirmedBy: string, updatedFields?: Partial<EnterpriseTaskContext>): EnterpriseTaskContext {
    const existing = this.standardRepo.getTaskContext(contextId);
    if (!existing) {
      throw new Error(`Task context ${contextId} not found.`);
    }

    const confirmedContext: EnterpriseTaskContext = {
      ...existing,
      ...updatedFields,
      confirmedBy,
      confirmedAt: new Date().toISOString()
    };

    this.standardRepo.saveTaskContext(confirmedContext);
    return confirmedContext;
  }

  getTaskContext(contextId: string): EnterpriseTaskContext | null {
    return this.standardRepo.getTaskContext(contextId);
  }
}
