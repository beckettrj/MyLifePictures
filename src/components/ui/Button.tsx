/**
 * Accessible Button component optimized for elderly users
 * Features large touch targets, high contrast, and clear visual feedback
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantStyles = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700',
  secondary: 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600 hover:border-gray-700',
  success: 'bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700',
  warning: 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600 hover:border-yellow-700',
  danger: 'bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border-gray-300 hover:border-gray-400',
};

const sizeStyles = {
  sm: 'px-3 py-2 text-sm min-h-[40px]',
  md: 'px-4 py-3 text-base min-h-[48px]',
  lg: 'px-6 py-4 text-lg min-h-[56px]',
  xl: 'px-8 py-5 text-xl min-h-[64px]',
};

export function Button({
  variant = 'primary',
  size = 'lg',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  children,
  onClick,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg border-2 transition-all duration-200 focus:ring-4 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const classes = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!loading && !disabled && onClick) {
      onClick(e);
    }
  };

  return (
    <motion.button
      className={classes}
      disabled={disabled || loading}
      onClick={handleClick}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      {...props}
    >
      {loading && (
        <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
      )}
      <span className="flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}