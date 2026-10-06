import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Signal Messenger',
  description: 'Secure Messaging Platform (Signal Clone)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#121418] text-white font-sans overflow-hidden">
        {children}
      </body>
    </html>
  );
}
