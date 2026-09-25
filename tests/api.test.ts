import { afterAll, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";

const app = buildApp();

afterAll(async () => {
  await app.close();
});

describe("API scaffold", () => {
  it("reports honest implementation and eval status", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/meta" });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.implementationStatus).toBe("SCAFFOLD");
    expect(body.evalStatus).toBe("NOT_RUN");
    expect(body.claims.measuredEffect).toBe(false);
  });

  it("rejects invalid student requests", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/student/evaluate",
      payload: {
        standardVersionId: "std_v1",
        consent: false,
        resumeText: "too short"
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("INVALID_REQUEST");
  });

  it("marks valid but unconnected routes as not implemented", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/student/evaluate",
      payload: {
        standardVersionId: "std_v1",
        consent: true,
        resumeText: "A sufficiently long, de-identified project description for contract validation."
      }
    });

    expect(response.statusCode).toBe(501);
    expect(response.json().error.code).toBe("AI_NOT_CONNECTED");
  });
});
