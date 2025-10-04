import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Track Order - ApniDukaan',
  description: 'Track your order status at ApniDukaan',
};

export default function TrackOrderPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Track Your Order</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="mb-6">
            <label htmlFor="orderId" className="block text-sm font-medium text-gray-700 mb-2">
              Order ID
            </label>
            <input
              type="text"
              id="orderId"
              placeholder="Enter your order ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email address"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Track Order
          </button>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Don't have your order ID? Check your email for order confirmation.
          </p>
        </div>
      </div>
    </div>
  );
}
