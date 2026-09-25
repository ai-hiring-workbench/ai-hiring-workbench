export interface ModelRunContext {
  runId: string;
  promptVersion: string;
  schemaVersion: string;
  standardVersionId: string;
  inputHash: string;
}

export interface ModelAdapter {
  readonly provider: string;
  readonly model: string;
  generate<T>(moduleName: string, input: unknown, context: ModelRunContext): Promise<T>;
}

export class UnconfiguredModelAdapter implements ModelAdapter {
  readonly provider = "unconfigured";
  readonly model = "unconfigured";

  async generate<T>(): Promise<T> {
    throw new Error("AI_NOT_CONNECTED");
  }
}
