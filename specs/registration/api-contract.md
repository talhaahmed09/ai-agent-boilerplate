# API contract — User registration & login

> The cross-repo source of truth. Frontend and backend both build to this exactly.
> A worker that needs to change it must stop and flag a re-plan.

---

## Endpoints

### `POST /register`

**Request body**
```json
{
  "email": "user@example.com",
  "password": "hunter2hunter2"
}
```
- `email`: string, required, valid email format, max 254 chars.
- `password`: string, required, 8–128 chars, at least one letter and one number.
- `confirm password` is a **client-only** concern and is never sent.

**Success — `201 Created`**
```json
{
  "user": { "id": "usr_ab12cd34", "email": "user@example.com" },
  "token": "sess_9f8e7d6c..."
}
```
- Never includes the password or its hash.
- `token` is an opaque session token; the client persists it under `bloomcart_auth`.

---

### `POST /login`

**Request body**
```json
{
  "email": "user@example.com",
  "password": "hunter2hunter2"
}
```
- `email`: string, required, valid email format, max 254 chars.
- `password`: string, required, non-empty, max 128 chars.

**Success — `200 OK`**
```json
{
  "user": { "id": "usr_ab12cd34", "email": "user@example.com" },
  "token": "sess_9f8e7d6c..."
}
```
- Same shape as `/register` success — the client handles both identically.
- Never includes the password or its hash.

---

## Error envelope (single shape for the whole API)

```json
{
  "error": {
    "code": "EMAIL_TAKEN",
    "message": "An account with that email already exists.",
    "fieldErrors": { "email": "An account with that email already exists." }
  }
}
```
- `fieldErrors` is present when the error maps to specific input fields; absent
  for purely form-level/server errors.
- The frontend error shape mirrors this exactly: thunks reject with
  `{ fieldErrors?, message? }`, unpacked by `extractThunkError()`.

---

## Error codes

| code | status | when | fieldErrors |
|------|--------|------|-------------|
| `VALIDATION` | 400 | body fails schema (missing field, wrong type, malformed email, password rule) | the offending field(s): `email` and/or `password` |
| `EMAIL_TAKEN` | 409 | `/register` — email already belongs to an account (case-insensitive) | `email` |
| `INVALID_CREDENTIALS` | 401 | `/login` — email not found or password incorrect (single generic message, no enumeration) | absent (form-level only) |
| `RATE_LIMIT` | 429 | too many attempts from this client (10 per 15 min per IP, either endpoint) | absent (form-level only) |
| `INTERNAL` | 500 | unexpected server error | absent (form-level only) |

---

## Client storage contract

On success from either endpoint the client persists the following to `localStorage`
under the key `bloomcart_auth`:

```json
{
  "user": { "id": "usr_ab12cd34", "email": "user@example.com" },
  "token": "sess_9f8e7d6c..."
}
```

On application boot the client reads this key and, if present, rehydrates the
auth state with no network call. On logout the client removes this key.

---

## Spec mapping

| Spec error | Code | Endpoint |
|------------|------|----------|
| ERR-1 | `EMAIL_TAKEN` | `/register` |
| ERR-2, ERR-3, ERR-4 | `VALIDATION` (with relevant `fieldErrors`) | `/register` |
| ERR-5 | `INTERNAL` or no response | `/register` |
| ERR-6 | `RATE_LIMIT` | `/register` |
| ERR-7 | `INVALID_CREDENTIALS` | `/login` |
| ERR-8 | `INTERNAL` or no response | `/login` |
| ERR-9 | `RATE_LIMIT` | `/login` |
