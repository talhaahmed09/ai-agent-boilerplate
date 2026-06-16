/**
 * JSON schema for POST /register request body — the validation boundary.
 * Fastify validates against this before the handler runs, so malformed/missing
 * fields return a typed 400 (never a 500). The handler re-checks the password
 * rule for a precise message. Schema mirrors spec §3 and the API contract.
 */
export const registerBodySchema = {
  type: 'object',
  required: ['email', 'password'],
  additionalProperties: false,
  properties: {
    email: { type: 'string', format: 'email', maxLength: 254 },
    password: { type: 'string', minLength: 1, maxLength: 128 },
  },
} as const;

export interface RegisterBody {
  email: string;
  password: string;
}
