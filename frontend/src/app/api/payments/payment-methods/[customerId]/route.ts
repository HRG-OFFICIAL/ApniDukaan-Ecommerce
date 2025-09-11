import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const { customerId } = params;

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Check if customer exists
    let customer;
    try {
      customer = await stripe.customers.retrieve(customerId);
    } catch {
      return NextResponse.json({
        paymentMethods: [],
      });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer.id,
      type: 'card',
    });

    return NextResponse.json({
      paymentMethods: paymentMethods.data,
    });
  } catch (error: any) {
    console.error('Payment methods retrieval error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve payment methods' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const { customerId } = params;
    const { searchParams } = new URL(request.url);
    const paymentMethodId = searchParams.get('payment_method_id');

    if (!customerId || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Customer ID and Payment Method ID are required' },
        { status: 400 }
      );
    }

    await stripe.paymentMethods.detach(paymentMethodId);

    return NextResponse.json({
      success: true,
      message: 'Payment method removed successfully',
    });
  } catch (error: any) {
    console.error('Payment method deletion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove payment method' },
      { status: 500 }
    );
  }
}
