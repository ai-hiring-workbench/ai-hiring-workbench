import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { StandardService } from "../services/standard-service.js";
import { SearchService } from "../services/search-service.js";
import { FreezeStandardRequestSchema } from "../domain/schemas.js";

export async function standardRoutes(
  fastify: FastifyInstance,
  options: { standardService: StandardService; searchService: SearchService } & FastifyPluginOptions
) {
  const { standardService, searchService } = options;

  fastify.post("/standards/draft", async (request, reply) => {
    const { taskContextId, roleName, department } = request.body as {
      taskContextId: string;
      roleName: string;
      department: string;
    };

    if (!taskContextId || !roleName || !department) {
      return reply.status(400).send({ error: "MISSING_FIELDS", message: "taskContextId, roleName, and department are required." });
    }

    const standard = await standardService.draftStandard(taskContextId, roleName, department);
    return reply.status(201).send(standard);
  });

  fastify.put("/standards/:id/requirements/:rid", async (request, reply) => {
    const { id, rid } = request.params as { id: string; rid: string };
    const { confirmedBy, updates } = request.body as { confirmedBy: string; updates?: any };

    if (!confirmedBy) {
      return reply.status(400).send({ error: "MISSING_CONFIRMED_BY", message: "confirmedBy is required." });
    }

    const updated = standardService.confirmRequirement(id, rid, confirmedBy, updates);
    return reply.status(200).send(updated);
  });

  fastify.post("/standards/:id/freeze", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parseResult = FreezeStandardRequestSchema.safeParse({
      standardId: id,
      confirmedBy: (request.body as any)?.confirmedBy
    });

    if (!parseResult.success) {
      return reply.status(400).send({ error: "VALIDATION_FAILED", details: parseResult.error.format() });
    }

    try {
      const frozen = standardService.freezeStandard(id, parseResult.data.confirmedBy);
      // Auto-generate search expressions upon freeze
      const searchExpressions = await searchService.generateSearchExpressions(frozen.id);
      return reply.status(200).send({ standard: frozen, searchExpressions });
    } catch (err: any) {
      if (err.statusCode) {
        return reply.status(err.statusCode).send({ error: err.ruleId || "ERROR", message: err.message });
      }
      throw err;
    }
  });

  fastify.get("/standards/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const standard = standardService.getStandard(id);
    if (!standard) {
      return reply.status(404).send({ error: "NOT_FOUND", message: `Standard ${id} not found.` });
    }
    return reply.status(200).send(standard);
  });
}
