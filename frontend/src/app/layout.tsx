import { Inter } from "next/font/google"; // Import Font
import React from "react";
import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MacroInsight",
  description: "Semantic-Router Retrieval-Augmented Generation for Vietnamese Financial & Legal Data. Intelligent query routing and evidence-based answers.",
  keywords: ["RAG", "Vietnam", "Finance", "Legal", "AI", "LangGraph", "Supabase", "Gemini"],
  icons: {
    icon: '/logo_new-removebg-preview-nobg.svg',
    shortcut: '/logo_new-removebg-preview-nobg.svg',
    apple: '/logo_new-removebg-preview-nobg.svg',
  },
  openGraph: {
    title: "MacroInsight",
    description: "Knowledge router powered by RAG for Vietnamese financial and legal research",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body 
        className={`${inter.variable} antialiased font-sans`} 
        suppressHydrationWarning
        style={{ background: 'var(--background)', color: 'var(--foreground)', minHeight: '100vh' }}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

