/**
 * JSON schema for POST /login request body — the validation boundary.
 * Fastify validates against this before the handler runs (spec §9, login rules).
 * Schema mirrors the API contract: email with format + max, password non-empty + max.
 */
export const loginBodySchema = {
  type: 'object',
  required: ['email', 'password'],
  additionalProperties: false,
  properties: {
    email: { type: 'string', format: 'email', maxLength: 254 },
    password: { type: 'string', minLength: 1, maxLength: 128 },
  },
} as const;

export interface LoginBody {
  email: string;
  password: string;
}
