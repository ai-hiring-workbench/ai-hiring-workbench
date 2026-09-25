import Fastify, { type FastifyInstance } from "fastify";
import { registerContractRoutes } from "./api/routes/contracts.js";
import { registerMetaRoutes } from "./api/routes/meta.js";

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: false });

  app.get("/health", async () => ({ status: "ok" }));
  registerMetaRoutes(app);
  registerContractRoutes(app);

  return app;
}
