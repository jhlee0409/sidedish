'use client'

import React from 'react'
import { FieldError } from 'react-hook-form'

interface FormFieldProps {
  label: string
  htmlFor?: string
  required?: boolean
  error?: FieldError
  hint?: string
  children: React.ReactNode
  className?: string
}

/**
 * 폼 필드 래퍼 컴포넌트
 *
 * 라벨, 에러 메시지, 힌트 텍스트를 일관되게 표시합니다.
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-1.5 sm:space-y-2 ${className}`}>
      <label
        htmlFor={htmlFor}
        className="block text-xs sm:text-sm font-bold text-slate-700"
      >
        {label}
        {required && <span className="text-orange-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 mt-1">{error.message}</p>
      )}
      {!error && hint && (
        <p className="text-xs text-slate-400 mt-1">{hint}</p>
      )}
    </div>
  )
}

interface FormErrorProps {
  error?: FieldError | string
  className?: string
}

/**
 * 폼 에러 메시지 컴포넌트
 */
export const FormError: React.FC<FormErrorProps> = ({ error, className = '' }) => {
  if (!error) return null

  const message = typeof error === 'string' ? error : error.message

  return (
    <p className={`text-xs text-red-500 ${className}`}>{message}</p>
  )
}

interface FormHintProps {
  children: React.ReactNode
  className?: string
}

/**
 * 폼 힌트 텍스트 컴포넌트
 */
export const FormHint: React.FC<FormHintProps> = ({ children, className = '' }) => {
  return (
    <p className={`text-xs text-slate-400 ${className}`}>{children}</p>
  )
}

interface CharacterCountProps {
  current: number
  max: number
  min?: number
  className?: string
}

/**
 * 글자 수 카운터 컴포넌트
 */
export const CharacterCount: React.FC<CharacterCountProps> = ({
  current,
  max,
  min,
  className = '',
}) => {
  const isValid = min ? current >= min : true
  const isOverMax = current > max

  return (
    <span
      className={`text-xs ${
        isOverMax
          ? 'text-red-500'
          : isValid
          ? 'text-green-600'
          : 'text-slate-400'
      } ${className}`}
    >
      {current}
      {min && current < min && <span className="text-slate-400"> / 최소 {min}자</span>}
      {!min && `/${max}`}
    </span>
  )
}

export default FormField
