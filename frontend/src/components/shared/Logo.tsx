'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const sizes = {
    sm: { icon: 32, text: 'text-lg' },
    md: { icon: 44, text: 'text-xl' },
    lg: { icon: 60, text: 'text-3xl' }
  };

  const { icon, text } = sizes[size];

  return (
    <div className="flex items-center gap-3">
      <motion.div
        className="relative flex items-center justify-center"
        style={{
          width: icon,
          height: icon,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Image
          src="/logo_new-removebg-preview-nobg.svg"
          alt="MacroInsight Logo"
          width={icon}
          height={icon}
          priority
        />
      </motion.div>
      {showText && (
        <div className="flex flex-col">
          <span className={`${text} font-bold text-gradient`}>
            MacroInsight
          </span>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Vietnamese Financial & Legal AI
          </span>
        </div>
      )}
    </div>
  );
}
