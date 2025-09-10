import { 
  EventHandler, 
  EventType,
  OrderCreatedEvent,
  OrderShippedEvent,
  OrderDeliveredEvent,
  PaymentCompletedEvent,
  PaymentFailedEvent,
  UserRegisteredEvent,
  ProductStockLowEvent
} from '../events/event.types';
import { notificationService, NotificationRequest } from '../services/notification.service';
import { logger } from '../utils/logger';

export class OrderNotificationHandler implements EventHandler<OrderCreatedEvent> {
  canHandle(eventType: EventType): boolean {
    return eventType === EventType.ORDER_CREATED;
  }

  async handle(event: OrderCreatedEvent): Promise<void> {
    try {
      logger.info('Processing order created notification', {
        eventId: event.id,
        orderId: event.data.orderId,
        customerEmail: event.data.customerEmail,
        action: 'order_created_notification'
      });

      // Send order confirmation email
      const emailRequest: NotificationRequest = {
        to: event.data.customerEmail,
        channel: 'email' as any,
        template: 'order_confirmation_email',
        variables: {
          customerName: event.data.customerName,
          orderNumber: event.data.orderNumber,
          items: event.data.items,
          total: event.data.total,
          shippingAddress: event.data.shippingAddress
        },
        priority: 'high' as any,
        metadata: {
          orderId: event.data.orderId,
          eventId: event.id
        }
      };

      const emailResult = await notificationService.sendNotification(emailRequest);
      
      logger.info('Order confirmation email sent', {
        eventId: event.id,
        orderId: event.data.orderId,
        notificationId: emailResult.id,
        status: emailResult.status,
        action: 'order_confirmation_email_sent'
      });

      // Send SMS if phone number is available
      if (event.data.customerEmail) { // In real implementation, get phone from user profile
        const smsRequest: NotificationRequest = {
          to: '+1234567890', // In real implementation, get from user profile
          channel: 'sms' as any,
          template: 'order_confirmation_sms',
          variables: {
            customerName: event.data.customerName,
            orderNumber: event.data.orderNumber,
            total: event.data.total
          },
          priority: 'normal' as any,
          metadata: {
            orderId: event.data.orderId,
            eventId: event.id
          }
        };

        const smsResult = await notificationService.sendNotification(smsRequest);
        
        logger.info('Order confirmation SMS sent', {
          eventId: event.id,
          orderId: event.data.orderId,
          notificationId: smsResult.id,
          status: smsResult.status,
          action: 'order_confirmation_sms_sent'
        });
      }

    } catch (error) {
      logger.error('Failed to process order created notification', {
        eventId: event.id,
        orderId: event.data.orderId,
        error: (error as any).message,
        action: 'order_created_notification_error'
      });
      throw error;
    }
  }
}

export class OrderShippedNotificationHandler implements EventHandler<OrderShippedEvent> {
  canHandle(eventType: EventType): boolean {
    return eventType === EventType.ORDER_SHIPPED;
  }

  async handle(event: OrderShippedEvent): Promise<void> {
    try {
      logger.info('Processing order shipped notification', {
        eventId: event.id,
        orderId: event.data.orderId,
        trackingNumber: event.data.trackingNumber,
        action: 'order_shipped_notification'
      });

      // Send shipping notification email
      const emailRequest: NotificationRequest = {
        to: event.data.customerId, // In real implementation, get email from user profile
        channel: 'email' as any,
        template: 'order_shipped_email',
        variables: {
          customerName: 'Customer', // In real implementation, get from user profile
          orderNumber: event.data.orderNumber,
          trackingNumber: event.data.trackingNumber,
          carrier: event.data.carrier,
          estimatedDelivery: event.data.estimatedDelivery
        },
        priority: 'high' as any,
        metadata: {
          orderId: event.data.orderId,
          eventId: event.id
        }
      };

      const emailResult = await notificationService.sendNotification(emailRequest);
      
      logger.info('Order shipped email sent', {
        eventId: event.id,
        orderId: event.data.orderId,
        notificationId: emailResult.id,
        status: emailResult.status,
        action: 'order_shipped_email_sent'
      });

      // Send SMS notification
      const smsRequest: NotificationRequest = {
        to: '+1234567890', // In real implementation, get from user profile
        channel: 'sms' as any,
        template: 'order_shipped_sms',
        variables: {
          orderNumber: event.data.orderNumber,
          trackingNumber: event.data.trackingNumber,
          estimatedDelivery: event.data.estimatedDelivery
        },
        priority: 'normal' as any,
        metadata: {
          orderId: event.data.orderId,
          eventId: event.id
        }
      };

      const smsResult = await notificationService.sendNotification(smsRequest);
      
      logger.info('Order shipped SMS sent', {
        eventId: event.id,
        orderId: event.data.orderId,
        notificationId: smsResult.id,
        status: smsResult.status,
        action: 'order_shipped_sms_sent'
      });

    } catch (error) {
      logger.error('Failed to process order shipped notification', {
        eventId: event.id,
        orderId: event.data.orderId,
        error: (error as any).message,
        action: 'order_shipped_notification_error'
      });
      throw error;
    }
  }
}

