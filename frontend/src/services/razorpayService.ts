'use client'

// Razorpay types
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOrderData {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  receipt: string;
  status: string;
}

interface PaymentVerificationData {
  paymentId: string;
  orderId: string;
  signature: string;
}

class RazorpayService {
  private keyId: string;
  private baseUrl: string;

  constructor() {
    this.keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_RPTmqUYFOHsjfL';
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://apnidukaan-api-gateway.onrender.com';
  }

  /**
   * Create Razorpay order (following official documentation)
   */
  async createOrder(data: {
    amount: number;
    currency?: string;
    receipt: string;
    notes?: Record<string, any>;
  }): Promise<{ success: boolean; data?: RazorpayOrderData; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/razorpay/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: data.amount,
          currency: data.currency || 'INR',
          receipt: data.receipt,
          notes: data.notes
        })
      });

      const result = await response.json();

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to create Razorpay order'
        };
      }

      return {
        success: true,
        data: result.data
      };

    } catch (error: any) {
      console.error('Razorpay order creation error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create Razorpay order'
      };
    }
  }

  /**
   * Verify Razorpay payment (following official documentation)
   */
  async verifyPayment(data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/razorpay/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Payment verification failed'
        };
      }

      return {
        success: true,
        data: result.data
      };

    } catch (error: any) {
      console.error('Razorpay payment verification error:', error);
      return {
        success: false,
        error: error.message || 'Payment verification failed'
      };
    }
  }

  /**
   * Open Razorpay payment modal (following official documentation)
   */
  async openPaymentModal(options: {
    amount: number;
    currency?: string;
    receipt: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    description?: string;
    onSuccess: (response: RazorpayResponse) => void;
    onError: (error: string) => void;
    onDismiss?: () => void;
  }): Promise<void> {
    try {
      // Create Razorpay order first
      const orderResult = await this.createOrder({
        amount: options.amount,
        currency: options.currency || 'INR',
        receipt: options.receipt,
        notes: {
          orderId: options.receipt
        }
      });

      if (!orderResult.success || !orderResult.data) {
        options.onError(orderResult.error || 'Failed to create payment order');
        return;
      }

      const orderData = orderResult.data;

      // Load Razorpay script if not already loaded
      await this.loadRazorpayScript();

      // Create Razorpay options (following official documentation)
      const razorpayOptions: RazorpayOptions = {
        key: this.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'ApniDukaan',
        description: options.description || `Payment for order ${orderData.receipt}`,
        order_id: orderData.orderId,
        prefill: {
          name: options.customerName,
          email: options.customerEmail,
          contact: options.customerPhone
        },
        notes: {
          orderId: options.receipt
        },
        theme: {
          color: '#3B82F6'
        },
        handler: async (response: RazorpayResponse) => {
          try {
            // Verify payment on server
            const verificationResult = await this.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verificationResult.success) {
              options.onSuccess(response);
            } else {
              options.onError(verificationResult.error || 'Payment verification failed');
            }
          } catch (error: any) {
            options.onError(error.message || 'Payment verification failed');
          }
        },
        modal: {
          ondismiss: options.onDismiss
        }
      };

      // Open Razorpay modal
      const razorpay = new (window as any).Razorpay(razorpayOptions);
      razorpay.open();

    } catch (error: any) {
      console.error('Razorpay payment modal error:', error);
      options.onError(error.message || 'Failed to open payment modal');
    }
  }

  /**
   * Load Razorpay script dynamically
   */
  private loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay script'));
      document.body.appendChild(script);
    });
  }

  /**
   * Format amount for Razorpay (convert to paise for INR)
   */
  formatAmount(amount: number, currency: string = 'INR'): number {
    if (currency === 'INR') {
      return Math.round(amount * 100); // Convert to paise
    }
    return Math.round(amount * 100); // Convert to cents for other currencies
  }

  /**
   * Get supported payment methods for Razorpay
   */
  getSupportedMethods(): string[] {
    return [
      'card',
      'netbanking',
      'wallet',
      'upi',
      'emi'
    ];
  }
}

// Export singleton instance
export const razorpayService = new RazorpayService();
export default razorpayService;
