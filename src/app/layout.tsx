import type { Metadata } from 'next';
import './globals.css';
import SmoothScroll from '@/components/SmoothScroll';

export const metadata: Metadata = {
  title: 'Cinematic Designer Portfolio',
  description: 'Interactive futuristic personal portfolio website for a UI/UX and Product Designer',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400..700&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>
        <SmoothScroll>
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
