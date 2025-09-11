'use client'

import { Shield, Clock, Eye, Lock } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import MainLayout from '../../components/layout/MainLayout'

const sections = [
  {
    title: 'Information We Collect',
    icon: Eye,
    content: [
      'Personal information you provide when creating an account or making a purchase',
      'Payment information processed securely through our payment partners',
      'Device and browser information for improving site performance',
      'Usage data to understand how you interact with our services',
      'Location data (only with your consent) for shipping and regional preferences'
    ]
  },
  {
    title: 'How We Use Your Information',
    icon: Shield,
    content: [
      'Process your orders and provide customer support',
      'Improve our products and services based on usage patterns',
      'Send important updates about your orders and account',
      'Personalize your shopping experience with relevant recommendations',
      'Comply with legal obligations and prevent fraudulent activities'
    ]
  },
  {
    title: 'Information Sharing',
    icon: Lock,
    content: [
      'We never sell your personal information to third parties',
      'Trusted service providers who help us operate our business',
      'Legal authorities when required by law or to protect our rights',
      'Business partners only for specific services you request',
      'Anonymized data for analytics and research purposes'
    ]
  },
  {
    title: 'Data Security',
    icon: Clock,
    content: [
      'Industry-standard encryption for all data transmission',
      'Regular security audits and vulnerability assessments',
      'Limited access to personal information by our employees',
      'Secure data centers with 24/7 monitoring and backup systems',
      'Incident response procedures to address any security breaches'
    ]
  }
]

export default function PrivacyPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">Legal</Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-xl text-gray-600 mb-4">
            Your privacy is important to us. This policy explains how we collect, 
            use, and protect your information.
          </p>
          <p className="text-sm text-gray-500">
            Last updated: December 15, 2023
          </p>
        </div>

        {/* Introduction */}
        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-3">Our Commitment to Privacy</h2>
          <p className="text-blue-800">
            At ApniDukaan, we're committed to protecting your privacy and ensuring you have a 
            positive experience on our platform. This privacy policy outlines how we handle 
            your personal information with the utmost care and transparency.
          </p>
        </div>

        {/* Main Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => {
            const Icon = section.icon
            return (
              <div key={index} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 p-2 rounded-lg mr-3">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900">{section.title}</h2>
                </div>
                <ul className="space-y-2">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Additional Sections */}
        <div className="mt-12 space-y-8">
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights and Choices</h2>
            <div className="text-gray-600 space-y-3">
              <p>You have several rights regarding your personal information:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Access and review your personal information</li>
                <li>Correct or update your information</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of marketing communications</li>
                <li>Download a copy of your data</li>
              </ul>
              <p>To exercise these rights, please contact us at privacy@apnidukaan.com</p>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookies and Tracking</h2>
            <div className="text-gray-600 space-y-3">
              <p>We use cookies and similar technologies to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Remember your preferences and settings</li>
                <li>Analyze site traffic and usage patterns</li>
                <li>Provide personalized content and recommendations</li>
                <li>Enable social media features</li>
                <li>Measure advertising effectiveness</li>
              </ul>
              <p>You can manage cookie preferences through your browser settings.</p>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Services</h2>
            <div className="text-gray-600 space-y-3">
              <p>We work with trusted third-party service providers, including:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Payment processors (Stripe, PayPal)</li>
                <li>Shipping and logistics partners</li>
                <li>Analytics services (Google Analytics)</li>
                <li>Customer support tools</li>
                <li>Email marketing platforms</li>
              </ul>
              <p>These partners have their own privacy policies and data handling practices.</p>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Retention</h2>
            <div className="text-gray-600 space-y-3">
              <p>We retain your personal information only as long as necessary for:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Providing our services to you</li>
                <li>Complying with legal obligations</li>
                <li>Resolving disputes and enforcing agreements</li>
                <li>Improving our services and user experience</li>
              </ul>
              <p>When information is no longer needed, we securely delete or anonymize it.</p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
          <div className="text-gray-600 space-y-2">
            <p>If you have questions about this privacy policy or our data practices:</p>
            <p><strong>Email:</strong> privacy@apnidukaan.com</p>
            <p><strong>Address:</strong> 123 Commerce St, City, State 12345</p>
            <p><strong>Phone:</strong> +1 (555) 123-4567</p>
          </div>
        </div>

        {/* Updates Notice */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            <strong>Note:</strong> We may update this privacy policy from time to time. 
            We'll notify you of any material changes via email or through our website.
          </p>
        </div>
      </div>
    </MainLayout>
  )
}
