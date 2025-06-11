
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Toaster } from "@/components/ui/toaster";
import GlobalChat from '@/components/chat/GlobalChat'; // Import the GlobalChat component

export const metadata: Metadata = {
  title: 'EchoSphere - Share Your Voice',
  description: 'A platform for stories and discussions.',
  // viewport: 'width=device-width, initial-scale=1', // Already exists, ensure it's present
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/images/echosphere-logo.jpeg" type="image/jpeg" sizes="any"/> {/* Updated to local path */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col bg-background text-foreground">
        <Providers>
          <Header />
          <main className="flex-grow container mx-auto px-3 sm:px-4 py-6 sm:py-8">
            {children}
          </main>
          <Footer />
          <Toaster />
          <GlobalChat /> {/* Add GlobalChat component here */}
        </Providers>
      </body>
    </html>
  );
}
