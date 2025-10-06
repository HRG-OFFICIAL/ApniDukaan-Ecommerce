/**
 * Razorpay utility functions for script loading and order management
 */

export const loadScript = (src: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      console.log('Razorpay script loaded successfully');
      resolve(true);
    };
    script.onerror = (error) => {
      console.error('Failed to load Razorpay script:', error);
      reject(false);
    };
    document.body.appendChild(script);
  });
};

export interface RazorpayOrderData {
  amount: number;
  currency: string;
  receipt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description?: string;
}

export interface RazorpayOrderResponse {
  success: boolean;
  data: {
    orderId: string;
    amount: number;
    currency: string;
    receipt: string;
    status: string;
    keyId: string;
    notes?: any;
  };
  error?: string;
}

export const createRazorpayOrder = async (orderData: RazorpayOrderData): Promise<RazorpayOrderResponse> => {
  try {
    const response = await fetch('/api/razorpay/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create Razorpay order');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
};

export interface RazorpayVerificationData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayVerificationResponse {
  success: boolean;
  data: {
    paymentId: string;
    orderId: string;
    status: string;
    verifiedAt: string;
  };
  error?: string;
}

export const verifyRazorpayPayment = async (verificationData: RazorpayVerificationData): Promise<RazorpayVerificationResponse> => {
  try {
    const response = await fetch('/api/razorpay/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verificationData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to verify payment');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    throw error;
  }
};

export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export const formatAmountForRazorpay = (amount: number): number => {
  // Convert to paise (multiply by 100)
  return Math.round(amount * 100);
};

export const getSupportedPaymentMethods = (): string[] => {
  return ['card', 'upi', 'netbanking', 'wallet', 'emi', 'paylater'];
};

// Razorpay configuration
export const RAZORPAY_CONFIG = {
  keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_RPTmqUYFOHsjfL',
  currency: 'INR',
  theme: {
    color: '#2563eb'
  }
};
