'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';

interface RomanticButtonProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
  disabled?: boolean;
}

export default function RomanticButton({
  href,
  onClick,
  children,
  variant = 'primary',
  isLoading = false,
  disabled = false
}: RomanticButtonProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const baseClasses = "relative overflow-hidden px-6 py-3 md:px-8 md:py-4 rounded-full font-medium text-base md:text-lg transition-all duration-300 shadow-lg flex items-center justify-center gap-2 min-w-[140px]";

  const variantClasses = {
    primary: isDark
      ? "bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white hover:shadow-xl hover:shadow-purple-500/30 disabled:opacity-70"
      : "bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 text-white hover:shadow-xl hover:shadow-pink-300/50 disabled:opacity-70",
    secondary: isDark
      ? "bg-slate-800/70 backdrop-blur-sm text-pink-300 border-2 border-purple-500/50 hover:bg-purple-900/50 hover:border-purple-400 disabled:opacity-50"
      : "bg-white/70 backdrop-blur-sm text-rose-600 border-2 border-pink-200 hover:bg-pink-50 hover:border-pink-300 disabled:opacity-50",
  };

  const spinner = (
    <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  const content = (
    <motion.span
      whileHover={(!disabled && !isLoading) ? { scale: 1.05 } : {}}
      whileTap={(!disabled && !isLoading) ? { scale: 0.98 } : {}}
      className={`${baseClasses} ${variantClasses[variant]} ${href ? 'inline-flex' : ''} ${(disabled || isLoading) ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {/* Shimmer effect - hidden when loading */}
      {!isLoading && (
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000" />
      )}

      <span className="relative z-10 flex items-center gap-2">
        {isLoading && spinner}
        {children}
      </span>
    </motion.span>
  );

  if (href && !disabled && !isLoading) {
    return <Link href={href}>{content}</Link>;
  }

  return (
    <button
      onClick={!isLoading && !disabled ? onClick : undefined}
      disabled={disabled || isLoading}
      className="focus:outline-none"
    >
      {content}
    </button>
  );
}
