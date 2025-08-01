import type { Metadata } from 'next'
import './globals.css'
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css'
import { AppLayout } from '@/app/components/app-layout'
import { Providers } from '@/app/components/providers'

export const metadata: Metadata = {
  title: 'NetBuild',
  description: 'Multi-role, multi-domain enterprise platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  )
}