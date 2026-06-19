/**
 * Tests for GET /products
 * Covers: ERR-6
 */
import { buildApp } from '../app';
import { InMemoryUserRepository } from '../data/userRepository';
import { InMemoryProductStore } from '../data/productStore';
import { InMemoryOrderStore } from '../data/orderStore';

function freshApp() {
  return buildApp({
    users: new InMemoryUserRepository(),
    products: new InMemoryProductStore(),
    orders: new InMemoryOrderStore(),
  });
}

describe('GET /products', () => {
  it('ERR-6: returns 200 with all 4 seeded products', async () => {
    const app = freshApp();
    await app.ready();
    const res = await app.inject({ method: 'GET', url: '/products' });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { products: unknown[] };
    expect(body.products).toHaveLength(4);
    await app.close();
  });

  it('ERR-6: each product has the required fields', async () => {
    const app = freshApp();
    await app.ready();
    const res = await app.inject({ method: 'GET', url: '/products' });
    const body = res.json() as {
      products: Array<{
        id: string;
        name: string;
        description: string;
        price: number;
        stock: number;
      }>;
    };
    for (const p of body.products) {
      expect(typeof p.id).toBe('string');
      expect(typeof p.name).toBe('string');
      expect(typeof p.description).toBe('string');
      expect(typeof p.price).toBe('number');
      expect(typeof p.stock).toBe('number');
    }
    await app.close();
  });

  it('ERR-6: seeded products include all 4 expected IDs', async () => {
    const app = freshApp();
    await app.ready();
    const res = await app.inject({ method: 'GET', url: '/products' });
    const body = res.json() as { products: Array<{ id: string }> };
    const ids = body.products.map((p) => p.id);
    expect(ids).toContain('prod_1');
    expect(ids).toContain('prod_2');
    expect(ids).toContain('prod_3');
    expect(ids).toContain('prod_4');
    await app.close();
  });

  it('ERR-6: prod_4 (Wicker Basket) has stock 0', async () => {
    const app = freshApp();
    await app.ready();
    const res = await app.inject({ method: 'GET', url: '/products' });
    const body = res.json() as { products: Array<{ id: string; stock: number }> };
    const prod4 = body.products.find((p) => p.id === 'prod_4');
    expect(prod4).toBeDefined();
    expect(prod4?.stock).toBe(0);
    await app.close();
  });
});
