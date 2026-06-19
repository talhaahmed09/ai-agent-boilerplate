/**
 * Order business logic.
 * Validates the cart, checks stock, creates the order, and decrements stock.
 * Stock decrement and order creation are performed together; if order creation
 * throws after stock is decremented, the decrement is rolled back (atomicity).
 *
 * All demo-only behaviour is marked with `// demo:` comments.
 */
import { ProductStore } from '../data/productStore';
import { OrderStore, Order } from '../data/orderStore';
import { cartEmpty, itemsUnavailable, validation } from '../lib/errors';
import { OrderBody } from '../schemas/orders';

const REQUIRED_ADDRESS_FIELDS: Array<keyof OrderBody['shippingAddress']> = [
  'fullName',
  'addressLine1',
  'city',
  'postcode',
  'country',
  'phone',
];

/**
 * Place an order.
 * @param products - ProductStore (injected; can be in-memory for tests)
 * @param orders   - OrderStore   (injected; can be in-memory for tests)
 * @param input    - Validated request body
 * @returns The created Order
 */
export function placeOrder(
  products: ProductStore,
  orders: OrderStore,
  input: OrderBody,
): Order {
  // Validate: items must be non-empty
  if (!input.items || input.items.length === 0) {
    throw cartEmpty();
  }

  // Validate: required shipping address fields must be non-empty strings
  const fieldErrors: Record<string, string> = {};
  for (const field of REQUIRED_ADDRESS_FIELDS) {
    const value = input.shippingAddress[field];
    if (typeof value !== 'string' || value.trim() === '') {
      fieldErrors[field] = `${field} is required.`;
    }
  }
  if (Object.keys(fieldErrors).length > 0) {
    throw validation('Please correct the highlighted fields.', fieldErrors);
  }

  // All required address fields are now validated non-empty strings.
  // reason: TypeScript sees ShippingAddressInput fields as optional; the
  // validation loop above guarantees they are all present non-empty strings
  // at this point, so the cast is safe.
  const shippingAddress = input.shippingAddress as {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postcode: string;
    country: string;
    phone: string;
  };

  // Resolve each ordered item against the product catalogue
  // demo: unitPrice taken from the backend catalogue, not from the request body
  const resolvedItems: Array<{
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }> = [];
  const unavailableItems: Array<{ productId: string; name: string }> = [];

  for (const { productId, quantity } of input.items) {
    const product = products.findById(productId);
    if (!product || product.stock < quantity) {
      // Item is OOS or stock insufficient — collect it for the error report
      unavailableItems.push({
        productId,
        name: product ? product.name : productId,
      });
    } else {
      resolvedItems.push({
        productId: product.id,
        name: product.name,
        quantity,
        unitPrice: product.price, // demo: always current backend price
      });
    }
  }

  if (unavailableItems.length > 0) {
    throw itemsUnavailable(unavailableItems);
  }

  // Calculate total
  const total = resolvedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  // Round to 2 decimal places to avoid floating-point drift
  const roundedTotal = Math.round(total * 100) / 100;

  // Atomically decrement stock then create the order.
  // If order creation throws after stock is decremented, roll back via
  // a compensating call to the store (spec: stock atomicity).
  const decrementTargets = resolvedItems.map(({ productId, quantity }) => ({ productId, quantity }));
  products.decrementStock(decrementTargets);

  let order: Order;
  try {
    order = orders.create({
      items: resolvedItems,
      total: roundedTotal,
      shippingAddress,
    });
  } catch (createError) {
    // Stock atomicity: restore what we decremented if order creation fails
    products.restoreStock(decrementTargets);
    throw createError;
  }

  return order;
}
