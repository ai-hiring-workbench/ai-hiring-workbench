PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS role_projects (
  id TEXT PRIMARY KEY,
  role_name TEXT NOT NULL,
  department TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_standard_versions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES role_projects(id),
  version INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'PENDING_CONFIRMATION', 'FROZEN', 'SUPERSEDED')),
  content_hash TEXT NOT NULL,
  confirmed_by TEXT,
  frozen_at TEXT,
  superseded_by TEXT REFERENCES role_standard_versions(id),
  UNIQUE(project_id, version)
);

CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES role_projects(id),
  standard_version_id TEXT NOT NULL REFERENCES role_standard_versions(id),
  status TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidates (
  id TEXT PRIMARY KEY,
  anonymous_id TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS candidate_materials (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL REFERENCES candidates(id),
  material_type TEXT NOT NULL,
  version INTEGER NOT NULL,
  input_hash TEXT NOT NULL,
  parse_status TEXT NOT NULL,
  local_path TEXT,
  UNIQUE(candidate_id, material_type, version)
);

CREATE TABLE IF NOT EXISTS ai_runs (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  standard_version_id TEXT NOT NULL REFERENCES role_standard_versions(id),
  input_hash TEXT NOT NULL,
  status TEXT NOT NULL,
  error_code TEXT,
  started_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS review_decisions (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL REFERENCES candidates(id),
  standard_version_id TEXT NOT NULL REFERENCES role_standard_versions(id),
  decision TEXT NOT NULL CHECK (decision IN ('INVITE', 'REQUEST_INFO', 'HOLD', 'DO_NOT_ADVANCE')),
  actor TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_reports (
  id TEXT PRIMARY KEY,
  anonymous_session_id TEXT NOT NULL,
  standard_version_id TEXT NOT NULL REFERENCES role_standard_versions(id),
  run_id TEXT NOT NULL REFERENCES ai_runs(id),
  report_json TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS application_run_logs (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  anonymous_actor_id TEXT,
  object_id TEXT,
  payload_hash TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
