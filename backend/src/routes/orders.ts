/**
 * POST /orders route.
 * Thin: auth check → call service → map result to response.
 * Business logic lives in orderService.
 */
import { FastifyInstance, FastifyRequest } from 'fastify';
import { orderBodySchema, OrderBody } from '../schemas/orders';
import { ProductStore } from '../data/productStore';
import { OrderStore } from '../data/orderStore';
import { requireAuth } from '../plugins/auth';
import { placeOrder } from '../services/orderService';
import { toEnvelope } from '../lib/errors';

export async function ordersRoutes(
  app: FastifyInstance,
  opts: { products: ProductStore; orders: OrderStore },
): Promise<void> {
  app.post(
    '/orders',
    { schema: { body: orderBodySchema } },
    async (req: FastifyRequest<{ Body: OrderBody }>, reply) => {
      try {
        // demo: any non-empty Bearer token is accepted as authenticated
        requireAuth(req);
        const order = placeOrder(opts.products, opts.orders, req.body);
        return reply.code(201).send({ order });
      } catch (err) {
        const { status, body } = toEnvelope(err);
        if (status >= 500) {
          req.log.error({ err }, 'place order failed');
        }
        return reply.code(status).send(body);
      }
    },
  );
}
