/**
 * POST /register route. Thin: validate at the boundary (schema), call the
 * service, map result/errors to the shared envelope. Schema validation failures
 * are translated into the same { error: { code, message, fieldErrors } } shape so
 * the client sees one consistent error contract (spec ERR-4: 400, never 500).
 */
import { FastifyInstance, FastifyRequest } from 'fastify';
import { registerBodySchema, RegisterBody } from '../schemas/register';
import { registerUser } from '../services/registerService';
import { UserRepository } from '../data/userRepository';
import { toEnvelope } from '../lib/errors';

export async function registerRoutes(
  app: FastifyInstance,
  opts: { users: UserRepository },
): Promise<void> {
  app.post(
    '/register',
    { schema: { body: registerBodySchema } },
    async (req: FastifyRequest<{ Body: RegisterBody }>, reply) => {
      try {
        const result = await registerUser(opts.users, req.body);
        return reply.code(201).send(result);
      } catch (err) {
        const { status, body } = toEnvelope(err);
        if (status >= 500) {
          req.log.error({ err }, 'register failed');
        }
        return reply.code(status).send(body);
      }
    },
  );
}
