'use client';

import { motion } from 'framer-motion';

interface ComplimentCardProps {
  text: string;
  index: number;
}

export default function ComplimentCard({ text, index }: ComplimentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: 'easeOut',
      }}
      whileHover={{
        scale: 1.02,
        boxShadow: '0 20px 40px rgba(244, 114, 182, 0.3)',
      }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-100 via-rose-50 to-pink-50 p-6 shadow-lg backdrop-blur-sm border border-pink-200/50 cursor-pointer transition-all duration-300"
    >
      {/* Decorative hearts */}
      <div className="absolute top-4 right-4 text-pink-300 text-xl">💗</div>
      <div className="absolute bottom-4 left-4 text-pink-200 text-sm">✿</div>

      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer" />

      {/* Content */}
      <div className="relative z-10">
        <p className="text-lg md:text-xl font-medium text-rose-800 leading-relaxed text-center italic">
          &quot;{text}&quot;
        </p>
      </div>

      {/* Bottom decorative line */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-gradient-to-r from-transparent via-pink-300 to-transparent rounded-full" />
    </motion.div>
  );
}
