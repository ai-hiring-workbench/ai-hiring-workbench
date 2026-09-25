# API Contract

Base path: `/api/v1`

| Method | Path | Purpose | Current scaffold state |
| --- | --- | --- | --- |
| GET | `/health` | Process health | Implemented |
| GET | `/api/v1/meta` | Product and Eval status | Implemented |
| POST | `/api/v1/tasks/clarify` | Structure enterprise need | Contract stub |
| POST | `/api/v1/sources/matrix` | Extract and compare source claims | Contract stub |
| POST | `/api/v1/standards/:id/freeze` | Freeze confirmed standard | Contract stub |
| POST | `/api/v1/candidates/batch-evaluate` | HR batch review | Contract stub |
| POST | `/api/v1/student/evaluate` | Student evidence diagnosis | Contract stub |

Contract stubs validate their request body and return `501 NOT_IMPLEMENTED`. This is intentional: the repository must not pretend that an unconnected AI path is complete.

## Error envelope

```json
{
  "error": {
    "code": "AI_NOT_CONNECTED",
    "message": "The route contract exists, but no model adapter is configured."
  }
}
```
