import { Inter } from "next/font/google"; // Import Font
import React from "react";
import type { Metadata } from "next";
import { Providers } from "./providers";
import { OrganizationSchema, WebSiteSchema } from "@/components/seo";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://macroinsight.me';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'MacroInsight - Tin tức Tài chính Thông minh',
    template: '%s | MacroInsight',
  },
  description: "Nền tảng tin tức tài chính thông minh với AI chatbot và swipe discovery. Khám phá thị trường chứng khoán Việt Nam, kinh tế vĩ mô và pháp lý tài chính.",
  keywords: ["tin tức tài chính", "chứng khoán Việt Nam", "kinh tế vĩ mô", "AI chatbot", "RAG", "phân tích thị trường", "MacroInsight"],
  authors: [{ name: 'MacroInsight Team' }],
  creator: 'MacroInsight',
  publisher: 'MacroInsight',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/logo_new-removebg-preview-nobg.svg',
    shortcut: '/logo_new-removebg-preview-nobg.svg',
    apple: '/logo_new-removebg-preview-nobg.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: siteUrl,
    siteName: 'MacroInsight',
    title: 'MacroInsight - Tin tức Tài chính Thông minh',
    description: 'Nền tảng tin tức tài chính thông minh với AI chatbot và swipe discovery',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'MacroInsight - Tin tức Tài chính Thông minh',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MacroInsight - Tin tức Tài chính Thông minh',
    description: 'Nền tảng tin tức tài chính thông minh với AI chatbot và swipe discovery',
    images: ['/og-default.png'],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || '',
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      'vi-VN': siteUrl,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <OrganizationSchema />
        <WebSiteSchema />
      </head>
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

