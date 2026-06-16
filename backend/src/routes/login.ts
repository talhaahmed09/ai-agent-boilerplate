/**
 * POST /login route. Thin: validate at the boundary (schema), call the service,
 * map result/errors to the shared envelope. Schema validation failures are
 * translated into the same { error: { code, message, fieldErrors } } shape (spec ERR-4: 400).
 */
import { FastifyInstance, FastifyRequest } from 'fastify';
import { loginBodySchema, LoginBody } from '../schemas/login';
import { loginUser } from '../services/loginService';
import { UserRepository } from '../data/userRepository';
import { toEnvelope } from '../lib/errors';

export async function loginRoutes(
  app: FastifyInstance,
  opts: { users: UserRepository },
): Promise<void> {
  app.post(
    '/login',
    { schema: { body: loginBodySchema } },
    async (req: FastifyRequest<{ Body: LoginBody }>, reply) => {
      try {
        const result = await loginUser(opts.users, req.body);
        return reply.code(200).send(result);
      } catch (err) {
        const { status, body } = toEnvelope(err);
        if (status >= 500) {
          req.log.error({ err }, 'login failed');
        }
        return reply.code(status).send(body);
      }
    },
  );
}
