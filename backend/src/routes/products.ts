/**
 * GET /products route.
 * Thin: call the product store, return the list.
 * No auth required.
 */
import { FastifyInstance } from 'fastify';
import { ProductStore } from '../data/productStore';

export async function productsRoutes(
  app: FastifyInstance,
  opts: { products: ProductStore },
): Promise<void> {
  app.get('/products', async (_req, reply) => {
    // demo: returns all products from the in-memory store
    const products = opts.products.findAll();
    return reply.code(200).send({ products });
  });
}
