/**
 * Tests for POST /orders
 * Covers: ERR-1, ERR-2, ERR-3, ERR-4, ERR-5, AC-10, AC-12 (backend half)
 */
import { buildApp } from '../app';
import { InMemoryUserRepository } from '../data/userRepository';
import { InMemoryProductStore } from '../data/productStore';
import { InMemoryOrderStore } from '../data/orderStore';
import { FastifyInstance } from 'fastify';

const VALID_ADDRESS = {
  fullName: 'Jane Doe',
  addressLine1: '123 Main St',
  city: 'London',
  postcode: 'SW1A 1AA',
  country: 'GB',
  phone: '+441234567890',
};

const AUTH_HEADER = 'Bearer demo-token-123';

function freshApp(): FastifyInstance {
  return buildApp({
    users: new InMemoryUserRepository(),
    products: new InMemoryProductStore(),
    orders: new InMemoryOrderStore(),
  });
}

describe('POST /orders', () => {
  it('ERR-1: missing Authorization header -> 401 UNAUTHORIZED', async () => {
    const app = freshApp();
    await app.ready();
    const res = await app.inject({
      method: 'POST',
      url: '/orders',
      payload: {
        items: [{ productId: 'prod_1', quantity: 1 }],
        shippingAddress: VALID_ADDRESS,
      },
    });
    expect(res.statusCode).toBe(401);
    const body = res.json() as { error: { code: string } };
    expect(body.error.code).toBe('UNAUTHORIZED');
    await app.close();
  });

  it('ERR-1: empty Authorization header -> 401 UNAUTHORIZED', async () => {
    const app = freshApp();
    await app.ready();
    const res = await app.inject({
      method: 'POST',
      url: '/orders',
      headers: { authorization: '' },
      payload: {
        items: [{ productId: 'prod_1', quantity: 1 }],
        shippingAddress: VALID_ADDRESS,
      },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json<{ error: { code: string } }>().error.code).toBe('UNAUTHORIZED');
    await app.close();
  });

  it('ERR-2: empty items array -> 400 CART_EMPTY', async () => {
    const app = freshApp();
    await app.ready();
    const res = await app.inject({
      method: 'POST',
      url: '/orders',
      headers: { authorization: AUTH_HEADER },
      payload: {
        items: [],
        shippingAddress: VALID_ADDRESS,
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json<{ error: { code: string } }>().error.code).toBe('CART_EMPTY');
    await app.close();
  });

  it('ERR-3: missing required shippingAddress field -> 400 VALIDATION with fieldErrors', async () => {
    const app = freshApp();
    await app.ready();
    const res = await app.inject({
      method: 'POST',
      url: '/orders',
      headers: { authorization: AUTH_HEADER },
      payload: {
        items: [{ productId: 'prod_1', quantity: 1 }],
        shippingAddress: {
          // fullName deliberately omitted
          addressLine1: '123 Main St',
          city: 'London',
          postcode: 'SW1A 1AA',
          country: 'GB',
          phone: '+441234567890',
        },
      },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json<{ error: { code: string; fieldErrors?: Record<string, string> } }>();
    expect(body.error.code).toBe('VALIDATION');
    expect(body.error.fieldErrors).toBeDefined();
    expect(body.error.fieldErrors?.fullName).toBeDefined();
    await app.close();
  });

  it('ERR-3: empty string for required field -> 400 VALIDATION with fieldErrors', async () => {
    const app = freshApp();
    await app.ready();
    const res = await app.inject({
      method: 'POST',
      url: '/orders',
      headers: { authorization: AUTH_HEADER },
      payload: {
        items: [{ productId: 'prod_1', quantity: 1 }],
        shippingAddress: { ...VALID_ADDRESS, city: '' },
      },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json<{ error: { code: string; fieldErrors?: Record<string, string> } }>();
    expect(body.error.code).toBe('VALIDATION');
    expect(body.error.fieldErrors?.city).toBeDefined();
    await app.close();
  });

  it('ERR-4: one OOS item (prod_4) + in-stock items -> 422 ITEMS_UNAVAILABLE, only prod_4 in unavailableItems', async () => {
    const app = freshApp();
    await app.ready();
    const res = await app.inject({
      method: 'POST',
      url: '/orders',
      headers: { authorization: AUTH_HEADER },
      payload: {
        items: [
          { productId: 'prod_1', quantity: 1 }, // in stock
          { productId: 'prod_4', quantity: 1 }, // OOS
        ],
        shippingAddress: VALID_ADDRESS,
      },
    });
    expect(res.statusCode).toBe(422);
    const body = res.json<{
      error: { code: string; unavailableItems?: Array<{ productId: string }> };
    }>();
    expect(body.error.code).toBe('ITEMS_UNAVAILABLE');
    expect(body.error.unavailableItems).toBeDefined();
    expect(body.error.unavailableItems).toHaveLength(1);
    expect(body.error.unavailableItems?.[0]?.productId).toBe('prod_4');
    await app.close();
  });

  it('ERR-5: all requested items OOS -> 422 ITEMS_UNAVAILABLE, all in unavailableItems', async () => {
    const app = freshApp();
    await app.ready();
    // prod_4 is OOS; request more stock than available for prod_2 (stock: 3)
    const res = await app.inject({
      method: 'POST',
      url: '/orders',
      headers: { authorization: AUTH_HEADER },
      payload: {
        items: [
          { productId: 'prod_4', quantity: 1 }, // OOS (stock: 0)
          { productId: 'prod_2', quantity: 99 }, // exceeds stock
        ],
        shippingAddress: VALID_ADDRESS,
      },
    });
    expect(res.statusCode).toBe(422);
    const body = res.json<{
      error: { code: string; unavailableItems?: Array<{ productId: string }> };
    }>();
    expect(body.error.code).toBe('ITEMS_UNAVAILABLE');
    const unavailableIds = body.error.unavailableItems?.map((i) => i.productId) ?? [];
    expect(unavailableIds).toContain('prod_4');
    expect(unavailableIds).toContain('prod_2');
    await app.close();
  });

  it('AC-10: successful order -> unitPrice reflects current backend price, not caller-supplied price', async () => {
    const app = freshApp();
    await app.ready();
    const res = await app.inject({
      method: 'POST',
      url: '/orders',
      headers: { authorization: AUTH_HEADER },
      payload: {
        items: [{ productId: 'prod_3', quantity: 2 }], // Scented Candle, price: 18.99
        shippingAddress: VALID_ADDRESS,
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<{
      order: {
        orderNumber: number;
        items: Array<{ productId: string; unitPrice: number; quantity: number }>;
        total: number;
      };
    }>();
    expect(body.order.items[0]?.unitPrice).toBe(18.99);
    expect(body.order.total).toBe(37.98);
    await app.close();
  });

  it('AC-12 (backend half): successful order decrements stock', async () => {
    const productStore = new InMemoryProductStore();
    const app = buildApp({
      users: new InMemoryUserRepository(),
      products: productStore,
      orders: new InMemoryOrderStore(),
    });
    await app.ready();

    const stockBefore = productStore.findById('prod_1')?.stock ?? 0;
    await app.inject({
      method: 'POST',
      url: '/orders',
      headers: { authorization: AUTH_HEADER },
      payload: {
        items: [{ productId: 'prod_1', quantity: 2 }],
        shippingAddress: VALID_ADDRESS,
      },
    });
    const stockAfter = productStore.findById('prod_1')?.stock ?? 0;
    expect(stockAfter).toBe(stockBefore - 2);
    await app.close();
  });

  it('successful order -> 201 with orderNumber starting at 1001', async () => {
    const app = freshApp();
    await app.ready();
    const res = await app.inject({
      method: 'POST',
      url: '/orders',
      headers: { authorization: AUTH_HEADER },
      payload: {
        items: [{ productId: 'prod_1', quantity: 1 }],
        shippingAddress: VALID_ADDRESS,
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<{ order: { orderNumber: number } }>();
    expect(body.order.orderNumber).toBe(1001);
    await app.close();
  });

  it('successful order -> shippingAddress echoed in response', async () => {
    const app = freshApp();
    await app.ready();
    const res = await app.inject({
      method: 'POST',
      url: '/orders',
      headers: { authorization: AUTH_HEADER },
      payload: {
        items: [{ productId: 'prod_1', quantity: 1 }],
        shippingAddress: VALID_ADDRESS,
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<{ order: { shippingAddress: typeof VALID_ADDRESS } }>();
    expect(body.order.shippingAddress.fullName).toBe(VALID_ADDRESS.fullName);
    expect(body.order.shippingAddress.city).toBe(VALID_ADDRESS.city);
    await app.close();
  });

  it('addressLine2 is optional — order succeeds without it', async () => {
    const app = freshApp();
    await app.ready();
    const addressWithoutLine2 = { ...VALID_ADDRESS };
    const res = await app.inject({
      method: 'POST',
      url: '/orders',
      headers: { authorization: AUTH_HEADER },
      payload: {
        items: [{ productId: 'prod_1', quantity: 1 }],
        shippingAddress: addressWithoutLine2,
      },
    });
    expect(res.statusCode).toBe(201);
    await app.close();
  });
});
