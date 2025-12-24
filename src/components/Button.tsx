'use client'

import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  icon?: React.ReactNode
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  // Base styles with 2025 microinteractions
  const baseStyles = `
    inline-flex items-center justify-center font-semibold
    transition-all duration-200 ease-out
    focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    active:scale-[0.98]
  `.replace(/\s+/g, ' ').trim()

  // Variant styles with enhanced hover states
  const variants = {
    primary: `
      bg-orange-500 text-white border border-transparent
      hover:bg-orange-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-200
      focus-visible:ring-orange-400
    `.replace(/\s+/g, ' ').trim(),
    secondary: `
      bg-orange-50 text-orange-700 border border-transparent
      hover:bg-orange-100 hover:-translate-y-0.5
      focus-visible:ring-orange-400
    `.replace(/\s+/g, ' ').trim(),
    outline: `
      border border-slate-200 bg-white text-slate-700
      hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5
      focus-visible:ring-slate-400
      shadow-sm
    `.replace(/\s+/g, ' ').trim(),
    ghost: `
      text-slate-500 border border-transparent
      hover:bg-slate-100/50 hover:text-slate-900
      focus-visible:ring-slate-400
    `.replace(/\s+/g, ' ').trim()
  }

  // Size presets with minimum 44px touch target for accessibility
  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-5 py-2.5 text-sm min-h-[44px]',  // 44px minimum touch target
    lg: 'px-6 py-3 text-base min-h-[48px]'
  }

  const defaultRounded = className.includes('rounded-') ? '' : 'rounded-xl'
  const sizeStyles = className.includes('p-') || className.includes('px-') ? '' : sizes[size]

  return (
    <button
      className={`${baseStyles} ${defaultRounded} ${sizeStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {!isLoading && icon && <span className="mr-2 flex-shrink-0">{icon}</span>}
      {children}
    </button>
  )
}

export default Button
