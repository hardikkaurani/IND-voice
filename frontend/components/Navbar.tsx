'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mic, LogOut } from 'lucide-react';

interface NavbarProps {
  onOpenVoiceModal?: () => void;
  onLogout?: () => void;
  isLoggedIn?: boolean;
}

export default function Navbar({ onOpenVoiceModal, onLogout, isLoggedIn = true }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E5E7EB] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand & Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-10 w-10 overflow-hidden rounded-full border border-[#E5E7EB] shadow-sm transition-transform group-hover:scale-105">
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
              <span className="text-lg font-normal tracking-tight text-[#000000]">IND-voice</span>
              <span className="rounded bg-[#2075CC]/10 px-2 py-0.5 text-[10px] font-semibold text-[#2075CC] border border-[#2075CC]/20">
                Institutional
              </span>
            </div>
            <p className="text-xs text-[#5B6472] hidden sm:block">बोल कर लिखो — Voice Ledger</p>
          </div>
        </Link>

        {/* Center Navigation */}
        {isLoggedIn && (
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
                pathname === '/'
                  ? 'bg-[#F1F5F9] text-[#2075CC]'
                  : 'text-[#5B6472] hover:text-[#000000] hover:bg-[#F8FAFC]'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/customers"
              className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
                pathname === '/customers'
                  ? 'bg-[#F1F5F9] text-[#2075CC]'
                  : 'text-[#5B6472] hover:text-[#000000] hover:bg-[#F8FAFC]'
              }`}
            >
              Customers (खाता)
            </Link>
            <Link
              href="/history"
              className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
                pathname === '/history'
                  ? 'bg-[#F1F5F9] text-[#2075CC]'
                  : 'text-[#5B6472] hover:text-[#000000] hover:bg-[#F8FAFC]'
              }`}
            >
              Transactions (लेन-देन)
            </Link>
          </nav>
        )}

        {/* Right CTA / Voice Action */}
        <div className="flex items-center gap-3">
          {isLoggedIn && onOpenVoiceModal && (
            <button
              onClick={onOpenVoiceModal}
              className="flex items-center gap-2 rounded bg-[#2075CC] hover:bg-[#115AA4] text-white px-4 py-2.5 text-sm font-medium transition-colors shadow-sm active:scale-[0.98]"
            >
              <Mic className="h-4 w-4" />
              <span className="hidden sm:inline">Speak Transaction</span>
              <span className="sm:hidden">Speak</span>
            </button>
          )}

          {isLoggedIn && onLogout && (
            <button
              onClick={onLogout}
              title="Sign Out"
              className="rounded p-2 text-[#5B6472] hover:text-[#000000] hover:bg-[#F1F5F9] transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
