export class OrderError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'OrderError';
    this.code = code;
    this.statusCode = statusCode;
    this.context = context || {};
  }
}

export class OrderNotFoundError extends OrderError {
  constructor(orderId: string) {
    super(`Order not found: ${orderId}`, 'ORDER_NOT_FOUND', 404, { orderId });
  }
}

export class OrderValidationError extends OrderError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'ORDER_VALIDATION_ERROR', 400, context);
  }
}

export class InventoryInsufficientError extends OrderError {
  constructor(productId: string, requested: number, available: number) {
    super(
      `Insufficient inventory for product ${productId}`,
      'INVENTORY_INSUFFICIENT',
      409,
      { productId, requested, available }
    );
  }
}

export class PaymentProcessingError extends OrderError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'PAYMENT_PROCESSING_ERROR', 402, context);
  }
}

export class OrderStateError extends OrderError {
  constructor(message: string, currentStatus: string, context?: Record<string, any>) {
    super(message, 'ORDER_STATE_ERROR', 409, { currentStatus, ...context });
  }
}

export class IdempotencyError extends OrderError {
  constructor(key: string, message: string = 'Duplicate request detected') {
    super(message, 'IDEMPOTENCY_ERROR', 409, { key });
  }
}
