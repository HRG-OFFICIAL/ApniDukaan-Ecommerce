import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help & Support - ApniDukaan',
  description: 'Get help and support for your ApniDukaan experience',
};

export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Help & Support</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">How do I place an order?</h3>
                <p className="text-gray-600 text-sm">Browse products, add to cart, and proceed to checkout.</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">What payment methods do you accept?</h3>
                <p className="text-gray-600 text-sm">We accept PayPal, Razorpay, and other secure payment methods.</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">How can I track my order?</h3>
                <p className="text-gray-600 text-sm">You'll receive tracking information via email once your order ships.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">Email Support</h3>
                <p className="text-gray-600 text-sm">support@apnidukaan.com</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Phone Support</h3>
                <p className="text-gray-600 text-sm">+1 (555) 123-4567</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Business Hours</h3>
                <p className="text-gray-600 text-sm">Monday - Friday: 9 AM - 6 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
