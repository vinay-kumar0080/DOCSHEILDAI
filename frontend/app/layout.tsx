import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'DocShield AI — AI Identity & Document Screening System',
  description: 'Production-style AI-assisted identity and travel document screening platform for border control, airlines, and airport security.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-background text-foreground min-h-screen flex flex-col antialiased selection:bg-blue-500 selection:text-white`}>
        {/* Background Cyber Glow Effects */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 blur-[140px] rounded-full" />
          <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-purple-600/5 blur-[160px] rounded-full" />
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-cyan-600/5 blur-[160px] rounded-full" />
        </div>

        {/* Left Sidebar Shell */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 main-content-layout transition-all duration-300">
            {children}
          </main>
          <div className="main-content-layout transition-all duration-300">
            <Footer />
          </div>
        </div>
      </body>
    </html>
  );
}
