'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { LogOut, User, Utensils, Heart, MessageCircle, ChefHat } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface UserMenuProps {
  onLoginClick: () => void
}

export default function UserMenu({ onLoginClick }: UserMenuProps) {
  const { user, isAuthenticated, isLoading, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      setIsOpen(false)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse" />
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <button
        onClick={onLoginClick}
        className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl transition-colors"
      >
        <ChefHat className="w-4 h-4" />
        로그인
      </button>
    )
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-colors"
      >
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={user.name}
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-3">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.name}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 truncate">{user.name}</p>
                <p className="text-sm text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              href="/mypage"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <User className="w-5 h-5 text-slate-400" />
              마이페이지
            </Link>
            <Link
              href="/mypage?tab=menus"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Utensils className="w-5 h-5 text-slate-400" />
              내 메뉴
            </Link>
            <Link
              href="/mypage?tab=likes"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Heart className="w-5 h-5 text-slate-400" />
              찜한 메뉴
            </Link>
            <Link
              href="/mypage?tab=reviews"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-slate-400" />
              내 리뷰
            </Link>
          </div>

          {/* Sign Out */}
          <div className="py-2 border-t border-slate-100">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
