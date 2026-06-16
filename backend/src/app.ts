/**
 * buildApp() returns a configured Fastify instance with an injected UserRepository
 * so tests can pass a fake/in-memory repo via fastify.inject() (no real DB).
 * A custom schema-error handler converts boundary validation failures into the
 * shared error envelope with the offending field(s) (spec ERR-4).
 * Rate limiting (10 req / 15 min per IP) is applied globally via @fastify/rate-limit.
 */
import Fastify, { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { registerRoutes } from './routes/register';
import { loginRoutes } from './routes/login';
import { UserRepository } from './data/userRepository';
import { ErrorEnvelope } from './lib/errors';

export function buildApp(deps: { users: UserRepository }): FastifyInstance {
  const app = Fastify({ logger: false });

  // Register rate-limit plugin globally: 10 requests per 15 minutes per IP.
  // The plugin throws the result of errorResponseBuilder; we return a plain
  // Error with statusCode 429 so that Fastify's setErrorHandler below can
  // map it to the shared RATE_LIMIT envelope (spec ERR-6 / ERR-9).
  void app.register(rateLimit, {
    global: true,
    max: 10,
    timeWindow: '15 minutes',
    errorResponseBuilder: (_req, _ctx) => {
      const err = new Error('Too many attempts. Please wait a few minutes and try again.');
      // reason: @fastify/rate-limit throws the return value of errorResponseBuilder.
      // We attach statusCode=429 so Fastify's setErrorHandler can detect and map
      // it to the shared RATE_LIMIT envelope (spec ERR-6 / ERR-9).
      (err as Error & { statusCode: number }).statusCode = 429;
      return err;
    },
  });

  // Map Fastify's schema validation errors onto our envelope, so a malformed
  // body returns 400 + fieldErrors rather than Fastify's default shape.
  app.setErrorHandler((error, _req, reply) => {
    // Rate-limit errors are already shaped by errorResponseBuilder above and
    // emitted by the plugin with statusCode 429 — just forward them as-is.
    if (error.statusCode === 429) {
      const body: ErrorEnvelope = {
        error: {
          code: 'RATE_LIMIT',
          message: 'Too many attempts. Please wait a few minutes and try again.',
        },
      };
      return reply.code(429).send(body);
    }

    if (error.validation) {
      const fieldErrors: Record<string, string> = {};
      for (const v of error.validation) {
        const path = (v.instancePath || '').replace(/^\//, '');
        if (path === 'email' || (v.params && (v.params as { missingProperty?: string }).missingProperty === 'email')) {
          fieldErrors.email = 'Enter a valid email address.';
        }
        if (path === 'password' || (v.params && (v.params as { missingProperty?: string }).missingProperty === 'password')) {
          fieldErrors.password =
            'Password must be at least 8 characters and include a letter and a number.';
        }
      }
      const body: ErrorEnvelope = {
        error: {
          code: 'VALIDATION',
          message: 'Please correct the highlighted fields.',
          fieldErrors: Object.keys(fieldErrors).length
            ? fieldErrors
            : { email: 'Enter a valid email address.' },
        },
      };
      return reply.code(400).send(body);
    }
    const body: ErrorEnvelope = {
      error: { code: 'INTERNAL', message: 'Something went wrong. Please try again.' },
    };
    return reply.code(500).send(body);
  });

  app.get('/health', async () => ({ status: 'ok' }));
  app.register(registerRoutes, { users: deps.users });
  app.register(loginRoutes, { users: deps.users });
  return app;
}
