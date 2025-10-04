# Razorpay Integration Setup Guide

This guide will help you set up Razorpay payment integration for the ApniDukaan e-commerce platform following the official Razorpay documentation.

## Prerequisites

1. **Razorpay Account**: Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. **API Keys**: Generate test/live API keys from the dashboard
3. **Node.js**: Version 18+ installed
4. **Environment Variables**: Configured properly

## Backend Setup

### 1. Install Dependencies

The Razorpay Node.js SDK is already included in the package.json:

```bash
cd backend/order-management-service
npm install
```

### 2. Environment Configuration

Add the following environment variables to your `.env` file:

```bash
# Razorpay Configuration
RAZORPAY_ENABLED=true
RAZORPAY_KEY_ID=rzp_test_your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
```

### 3. API Endpoints

The following endpoints are available:

#### Create Razorpay Order
```
POST /payments/razorpay/create-order
```

**Request Body:**
```json
{
  "amount": 1000,
  "currency": "INR",
  "receipt": "receipt_123",
  "notes": {
    "orderId": "order_123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order_xyz",
    "amount": 100000,
    "currency": "INR",
    "receipt": "receipt_123",
    "status": "created",
    "created_at": 1234567890,
    "key_id": "rzp_test_xyz"
  }
}
```

#### Verify Payment
```
POST /payments/razorpay/verify
```

**Request Body:**
```json
{
  "razorpay_order_id": "order_xyz",
  "razorpay_payment_id": "pay_xyz",
  "razorpay_signature": "signature_xyz"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "razorpay_payment_id": "pay_xyz",
    "razorpay_order_id": "order_xyz",
    "razorpay_signature": "signature_xyz",
    "amount": 1000,
    "currency": "INR",
    "status": "captured",
    "method": "card"
  }
}
```

#### Webhook Handler
```
POST /webhooks/razorpay
```

Handles Razorpay webhook events for payment status updates.

## Frontend Setup

### 1. Environment Variables

Add to your frontend `.env.local` file:

```bash
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_razorpay_key_id
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 2. Razorpay Script

The Razorpay checkout script is already included in the layout:

```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### 3. Usage Example

```tsx
import { razorpayService } from '../services/razorpayService';

const handlePayment = async () => {
  await razorpayService.openPaymentModal({
    amount: 1000,
    currency: 'INR',
    receipt: 'receipt_123',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '9999999999',
    description: 'Payment for order',
    onSuccess: (response) => {
      console.log('Payment successful:', response);
    },
    onError: (error) => {
      console.error('Payment failed:', error);
    }
  });
};
```

## Payment Flow

1. **Create Order**: Frontend calls backend to create Razorpay order
2. **Open Checkout**: Razorpay checkout modal opens with order details
3. **Payment Processing**: Customer completes payment through Razorpay
4. **Verification**: Backend verifies payment signature
5. **Success**: Payment is confirmed and order is processed

## Supported Payment Methods

- Credit/Debit Cards
- UPI
- Net Banking
- Wallets (Paytm, PhonePe, etc.)
- EMI

## Testing

### Test Cards (Razorpay Test Mode)

- **Success**: 4111 1111 1111 1111
- **Failure**: 4000 0000 0000 0002
- **CVV**: Any 3 digits
- **Expiry**: Any future date

### Test UPI IDs

- `success@razorpay`
- `failure@razorpay`

## Webhook Configuration

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/webhooks/razorpay`
3. Select events:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`

## Security Considerations

1. **Signature Verification**: Always verify payment signatures on the server
2. **HTTPS**: Use HTTPS in production
3. **API Keys**: Keep API keys secure and never expose them in frontend code
4. **Webhook Verification**: Verify webhook signatures

## Error Handling

The integration includes comprehensive error handling for:

- Network failures
- Invalid signatures
- Payment failures
- Order creation errors
- Verification failures

## Production Deployment

1. **Switch to Live Mode**: Replace test API keys with live keys
2. **Update Webhook URLs**: Use production webhook URLs
3. **SSL Certificate**: Ensure HTTPS is enabled
4. **Monitoring**: Set up monitoring for payment failures

## Troubleshooting

### Common Issues

1. **Script Not Loading**: Check if Razorpay script is loaded
2. **Invalid Signature**: Verify API keys and signature generation
3. **Order Creation Failed**: Check amount format (should be in paise)
4. **Payment Not Captured**: Verify webhook configuration

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

## Support

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay Support](https://razorpay.com/support/)
- [Node.js Integration Guide](https://razorpay.com/docs/payments/server-integration/nodejs/)
- [Web Integration Guide](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/)

## Implementation Status

✅ **Completed:**
- Backend Razorpay SDK integration
- Order creation endpoint
- Payment verification endpoint
- Webhook handling
- Frontend Razorpay service
- Payment form component
- Checkout integration
- Error handling
- Security measures

The Razorpay integration is now fully implemented and ready for testing and production use.
