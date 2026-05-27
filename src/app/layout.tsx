import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/Sidebar'
import { getAuthSession } from '@/lib/auth'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Shakti Exports | Diamond Invoice Management',
  description: 'GST Compliant Invoice Management System',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await getAuthSession()

  return (
    <html lang="en">
      <body className={inter.className}>
        {user ? (
          <div className="container">
            <Sidebar user={user} />
            <main className="main-content">
              {children}
            </main>
          </div>
        ) : (
          <main style={{ minHeight: '100vh', background: 'var(--background)' }}>
            {children}
          </main>
        )}
      </body>
    </html>
  )
}

