'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import LoginPage from '@/components/LoginPage';
import VoiceModal from '@/components/VoiceModal';
import ManualModal from '@/components/ManualModal';
import CustomerModal from '@/components/CustomerModal';
import { api } from '@/lib/api';
import { DashboardSummary, Customer, Transaction } from '@/types';
import {
  Mic,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  Search,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Phone,
  Sparkles
} from 'lucide-react';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Load dashboard data
  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardSummary();
      setDashboard(data);
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboard();
    }
  }, [isAuthenticated, loadDashboard]);

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  const filteredCustomers = (dashboard?.top_debtors || []).filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone && c.phone.includes(searchQuery))
  );

  return (
    <div className="min-h-screen bg-[#171721] text-[#EDEDF3] flex flex-col">
      
      {/* Navigation */}
      <Navbar
        onOpenVoiceModal={() => setIsVoiceOpen(true)}
        onLogout={() => setIsAuthenticated(false)}
        isLoggedIn={true}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Top Hero Banner & Voice CTA */}
        <div className="relative overflow-hidden rounded-2xl border border-[#374151] bg-[#20202D] p-6 shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#5266EB]/30 bg-[#5266EB]/10 px-3 py-1 text-xs font-semibold text-[#5266EB]">
                <Sparkles className="h-3 w-3" />
                <span>Voice Ledger Active</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#EDEDF3]">
                Kirana Business Ledger
              </h1>
              <p className="text-xs sm:text-sm text-[#70707D]">
                Speak naturally in Hindi, Hinglish, Marathi, or English to record customer credit & payments instantly.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsVoiceOpen(true)}
                className="flex items-center gap-2 rounded-full bg-[#5266EB] hover:bg-[#4055E6] px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all active:scale-95"
              >
                <Mic className="h-4 w-4" />
                <span>Speak Transaction</span>
              </button>

              <button
                onClick={() => setIsManualOpen(true)}
                className="flex items-center gap-2 rounded-full border border-[#374151] bg-[#171721] hover:bg-[#20202D] px-4 py-3 text-sm font-semibold text-[#EDEDF3] transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Manual Entry</span>
              </button>
            </div>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Outstanding */}
          <div className="rounded-xl border border-[#374151] bg-[#20202D] p-5">
            <span className="text-xs font-medium text-[#70707D] uppercase tracking-wider block">
              Total Outstanding (कुल बाकी)
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-[#EF4444]">
                ₹{dashboard?.total_outstanding_rupees.toFixed(2) || '0.00'}
              </span>
              <span className="rounded-full bg-[#EF4444]/10 border border-[#EF4444]/30 px-2 py-0.5 text-[10px] font-semibold text-[#EF4444]">
                To Collect
              </span>
            </div>
            <p className="mt-2 text-[11px] text-[#70707D]">
              Across {dashboard?.active_credit_customers || 0} active debtor accounts
            </p>
          </div>

          {/* Card 2: Today's Credit */}
          <div className="rounded-xl border border-[#374151] bg-[#20202D] p-5">
            <span className="text-xs font-medium text-[#70707D] uppercase tracking-wider block">
              Today's Credit (आज का उधार)
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-[#EDEDF3]">
                ₹{dashboard?.today_credit_rupees.toFixed(2) || '0.00'}
              </span>
              <span className="flex items-center text-[10px] font-semibold text-[#EF4444]">
                <TrendingUp className="h-3 w-3 mr-0.5" /> Udhaar
              </span>
            </div>
            <p className="mt-2 text-[11px] text-[#70707D]">New credit given today</p>
          </div>

          {/* Card 3: Today's Collection */}
          <div className="rounded-xl border border-[#374151] bg-[#20202D] p-5">
            <span className="text-xs font-medium text-[#70707D] uppercase tracking-wider block">
              Today's Collection (आज की वसूली)
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-[#10B981]">
                ₹{dashboard?.today_payment_rupees.toFixed(2) || '0.00'}
              </span>
              <span className="flex items-center text-[10px] font-semibold text-[#10B981]">
                <TrendingDown className="h-3 w-3 mr-0.5" /> Jama
              </span>
            </div>
            <p className="mt-2 text-[11px] text-[#70707D]">Cash & UPI payments received</p>
          </div>

          {/* Card 4: Customers Count */}
          <div className="rounded-xl border border-[#374151] bg-[#20202D] p-5">
            <span className="text-xs font-medium text-[#70707D] uppercase tracking-wider block">
              Total Customers (ग्राहक)
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-[#EDEDF3]">
                {dashboard?.total_customers || 0}
              </span>
              <span className="flex items-center text-[10px] font-semibold text-[#5266EB]">
                <Users className="h-3 w-3 mr-0.5" /> Khata
              </span>
            </div>
            <p className="mt-2 text-[11px] text-[#70707D]">Registered in business directory</p>
          </div>

        </div>

        {/* Main Grid: Ledger & Top Debtors */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent Transactions List (2 Cols) */}
          <div className="lg:col-span-2 rounded-xl border border-[#374151] bg-[#20202D] p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#374151]">
              <div>
                <h3 className="text-base font-bold text-[#EDEDF3]">Recent Ledger Transactions</h3>
                <p className="text-xs text-[#70707D]">Live atomic double-entry updates</p>
              </div>
              <button
                onClick={loadDashboard}
                disabled={loading}
                title="Refresh"
                className="rounded-full p-2 text-[#70707D] hover:bg-[#171721] hover:text-[#EDEDF3] transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-[#70707D]">Loading ledger...</div>
            ) : (dashboard?.recent_transactions || []).length === 0 ? (
              <div className="py-12 text-center text-xs text-[#70707D]">
                No transactions yet. Click <strong>Speak Transaction</strong> to record the first one!
              </div>
            ) : (
              <div className="space-y-2.5">
                {dashboard?.recent_transactions.map((tx) => {
                  const isCredit = tx.transaction_type === 'CREDIT';
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between rounded-xl border border-[#374151] bg-[#171721] p-3.5 hover:border-[#5266EB]/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          isCredit ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-[#10B981]/20 text-[#10B981]'
                        }`}>
                          {isCredit ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#EDEDF3]">
                              {tx.customer_name || 'Customer'}
                            </span>
                            {tx.source === 'VOICE' && (
                              <span className="flex items-center gap-0.5 rounded-full bg-[#5266EB]/20 border border-[#5266EB]/30 px-2 py-0.5 text-[9px] font-semibold text-[#5266EB]">
                                <Mic className="h-2.5 w-2.5" /> Gnani Voice
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#70707D]">{tx.description || (isCredit ? 'Udhaar' : 'Jama')}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-base font-extrabold block ${
                          isCredit ? 'text-[#EF4444]' : 'text-[#10B981]'
                        }`}>
                          {isCredit ? '+' : '-'} ₹{tx.amount_rupees.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-[#70707D]">
                          {new Date(tx.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Outstanding Customers (1 Col) */}
          <div className="rounded-xl border border-[#374151] bg-[#20202D] p-5 flex flex-col">
            <div className="mb-4 pb-3 border-b border-[#374151]">
              <h3 className="text-base font-bold text-[#EDEDF3]">Top Outstanding Debtors</h3>
              <p className="text-xs text-[#70707D]">Customers with highest credit balance</p>
            </div>

            {/* Customer Search Bar */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#70707D]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customers..."
                className="w-full rounded-full border border-[#374151] bg-[#171721] pl-9 pr-4 py-2 text-xs text-[#EDEDF3] placeholder-[#70707D] focus:border-[#5266EB] focus:outline-none"
              />
            </div>

            {filteredCustomers.length === 0 ? (
              <p className="py-8 text-center text-xs text-[#70707D]">No debtor customers found.</p>
            ) : (
              <div className="space-y-2">
                {filteredCustomers.map((cust) => (
                  <button
                    key={cust.id}
                    onClick={() => {
                      setSelectedCustomer(cust);
                      setIsCustomerModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between rounded-xl border border-[#374151] bg-[#171721] p-3 text-left hover:border-[#5266EB] transition-colors"
                  >
                    <div>
                      <span className="text-xs font-bold text-[#EDEDF3] block">{cust.name}</span>
                      {cust.phone ? (
                        <span className="text-[10px] text-[#70707D] flex items-center gap-1">
                          <Phone className="h-2.5 w-2.5" /> {cust.phone}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#70707D]">Customer #{cust.id}</span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-[#EF4444]">
                      ₹{cust.current_balance_rupees.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

      </main>

      {/* Modals */}
      <VoiceModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onSuccess={loadDashboard}
      />

      <ManualModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        onSuccess={loadDashboard}
      />

      <CustomerModal
        customer={selectedCustomer}
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setSelectedCustomer(null);
        }}
        onOpenVoiceForCustomer={(name) => {
          setIsVoiceOpen(true);
        }}
      />

    </div>
  );
}
