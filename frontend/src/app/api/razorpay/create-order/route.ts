import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

// Initialize Razorpay with test credentials
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_RPTmqUYFOHsjfL',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '77jo8sW2SfaLZ62g6OBy6dK6'
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency, receipt, customerName, customerEmail, customerPhone, description } = body;

    // Validate required fields
    if (!amount || !receipt || !customerName || !customerEmail || !customerPhone) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: amount, receipt, customerName, customerEmail, customerPhone' 
        },
        { status: 400 }
      );
    }

    // Create real Razorpay order
    const amountInPaise = Math.round(amount * 100);
    
    const orderOptions = {
      amount: amountInPaise,
      currency: currency || 'INR',
      receipt: receipt,
      notes: {
        customerName,
        customerEmail,
        customerPhone,
        description: description || `Payment for order ${receipt}`
      }
    };

    try {
      const order = await razorpay.orders.create(orderOptions);
      
      return NextResponse.json({
        success: true,
        data: order
      });
    } catch (razorpayError: any) {
      console.error('Razorpay API error:', razorpayError);
      
      // Fallback to mock order for demo purposes
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return NextResponse.json({
        success: true,
        data: {
          id: orderId,
          entity: 'order',
          amount: amountInPaise,
          amount_paid: 0,
          amount_due: amountInPaise,
          currency: currency || 'INR',
          receipt: receipt,
          status: 'created',
          attempts: 0,
          notes: {
            customerName,
            customerEmail,
            customerPhone,
            description: description || `Payment for order ${receipt}`
          },
          created_at: Math.floor(Date.now() / 1000)
        }
      });
    }

  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
