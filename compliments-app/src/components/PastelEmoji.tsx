'use client';

interface PastelEmojiProps {
  emoji: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
  xl: 'text-5xl',
};

export default function PastelEmoji({ emoji, size = 'md', className = '' }: PastelEmojiProps) {
  return (
    <span
      className={`inline-block ${sizeClasses[size]} ${className}`}
      style={{
        filter: 'saturate(0.7) brightness(1.1)',
        opacity: 0.9,
      }}
    >
      {emoji}
    </span>
  );
}
