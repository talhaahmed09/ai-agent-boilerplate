/**
 * Unit tests for orderService.placeOrder()
 * Covers: ERR-2, ERR-3, ERR-4, ERR-5, AC-10, AC-12 (backend half), stock atomicity
 */
import { placeOrder } from './orderService';
import { InMemoryProductStore } from '../data/productStore';
import { InMemoryOrderStore } from '../data/orderStore';
import { AppError } from '../lib/errors';

const VALID_ADDRESS = {
  fullName: 'Jane Doe',
  addressLine1: '123 Main St',
  city: 'London',
  postcode: 'SW1A 1AA',
  country: 'GB',
  phone: '+441234567890',
};

function freshStores() {
  return {
    products: new InMemoryProductStore(),
    orders: new InMemoryOrderStore(),
  };
}

describe('orderService.placeOrder', () => {
  it('ERR-2: empty items array throws CART_EMPTY (400)', () => {
    const { products, orders } = freshStores();
    expect(() =>
      placeOrder(products, orders, { items: [], shippingAddress: VALID_ADDRESS }),
    ).toThrow(
      expect.objectContaining({ code: 'CART_EMPTY', status: 400 }),
    );
  });

  it('ERR-3: missing required shippingAddress field throws VALIDATION (400) with fieldErrors', () => {
    const { products, orders } = freshStores();
    expect(() =>
      placeOrder(products, orders, {
        items: [{ productId: 'prod_1', quantity: 1 }],
        shippingAddress: {
          fullName: '',     // empty — required
          addressLine1: '123 Main St',
          city: 'London',
          postcode: 'SW1A 1AA',
          country: 'GB',
          phone: '+441234567890',
        },
      }),
    ).toThrow(
      expect.objectContaining({ code: 'VALIDATION', status: 400 }),
    );
  });

  it('ERR-3: fieldErrors includes the missing field name', () => {
    const { products, orders } = freshStores();
    let caught: AppError | null = null;
    try {
      placeOrder(products, orders, {
        items: [{ productId: 'prod_1', quantity: 1 }],
        shippingAddress: { ...VALID_ADDRESS, city: '' },
      });
    } catch (e) {
      caught = e as AppError;
    }
    expect(caught).not.toBeNull();
    expect(caught?.fieldErrors?.city).toBeDefined();
  });

  it('ERR-4: one OOS item + in-stock items -> ITEMS_UNAVAILABLE (422) with only OOS item listed', () => {
    const { products, orders } = freshStores();
    let caught: AppError | null = null;
    try {
      placeOrder(products, orders, {
        items: [
          { productId: 'prod_1', quantity: 1 }, // in stock (8)
          { productId: 'prod_4', quantity: 1 }, // OOS (0)
        ],
        shippingAddress: VALID_ADDRESS,
      });
    } catch (e) {
      caught = e as AppError;
    }
    expect(caught?.code).toBe('ITEMS_UNAVAILABLE');
    expect(caught?.status).toBe(422);
    expect(caught?.unavailableItems).toHaveLength(1);
    expect(caught?.unavailableItems?.[0]?.productId).toBe('prod_4');
  });

  it('ERR-5: all items OOS -> ITEMS_UNAVAILABLE (422) with all items listed', () => {
    const { products, orders } = freshStores();
    let caught: AppError | null = null;
    try {
      placeOrder(products, orders, {
        items: [
          { productId: 'prod_4', quantity: 1 },  // OOS (stock: 0)
          { productId: 'prod_2', quantity: 100 }, // exceeds stock (3)
        ],
        shippingAddress: VALID_ADDRESS,
      });
    } catch (e) {
      caught = e as AppError;
    }
    expect(caught?.code).toBe('ITEMS_UNAVAILABLE');
    const ids = caught?.unavailableItems?.map((i) => i.productId) ?? [];
    expect(ids).toContain('prod_4');
    expect(ids).toContain('prod_2');
  });

  it('AC-10: unitPrice in returned order equals current backend price', () => {
    const { products, orders } = freshStores();
    const order = placeOrder(products, orders, {
      items: [{ productId: 'prod_3', quantity: 2 }], // Scented Candle: 18.99
      shippingAddress: VALID_ADDRESS,
    });
    expect(order.items[0]?.unitPrice).toBe(18.99);
  });

  it('AC-10: total = unitPrice * quantity (correct backend price)', () => {
    const { products, orders } = freshStores();
    const order = placeOrder(products, orders, {
      items: [{ productId: 'prod_3', quantity: 2 }], // 2 * 18.99 = 37.98
      shippingAddress: VALID_ADDRESS,
    });
    expect(order.total).toBe(37.98);
  });

  it('AC-12 (backend half): stock is decremented by the ordered quantity', () => {
    const products = new InMemoryProductStore();
    const orders = new InMemoryOrderStore();
    const before = products.findById('prod_1')?.stock ?? 0;
    placeOrder(products, orders, {
      items: [{ productId: 'prod_1', quantity: 3 }],
      shippingAddress: VALID_ADDRESS,
    });
    expect(products.findById('prod_1')?.stock).toBe(before - 3);
  });

  it('orderNumber starts at 1001', () => {
    const { products, orders } = freshStores();
    const order = placeOrder(products, orders, {
      items: [{ productId: 'prod_1', quantity: 1 }],
      shippingAddress: VALID_ADDRESS,
    });
    expect(order.orderNumber).toBe(1001);
  });

  it('orderNumber increments on successive orders', () => {
    const { products, orders } = freshStores();
    const order1 = placeOrder(products, orders, {
      items: [{ productId: 'prod_1', quantity: 1 }],
      shippingAddress: VALID_ADDRESS,
    });
    const order2 = placeOrder(products, orders, {
      items: [{ productId: 'prod_1', quantity: 1 }],
      shippingAddress: VALID_ADDRESS,
    });
    expect(order1.orderNumber).toBe(1001);
    expect(order2.orderNumber).toBe(1002);
  });

  it('Stock atomicity: stock restored when order creation fails', () => {
    const products = new InMemoryProductStore();
    // Wrap the real order store so create() always throws
    const faultyOrders = {
      create: () => { throw new Error('simulated order store failure'); },
    };
    const before = products.findById('prod_1')?.stock ?? 0;
    expect(() =>
      placeOrder(products, faultyOrders, {
        items: [{ productId: 'prod_1', quantity: 2 }],
        shippingAddress: VALID_ADDRESS,
      }),
    ).toThrow('simulated order store failure');
    // Stock must be restored
    expect(products.findById('prod_1')?.stock).toBe(before);
  });

  it('shippingAddress is echoed in the returned order', () => {
    const { products, orders } = freshStores();
    const order = placeOrder(products, orders, {
      items: [{ productId: 'prod_1', quantity: 1 }],
      shippingAddress: VALID_ADDRESS,
    });
    expect(order.shippingAddress.fullName).toBe(VALID_ADDRESS.fullName);
    expect(order.shippingAddress.city).toBe(VALID_ADDRESS.city);
  });

  it('addressLine2 is optional — order succeeds without it', () => {
    const { products, orders } = freshStores();
    expect(() =>
      placeOrder(products, orders, {
        items: [{ productId: 'prod_1', quantity: 1 }],
        shippingAddress: { ...VALID_ADDRESS },
      }),
    ).not.toThrow();
  });
});
