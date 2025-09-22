import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { ClerkProvider } from '@clerk/nextjs'
import "./globals.css"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Budget Explorer - AI-Powered Government Budget Analysis",
  description:
    "Analyze government budgets with AI assistance. Perfect for students, journalists, and engaged citizens.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
          <Suspense>
            {children}
            <Analytics />
          </Suspense>
        </body>
      </html>
    </ClerkProvider>
  )
}
