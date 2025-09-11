'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, Users, Award, Globe, ArrowRight } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import MainLayout from '../../components/layout/MainLayout'

const stats = [
  { label: 'Happy Customers', value: '50,000+' },
  { label: 'Products Sold', value: '1M+' },
  { label: 'Years of Service', value: '10+' },
  { label: 'Countries Served', value: '25+' }
]

const team = [
  {
    name: 'Sarah Johnson',
    role: 'CEO & Founder',
    image: 'https://images.unsplash.com/photo-1494790108755-2616b30c9b5b?w=400',
    bio: 'Passionate about creating amazing shopping experiences.'
  },
  {
    name: 'Michael Chen',
    role: 'CTO',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    bio: 'Leading our technology vision and innovation.'
  },
  {
    name: 'Emily Rodriguez',
    role: 'Head of Design',
    image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400',
    bio: 'Crafting beautiful and intuitive user experiences.'
  }
]

const values = [
  {
    icon: Heart,
    title: 'Customer First',
    description: 'Everything we do is centered around providing exceptional customer experiences.'
  },
  {
    icon: Award,
    title: 'Quality Promise',
    description: 'We curate only the best products and ensure highest quality standards.'
  },
  {
    icon: Globe,
    title: 'Global Community',
    description: 'Building connections and serving customers worldwide with local expertise.'
  },
  {
    icon: Users,
    title: 'Team Spirit',
    description: 'Our diverse team works together to make shopping delightful for everyone.'
  }
]

export default function AboutPage() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">About ApniDukaan</Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Your Ultimate Shopping 
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Destination
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            We're on a mission to revolutionize e-commerce by providing exceptional products, 
            unbeatable prices, and outstanding customer service to millions of customers worldwide.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
              <Button size="lg">
                Shop Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                {stat.value}
              </div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Story Section */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
            <p className="text-gray-600 mb-4">
              Founded in 2014, ApniDukaan started as a small online marketplace with a big vision: 
              to make quality products accessible to everyone, everywhere. What began as a simple 
              idea has grown into a thriving e-commerce platform serving millions of customers.
            </p>
            <p className="text-gray-600 mb-4">
              Our journey hasn't always been smooth, but our commitment to our customers has never 
              wavered. From humble beginnings in a garage to becoming a trusted global marketplace, 
              we've stayed true to our core values of quality, affordability, and exceptional service.
            </p>
            <p className="text-gray-600">
              Today, we're proud to offer over 1 million products across hundreds of categories, 
              working with trusted sellers and brands to bring you the best shopping experience possible.
            </p>
          </div>
          <div className="relative">
            <Image
              src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600"
              alt="Our Story"
              width={600}
              height={400}
              className="rounded-lg shadow-lg"
            />
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              These core values guide everything we do and shape the way we serve our customers and community.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <div key={index} className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The passionate people behind ApniDukaan who work tirelessly to serve you better.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={128}
                    height={128}
                    className="rounded-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-blue-600 font-medium mb-2">{member.role}</p>
                <p className="text-gray-600">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Shopping?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join millions of satisfied customers and discover amazing products at unbeatable prices.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
              <Button size="lg" variant="secondary">
                Browse Products
              </Button>
            </Link>
            <Link href="/categories">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                Shop by Category
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
