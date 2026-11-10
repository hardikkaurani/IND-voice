'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import VoiceModal from '@/components/VoiceModal';
import { api } from '@/lib/api';
import { Transaction, TransactionType } from '@/types';
import { Search, ArrowUpRight, ArrowDownLeft, Mic, RefreshCw, FileText, Download } from 'lucide-react';

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'CREDIT' | 'PAYMENT' | 'VOICE'>('ALL');
  const [query, setQuery] = useState('');
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardSummary();
      setTransactions(data.recent_transactions || []);
    } catch (e) {
      console.error('Failed to load transaction history:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const filtered = transactions.filter((t) => {
    if (filterType === 'CREDIT' && t.transaction_type !== 'CREDIT') return false;
    if (filterType === 'PAYMENT' && t.transaction_type !== 'PAYMENT') return false;
    if (filterType === 'VOICE' && t.source !== 'VOICE') return false;

    if (query) {
      const q = query.toLowerCase();
      const name = (t.customer_name || '').toLowerCase();
      const desc = (t.description || '').toLowerCase();
      const transcript = (t.raw_transcript || '').toLowerCase();
      return name.includes(q) || desc.includes(q) || transcript.includes(q);
    }
    return true;
  });

  const exportCSV = () => {
    if (filtered.length === 0) return;
    const headers = 'ID,Date,Customer,Type,Amount (Rupees),Source,Description,Transcript\n';
    const rows = filtered.map(t => [
      t.id,
      new Date(t.created_at).toISOString(),
      `"${t.customer_name || ''}"`,
      t.transaction_type,
      t.amount_rupees,
      t.source,
      `"${t.description || ''}"`,
      `"${t.raw_transcript || ''}"`
    ].join(',')).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IND-voice-statement-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#171721] text-[#EDEDF3] flex flex-col">
      <Navbar onOpenVoiceModal={() => setIsVoiceOpen(true)} isLoggedIn={true} />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#374151] pb-5">
          <div>
            <h1 className="text-2xl font-black text-[#EDEDF3]">Ledger Transaction History</h1>
            <p className="text-xs text-[#70707D]">Complete audit log of all voice and manual entries</p>
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-full border border-[#374151] bg-[#20202D] hover:bg-[#282838] px-4 py-2 text-xs font-semibold text-[#EDEDF3] transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-[#5266EB]" />
            <span>Export Statement (CSV)</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#70707D]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by customer name, note, or speech..."
              className="w-full rounded-full border border-[#374151] bg-[#20202D] pl-10 pr-4 py-2 text-xs text-[#EDEDF3] placeholder-[#70707D] focus:border-[#5266EB] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(['ALL', 'CREDIT', 'PAYMENT', 'VOICE'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  filterType === type
                    ? 'bg-[#5266EB] text-white'
                    : 'border border-[#374151] bg-[#20202D] text-[#70707D] hover:text-[#EDEDF3]'
                }`}
              >
                {type === 'ALL' ? 'All Transactions' : type === 'CREDIT' ? 'Udhaar (Credit)' : type === 'PAYMENT' ? 'Jama (Payment)' : 'Voice Entries'}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="rounded-xl border border-[#374151] bg-[#20202D] overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-xs text-[#70707D]">Loading transaction history...</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-xs text-[#70707D]">No transactions found.</div>
          ) : (
            <div className="divide-y divide-[#374151]">
              {filtered.map((t) => {
                const isCredit = t.transaction_type === 'CREDIT';
                return (
                  <div
                    key={t.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-[#171721]/50 transition-colors gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        isCredit ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-[#10B981]/20 text-[#10B981]'
                      }`}>
                        {isCredit ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#EDEDF3]">{t.customer_name || 'Customer'}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isCredit ? 'bg-[#EF4444]/15 text-[#EF4444]' : 'bg-[#10B981]/15 text-[#10B981]'
                          }`}>
                            {isCredit ? 'Udhaar' : 'Jama'}
                          </span>
                          {t.source === 'VOICE' && (
                            <span className="flex items-center gap-0.5 rounded-full bg-[#5266EB]/20 border border-[#5266EB]/30 px-1.5 py-0.2 text-[9px] text-[#5266EB]">
                              <Mic className="h-2.5 w-2.5" /> Voice
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#70707D] mt-0.5">{t.description || 'No description'}</p>
                        {t.raw_transcript && (
                          <p className="text-[11px] text-[#5266EB]/80 italic mt-0.5">
                            Spoken: "{t.raw_transcript}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right sm:shrink-0">
                      <span className={`text-base font-black ${
                        isCredit ? 'text-[#EF4444]' : 'text-[#10B981]'
                      }`}>
                        {isCredit ? '+' : '-'} ₹{t.amount_rupees.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-[#70707D] block mt-0.5">
                        {new Date(t.created_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
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

      </main>

      <VoiceModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onSuccess={loadTransactions}
      />
    </div>
  );
}
