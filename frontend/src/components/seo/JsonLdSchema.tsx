'use client';

import React from 'react';

// ============================================
// Types
// ============================================

interface NewsArticleSchemaProps {
  headline: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  url: string;
  image?: string;
  keywords?: string[];
  articleSection?: string;
}

interface OrganizationSchemaProps {
  name: string;
  url: string;
  logo: string;
  description?: string;
  sameAs?: string[];
}

interface WebSiteSchemaProps {
  name: string;
  url: string;
  searchUrl?: string;
}

interface BreadcrumbItem {
  name: string;
  href: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

// ============================================
// NewsArticle Schema (for Google News)
// ============================================

export function NewsArticleSchema({
  headline,
  description,
  datePublished,
  dateModified,
  author = 'MacroInsight Editorial',
  url,
  image,
  keywords = [],
  articleSection = 'Finance',
}: NewsArticleSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: headline.slice(0, 110), // Google recommends max 110 chars
    description: description.slice(0, 200),
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Person',
      name: author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'MacroInsight',
      logo: {
        '@type': 'ImageObject',
        url: 'https://macroinsight.me/logo_new-removebg-preview-nobg.svg',
        width: 200,
        height: 60,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    image: image || 'https://macroinsight.me/og-default.png',
    articleSection,
    keywords: keywords.join(', '),
    inLanguage: 'vi-VN',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================
// Organization Schema
// ============================================

export function OrganizationSchema({
  name = 'MacroInsight',
  url = 'https://macroinsight.me',
  logo = 'https://macroinsight.me/logo_new-removebg-preview-nobg.svg',
  description = 'Nền tảng tin tức và tri thức tài chính - kinh tế Việt Nam. Khám phá tin tức theo phong cách Tinder swipe và chatbot AI thông minh.',
  sameAs = [],
}: Partial<OrganizationSchemaProps>) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo: {
      '@type': 'ImageObject',
      url: logo,
    },
    description,
    sameAs,
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'contact@macroinsight.me',
      contactType: 'customer service',
      availableLanguage: ['Vietnamese', 'English'],
    },
    knowsAbout: [
      'Vietnamese Stock Market',
      'Macroeconomics',
      'Financial News',
      'Investment Analysis',
      'Vietnamese Finance Law',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================
// WebSite Schema with SearchAction
// ============================================

export function WebSiteSchema({
  name = 'MacroInsight',
  url = 'https://macroinsight.me',
  searchUrl = 'https://macroinsight.me/chat?q={search_term_string}',
}: Partial<WebSiteSchemaProps>) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    description: 'Nền tảng tin tức tài chính thông minh với AI chatbot và swipe discovery',
    inLanguage: 'vi-VN',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: searchUrl,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================
// Breadcrumb Schema
// ============================================

export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `https://macroinsight.me${item.href}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================
// FAQ Schema (for Explained pages)
// ============================================

export function FAQSchema({ faqs }: { faqs: FAQItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================
// Breadcrumb UI Component
// ============================================

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <>
      <BreadcrumbSchema items={items} />
      <nav aria-label="Breadcrumb" style={{ marginBottom: '1rem' }}>
        <ol style={{
          display: 'flex',
          gap: '0.5rem',
          fontSize: '0.875rem',
          color: 'var(--text-tertiary)',
          listStyle: 'none',
          padding: 0,
          margin: 0,
        }}>
          {items.map((item, i) => (
            <li key={item.href} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && <span style={{ margin: '0 0.5rem' }}>/</span>}
              {i === items.length - 1 ? (
                <span style={{ color: 'var(--text-primary)' }}>{item.name}</span>
              ) : (
                <a
                  href={item.href}
                  style={{
                    color: 'var(--text-tertiary)',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
                >
                  {item.name}
                </a>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

// ============================================
// Combined default export
// ============================================

export default {
  NewsArticleSchema,
  OrganizationSchema,
  WebSiteSchema,
  BreadcrumbSchema,
  FAQSchema,
  Breadcrumbs,
};
