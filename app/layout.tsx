import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/auth'
import './globals.css'
import { Toaster } from "@/components/ui/sonner";
import { MobileReturnButton } from "@/components/survey/mobile-return-button";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://0mninetlottery.com'),
  title: {
    default: '0mninet Lottery - Win Amazon Gift Cards & Support Digital Inclusion',
    template: '%s | 0mninet Lottery'
  },
  description: 'Join 0mninet Lottery platform where you can win $50 Amazon gift cards every week while supporting digital inclusion initiatives worldwide. Complete surveys, earn tickets, and make a difference.',
  keywords: [
    '0mninet lottery',
    '0mninet',
    'omnimet lottery',
    'digital inclusion lottery',
    'amazon gift card lottery',
    'free lottery',
    'survey rewards',
    'win amazon gift cards',
    'digital inclusion',
    'global connectivity',
    'free internet',
    'lottery platform',
    'weekly lottery draw',
    'earn tickets',
    'survey participation',
    'social impact',
    'community rewards',
    'technology access',
    'internet accessibility',
    'digital divide'
  ],
  authors: [{ name: '0mninet Team' }],
  creator: '0mninet',
  publisher: '0mninet',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  category: 'lottery',
  classification: 'Lottery and Social Impact Platform',
  openGraph: {
    title: '0mninet Lottery - Win Amazon Gift Cards & Support Digital Inclusion',
    description: 'Join 0mninet Lottery platform where you can win $50 Amazon gift cards every week while supporting digital inclusion initiatives worldwide. Complete surveys, earn tickets, and make a difference.',
    url: 'https://0mninetlottery.com',
    siteName: '0mninet Lottery',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/main-logo.png',
        width: 1200,
        height: 630,
        alt: '0mninet Lottery - Digital Inclusion Platform',
        type: 'image/png',
      },
      {
        url: '/giftCard.png',
        width: 800,
        height: 600,
        alt: 'Amazon Gift Card Prize - Win $50 Every Week',
        type: 'image/png',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '0mninet Lottery - Win Amazon Gift Cards & Support Digital Inclusion',
    description: 'Join 0mninet Lottery platform where you can win $50 Amazon gift cards every week while supporting digital inclusion initiatives worldwide.',
    site: '@0mninet',
    creator: '@0mninet',
    images: ['/main-logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://0mninetlottery.com',
  },
  verification: {
    google: 'add-your-google-verification-code-here',
    yandex: 'add-your-yandex-verification-code-here',
    yahoo: 'add-your-yahoo-verification-code-here',
    other: {
      me: ['https://0mninetlottery.com'],
    },
  },
  applicationName: '0mninet Lottery',
  referrer: 'origin-when-cross-origin',
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#3b82f6' },
    { media: '(prefers-color-scheme: dark)', color: '#1e40af' },
  ],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  appleWebApp: {
    title: '0mninet Lottery',
    statusBarStyle: 'default',
    capable: true,
  },
  other: {
    'msapplication-TileColor': '#3b82f6',
    'msapplication-TileImage': '/main-logo.png',
    'apple-mobile-web-app-title': '0mninet Lottery',
    'application-name': '0mninet Lottery',
    'mobile-web-app-capable': 'yes',
    'theme-color': '#3b82f6',
  },
  manifest: '/manifest.json',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth();

  return (
    <SessionProvider session={session}>
      <html lang="en">
        <head>
          {/* Additional SEO Meta Tags */}
          <meta name="geo.region" content="Global" />
          <meta name="geo.placename" content="Worldwide" />
          <meta name="language" content="English" />
          <meta name="coverage" content="Worldwide" />
          <meta name="distribution" content="Global" />
          <meta name="target" content="all" />
          <meta name="audience" content="all" />
          <meta name="rating" content="general" />
          <meta name="revisit-after" content="1 days" />
          <meta name="expires" content="never" />
          
          {/* Lottery and Gaming Specific Tags */}
          <meta name="lottery-type" content="free" />
          <meta name="prize-type" content="amazon-gift-card" />
          <meta name="draw-frequency" content="weekly" />
          <meta name="prize-amount" content="50-usd" />
          
          {/* Business and Contact Information */}
          <meta name="contact" content="ask@0mninet.info" />
          <meta name="copyright" content="© 2024 0mninet. All rights reserved." />
          
          {/* Enhanced Structured Data */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "0mninet Lottery",
                "alternateName": ["0mninet", "Omnimet Lottery"],
                "url": "https://0mninetlottery.com",
                "description": "Join 0mninet Lottery platform where you can win $50 Amazon gift cards every week while supporting digital inclusion initiatives worldwide.",
                "inLanguage": "en-US",
                "isAccessibleForFree": true,
                "creator": {
                  "@type": "Organization",
                  "name": "0mninet",
                  "url": "https://0mninetlottery.com",
                  "contactPoint": {
                    "@type": "ContactPoint",
                    "email": "ask@0mninet.info",
                    "contactType": "customer service"
                  }
                },
                "mainEntity": {
                  "@type": "Game",
                  "name": "0mninet Lottery",
                  "description": "Weekly lottery draw with Amazon gift card prizes supporting digital inclusion",
                  "gameItem": {
                    "@type": "Thing",
                    "name": "Amazon Gift Card",
                    "value": "$50 USD"
                  },
                  "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD",
                    "availability": "https://schema.org/InStock",
                    "description": "Free to participate"
                  }
                },
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": "https://0mninetlottery.com/search?q={search_term_string}",
                  "query-input": "required name=search_term_string"
                }
              })
            }}
          />
          
          {/* Business Organization Schema */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "0mninet",
                "legalName": "0mninet Lottery Platform",
                "url": "https://0mninetlottery.com",
                "logo": "https://0mninetlottery.com/main-logo.png",
                "description": "Digital inclusion lottery platform connecting communities worldwide",
                "foundingDate": "2024",
                "contactPoint": [
                  {
                    "@type": "ContactPoint",
                    "telephone": "",
                    "contactType": "customer service",
                    "email": "ask@0mninet.info",
                    "availableLanguage": ["English"]
                  }
                ],
                "sameAs": [
                  "https://0mninet.com",
                  "https://0mninetlottery.com"
                ],
                "address": {
                  "@type": "PostalAddress",
                  "addressCountry": "Global",
                  "addressRegion": "Worldwide"
                }
              })
            }}
          />
        </head>
        <body className={inter.className}>
          <Toaster />
          {children}
          <MobileReturnButton />
        </body>
      </html>
    </SessionProvider>
  )
}
