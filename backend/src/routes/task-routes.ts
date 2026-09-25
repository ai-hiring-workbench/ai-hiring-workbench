import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { TaskService } from "../services/task-service.js";
import { TaskClarifyRequestSchema, TaskConfirmRequestSchema } from "../domain/schemas.js";

export async function taskRoutes(fastify: FastifyInstance, options: { taskService: TaskService } & FastifyPluginOptions) {
  const { taskService } = options;

  fastify.post("/tasks/clarify", async (request, reply) => {
    const parseResult = TaskClarifyRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "VALIDATION_FAILED", details: parseResult.error.format() });
    }

    const { department, targetRole, rawDescription } = parseResult.data;
    const taskContext = await taskService.clarifyTask(department, targetRole, rawDescription);
    return reply.status(200).send(taskContext);
  });

  fastify.put("/tasks/:id/confirm", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parseResult = TaskConfirmRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "VALIDATION_FAILED", details: parseResult.error.format() });
    }

    const { confirmedBy, context } = parseResult.data;
    const confirmed = taskService.confirmTask(id, confirmedBy, context);
    return reply.status(200).send(confirmed);
  });

  fastify.get("/tasks/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const context = taskService.getTaskContext(id);
    if (!context) {
      return reply.status(404).send({ error: "NOT_FOUND", message: `Task context ${id} not found.` });
    }
    return reply.status(200).send(context);
  });
}
