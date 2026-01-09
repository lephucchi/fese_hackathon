'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'vi' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('vi');

  useEffect(() => {
    // Load saved language preference
    const saved = localStorage.getItem('language') as Language;
    if (saved && (saved === 'vi' || saved === 'en')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

// Translation Data
const translations = {
  vi: {
    nav: {
      home: 'Trang chủ',
      news: 'Tin tức',
      personal: 'Cá nhân',
      education: 'Học tập',
      about: 'Giới thiệu',
      backToHome: 'Về trang chủ'
    },
    hero: {
      badge: 'AI-Powered Financial Intelligence',
      title: 'TRỢ LÝ TÀI CHÍNH THÔNG MINH VỚI AI',
      subtitle: 'Phân tích tin tức tài chính, dự báo xu hướng thị trường, và tối ưu hóa danh mục đầu tư của bạn với công nghệ AI tiên tiến',
      ctaPrimary: 'Bắt đầu miễn phí',
      ctaSecondary: 'Xem Demo',
      stats: {
        users: 'Người dùng',
        accuracy: 'Độ chính xác',
        saved: 'Tiết kiệm thời gian'
      }
    },
    features: {
      title: 'Tính năng nổi bật',
      subtitle: 'Công nghệ AI tiên tiến giúp bạn đầu tư thông minh hơn',
      news: {
        title: 'Phân tích tin tức thông minh',
        description: 'AI tổng hợp và phân tích hàng ngàn bài báo tài chính, giúp bạn nắm bắt thông tin quan trọng ngay lập tức'
      },
      portfolio: {
        title: 'Quản lý danh mục đầu tư',
        description: 'Theo dõi và tối ưu hóa danh mục của bạn với các đề xuất được cá nhân hóa từ AI'
      },
      learning: {
        title: 'Học tập gamification',
        description: 'Tích lũy M-Points, mở khóa nội dung premium và nâng cao kiến thức tài chính của bạn'
      }
    },
    howItWorks: {
      title: 'Cách hoạt động',
      subtitle: 'Quy trình đơn giản, hiệu quả cao',
      step1: {
        title: 'Thu thập dữ liệu',
        description: 'AI thu thập tin tức từ nguồn uy tín'
      },
      step2: {
        title: 'Phân tích & Tổng hợp',
        description: 'Xử lý ngôn ngữ tự nhiên phân tích sentiment'
      },
      step3: {
        title: 'Đề xuất thông minh',
        description: 'Cá nhân hóa chiến lược đầu tư cho bạn'
      }
    },
    pricing: {
      title: 'Gói dịch vụ',
      subtitle: 'Lựa chọn phù hợp với nhu cầu của bạn',
      free: {
        name: 'Miễn phí',
        price: '0đ',
        period: 'mãi mãi',
        features: [
          'Tin tức cơ bản hàng ngày',
          '3 phân tích AI/tuần',
          'Truy cập học viện cơ bản',
          'Hỗ trợ cộng đồng'
        ],
        cta: 'Bắt đầu ngay'
      },
      pro: {
        name: 'Pro',
        price: '299,000đ',
        period: 'tháng',
        popular: 'Phổ biến nhất',
        features: [
          'Tin tức & phân tích không giới hạn',
          'Quản lý danh mục đầu tư',
          'Học viện Premium (M-Points)',
          'Hỗ trợ ưu tiên',
          'Tín hiệu đầu tư thời gian thực'
        ],
        cta: 'Nâng cấp Pro'
      }
    },
    footer: {
      tagline: 'Trợ lý tài chính thông minh với AI',
      product: 'Sản phẩm',
      features: 'Tính năng',
      pricing: 'Bảng giá',
      company: 'Công ty',
      about: 'Giới thiệu & Pháp lý',
      careers: 'Tuyển dụng',
      contact: 'Liên hệ',
      legal: 'Pháp lý',
      privacy: 'Chính sách bảo mật',
      terms: 'Điều khoản sử dụng',
      rights: 'Bản quyền thuộc về MacroInsight Agent'
    },
    education: {
      title: 'Học viện MacroInsight',
      subtitle: 'Nâng cao kiến thức tài chính của bạn',
      level: 'Cấp độ',
      points: 'điểm',
      free: 'Miễn phí',
      locked: 'Khóa',
      unlock: 'Mở khóa',
      play: 'Phát',
      unlockSuccess: 'Mở khóa thành công!',
      unlockMessage: 'Bạn vừa mở khóa',
      enjoyLearning: 'Chúc bạn học tập vui vẻ!'
    },
    about: {
      title: 'Về chúng tôi',
      mission: {
        title: 'Sứ mệnh',
        content: 'MacroInsight Agent là nền tảng trợ lý tài chính thông minh được phát triển bởi công nghệ AI tiên tiến. Chúng tôi cam kết mang đến cho người dùng Việt Nam công cụ phân tích tài chính chuyên nghiệp, dễ sử dụng và hoàn toàn miễn phí.'
      },
      vision: {
        title: 'Tầm nhìn',
        content: 'Trở thành nền tảng trí tuệ tài chính hàng đầu Việt Nam, giúp hàng triệu nhà đầu tư đưa ra quyết định thông minh dựa trên dữ liệu và phân tích AI.'
      },
      values: {
        title: 'Giá trị cốt lõi',
        transparency: 'Minh bạch',
        innovation: 'Đổi mới',
        userFirst: 'Người dùng là trung tâm'
      },
      legal: {
        title: 'Pháp lý & Tuân thủ',
        privacy: {
          title: 'Chính sách bảo mật',
          content: 'Chúng tôi cam kết bảo vệ dữ liệu cá nhân của bạn. Mọi thông tin thu thập đều được mã hóa và lưu trữ an toàn theo tiêu chuẩn quốc tế.'
        },
        terms: {
          title: 'Điều khoản sử dụng',
          content: 'Bằng cách sử dụng MacroInsight Agent, bạn đồng ý tuân thủ các điều khoản và điều kiện của chúng tôi. Dịch vụ cung cấp thông tin tài chính chỉ mang tính chất tham khảo.'
        },
        disclaimer: {
          title: 'Tuyên bố miễn trừ trách nhiệm',
          content: 'Thông tin trên nền tảng không phải lời khuyên đầu tư. Người dùng tự chịu trách nhiệm với các quyết định tài chính của mình.'
        }
      },
      team: {
        title: 'Đội ngũ phát triển',
        subtitle: 'Những con người đằng sau MacroInsight Agent'
      }
    }
  },
  en: {
    nav: {
      home: 'Home',
      news: 'News',
      personal: 'Personal',
      education: 'Education',
      about: 'About',
      backToHome: 'Back to Home'
    },
    hero: {
      badge: 'AI-Powered Financial Intelligence',
      title: 'SMART FINANCIAL ASSISTANT WITH AI',
      subtitle: 'Analyze financial news, predict market trends, and optimize your investment portfolio with advanced AI technology',
      ctaPrimary: 'Get Started Free',
      ctaSecondary: 'View Demo',
      stats: {
        users: 'Users',
        accuracy: 'Accuracy',
        saved: 'Time Saved'
      }
    },
    features: {
      title: 'Key Features',
      subtitle: 'Advanced AI technology helps you invest smarter',
      news: {
        title: 'Smart News Analysis',
        description: 'AI aggregates and analyzes thousands of financial articles, helping you grasp important information instantly'
      },
      portfolio: {
        title: 'Portfolio Management',
        description: 'Track and optimize your portfolio with personalized AI recommendations'
      },
      learning: {
        title: 'Gamified Learning',
        description: 'Earn M-Points, unlock premium content and enhance your financial knowledge'
      }
    },
    howItWorks: {
      title: 'How It Works',
      subtitle: 'Simple process, high efficiency',
      step1: {
        title: 'Data Collection',
        description: 'AI collects news from trusted sources'
      },
      step2: {
        title: 'Analysis & Synthesis',
        description: 'NLP analyzes sentiment and trends'
      },
      step3: {
        title: 'Smart Recommendations',
        description: 'Personalized investment strategies for you'
      }
    },
    pricing: {
      title: 'Pricing Plans',
      subtitle: 'Choose the right plan for your needs',
      free: {
        name: 'Free',
        price: '$0',
        period: 'forever',
        features: [
          'Daily basic news',
          '3 AI analyses/week',
          'Basic academy access',
          'Community support'
        ],
        cta: 'Get Started'
      },
      pro: {
        name: 'Pro',
        price: '$12',
        period: 'month',
        popular: 'Most Popular',
        features: [
          'Unlimited news & analysis',
          'Portfolio management',
          'Premium Academy (M-Points)',
          'Priority support',
          'Real-time trading signals'
        ],
        cta: 'Upgrade to Pro'
      }
    },
    footer: {
      tagline: 'Smart financial assistant with AI',
      product: 'Product',
      features: 'Features',
      pricing: 'Pricing',
      company: 'Company',
      about: 'About & Legal',
      careers: 'Careers',
      contact: 'Contact',
      legal: 'Legal',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      rights: 'All rights reserved by MacroInsight Agent'
    },
    education: {
      title: 'MacroInsight Academy',
      subtitle: 'Enhance your financial knowledge',
      level: 'Level',
      points: 'points',
      free: 'Free',
      locked: 'Locked',
      unlock: 'Unlock',
      play: 'Play',
      unlockSuccess: 'Unlock Successful!',
      unlockMessage: 'You just unlocked',
      enjoyLearning: 'Enjoy your learning!'
    },
    about: {
      title: 'About Us',
      mission: {
        title: 'Mission',
        content: 'MacroInsight Agent is an intelligent financial assistant platform powered by advanced AI technology. We are committed to providing Vietnamese users with professional, user-friendly, and completely free financial analysis tools.'
      },
      vision: {
        title: 'Vision',
        content: 'To become the leading financial intelligence platform in Vietnam, helping millions of investors make smart decisions based on data and AI analysis.'
      },
      values: {
        title: 'Core Values',
        transparency: 'Transparency',
        innovation: 'Innovation',
        userFirst: 'User First'
      },
      legal: {
        title: 'Legal & Compliance',
        privacy: {
          title: 'Privacy Policy',
          content: 'We are committed to protecting your personal data. All collected information is encrypted and stored securely according to international standards.'
        },
        terms: {
          title: 'Terms of Service',
          content: 'By using MacroInsight Agent, you agree to comply with our terms and conditions. The service provides financial information for reference only.'
        },
        disclaimer: {
          title: 'Disclaimer',
          content: 'Information on the platform is not investment advice. Users are responsible for their own financial decisions.'
        }
      },
      team: {
        title: 'Development Team',
        subtitle: 'The people behind MacroInsight Agent'
      }
    }
  }
};
