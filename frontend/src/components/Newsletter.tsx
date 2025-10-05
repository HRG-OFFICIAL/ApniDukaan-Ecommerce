'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Mail } from 'lucide-react'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setSuccess(true)
      setEmail('')
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Newsletter signup failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-16 bg-neutral-900 text-white">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="container mx-auto px-4 text-center"
      >
        <h2 className="text-3xl font-bold mb-4">Stay Updated with Deals</h2>
        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">Subscribe to our newsletter for exclusive offers and new arrivals.</p>
        <form onSubmit={handleSubmit} className="max-w-md mx-auto flex gap-2 justify-center items-center">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-3 py-2 md:px-4 md:py-2.5 rounded-full bg-white text-neutral-900 outline-none placeholder-neutral-500"
            required
            aria-label="Email for newsletter"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 md:px-6 md:py-2.5 rounded-full font-semibold inline-flex items-center gap-2 transition disabled:opacity-50"
          >
            <Mail className="w-5 h-5" />
            {loading ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
        {success && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-emerald-400 font-semibold">
            Thanks for subscribing! Check your inbox.
          </motion.p>
        )}
      </motion.div>
    </section>
  )
}


