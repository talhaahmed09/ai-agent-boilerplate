/**
 * ProductStore interface and in-memory implementation.
 * The interface keeps routes and services decoupled from the concrete store so
 * tests can inject controlled instances without mutating shared state.
 */

// demo: hard-coded product catalogue; replace with a DB-backed store for production
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
}

export interface ProductStore {
  /** Return all products (shallow copy — callers must not mutate). */
  findAll(): Product[];
  /** Find a single product by id, or null if not found. */
  findById(id: string): Product | null;
  /**
   * Atomically decrement stock for a set of (productId, quantity) pairs.
   * Throws if any product is not found or has insufficient stock.
   * On partial failure the entire decrement is rolled back.
   */
  decrementStock(items: Array<{ productId: string; quantity: number }>): void;
  /**
   * Restore (add back) stock for a set of (productId, quantity) pairs.
   * Used for rollback when order creation fails after stock was decremented.
   * Silently skips products not found (best-effort rollback).
   */
  restoreStock(items: Array<{ productId: string; quantity: number }>): void;
}

// demo: seeded product catalogue — 4 hard-coded products
const SEED_PRODUCTS: Product[] = [
  { id: 'prod_1', name: 'Ceramic Vase',   description: 'Hand-thrown ceramic vase, 25cm',         price: 34.99, stock: 8  },
  { id: 'prod_2', name: 'Linen Throw',    description: '100% linen throw blanket, natural',       price: 59.99, stock: 3  },
  { id: 'prod_3', name: 'Scented Candle', description: 'Soy wax candle, 40hr burn time',          price: 18.99, stock: 15 },
  { id: 'prod_4', name: 'Wicker Basket',  description: 'Handwoven storage basket, medium',        price: 27.99, stock: 0  },
];

export class InMemoryProductStore implements ProductStore {
  // demo: in-memory mutable product list; seeded from SEED_PRODUCTS
  private readonly products: Map<string, Product>;

  constructor(seed: Product[] = SEED_PRODUCTS) {
    this.products = new Map(seed.map((p) => [p.id, { ...p }]));
  }

  findAll(): Product[] {
    return Array.from(this.products.values()).map((p) => ({ ...p }));
  }

  findById(id: string): Product | null {
    const p = this.products.get(id);
    return p ? { ...p } : null;
  }

  decrementStock(items: Array<{ productId: string; quantity: number }>): void {
    // Resolve all products and snapshot current stock levels for rollback
    const resolved: Array<{ product: Product; quantity: number }> = [];
    const rollback: Array<{ id: string; previousStock: number }> = [];

    for (const { productId, quantity } of items) {
      const product = this.products.get(productId);
      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }
      resolved.push({ product, quantity });
    }

    // Apply decrements; on any failure roll back the ones already applied
    for (const { product, quantity } of resolved) {
      rollback.push({ id: product.id, previousStock: product.stock });
      product.stock -= quantity;
      if (product.stock < 0) {
        // Restore all decremented stocks (atomicity guarantee)
        for (const { id, previousStock } of rollback) {
          const p = this.products.get(id);
          if (p) p.stock = previousStock;
        }
        throw new Error(`Insufficient stock for product ${product.id}`);
      }
    }
  }

  restoreStock(items: Array<{ productId: string; quantity: number }>): void {
    for (const { productId, quantity } of items) {
      const product = this.products.get(productId);
      if (product) {
        product.stock += quantity;
      }
    }
  }
}
