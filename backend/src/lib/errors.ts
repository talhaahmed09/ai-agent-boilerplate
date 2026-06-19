/**
 * Typed application errors and the single response envelope every route maps to.
 * The envelope shape is the cross-repo contract (see specs/registration/api-contract.md):
 *   { error: { code, message, fieldErrors?, unavailableItems? } }
 */

export type ErrorCode =
  | 'VALIDATION'
  | 'EMAIL_TAKEN'
  | 'INVALID_CREDENTIALS'
  | 'RATE_LIMIT'
  | 'INTERNAL'
  | 'UNAUTHORIZED'
  | 'CART_EMPTY'
  | 'ITEMS_UNAVAILABLE';

export interface UnavailableItem {
  productId: string;
  name: string;
}

export interface ErrorEnvelope {
  error: {
    code: ErrorCode;
    message: string;
    fieldErrors?: Record<string, string>;
    unavailableItems?: UnavailableItem[];
  };
}

/** An error that carries the HTTP status, the stable code, and optional field errors. */
export class AppError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly fieldErrors?: Record<string, string>;
  readonly unavailableItems?: UnavailableItem[];

  constructor(
    status: number,
    code: ErrorCode,
    message: string,
    fieldErrors?: Record<string, string>,
    unavailableItems?: UnavailableItem[],
  ) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.unavailableItems = unavailableItems;
  }
}

export const emailTaken = (): AppError =>
  new AppError(409, 'EMAIL_TAKEN', 'An account with that email already exists.', {
    email: 'An account with that email already exists.',
  });

export const invalidCredentials = (): AppError =>
  new AppError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password.');

export const rateLimited = (): AppError =>
  new AppError(429, 'RATE_LIMIT', 'Too many attempts. Please wait a few minutes and try again.');

export const validation = (
  message: string,
  fieldErrors: Record<string, string>,
): AppError => new AppError(400, 'VALIDATION', message, fieldErrors);

// demo: any non-empty Bearer token is accepted as authenticated
export const unauthorized = (): AppError =>
  new AppError(401, 'UNAUTHORIZED', 'Authorization header is missing or invalid.');

export const cartEmpty = (): AppError =>
  new AppError(400, 'CART_EMPTY', 'Your cart is empty.');

export const itemsUnavailable = (items: UnavailableItem[]): AppError =>
  new AppError(422, 'ITEMS_UNAVAILABLE', 'One or more items are out of stock.', undefined, items);

/** Map any error to the wire envelope. Unknown errors become an opaque 500. */
export function toEnvelope(err: unknown): { status: number; body: ErrorEnvelope } {
  if (err instanceof AppError) {
    return {
      status: err.status,
      body: {
        error: {
          code: err.code,
          message: err.message,
          ...(err.fieldErrors ? { fieldErrors: err.fieldErrors } : {}),
          ...(err.unavailableItems ? { unavailableItems: err.unavailableItems } : {}),
        },
      },
    };
  }
  return {
    status: 500,
    body: { error: { code: 'INTERNAL', message: 'Something went wrong. Please try again.' } },
  };
}
