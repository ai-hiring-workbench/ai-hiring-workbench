import { createClient, SupabaseClient as Client } from "@supabase/supabase-js";

export class SupabaseClient {
  private client: Client | null = null;
  public readonly storageBucket: string;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    this.storageBucket = process.env.SUPABASE_STORAGE_BUCKET || "resumes";

    if (url && key) {
      this.client = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
    }
  }

  public getClient(): Client {
    if (!this.client) {
      throw new Error("Supabase is not configured. Please supply SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env, or switch DB_PROVIDER=sqlite.");
    }
    return this.client;
  }

  public isAvailable(): boolean {
    return this.client !== null;
  }

  public async uploadResumeFile(fileName: string, fileBuffer: Buffer, mimeType: string): Promise<string> {
    const client = this.getClient();
    const filePath = `raw_resumes/${fileName}`;
    const { error } = await client.storage
      .from(this.storageBucket)
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: true
      });

    if (error) {
      throw new Error(`Failed to upload file to Supabase Storage: ${error.message}`);
    }

    const { data } = client.storage.from(this.storageBucket).getPublicUrl(filePath);
    return data.publicUrl;
  }
}
