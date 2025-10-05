'use client'

import Link from 'next/link'
import {
  Briefcase,
  BadgePercent,
  Gift,
  HelpCircle,
  Youtube,
  Instagram,
} from 'lucide-react'

// A simple component for the 'X' icon to match the others
const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
)

export default function Footer() {
  return (
    <footer className="bg-[#121212] text-white">
      <div className="w-full px-12 py-12 sm:px-16 lg:px-24">
        <div className="pb-8 border-b border-gray-700 -mx-12 sm:-mx-16 lg:-mx-24">
          <div className="grid grid-cols-1 gap-8 px-12 sm:px-16 lg:px-24 text-xs md:grid-cols-7" style={{ fontFamily: 'inter_semi_bold, fallback-inter_semi_bold, Arial, sans-serif' }}>
          {/* ABOUT */}
          <div>
            <h3 className="mb-4 text-xs font-semibold tracking-wider text-gray-400" style={{ fontFamily: 'inter_regular, fallback-inter_regular, Arial, sans-serif' }}>ABOUT</h3>
            <ul className="space-y-0 text-sm">
              <li><Link href="/contact" className="hover:underline">Contact Us</Link></li>
              <li><Link href="/about" className="hover:underline">About Us</Link></li>
              <li><Link href="/careers" className="hover:underline">Careers</Link></li>
              <li><Link href="/stories" className="hover:underline">ApniDukaan Stories</Link></li>
              <li><Link href="/press" className="hover:underline">Press</Link></li>
              <li><Link href="/corporate" className="hover:underline">Corporate Information</Link></li>
            </ul>
          </div>

          {/* GROUP COMPANIES */}
          <div>
            <h3 className="mb-4 text-xs font-semibold tracking-wider text-gray-400" style={{ fontFamily: 'inter_regular, fallback-inter_regular, Arial, sans-serif' }}>GROUP COMPANIES</h3>
            <ul className="space-y-0 text-sm">
              <li><a href="#" className="hover:underline">ApniFashion</a></li>
              <li><a href="#" className="hover:underline">TravelGo</a></li>
              <li><a href="#" className="hover:underline">ShopLite</a></li>
            </ul>
          </div>

          {/* HELP */}
          <div>
            <h3 className="mb-4 text-xs font-semibold tracking-wider text-gray-400" style={{ fontFamily: 'inter_regular, fallback-inter_regular, Arial, sans-serif' }}>HELP</h3>
            <ul className="space-y-0 text-sm">
              <li><Link href="/payments" className="hover:underline">Payments</Link></li>
              <li><Link href="/shipping" className="hover:underline">Shipping</Link></li>
              <li><Link href="/returns" className="hover:underline">Cancellation & Returns</Link></li>
              <li><Link href="/faq" className="hover:underline">FAQ</Link></li>
            </ul>
          </div>

          {/* CONSUMER POLICY */}
          <div>
            <h3 className="mb-4 text-xs font-semibold tracking-wider text-gray-400" style={{ fontFamily: 'inter_regular, fallback-inter_regular, Arial, sans-serif' }}>CONSUMER POLICY</h3>
            <ul className="space-y-0 text-sm">
              <li><Link href="/returns" className="hover:underline">Cancellation & Returns</Link></li>
              <li><Link href="/terms" className="hover:underline">Terms Of Use</Link></li>
              <li><Link href="/security" className="hover:underline">Security</Link></li>
              <li><Link href="/privacy" className="hover:underline">Privacy</Link></li>
              <li><Link href="/sitemap" className="hover:underline">Sitemap</Link></li>
              <li><Link href="/grievance-redressal" className="hover:underline">Grievance Redressal</Link></li>
              <li><Link href="/epr-compliance" className="hover:underline">EPR Compliance</Link></li>
            </ul>
          </div>

          {/* CONTACT COLUMNS */}
          <div className="col-span-1 border-t border-gray-700 pt-8 text-sm text-gray-400 md:col-span-3 md:border-l md:border-t-0 md:pl-6 md:pt-0">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-6">
              <div>
                <h3 className="mb-2 text-xs font-semibold tracking-wider" style={{ fontFamily: 'inter_regular, fallback-inter_regular, Arial, sans-serif' }}>Mail Us:</h3>
                <p className="leading-6 text-white">
                  ApniDukaan Private Limited, Galaxy Commerce Park, Orion Wing, Plot 42, Sector 21, Tech Park, Outer Ring Road, Electronic City, Bengaluru 560100, Karnataka, India
                </p>
                <div className="mt-3">
                  <h4 className="mb-2 text-xs font-semibold tracking-wider" style={{ fontFamily: 'inter_regular, fallback-inter_regular, Arial, sans-serif' }}>Social:</h4>
                  <div className="flex items-center gap-4">
                    <a aria-label="YouTube" href="#" className="hover:text-white"><Youtube size={20} /></a>
                    <a aria-label="X" href="#" className="hover:text-white"><XIcon className="h-5 w-5" /></a>
                    <a aria-label="Instagram" href="#" className="hover:text-white"><Instagram size={20} /></a>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-xs font-semibold tracking-wider" style={{ fontFamily: 'inter_regular, fallback-inter_regular, Arial, sans-serif' }}>Registered Office Address:</h3>
                <p className="leading-6 text-white">
                  ApniDukaan Private Limited, Galaxy Commerce Park, Orion Wing, Plot 42, Sector 21, Tech Park, Outer Ring Road, Electronic City, Bengaluru 560100, Karnataka, India
                </p>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Utility bar */}
        <div className="flex flex-col items-center justify-between gap-6 pt-6 md:flex-row md:gap-2 px-6 sm:px-8 lg:px-12" style={{ fontFamily: 'inter_semi_bold, fallback-inter_semi_bold, Arial, sans-serif' }}>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <a href="#" className="flex items-center gap-2 hover:underline"><Briefcase className="h-4 w-4 text-yellow-400" /> Become a Seller</a>
            <a href="#" className="flex items-center gap-2 hover:underline"><BadgePercent className="h-4 w-4 text-yellow-400" /> Advertise</a>
            <a href="#" className="flex items-center gap-2 hover:underline"><Gift className="h-4 w-4 text-yellow-400" /> Gift Cards</a>
            <a href="#" className="flex items-center gap-2 hover:underline"><HelpCircle className="h-4 w-4 text-yellow-400" /> Help Center</a>
          </div>
          <div className="text-xs text-gray-400">© {new Date().getFullYear()} ApniDukaan.com</div>
          <div className="flex items-center gap-2">
            <img
              src="https://static-assets-web.flixcart.com/batman-returns/batman-returns/p/images/payment-method-c454fb.svg"
              alt="Payment methods"
              width={380}
              height={24}
            />
          </div>
        </div>
      </div>
    </footer>
  )
}