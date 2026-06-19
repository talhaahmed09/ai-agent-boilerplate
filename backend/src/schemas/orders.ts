/**
 * JSON schema for POST /orders request body — the validation boundary.
 * Fastify validates against this before the handler runs.
 * addressLine2 is optional; all other shippingAddress fields are required.
 */

export const orderBodySchema = {
  type: 'object',
  required: ['items', 'shippingAddress'],
  additionalProperties: false,
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        required: ['productId', 'quantity'],
        additionalProperties: false,
        properties: {
          productId: { type: 'string', minLength: 1 },
          quantity: { type: 'integer', minimum: 1 },
        },
      },
    },
    shippingAddress: {
      type: 'object',
      // No required list here — service validates presence and non-emptiness
      // so it can return per-field fieldErrors (ERR-3).
      additionalProperties: false,
      properties: {
        fullName:     { type: 'string' },
        addressLine1: { type: 'string' },
        addressLine2: { type: 'string' },
        city:         { type: 'string' },
        postcode:     { type: 'string' },
        country:      { type: 'string' },
        phone:        { type: 'string' },
      },
    },
  },
} as const;

export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface ShippingAddressInput {
  // All fields are optional at the TypeScript boundary so the service can
  // validate presence and return per-field fieldErrors (ERR-3).
  fullName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode?: string;
  country?: string;
  phone?: string;
}

export interface OrderBody {
  items: OrderItem[];
  shippingAddress: ShippingAddressInput;
}
