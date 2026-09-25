import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { StudentService } from "../services/student-service.js";
import { StudentDiagnosisRequestSchema } from "../domain/schemas.js";

export async function studentRoutes(fastify: FastifyInstance, options: { studentService: StudentService } & FastifyPluginOptions) {
  const { studentService } = options;

  fastify.post("/student/diagnose", async (request, reply) => {
    const parseResult = StudentDiagnosisRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "VALIDATION_FAILED", details: parseResult.error.format() });
    }

    const { rawResumeText, standardVersionId, studentId } = parseResult.data;
    try {
      const report = await studentService.diagnoseStudentMaterial(rawResumeText, standardVersionId, studentId);
      return reply.status(200).send(report);
    } catch (err: any) {
      return reply.status(400).send({ error: "DIAGNOSIS_FAILED", message: err.message });
    }
  });

  fastify.get("/student/reports/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const report = studentService.getStudentReport(id);
    if (!report) {
      return reply.status(404).send({ error: "NOT_FOUND", message: `Student report ${id} not found.` });
    }
    return reply.status(200).send(report);
  });
}