export class OrderDeliveredNotificationHandler implements EventHandler<OrderDeliveredEvent> {
  canHandle(eventType: EventType): boolean {
    return eventType === EventType.ORDER_DELIVERED;
  }

  async handle(event: OrderDeliveredEvent): Promise<void> {
    try {
      logger.info('Processing order delivered notification', {
        eventId: event.id,
        orderId: event.data.orderId,
        deliveredAt: event.data.deliveredAt,
        action: 'order_delivered_notification'
      });

      // Send delivery confirmation email
      const emailRequest: NotificationRequest = {
        to: event.data.customerId, // In real implementation, get email from user profile
        channel: 'email' as any,
        template: 'order_delivered_email',
        variables: {
          customerName: 'Customer', // In real implementation, get from user profile
          orderNumber: event.data.orderNumber,
          deliveredTo: event.data.deliveredTo,
          deliveredAt: event.data.deliveredAt
        },
        priority: 'normal' as any,
        metadata: {
          orderId: event.data.orderId,
          eventId: event.id
        }
      };

      const emailResult = await notificationService.sendNotification(emailRequest);
      
      logger.info('Order delivered email sent', {
        eventId: event.id,
        orderId: event.data.orderId,
        notificationId: emailResult.id,
        status: emailResult.status,
        action: 'order_delivered_email_sent'
      });

    } catch (error) {
      logger.error('Failed to process order delivered notification', {
        eventId: event.id,
        orderId: event.data.orderId,
        error: (error as any).message,
        action: 'order_delivered_notification_error'
      });
      throw error;
    }
  }
}

export class PaymentNotificationHandler implements EventHandler<PaymentCompletedEvent | PaymentFailedEvent> {
  canHandle(eventType: EventType): boolean {
    return eventType === EventType.PAYMENT_COMPLETED || eventType === EventType.PAYMENT_FAILED;
  }

  async handle(event: PaymentCompletedEvent | PaymentFailedEvent): Promise<void> {
    try {
      if (event.type === EventType.PAYMENT_COMPLETED) {
        await this.handlePaymentCompleted(event as PaymentCompletedEvent);
      } else if (event.type === EventType.PAYMENT_FAILED) {
        await this.handlePaymentFailed(event as PaymentFailedEvent);
      }
    } catch (error) {
      logger.error('Failed to process payment notification', {
        eventId: event.id,
        paymentId: event.data.paymentId,
        error: (error as any).message,
        action: 'payment_notification_error'
      });
      throw error;
    }
  }

  private async handlePaymentCompleted(event: PaymentCompletedEvent): Promise<void> {
    logger.info('Processing payment completed notification', {
      eventId: event.id,
      paymentId: event.data.paymentId,
      orderId: event.data.orderId,
      action: 'payment_completed_notification'
    });

    const emailRequest: NotificationRequest = {
      to: event.data.customerId, // In real implementation, get email from user profile
      channel: 'email' as any,
      template: 'payment_confirmation_email',
      variables: {
        customerName: 'Customer', // In real implementation, get from user profile
        orderNumber: event.data.orderId,
        amount: event.data.amount,
        paymentMethod: event.data.paymentMethod,
        transactionId: event.data.transactionId
      },
      priority: 'high' as any,
      metadata: {
        paymentId: event.data.paymentId,
        orderId: event.data.orderId,
        eventId: event.id
      }
    };

    const emailResult = await notificationService.sendNotification(emailRequest);
    
    logger.info('Payment confirmation email sent', {
      eventId: event.id,
      paymentId: event.data.paymentId,
      notificationId: emailResult.id,
      status: emailResult.status,
      action: 'payment_confirmation_email_sent'
    });
  }

