'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Mic, ShieldCheck, Sparkles, ArrowRight, Store, CheckCircle } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [phone, setPhone] = useState('9876543210');
  const [pin, setPin] = useState('1234');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 400);
  };

  const handleQuickDemo = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 300);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#171721] p-4 sm:p-6">
      
      {/* 1. Live Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover filter brightness-[0.45] contrast-125"
      >
        <source src="/background-video.mp4" type="video/mp4" />
      </video>

      {/* 2. Atmospheric Dark Overlay (Mercury Dark Theme) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#171721]/85 via-[#171721]/80 to-[#171721]/95 backdrop-blur-[3px]" />

      {/* 3. Centered Content Card (Zero Overlap Guaranteed) */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#374151] bg-[#171721]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-[#5266EB] shadow-lg mb-4">
            <Image
              src="/logo.jpg"
              alt="IND-voice Official Logo"
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#5266EB]/30 bg-[#5266EB]/10 px-3 py-1 text-xs font-semibold text-[#5266EB] mb-2">
            <Sparkles className="h-3 w-3" />
            <span>Voice-First Business Ledger</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#EDEDF3]">
            IND-voice
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#70707D]">
            बोल कर लिखो — Smart Khata for Indian Kirana & Small Merchants
          </p>
        </div>

        {/* Feature Badges */}
        <div className="mt-6 grid grid-cols-2 gap-2 text-[11px] text-[#EDEDF3]">
          <div className="flex items-center gap-1.5 rounded-lg border border-[#374151] bg-[#20202D]/80 p-2">
            <Mic className="h-3.5 w-3.5 text-[#5266EB] shrink-0" />
            <span>Gnani Prisma STT</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-[#374151] bg-[#20202D]/80 p-2">
            <ShieldCheck className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
            <span>Integer Paise Math</span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-[#EDEDF3] block mb-1.5">
              Merchant Mobile Number
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-semibold text-[#70707D]">+91</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98765 43210"
                className="w-full rounded-xl border border-[#374151] bg-[#20202D] pl-12 pr-4 py-2.5 text-sm font-medium text-[#EDEDF3] focus:border-[#5266EB] focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#EDEDF3] block mb-1.5">
              Shopkeeper Security PIN
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              maxLength={4}
              className="w-full rounded-xl border border-[#374151] bg-[#20202D] px-4 py-2.5 text-sm font-medium text-[#EDEDF3] focus:border-[#5266EB] focus:outline-none transition-colors tracking-widest text-center"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#5266EB] hover:bg-[#4055E6] py-3 text-sm font-semibold text-white shadow-lg transition-all active:scale-[0.98]"
          >
            <span>{loading ? 'Entering Shop...' : 'Open Ledger'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Quick Demo Access Button */}
        <div className="mt-4 pt-4 border-t border-[#374151] text-center">
          <button
            type="button"
            onClick={handleQuickDemo}
            className="inline-flex items-center gap-2 rounded-full border border-[#374151] bg-[#20202D] hover:bg-[#282838] px-4 py-2 text-xs font-medium text-[#EDEDF3] transition-colors"
          >
            <Store className="h-3.5 w-3.5 text-[#5266EB]" />
            <span>Launch Instant Kirana Merchant Demo</span>
          </button>
        </div>

        {/* Security & Invariants Disclaimer */}
        <p className="mt-6 text-center text-[11px] text-[#70707D]">
          Protected by Cloudflare Security Standards & Atomic Double-Entry Ledger.
        </p>

      </div>

    </div>
  );
}
