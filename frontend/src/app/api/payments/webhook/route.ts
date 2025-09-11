import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe signature');
      return NextResponse.json(
        { error: 'Missing stripe signature' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);
        await handlePaymentSucceeded(paymentIntent);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', failedPayment.id);
        await handlePaymentFailed(failedPayment);
        break;

      case 'payment_method.attached':
        const paymentMethod = event.data.object as Stripe.PaymentMethod;
        console.log('Payment method attached:', paymentMethod.id);
        await handlePaymentMethodAttached(paymentMethod);
        break;

      case 'customer.created':
        const customer = event.data.object as Stripe.Customer;
        console.log('Customer created:', customer.id);
        await handleCustomerCreated(customer);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice payment succeeded:', invoice.id);
        await handleInvoicePaymentSucceeded(invoice);
        break;

      case 'charge.dispute.created':
        const dispute = event.data.object as Stripe.Dispute;
        console.log('Dispute created:', dispute.id);
        await handleDisputeCreated(dispute);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Event handlers
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const orderId = paymentIntent.metadata?.orderId;
    
    if (!orderId) {
      console.error('No order ID found in payment intent metadata');
      return;
    }

    // Here you would typically:
    // 1. Update order status in database
    // 2. Send confirmation email
    // 3. Update inventory
    // 4. Trigger fulfillment process

    console.log(`Order ${orderId} payment confirmed: ${paymentIntent.id}`);
    
    // Simulate database update
    const orderUpdate = {
      orderId,
      status: 'paid',
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      paymentMethod: paymentIntent.payment_method,
      updatedAt: new Date().toISOString(),
    };

    console.log('Order updated:', orderUpdate);

    // TODO: Send confirmation email
    // TODO: Update inventory
    // TODO: Trigger order fulfillment

  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const orderId = paymentIntent.metadata?.orderId;
    
    if (!orderId) {
      console.error('No order ID found in payment intent metadata');
      return;
    }

    console.log(`Order ${orderId} payment failed: ${paymentIntent.id}`);
    
    // Here you would typically:
    // 1. Update order status to 'payment_failed'
    // 2. Send failure notification email
    // 3. Release inventory hold
    // 4. Log for customer service follow-up

    const orderUpdate = {
      orderId,
      status: 'payment_failed',
      paymentIntentId: paymentIntent.id,
      failureReason: paymentIntent.last_payment_error?.message,
      updatedAt: new Date().toISOString(),
    };

    console.log('Order payment failed:', orderUpdate);

  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  try {
    console.log(`Payment method ${paymentMethod.id} attached to customer ${paymentMethod.customer}`);
    
    // Here you could:
    // 1. Update customer's payment methods in your database
    // 2. Send notification about saved payment method
    // 3. Update customer preferences

  } catch (error) {
    console.error('Error handling payment method attached:', error);
  }
}

async function handleCustomerCreated(customer: Stripe.Customer) {
  try {
    console.log(`Customer created: ${customer.id}`);
    
    // Here you could:
    // 1. Sync customer data with your database
    // 2. Send welcome email
    // 3. Set up customer preferences

  } catch (error) {
    console.error('Error handling customer created:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    console.log(`Invoice payment succeeded: ${invoice.id}`);
    
    // Handle subscription or recurring payment success
    // 1. Update subscription status
    // 2. Extend service access
    // 3. Send receipt email

  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
  }
}

async function handleDisputeCreated(dispute: Stripe.Dispute) {
  try {
    console.log(`Dispute created: ${dispute.id} for charge ${dispute.charge}`);
    
    // Handle chargeback/dispute
    // 1. Flag order for review
    // 2. Gather evidence
    // 3. Notify customer service team
    // 4. Send notification to relevant parties

  } catch (error) {
    console.error('Error handling dispute created:', error);
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