  private async handlePaymentFailed(event: PaymentFailedEvent): Promise<void> {
    logger.info('Processing payment failed notification', {
      eventId: event.id,
      paymentId: event.data.paymentId,
      orderId: event.data.orderId,
      errorCode: event.data.errorCode,
      action: 'payment_failed_notification'
    });

    const emailRequest: NotificationRequest = {
      to: event.data.customerId, // In real implementation, get email from user profile
      channel: 'email' as any,
      template: 'payment_failed_email',
      variables: {
        customerName: 'Customer', // In real implementation, get from user profile
        orderNumber: event.data.orderId,
        amount: event.data.amount,
        paymentMethod: event.data.paymentMethod,
        errorMessage: event.data.errorMessage
      },
      priority: 'high' as any,
      metadata: {
        paymentId: event.data.paymentId,
        orderId: event.data.orderId,
        eventId: event.id
      }
    };

    const emailResult = await notificationService.sendNotification(emailRequest);
    
    logger.info('Payment failed email sent', {
      eventId: event.id,
      paymentId: event.data.paymentId,
      notificationId: emailResult.id,
      status: emailResult.status,
      action: 'payment_failed_email_sent'
    });
  }
}

export class UserNotificationHandler implements EventHandler<UserRegisteredEvent> {
  canHandle(eventType: EventType): boolean {
    return eventType === EventType.USER_REGISTERED;
  }

  async handle(event: UserRegisteredEvent): Promise<void> {
    try {
      logger.info('Processing user registered notification', {
        eventId: event.id,
        userId: event.data.userId,
        email: event.data.email,
        action: 'user_registered_notification'
      });

      const emailRequest: NotificationRequest = {
        to: event.data.email,
        channel: 'email' as any,
        template: 'welcome_email',
        variables: {
          customerName: event.data.name
        },
        priority: 'normal' as any,
        metadata: {
          userId: event.data.userId,
          eventId: event.id
        }
      };

      const emailResult = await notificationService.sendNotification(emailRequest);
      
      logger.info('Welcome email sent', {
        eventId: event.id,
        userId: event.data.userId,
        notificationId: emailResult.id,
        status: emailResult.status,
        action: 'welcome_email_sent'
      });

    } catch (error) {
      logger.error('Failed to process user registered notification', {
        eventId: event.id,
        userId: event.data.userId,
        error: (error as any).message,
        action: 'user_registered_notification_error'
      });
      throw error;
    }
  }
}

export class AdminNotificationHandler implements EventHandler<ProductStockLowEvent> {
  canHandle(eventType: EventType): boolean {
    return eventType === EventType.PRODUCT_STOCK_LOW;
  }

  async handle(event: ProductStockLowEvent): Promise<void> {
    try {
      logger.info('Processing low stock notification', {
        eventId: event.id,
        productId: event.data.productId,
        productName: event.data.productName,
        currentStock: event.data.currentStock,
        action: 'low_stock_notification'
      });

      const emailRequest: NotificationRequest = {
        to: process.env.ADMIN_EMAIL || 'admin@apnidukaan.com',
        channel: 'email' as any,
        template: 'low_stock_email',
        variables: {
          productName: event.data.productName,
          sku: event.data.sku,
          currentStock: event.data.currentStock,
          lowStockThreshold: event.data.lowStockThreshold
        },
        priority: 'high' as any,
        metadata: {
          productId: event.data.productId,
          eventId: event.id
        }
      };

      const emailResult = await notificationService.sendNotification(emailRequest);
      
      logger.info('Low stock email sent', {
        eventId: event.id,
        productId: event.data.productId,
        notificationId: emailResult.id,
        status: emailResult.status,
        action: 'low_stock_email_sent'
      });

    } catch (error) {
      logger.error('Failed to process low stock notification', {
        eventId: event.id,
        productId: event.data.productId,
        error: (error as any).message,
        action: 'low_stock_notification_error'
      });
      throw error;
    }
  }
}
