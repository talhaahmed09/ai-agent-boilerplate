/**
 * OrderStore interface and in-memory implementation.
 * The interface keeps route handlers and services decoupled from the concrete
 * store so tests can inject controlled instances without touching shared state.
 */

// demo: in-memory order store; replace with a DB-backed store for production

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postcode: string;
  country: string;
  phone: string;
}

export interface Order {
  orderNumber: number;
  items: OrderItem[];
  total: number;
  shippingAddress: ShippingAddress;
}

export interface OrderStore {
  /**
   * Persist a new order and return it with its assigned orderNumber.
   * orderNumber is assigned by the store, starting at 1001 and incrementing.
   */
  create(input: Omit<Order, 'orderNumber'>): Order;
}

// demo: order counter starts at 1001 per API contract
const INITIAL_ORDER_NUMBER = 1001;

export class InMemoryOrderStore implements OrderStore {
  // demo: in-memory sequential order counter; not thread-safe but adequate for demo
  private nextOrderNumber = INITIAL_ORDER_NUMBER;
  private readonly orders: Order[] = [];

  create(input: Omit<Order, 'orderNumber'>): Order {
    const order: Order = {
      orderNumber: this.nextOrderNumber++,
      ...input,
    };
    this.orders.push(order);
    return order;
  }
}
