export const orderConfig = {
  redis: {
    uri: process.env.REDIS_URI || 'redis://localhost:6379',
    cacheTtlSeconds: parseInt(process.env.REDIS_CACHE_TTL || '1800'),
  },
  inventory: {
    reservationExpiryMs: parseInt(process.env.INVENTORY_RESERVATION_EXPIRY || '1800000'), // 30 minutes
  },
  currency: process.env.DEFAULT_CURRENCY || 'USD',
  idempotency: {
    keyTtlSeconds: parseInt(process.env.IDEMPOTENCY_KEY_TTL || '3600'), // 1 hour
  },
  pagination: {
    defaultLimit: parseInt(process.env.DEFAULT_PAGE_LIMIT || '20'),
    maxLimit: parseInt(process.env.MAX_PAGE_LIMIT || '100'),
  },
  cache: {
    orderTtlSeconds: parseInt(process.env.ORDER_CACHE_TTL || '1800'), // 30 minutes
  }
};

export default orderConfig;
