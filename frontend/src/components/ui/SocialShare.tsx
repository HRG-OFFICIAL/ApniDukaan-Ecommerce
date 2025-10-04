'use client'

import React, { useState } from 'react'
import { 
  Share2, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Mail, 
  MessageCircle,
  Copy,
  Check
} from 'lucide-react'
import { Button } from './Button'
import { toast } from 'react-hot-toast'

interface SocialShareProps {
  url?: string
  title?: string
  description?: string
  productName?: string
  productPrice?: number
  productImage?: string
  className?: string
}

export const SocialShare: React.FC<SocialShareProps> = ({
  url = typeof window !== 'undefined' ? window.location.href : '',
  title = 'Check out this product on ApniDukaan',
  description = 'Amazing products at great prices!',
  productName,
  productPrice,
  productImage,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = url
  const shareTitle = productName ? `${productName} - ${title}` : title
  const shareDescription = productPrice 
    ? `${description} - Only ₹${productPrice}!` 
    : description

  const socialPlatforms = [
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareTitle)}`
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-sky-500 hover:bg-sky-600',
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-blue-700 hover:bg-blue-800',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}&summary=${encodeURIComponent(shareDescription)}`
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-500 hover:bg-green-600',
      url: `https://wa.me/?text=${encodeURIComponent(`${shareTitle} - ${shareUrl}`)}`
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-gray-600 hover:bg-gray-700',
      url: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareDescription}\n\n${shareUrl}`)}`
    }
  ]

  const handleShare = (platformUrl: string, platformName: string) => {
    if (platformName === 'Email' || platformName === 'WhatsApp') {
      window.open(platformUrl, '_blank')
    } else {
      window.open(platformUrl, '_blank', 'width=600,height=400')
    }
    setIsOpen(false)
    toast.success(`Shared on ${platformName}!`)
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareDescription,
          url: shareUrl
        })
        toast.success('Shared successfully!')
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      setIsOpen(true)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        onClick={handleNativeShare}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Share2 className="w-4 h-4" />
        Share
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-25"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Share Modal */}
          <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-w-[280px]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Share this product
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {socialPlatforms.map((platform) => {
                  const Icon = platform.icon
                  return (
                    <button
                      key={platform.name}
                      onClick={() => handleShare(platform.url, platform.name)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-white transition-colors ${platform.color}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{platform.name}</span>
                    </button>
                  )
                })}
              </div>
              
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 w-full px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span className="text-sm font-medium">Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default SocialShare
