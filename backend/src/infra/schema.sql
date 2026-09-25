-- ==============================================================================
-- SQL DDL Schema for AI Hiring Screening & Omission Review Workbench
-- Compatible with SQLite 3 (WAL mode) and Supabase PostgreSQL 16
-- ==============================================================================

CREATE TABLE IF NOT EXISTS enterprise_task_contexts (
  id TEXT PRIMARY KEY,
  department TEXT NOT NULL,
  target_role TEXT NOT NULL,
  business_problem TEXT NOT NULL,
  target_users TEXT NOT NULL, -- JSON array
  deliverables TEXT NOT NULL, -- JSON array
  constraints TEXT NOT NULL, -- JSON array
  open_questions TEXT, -- JSON array
  confirmed_by TEXT,
  confirmed_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS source_documents (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  publisher TEXT NOT NULL,
  date TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS source_claims (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  claim_type TEXT NOT NULL,
  statement TEXT NOT NULL,
  source_excerpt_ids TEXT NOT NULL, -- JSON array
  quote_snapshot TEXT NOT NULL,
  has_contradiction INTEGER DEFAULT 0,
  contradiction_note TEXT,
  FOREIGN KEY (source_id) REFERENCES source_documents(id)
);

CREATE TABLE IF NOT EXISTS role_standards (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  status TEXT NOT NULL, -- 'DRAFT' | 'PENDING_CONFIRMATION' | 'FROZEN' | 'SUPERSEDED'
  role_name TEXT NOT NULL,
  department TEXT NOT NULL,
  hash TEXT NOT NULL, -- SHA-256 snapshot hash
  confirmed_by TEXT NOT NULL,
  frozen_at TEXT,
  superseded_by TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS role_requirements (
  id TEXT PRIMARY KEY,
  standard_id TEXT NOT NULL,
  code TEXT NOT NULL, -- e.g. AIPM-AP1
  name TEXT NOT NULL,
  definition TEXT NOT NULL,
  evidence_required TEXT NOT NULL,
  status TEXT NOT NULL, -- 'DRAFT' | 'PENDING' | 'CONFIRMED'
  confirmed_by TEXT,
  FOREIGN KEY (standard_id) REFERENCES role_standards(id)
);

CREATE TABLE IF NOT EXISTS search_expression_sets (
  id TEXT PRIMARY KEY,
  standard_version_id TEXT NOT NULL,
  title_terms TEXT NOT NULL, -- JSON array
  task_terms TEXT NOT NULL, -- JSON array
  skill_terms TEXT NOT NULL, -- JSON array
  exclusion_terms TEXT NOT NULL, -- JSON array
  boolean_query TEXT NOT NULL,
  human_edited INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (standard_version_id) REFERENCES role_standards(id)
);

CREATE TABLE IF NOT EXISTS candidates (
  id TEXT PRIMARY KEY,
  anonymous_id TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL, -- 'BATCH_UPLOAD' | 'STUDENT_SELF_SERVICE'
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS candidate_materials (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL,
  type TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  input_hash TEXT NOT NULL,
  storage_key TEXT, -- Supabase Storage key
  text_lines TEXT NOT NULL, -- JSON array of lines
  parse_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id)
);

CREATE TABLE IF NOT EXISTS candidate_review_cards (
  candidate_id TEXT PRIMARY KEY,
  anonymous_id TEXT NOT NULL,
  standard_version_id TEXT NOT NULL,
  triage_category TEXT NOT NULL, -- 'PRIORITY_REVIEW' | 'NEEDS_INFO' | 'STANDARD_REVIEW' | 'NOT_SUPPORTED'
  triage_reason TEXT NOT NULL,
  is_rescued INTEGER DEFAULT 0,
  is_overestimated_risk INTEGER DEFAULT 0,
  assessments TEXT NOT NULL, -- JSON array
  task_records TEXT NOT NULL, -- JSON array
  project_episodes TEXT NOT NULL, -- JSON array
  generated_at TEXT NOT NULL,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id),
  FOREIGN KEY (standard_version_id) REFERENCES role_standards(id)
);

CREATE TABLE IF NOT EXISTS review_decisions (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL,
  standard_version_id TEXT NOT NULL,
  decision TEXT NOT NULL, -- 'ADVANCE_TO_INTERVIEW' | 'HOLD_FOR_INFO' | 'REJECT'
  actor TEXT NOT NULL DEFAULT 'HR_USER', -- Strict R-10: never AI
  actor_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  note TEXT,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id),
  FOREIGN KEY (standard_version_id) REFERENCES role_standards(id)
);

CREATE TABLE IF NOT EXISTS student_evidence_reports (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  anonymous_id TEXT NOT NULL,
  standard_version_id TEXT NOT NULL,
  rubric_results TEXT NOT NULL, -- JSON array of 4 evidence states
  interview_prompts TEXT NOT NULL, -- JSON array
  run_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (standard_version_id) REFERENCES role_standards(id)
);
