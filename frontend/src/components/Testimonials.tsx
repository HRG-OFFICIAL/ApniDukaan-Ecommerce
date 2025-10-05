'use client'

import { motion } from 'framer-motion'
import { Star, StarHalf } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

const testimonials = [
  {
    id: 1,
    name: 'Aarav Sharma',
    gender: 'male',
    rating: 4.8,
    text: 'Amazing products and super fast delivery! Highly recommend ApniDukaan.',
    role: 'Satisfied Customer'
  },
  {
    id: 2,
    name: 'Priya Verma',
    gender: 'female',
    rating: 5,
    text: 'Quality is excellent and returns were hassle-free. Great experience overall.',
    role: 'Repeat Buyer'
  },
  {
    id: 3,
    name: 'Rahul Mehta',
    gender: 'male',
    rating: 4.3,
    text: 'Got a great deal on headphones. Customer support was helpful too.',
    role: 'Tech Enthusiast'
  },
  {
    id: 4,
    name: 'Ananya Iyer',
    gender: 'female',
    rating: 4.7,
    text: 'Loved the collection and quick checkout. Will shop again!',
    role: 'Fashion Lover'
  },
  {
    id: 5,
    name: 'Vikram Singh',
    gender: 'male',
    rating: 4.2,
    text: 'Packaging was neat and items arrived on time. Trustworthy store.',
    role: 'Verified Buyer'
  },
  {
    id: 6,
    name: 'Sneha Gupta',
    gender: 'female',
    rating: 4.5,
    text: 'Excellent customer service and fast shipping. Will definitely order again!',
    role: 'Happy Customer'
  }
]

export default function Testimonials() {
  const [isHovered, setIsHovered] = useState(false)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const lastTimeRef = useRef<number | null>(null)
  const offsetRef = useRef<number>(0)
  const contentWidthRef = useRef<number>(0)

  // Build a duplicated list for seamless loop
  const items = [...testimonials, ...testimonials]

  const renderStars = (rating: number) => {
    const full = Math.floor(rating)
    const hasHalf = rating - full >= 0.25 && rating - full < 0.75
    const roundedUp = rating - full >= 0.75
    const stars: JSX.Element[] = []
    const totalFull = roundedUp ? full + 1 : full
    for (let i = 0; i < totalFull && i < 5; i++) {
      stars.push(<Star key={`f-${i}`} className="w-5 h-5 text-amber-400 fill-current" />)
    }
    if (!roundedUp && hasHalf && stars.length < 5) {
      stars.push(<StarHalf key="half" className="w-5 h-5 text-amber-400 fill-current" />)
    }
    while (stars.length < 5) {
      stars.push(<Star key={`e-${stars.length}`} className="w-5 h-5 text-gray-300" />)
    }
    return stars
  }

  useEffect(() => {
    // Measure half content width (since items are duplicated)
    if (contentRef.current) {
      contentWidthRef.current = contentRef.current.scrollWidth / 2
    }

    let rafId: number
    const speedPxPerMs = 0.06 // ~60px per second

    const loop = (now: number) => {
      if (lastTimeRef.current == null) {
        lastTimeRef.current = now
      }
      const delta = now - lastTimeRef.current
      lastTimeRef.current = now
      if (!isHovered) {
        offsetRef.current += delta * speedPxPerMs
        const total = contentWidthRef.current || 1
        if (offsetRef.current > total) {
          offsetRef.current = offsetRef.current - total
        }
        if (trackRef.current) {
          trackRef.current.style.transform = `translateX(-${offsetRef.current}px)`
        }
      }
      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [isHovered])

  return (
    <div className="max-w-6xl mx-auto overflow-hidden">
      <div
        ref={trackRef}
        className="flex gap-4 w-max py-2 will-change-transform"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div ref={contentRef} className="flex gap-4">
          {items.map((t, idx) => (
            <motion.div
              key={`${t.id}-${idx}`}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="min-w-[280px] sm:min-w-[320px] bg-white p-6 rounded-xl shadow-lg text-center"
            >
              <div className="flex justify-center mb-3">{renderStars(t.rating as number)}</div>
              <Image
                src={t.gender === 'female' ? '/girl.png' : '/boy.png'}
                alt={t.name}
                width={72}
                height={72}
                className="w-18 h-18 rounded-full mx-auto mb-3 object-cover"
                unoptimized
              />
              <p className="text-gray-600 italic mb-3">"{t.text}"</p>
              <h4 className="font-semibold text-gray-900">{t.name}</h4>
              <p className="text-gray-500 text-sm">{t.role}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}


