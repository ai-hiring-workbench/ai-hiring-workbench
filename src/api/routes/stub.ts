import type { FastifyInstance } from "fastify";
import type { ZodType } from "zod";

interface StubRouteOptions {
  method: "POST";
  url: string;
  schema: ZodType;
  code?: string;
}

export function registerContractStub(app: FastifyInstance, options: StubRouteOptions): void {
  app.route({
    method: options.method,
    url: options.url,
    handler: async (request, reply) => {
      const parsed = options.schema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({
          error: {
            code: "INVALID_REQUEST",
            message: "Request does not match the frozen API contract.",
            issues: parsed.error.issues
          }
        });
      }

      return reply.status(501).send({
        error: {
          code: options.code ?? "AI_NOT_CONNECTED",
          message: "The route contract exists, but the implementation is not connected yet."
        }
      });
    }
  });
}
