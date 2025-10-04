import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Careers - ApniDukaan',
  description: 'Join our team at ApniDukaan',
};

export default function CareersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Careers at ApniDukaan</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">
            We're always looking for talented individuals to join our team. 
            Check back soon for open positions.
          </p>
          
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">Why Work With Us?</h2>
            <ul className="list-disc list-inside text-blue-800 space-y-2">
              <li>Competitive salary and benefits</li>
              <li>Flexible working hours</li>
              <li>Opportunity to work with cutting-edge technology</li>
              <li>Collaborative and inclusive work environment</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
