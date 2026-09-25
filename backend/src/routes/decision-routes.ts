import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { CandidateService } from "../services/candidate-service.js";
import { ReviewDecisionSchema } from "../domain/schemas.js";

export async function decisionRoutes(fastify: FastifyInstance, options: { candidateService: CandidateService } & FastifyPluginOptions) {
  const { candidateService } = options;

  fastify.post("/decisions", async (request, reply) => {
    const parseResult = ReviewDecisionSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "VALIDATION_FAILED", details: parseResult.error.format() });
    }

    const { candidateId, standardVersionId, decision, actor, actorId, note } = parseResult.data;
    const reviewDecision = {
      id: `DEC_${Date.now()}`,
      candidateId,
      standardVersionId,
      decision,
      actor,
      actorId,
      timestamp: new Date().toISOString(),
      note
    };

    try {
      candidateService.recordDecision(reviewDecision);
      return reply.status(201).send(reviewDecision);
    } catch (err: any) {
      if (err.statusCode) {
        return reply.status(err.statusCode).send({ error: err.ruleId || "ERROR", message: err.message });
      }
      throw err;
    }
  });
}
