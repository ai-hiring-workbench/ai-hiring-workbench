# Architecture

## Core decision

The product uses two interfaces over one shared intelligence core:

```text
enterprise task + source pack
→ human-confirmed frozen role standard
→ shared evidence extraction and linking contract
→ HR batch review OR student self-diagnosis
```

## Human authority

- Hiring manager confirms enterprise truth and freezes the role standard.
- Recruiter decides interview, request-more-information, hold, or do-not-advance.
- Student decides how to revise materials and prepare for an interview.

The AI does not make these decisions.

## Planned layers

1. HR and student interfaces.
2. API and structured-data contracts; the concrete framework is confirmed by the backend owner before implementation.
3. Parsing, line indexing, and document hashing.
4. Version and workflow state.
5. Configurable model adapter and bounded AI modules.
6. Deterministic safety rules.
7. Version store and offline Eval; the concrete database is confirmed by the backend owner before implementation.

## P0 boundaries

Out of scope: auto-outreach, admission probability, market-wide job matching, voice interview simulation, ATS integration, multi-tenancy, and production-scale infrastructure.

## Evidence boundary

An anchored quote proves that the text exists, not that the AI interpreted it correctly. Semantic quality still requires independent Gold labels and holdout evaluation.
