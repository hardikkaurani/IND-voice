'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Mic, ShieldCheck, Store } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [identifier, setIdentifier] = useState('98765 43210');
  const [password, setPassword] = useState('1234');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#FFFFFF]">
      
      {/* ========================================================
          LEFT COLUMN: VIDEO & INSTITUTIONAL EDITORIAL HERO
         ======================================================== */}
      <div className="relative w-full lg:w-[58%] min-h-[480px] lg:min-h-screen flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden bg-[#0B1A2F]">
        
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover filter brightness-[0.50] contrast-125"
        >
          <source src="/background-video.mp4" type="video/mp4" />
        </video>

        {/* Deep Navy Overlay matching Morgan Stanley / Institutional Style */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1A2F] via-[#0B1A2F]/80 to-[#0B1A2F]/70 backdrop-blur-[2px]" />

        {/* Top Header: Brand Identity */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="relative h-11 w-11 overflow-hidden rounded-full border border-white/20 shadow-md">
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
              <span className="text-xl font-bold tracking-tight text-white">IND-voice</span>
              <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/80 border border-white/15">
                v1.0
              </span>
            </div>
            <p className="text-[11px] font-medium tracking-wider text-slate-300 uppercase">
              Personal Business Ledger
            </p>
          </div>
        </div>

        {/* Middle: Editorial Value Proposition */}
        <div className="relative z-10 my-12 lg:my-auto max-w-xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded bg-[#2075CC]/25 border border-[#2075CC]/40 px-3 py-1 text-xs font-semibold text-[#93C5FD]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#60A5FA] animate-pulse" />
            <span>INSTITUTIONAL VOICE LEDGER</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-normal leading-[1.15] text-white tracking-tight">
            Knowledge captured with precision.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 font-light leading-relaxed max-w-lg">
            A secure, private intelligence workspace designed for Kirana merchants, small distributors, and independent retailers in Indian languages.
          </p>
        </div>

        {/* Bottom Metadata Badges */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#2075CC]" />
            <span>Enterprise Double-Entry Invariants</span>
          </div>
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-[#2075CC]" />
            <span>Gnani Prisma v3 Multilingual STT</span>
          </div>
          <span>Integer Paise Precision</span>
        </div>

      </div>

      {/* ========================================================
          RIGHT COLUMN: CLEAN WHITE SIGN-IN PANEL
         ======================================================== */}
      <div className="w-full lg:w-[42%] flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 lg:py-20 bg-[#FFFFFF]">
        <div className="w-full max-w-md mx-auto space-y-7">
          
          {/* Form Header */}
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-normal tracking-tight text-[#000000]">
              Sign in to IND-voice
            </h2>
            <p className="text-sm text-[#5B6472]">
              Access your private captures, search indices, and research notes.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Merchant Identifier */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold tracking-wider text-[#5B6472] uppercase block">
                Email Address or Mobile
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="you@domain.com or 98765 43210"
                required
                className="w-full h-12 px-4 rounded border border-[#E5E7EB] bg-white text-base text-[#000000] placeholder-[#9CA3AF] focus:border-[#2075CC] focus:ring-1 focus:ring-[#2075CC] focus:outline-none transition-all"
              />
            </div>

            {/* Password / PIN */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-semibold tracking-wider text-[#5B6472] uppercase">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-[#2075CC] hover:text-[#115AA4] font-medium"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-12 px-4 rounded border border-[#E5E7EB] bg-white text-base text-[#000000] placeholder-[#9CA3AF] focus:border-[#2075CC] focus:ring-1 focus:ring-[#2075CC] focus:outline-none transition-all"
              />
            </div>

            {/* Sign in Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded bg-[#2075CC] hover:bg-[#115AA4] text-white text-base font-medium shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading ? 'Signing in...' : 'Sign in'}</span>
            </button>

          </form>

          {/* Quick Demo Access Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleQuickDemo}
              className="w-full h-11 rounded border border-[#E5E7EB] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#000000] text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Store className="h-4 w-4 text-[#2075CC]" />
              <span>Launch Instant Kirana Merchant Demo</span>
            </button>
          </div>

          {/* Help & Switch */}
          <div className="pt-4 border-t border-[#E5E7EB] text-center space-y-2">
            <p className="text-xs text-[#5B6472]">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={handleQuickDemo}
                className="text-[#2075CC] hover:underline font-medium"
              >
                Create an account
              </button>
            </p>
            <p className="text-[11px] text-[#9CA3AF]">
              Language support in Hindi, Hinglish, Marathi, and English.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
