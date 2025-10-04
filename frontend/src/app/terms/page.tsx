import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - ApniDukaan',
  description: 'Terms of Service for ApniDukaan',
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600">
              By accessing and using ApniDukaan, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Use License</h2>
            <p className="text-gray-600">
              Permission is granted to temporarily download one copy of the materials on ApniDukaan for personal, non-commercial transitory viewing only.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Disclaimer</h2>
            <p className="text-gray-600">
              The materials on ApniDukaan are provided on an 'as is' basis. ApniDukaan makes no warranties, expressed or implied.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
