import { SqliteClient } from "./sqlite-client.js";
import { SupabaseClient } from "./supabase-client.js";

export type DbProviderType = "sqlite" | "supabase";

export class DatabaseProvider {
  private static instance: DatabaseProvider;
  public readonly providerType: DbProviderType;
  public readonly sqlite: SqliteClient;
  public readonly supabase: SupabaseClient;

  private constructor() {
    const rawType = process.env.DB_PROVIDER?.toLowerCase();
    this.providerType = rawType === "supabase" ? "supabase" : "sqlite";
    this.sqlite = new SqliteClient();
    this.supabase = new SupabaseClient();
  }

  public static getInstance(): DatabaseProvider {
    if (!DatabaseProvider.instance) {
      DatabaseProvider.instance = new DatabaseProvider();
    }
    return DatabaseProvider.instance;
  }
}
