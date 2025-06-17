import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/auth'
import './globals.css'
import { Toaster } from "@/components/ui/sonner";
import { MobileReturnButton } from "@/components/survey/mobile-return-button";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '0mninet Lottery - Support Digital Inclusion',
  description: 'Join the 0mninet lottery platform where you can win Amazon gift cards while supporting digital inclusion initiatives worldwide.',
  keywords: 'lottery, social impact, digital inclusion, surveys, rewards, amazon gift card',
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
        <body className={inter.className}>
          <Toaster />
          {children}
          <MobileReturnButton />
        </body>
      </html>
    </SessionProvider>
  )
}
