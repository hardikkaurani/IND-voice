'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import LoginPage from '@/components/LoginPage';
import VoiceModal from '@/components/VoiceModal';
import ManualModal from '@/components/ManualModal';
import CustomerModal from '@/components/CustomerModal';
import { api } from '@/lib/api';
import { DashboardSummary, Customer } from '@/types';
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

  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let ignore = false;
    if (!isAuthenticated) return;

    async function fetchDashboard() {
      try {
        const data = await api.getDashboardSummary();
        if (!ignore) {
          setDashboard(data);
          setLoading(false);
        }
      } catch (e) {
        console.error('Failed to load dashboard:', e);
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchDashboard();
    return () => {
      ignore = true;
    };
  }, [isAuthenticated, refreshIndex]);

  const handleRefresh = () => {
    setLoading(true);
    setRefreshIndex(prev => prev + 1);
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  const filteredCustomers = (dashboard?.top_debtors || []).filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone && c.phone.includes(searchQuery))
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#000000] flex flex-col font-sans">
      
      {/* Navigation */}
      <Navbar
        onOpenVoiceModal={() => setIsVoiceOpen(true)}
        onLogout={() => setIsAuthenticated(false)}
        isLoggedIn={true}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Hero Banner & Voice CTA */}
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded bg-[#2075CC]/10 border border-[#2075CC]/20 px-3 py-1 text-xs font-semibold text-[#2075CC]">
                <Sparkles className="h-3 w-3" />
                <span>MULTILINGUAL VOICE RECORDING ACTIVE</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-[#000000]">
                Kirana Business Ledger
              </h1>
              <p className="text-sm text-[#5B6472] leading-relaxed">
                Speak naturally in Hindi, Hinglish, Marathi, or English to record customer credit & payments with verified double-entry precision.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsVoiceOpen(true)}
                className="flex items-center gap-2 rounded bg-[#2075CC] hover:bg-[#115AA4] px-5 py-3 text-sm font-medium text-white shadow-sm transition-colors active:scale-[0.98]"
              >
                <Mic className="h-4 w-4" />
                <span>Speak Transaction</span>
              </button>

              <button
                onClick={() => setIsManualOpen(true)}
                className="flex items-center gap-2 rounded border border-[#E5E7EB] bg-white hover:bg-[#F8FAFC] px-4 py-3 text-sm font-medium text-[#000000] transition-colors"
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
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <span className="text-xs font-medium text-[#5B6472] uppercase tracking-wider block">
              Total Outstanding (कुल बाकी)
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-light text-[#C62828] tracking-tight">
                ₹{dashboard?.total_outstanding_rupees.toFixed(2) || '0.00'}
              </span>
              <span className="rounded bg-[#C62828]/10 border border-[#C62828]/20 px-2 py-0.5 text-[11px] font-medium text-[#C62828]">
                To Collect
              </span>
            </div>
            <p className="mt-2 text-xs text-[#5B6472]">
              Across {dashboard?.active_credit_customers || 0} active debtor accounts
            </p>
          </div>

          {/* Card 2: Today's Credit */}
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <span className="text-xs font-medium text-[#5B6472] uppercase tracking-wider block">
              Today&apos;s Credit (आज का उधार)
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-light text-[#000000] tracking-tight">
                ₹{dashboard?.today_credit_rupees.toFixed(2) || '0.00'}
              </span>
              <span className="flex items-center text-xs font-medium text-[#C62828]">
                <TrendingUp className="h-3.5 w-3.5 mr-0.5" /> Udhaar
              </span>
            </div>
            <p className="mt-2 text-xs text-[#5B6472]">New credit given today</p>
          </div>

          {/* Card 3: Today's Collection */}
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <span className="text-xs font-medium text-[#5B6472] uppercase tracking-wider block">
              Today&apos;s Collection (आज की वसूली)
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-light text-[#059669] tracking-tight">
                ₹{dashboard?.today_payment_rupees.toFixed(2) || '0.00'}
              </span>
              <span className="flex items-center text-xs font-medium text-[#059669]">
                <TrendingDown className="h-3.5 w-3.5 mr-0.5" /> Jama
              </span>
            </div>
            <p className="mt-2 text-xs text-[#5B6472]">Cash & UPI payments received</p>
          </div>

          {/* Card 4: Customers Count */}
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <span className="text-xs font-medium text-[#5B6472] uppercase tracking-wider block">
              Total Customers (ग्राहक)
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-light text-[#000000] tracking-tight">
                {dashboard?.total_customers || 0}
              </span>
              <span className="flex items-center text-xs font-medium text-[#2075CC]">
                <Users className="h-3.5 w-3.5 mr-0.5" /> Khata
              </span>
            </div>
            <p className="mt-2 text-xs text-[#5B6472]">Registered in business directory</p>
          </div>

        </div>

        {/* Main Grid: Ledger & Top Debtors */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent Transactions List (2 Cols) */}
          <div className="lg:col-span-2 rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E5E7EB]">
              <div>
                <h3 className="text-base font-normal text-[#000000]">Recent Ledger Transactions</h3>
                <p className="text-xs text-[#5B6472]">Real-time atomic double-entry updates</p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={loading}
                title="Refresh"
                className="rounded p-2 text-[#5B6472] hover:bg-[#F8FAFC] hover:text-[#000000] transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-[#5B6472]">Loading ledger...</div>
            ) : (dashboard?.recent_transactions || []).length === 0 ? (
              <div className="py-12 text-center text-xs text-[#5B6472]">
                No transactions recorded yet. Click <strong>Speak Transaction</strong> to record the first entry.
              </div>
            ) : (
              <div className="space-y-3">
                {dashboard?.recent_transactions.map((tx) => {
                  const isCredit = tx.transaction_type === 'CREDIT';
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between rounded border border-[#E5E7EB] bg-white p-4 hover:bg-[#F8FAFC] transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`flex h-10 w-10 items-center justify-center rounded ${
                          isCredit ? 'bg-[#C62828]/10 text-[#C62828]' : 'bg-[#059669]/10 text-[#059669]'
                        }`}>
                          {isCredit ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#000000]">
                              {tx.customer_name || 'Customer'}
                            </span>
                            {tx.source === 'VOICE' && (
                              <span className="flex items-center gap-1 rounded bg-[#2075CC]/10 border border-[#2075CC]/20 px-2 py-0.5 text-[10px] font-medium text-[#2075CC]">
                                <Mic className="h-2.5 w-2.5" /> Gnani Voice
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#5B6472] mt-0.5">{tx.description || (isCredit ? 'Udhaar (Credit Given)' : 'Jama (Payment Received)')}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-base font-medium block ${
                          isCredit ? 'text-[#C62828]' : 'text-[#059669]'
                        }`}>
                          {isCredit ? '+' : '-'} ₹{tx.amount_rupees.toFixed(2)}
                        </span>
                        <span className="text-[11px] text-[#5B6472]">
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
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-sm flex flex-col">
            <div className="mb-4 pb-3 border-b border-[#E5E7EB]">
              <h3 className="text-base font-normal text-[#000000]">Top Outstanding Debtors</h3>
              <p className="text-xs text-[#5B6472]">Customers with highest credit balance</p>
            </div>

            {/* Customer Search Bar */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#5B6472]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search debtors..."
                className="w-full rounded border border-[#E5E7EB] bg-white pl-9 pr-4 py-2 text-xs text-[#000000] placeholder-[#5B6472] focus:border-[#2075CC] focus:outline-none"
              />
            </div>

            {filteredCustomers.length === 0 ? (
              <p className="py-8 text-center text-xs text-[#5B6472]">No debtor accounts found.</p>
            ) : (
              <div className="space-y-2">
                {filteredCustomers.map((cust) => (
                  <button
                    key={cust.id}
                    onClick={() => {
                      setSelectedCustomer(cust);
                      setIsCustomerModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between rounded border border-[#E5E7EB] bg-white p-3 text-left hover:bg-[#F8FAFC] transition-colors"
                  >
                    <div>
                      <span className="text-xs font-medium text-[#000000] block">{cust.name}</span>
                      {cust.phone ? (
                        <span className="text-[11px] text-[#5B6472] flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" /> {cust.phone}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#5B6472] mt-0.5">Customer #{cust.id}</span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-[#C62828]">
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
        onSuccess={() => setRefreshIndex(prev => prev + 1)}
      />

      <ManualModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        onSuccess={() => setRefreshIndex(prev => prev + 1)}
      />

      <CustomerModal
        customer={selectedCustomer}
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setSelectedCustomer(null);
        }}
        onOpenVoiceForCustomer={() => {
          setIsVoiceOpen(true);
        }}
      />

    </div>
  );
}
