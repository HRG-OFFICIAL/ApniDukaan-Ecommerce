'use client';

import { loadStripe, Stripe, StripeElements, PaymentIntent, StripeError } from '@stripe/stripe-js';

export interface PaymentIntentData {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  customerId?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  success: boolean;
  paymentIntent?: PaymentIntent;
  error?: string;
  requiresAction?: boolean;
}

class StripeService {
  private static instance: StripeService;
  private stripe: Promise<Stripe | null>;
  private publishableKey: string;

  constructor() {
    this.publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51JVHxn...';
    this.stripe = loadStripe(this.publishableKey);
  }

  static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  async getStripe(): Promise<Stripe | null> {
    return await this.stripe;
  }

  // Create payment intent on the server
  async createPaymentIntent(data: PaymentIntentData): Promise<{ clientSecret: string; paymentIntentId: string } | null> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace('/graphql', '')}/api/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Payment intent creation failed: ${response.status}`);
      }

      const result = await response.json();
      return {
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId
      };
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      return null;
    }
  }

  // Confirm payment with Stripe Elements
  async confirmPayment(
    elements: StripeElements,
    confirmationUrl: string = `${window.location.origin}/checkout/success`
  ): Promise<PaymentResult> {
    try {
      const stripe = await this.getStripe();
      if (!stripe || !elements) {
        return { success: false, error: 'Stripe not initialized' };
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: confirmationUrl,
        },
        redirect: 'if_required'
      });

      if (error) {
        return {
          success: false,
          error: error.message,
          requiresAction: error.type === 'card_error' && error.code === 'authentication_required'
        };
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        return {
          success: true,
          paymentIntent
        };
      }

      if (paymentIntent && paymentIntent.status === 'requires_action') {
        return {
          success: false,
          requiresAction: true,
          paymentIntent
        };
      }

      return {
        success: false,
        error: 'Payment processing failed'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unexpected error occurred'
      };
    }
  }

  // Confirm payment with payment method (for manual confirmation)
  async confirmPaymentWithPaymentMethod(
    clientSecret: string,
    paymentMethodId: string
  ): Promise<PaymentResult> {
    try {
      const stripe = await this.getStripe();
      if (!stripe) {
        return { success: false, error: 'Stripe not initialized' };
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethodId
      });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        paymentIntent
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Payment confirmation failed'
      };
    }
  }

  // Create setup intent for saving payment methods
  async createSetupIntent(customerId: string): Promise<{ clientSecret: string } | null> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace('/graphql', '')}/api/payments/setup-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ customerId })
      });

      if (!response.ok) {
        throw new Error('Setup intent creation failed');
      }

      const result = await response.json();
      return { clientSecret: result.clientSecret };
    } catch (error) {
      console.error('Failed to create setup intent:', error);
      return null;
    }
  }

  // Retrieve saved payment methods
  async getPaymentMethods(customerId: string) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace('/graphql', '')}/api/payments/payment-methods/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to retrieve payment methods');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get payment methods:', error);
      return { paymentMethods: [] };
    }
  }

  // Handle webhook events (for server-side)
  async handleWebhookEvent(event: any): Promise<boolean> {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          // Handle successful payment
          console.log('Payment succeeded:', event.data.object);
          break;
        case 'payment_intent.payment_failed':
          // Handle failed payment
          console.log('Payment failed:', event.data.object);
          break;
        case 'payment_method.attached':
          // Handle payment method attached
          console.log('Payment method attached:', event.data.object);
          break;
        default:
          console.log('Unhandled event type:', event.type);
      }
      return true;
    } catch (error) {
      console.error('Webhook handling failed:', error);
      return false;
    }
  }

  // Utility methods
  formatAmountForStripe(amount: number, currency: string = 'usd'): number {
    // Stripe amounts are in the smallest currency unit (e.g., cents for USD)
    return Math.round(amount * 100);
  }

  formatAmountFromStripe(amount: number, currency: string = 'usd'): number {
    return amount / 100;
  }

  validateCard(cardNumber: string): boolean {
    // Basic Luhn algorithm validation
    const sanitized = cardNumber.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(sanitized)) return false;

    let sum = 0;
    let shouldDouble = false;

    for (let i = sanitized.length - 1; i >= 0; i--) {
      let digit = parseInt(sanitized[i]);

      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  }

  getCardBrand(cardNumber: string): string {
    const sanitized = cardNumber.replace(/\s/g, '');
    
    if (/^4/.test(sanitized)) return 'visa';
    if (/^5[1-5]/.test(sanitized)) return 'mastercard';
    if (/^3[47]/.test(sanitized)) return 'american_express';
    if (/^6(?:011|5)/.test(sanitized)) return 'discover';
    
    return 'unknown';
  }

  // Test mode helpers
  getTestCards() {
    return {
      visa: '4242424242424242',
      visa_debit: '4000056655665556',
      mastercard: '5555555555554444',
      amex: '378282246310005',
      declined: '4000000000000002',
      insufficient_funds: '4000000000009995',
      requires_auth: '4000002760003184'
    };
  }
}

export const stripeService = StripeService.getInstance();
