import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { StandardService } from "../services/standard-service.js";
import { SourceIngestRequestSchema } from "../domain/schemas.js";

export async function sourceRoutes(fastify: FastifyInstance, options: { standardService: StandardService } & FastifyPluginOptions) {
  const { standardService } = options;

  fastify.post("/sources/ingest", async (request, reply) => {
    const parseResult = SourceIngestRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "VALIDATION_FAILED", details: parseResult.error.format() });
    }

    const { type, title, publisher, date, rawText } = parseResult.data;
    const result = await standardService.ingestSourceDocument(type, title, publisher, date, rawText);
    return reply.status(201).send(result);
  });

  fastify.post("/sources/matrix", async (_request, reply) => {
    const matrix = await standardService.buildClaimMatrix();
    return reply.status(200).send(matrix);
  });
}
