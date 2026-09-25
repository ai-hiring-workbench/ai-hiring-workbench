# API Contract

Base path: `/api/v1`

| Method | Path | Purpose | Current state |
| --- | --- | --- | --- |
| GET | `/health` | Process health | Planned |
| GET | `/api/v1/meta` | Product and Eval status | Planned |
| POST | `/api/v1/tasks/clarify` | Structure enterprise need | Planned |
| POST | `/api/v1/sources/matrix` | Extract and compare source claims | Planned |
| POST | `/api/v1/standards/:id/freeze` | Freeze confirmed standard | Planned |
| POST | `/api/v1/candidates/batch-evaluate` | HR batch review | Planned |
| POST | `/api/v1/student/evaluate` | Student evidence diagnosis | Planned |

This file is a discussion draft, not an implemented interface. The team must confirm the paths, fields and error states before development.

## Error envelope

```json
{
  "error": {
    "code": "AI_NOT_CONNECTED",
    "message": "The AI service is not configured."
  }
}
```
