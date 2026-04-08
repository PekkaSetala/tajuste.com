import type { Metadata } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Tajuste',
  description: 'Photography by Tajuste',
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){var p=new URLSearchParams(window.location.search);document.documentElement.dataset.mode=p.get('mode')==='color'?'color':'bw'})()` }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
