'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mic, BookOpen, Users, LogOut, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  onOpenVoiceModal?: () => void;
  onLogout?: () => void;
  isLoggedIn?: boolean;
}

export default function Navbar({ onOpenVoiceModal, onLogout, isLoggedIn = true }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#374151] bg-[#171721]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand & Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-10 w-10 overflow-hidden rounded-full border border-[#374151] shadow-sm transition-transform group-hover:scale-105">
            <Image
              src="/logo.jpg"
              alt="IND-voice Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-[#EDEDF3]">IND-voice</span>
              <span className="rounded-full bg-[#5266EB]/20 px-2 py-0.5 text-[10px] font-medium text-[#5266EB] border border-[#5266EB]/30">
                Fintech
              </span>
            </div>
            <p className="text-xs text-[#70707D] hidden sm:block">बोल कर लिखो — Voice Ledger</p>
          </div>
        </Link>

        {/* Center Navigation */}
        {isLoggedIn && (
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                pathname === '/'
                  ? 'bg-[#20202D] text-[#EDEDF3] border border-[#374151]'
                  : 'text-[#70707D] hover:text-[#EDEDF3] hover:bg-[#20202D]/50'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/customers"
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                pathname === '/customers'
                  ? 'bg-[#20202D] text-[#EDEDF3] border border-[#374151]'
                  : 'text-[#70707D] hover:text-[#EDEDF3] hover:bg-[#20202D]/50'
              }`}
            >
              Customers
            </Link>
            <Link
              href="/history"
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                pathname === '/history'
                  ? 'bg-[#20202D] text-[#EDEDF3] border border-[#374151]'
                  : 'text-[#70707D] hover:text-[#EDEDF3] hover:bg-[#20202D]/50'
              }`}
            >
              Transactions
            </Link>
          </nav>
        )}

        {/* Right CTA / Voice Action */}
        <div className="flex items-center gap-3">
          {isLoggedIn && onOpenVoiceModal && (
            <button
              onClick={onOpenVoiceModal}
              className="flex items-center gap-2 rounded-full bg-[#5266EB] hover:bg-[#4055E6] text-[#EDEDF3] px-4 py-2 text-sm font-medium transition-all shadow-md active:scale-95"
            >
              <Mic className="h-4 w-4" />
              <span className="hidden sm:inline">Speak Transaction</span>
              <span className="sm:hidden">Speak</span>
            </button>
          )}

          {isLoggedIn && onLogout && (
            <button
              onClick={onLogout}
              title="Logout"
              className="rounded-full p-2 text-[#70707D] hover:text-[#EDEDF3] hover:bg-[#20202D] transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
