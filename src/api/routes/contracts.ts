import type { FastifyInstance } from "fastify";
import {
  CandidateBatchEvaluateRequestSchema,
  SourceMatrixRequestSchema,
  StandardFreezeRequestSchema,
  StudentEvaluateRequestSchema,
  TaskClarifyRequestSchema
} from "../../models/api.js";
import { registerContractStub } from "./stub.js";

export function registerContractRoutes(app: FastifyInstance): void {
  registerContractStub(app, {
    method: "POST",
    url: "/api/v1/tasks/clarify",
    schema: TaskClarifyRequestSchema
  });

  registerContractStub(app, {
    method: "POST",
    url: "/api/v1/sources/matrix",
    schema: SourceMatrixRequestSchema
  });

  registerContractStub(app, {
    method: "POST",
    url: "/api/v1/standards/:id/freeze",
    schema: StandardFreezeRequestSchema,
    code: "STANDARD_FLOW_NOT_CONNECTED"
  });

  registerContractStub(app, {
    method: "POST",
    url: "/api/v1/candidates/batch-evaluate",
    schema: CandidateBatchEvaluateRequestSchema
  });

  registerContractStub(app, {
    method: "POST",
    url: "/api/v1/student/evaluate",
    schema: StudentEvaluateRequestSchema
  });
}
