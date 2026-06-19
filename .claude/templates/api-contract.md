# API contract — <feature>

> The cross-repo source of truth (spec §4a). Frontend and backend workers both
> build to this exactly. A worker that needs to change it must stop and flag a
> re-plan — it is never edited unilaterally inside one repo.

## Endpoint(s)
### `<METHOD> <path>`
**Request body**
```json
{ }
```
**Success — `<status>`**
```json
{ }
```

## Error envelope (single shape for the whole API)
```json
{ "error": { "code": "STRING_ENUM", "message": "human readable", "fieldErrors": { "field": "message" } } }
```
The frontend error shape mirrors this exactly so the two halves agree.

## Error codes
| code | status | when | fieldErrors? |
|------|--------|------|--------------|
| … | … | … | … |
