/**
 * Card component for displaying content in structured containers
 * Optimized for accessibility and elderly-friendly design
 */

import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  onClick?: () => void;
  role?: string;
  'aria-label'?: string;
}

const paddingStyles = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10',
};

export function Card({
  children,
  className = '',
  padding = 'lg',
  hover = false,
  onClick,
  role,
  'aria-label': ariaLabel,
}: CardProps) {
  const baseStyles = 'bg-white rounded-xl shadow-md border border-gray-200';
  const hoverStyles = hover ? 'hover:shadow-lg transition-shadow duration-200' : '';
  const clickableStyles = onClick ? 'cursor-pointer' : '';
  
  const classes = `
    ${baseStyles}
    ${paddingStyles[padding]}
    ${hoverStyles}
    ${clickableStyles}
    ${className}
  `.trim();

  const cardContent = (
    <div className={classes} onClick={onClick} role={role} aria-label={ariaLabel}>
      {children}
    </div>
  );

  if (hover && onClick) {
    return (
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`mb-6 ${className}`}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export function CardTitle({ children, className = '', level = 2 }: CardTitleProps) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  const baseStyles = 'font-bold text-gray-900';
  
  const sizeStyles = {
    1: 'text-3xl',
    2: 'text-2xl',
    3: 'text-xl',
    4: 'text-lg',
    5: 'text-base',
    6: 'text-sm',
  };

  return (
    <Tag className={`${baseStyles} ${sizeStyles[level]} ${className}`}>
      {children}
    </Tag>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={`text-gray-700 leading-relaxed ${className}`}>
      {children}
    </div>
  );
}