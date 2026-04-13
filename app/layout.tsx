import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastContainer } from '@/components/ui/Toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ProctorEdu — Ujian Online Aman',
  description: 'Aplikasi ujian online dengan sistem pengawasan untuk SMP',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-gray-50 antialiased`}>
        {children}
        <ToastContainer />
      </body>
    </html>
  )
}
