import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { CandidateService } from "../services/candidate-service.js";
import { CandidateBatchIngestSchema, CandidateBatchEvaluateSchema } from "../domain/schemas.js";

export async function candidateRoutes(fastify: FastifyInstance, options: { candidateService: CandidateService } & FastifyPluginOptions) {
  const { candidateService } = options;

  fastify.post("/candidates/batch-ingest", async (request, reply) => {
    const parseResult = CandidateBatchIngestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "VALIDATION_FAILED", details: parseResult.error.format() });
    }

    const { standardVersionId, candidates } = parseResult.data;
    const batchId = await candidateService.ingestBatchCandidates(standardVersionId, candidates);
    return reply.status(201).send({ batchId, count: candidates.length, standardVersionId });
  });

  fastify.post("/candidates/batch-evaluate", async (request, reply) => {
    const parseResult = CandidateBatchEvaluateSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "VALIDATION_FAILED", details: parseResult.error.format() });
    }

    const { batchId, standardVersionId } = parseResult.data;
    const allCards = candidateService.listReviewCards(standardVersionId);
    return reply.status(200).send({ batchId, reviewCards: allCards });
  });

  fastify.get("/candidates/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const card = candidateService.getReviewCard(id);
    if (!card) {
      return reply.status(404).send({ error: "NOT_FOUND", message: `Candidate card ${id} not found.` });
    }
    return reply.status(200).send(card);
  });
}
