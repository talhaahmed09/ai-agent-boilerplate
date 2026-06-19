/**
 * Auth helper for route handlers.
 * requireAuth reads the Authorization header and throws UNAUTHORIZED if it is
 * absent or not a non-empty Bearer token.
 *
 * This is intentionally a standalone helper function, not a Fastify plugin,
 * because the auth check is called explicitly in the orders route handler
 * before delegating to the service — keeping the auth boundary obvious.
 */
import { FastifyRequest } from 'fastify';
import { unauthorized } from '../lib/errors';

/**
 * Validate that the request carries a non-empty Bearer token.
 * Throws an UNAUTHORIZED AppError (401) if the header is missing or malformed.
 *
 * // demo: accepts ANY non-empty Bearer token; no real session validation
 *
 * @param req - The incoming Fastify request
 * @throws AppError (401 UNAUTHORIZED)
 */
export function requireAuth(req: FastifyRequest): void {
  const authHeader = req.headers['authorization'] ?? '';
  // demo: accept any non-empty Bearer token value as authenticated
  const match = /^Bearer\s+(\S+)$/.exec(authHeader);
  if (!match || !match[1]) {
    throw unauthorized();
  }
}
