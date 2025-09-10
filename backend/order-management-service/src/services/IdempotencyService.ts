import { RedisClientType } from 'redis';
import { IdempotencyError } from '../errors/OrderErrors';
import { orderConfig } from '../config/order.config';

export class IdempotencyService {
  private redisClient: RedisClientType;

  constructor(redisClient: RedisClientType) {
    this.redisClient = redisClient;
  }

  /**
   * Check if a request with the given idempotency key has already been processed
   */
  async checkIdempotency(key: string): Promise<boolean> {
    try {
      const existingKey = await this.redisClient.get(`idempotency:${key}`);
      return existingKey !== null;
    } catch (error) {
      console.error('Error checking idempotency:', error);
      return false; // Allow request to proceed if Redis is down
    }
  }

  /**
   * Mark a request as processed with the given idempotency key
   */
  async markAsProcessed(key: string, result: any): Promise<void> {
    try {
      await this.redisClient.setEx(
        `idempotency:${key}`,
        orderConfig.idempotency.keyTtlSeconds,
        JSON.stringify(result)
      );
    } catch (error) {
      console.error('Error marking request as processed:', error);
      // Don't throw error as the main operation might have succeeded
    }
  }

  /**
   * Get the result of a previously processed request
   */
  async getProcessedResult(key: string): Promise<any | null> {
    try {
      const result = await this.redisClient.get(`idempotency:${key}`);
      return result ? JSON.parse(result) : null;
    } catch (error) {
      console.error('Error getting processed result:', error);
      return null;
    }
  }

  /**
   * Generate an idempotency key from request data
   */
  generateKey(operation: string, data: any): string {
    const dataString = JSON.stringify(data);
    const hash = require('crypto')
      .createHash('sha256')
      .update(`${operation}:${dataString}`)
      .digest('hex');
    return `${operation}:${hash}`;
  }

  /**
   * Process a request with idempotency check
   */
  async processWithIdempotency<T>(
    key: string,
    operation: () => Promise<T>
  ): Promise<T> {
    // Check if already processed
    const existingResult = await this.getProcessedResult(key);
    if (existingResult) {
      throw new IdempotencyError(key);
    }

    // Check if currently being processed
    const isProcessing = await this.checkIdempotency(key);
    if (isProcessing) {
      throw new IdempotencyError(key, 'Request is currently being processed');
    }

    // Mark as processing
    await this.markAsProcessed(key, { status: 'processing' });

    try {
      // Execute the operation
      const result = await operation();
      
      // Mark as completed with result
      await this.markAsProcessed(key, { status: 'completed', result });
      
      return result;
    } catch (error) {
      // Remove the processing marker on error
      await this.redisClient.del(`idempotency:${key}`);
      throw error;
    }
  }
}
