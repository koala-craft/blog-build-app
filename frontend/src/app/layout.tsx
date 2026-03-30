import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AuraEngine | Fortune AI",
  description: "AI Fortune Telling Content Generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="antialiased">
      <body className={`${inter.className} bg-background text-foreground min-h-screen relative`}>
        {/* Deep Mystical Background Blobs - Lower priority and more subtle */}
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none opacity-20 dark:opacity-10">
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary-500 blur-[200px] opacity-40 animate-pulse-slow" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-secondary-500 blur-[200px] opacity-40 animate-pulse-slow" style={{ animationDelay: '2s' }} />
        </div>
        
        <Sidebar />
        
        <main className="ml-80 p-8 min-h-screen flex flex-col items-center">
          <div className="w-full max-w-7xl xl:px-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
