import type { FastifyInstance } from "fastify";

export function registerMetaRoutes(app: FastifyInstance): void {
  app.get("/api/v1/meta", async () => ({
    product: "AI Hiring Workbench",
    architecture: "Dual Experience, Single Intelligence Core",
    implementationStatus: "SCAFFOLD",
    modelIntegration: "NOT_CONNECTED",
    evalStatus: "NOT_RUN",
    claims: {
      measuredEffect: false,
      productionReady: false
    }
  }));
}
