import { DatabaseSync } from "node:sqlite";
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export class SqliteClient {
  private db: DatabaseSync;

  constructor(dbPath?: string) {
    const targetPath = dbPath || process.env.SQLITE_DB_PATH || "./data/workbench.sqlite";
    const dir = dirname(targetPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    this.db = new DatabaseSync(targetPath);
    // Enable WAL mode & foreign keys & busy timeout for concurrent threads
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec("PRAGMA foreign_keys = ON;");
    this.db.exec("PRAGMA busy_timeout = 5000;");

    this.initSchema();
  }

  private initSchema(): void {
    const schemaFile = join(__dirname, "schema.sql");
    if (existsSync(schemaFile)) {
      const sql = readFileSync(schemaFile, "utf8");
      this.db.exec(sql);
    }
  }

  public getDatabase(): DatabaseSync {
    return this.db;
  }

  public query<T = any>(sql: string, params: any[] = []): T[] {
    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as T[];
  }

  public queryOne<T = any>(sql: string, params: any[] = []): T | undefined {
    const stmt = this.db.prepare(sql);
    return stmt.get(...params) as T | undefined;
  }

  public execute(sql: string, params: any[] = []): any {
    const stmt = this.db.prepare(sql);
    return stmt.run(...params);
  }

  public close(): void {
    this.db.close();
  }
}
