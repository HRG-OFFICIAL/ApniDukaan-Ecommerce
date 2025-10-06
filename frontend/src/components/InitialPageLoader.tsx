'use client'

import { useEffect, useState } from 'react'

export default function InitialPageLoader() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    let readyCount = 0
    const required = 2 // featured + deals
    const markReady = () => {
      readyCount += 1
      if (readyCount >= required) hide()
    }

    const hide = () => {
      setVisible(false)
    }

    const onFeatured = () => markReady()
    const onDeals = () => markReady()
    const onLoad = () => hide()

    if (typeof window !== 'undefined') {
      window.addEventListener('featured-ready', onFeatured as EventListener)
      window.addEventListener('deals-ready', onDeals as EventListener)
      window.addEventListener('load', onLoad)
    }

    const timeout = setTimeout(() => hide(), 8000)

    return () => {
      clearTimeout(timeout)
      if (typeof window !== 'undefined') {
        window.removeEventListener('featured-ready', onFeatured as EventListener)
        window.removeEventListener('deals-ready', onDeals as EventListener)
        window.removeEventListener('load', onLoad)
      }
    }
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-white/90 dark:bg-gray-900/90">
      <div className="flex flex-col items-center gap-3">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
        <p className="text-sm text-gray-700 dark:text-gray-300">Loading ApniDukaan…</p>
      </div>
    </div>
  )
}


