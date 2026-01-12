'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';

interface RomanticButtonProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export default function RomanticButton({
  href,
  onClick,
  children,
  variant = 'primary'
}: RomanticButtonProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const baseClasses = "relative overflow-hidden px-6 py-3 md:px-8 md:py-4 rounded-full font-medium text-base md:text-lg transition-all duration-300 shadow-lg";

  const variantClasses = {
    primary: isDark
      ? "bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white hover:shadow-xl hover:shadow-purple-500/30"
      : "bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 text-white hover:shadow-xl hover:shadow-pink-300/50",
    secondary: isDark
      ? "bg-slate-800/70 backdrop-blur-sm text-pink-300 border-2 border-purple-500/50 hover:bg-purple-900/50 hover:border-purple-400"
      : "bg-white/70 backdrop-blur-sm text-rose-600 border-2 border-pink-200 hover:bg-pink-50 hover:border-pink-300",
  };

  const content = (
    <motion.span
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseClasses} ${variantClasses[variant]} inline-block cursor-pointer`}
    >
      {/* Shimmer effect */}
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000" />
      <span className="relative z-10">{children}</span>
    </motion.span>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return <button onClick={onClick}>{content}</button>;
}
