'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import VoiceModal from '@/components/VoiceModal';
import { api } from '@/lib/api';
import { Transaction } from '@/types';
import { Search, ArrowUpRight, ArrowDownLeft, Mic, Download } from 'lucide-react';

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'CREDIT' | 'PAYMENT' | 'VOICE'>('ALL');
  const [query, setQuery] = useState('');
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      try {
        const data = await api.getDashboardSummary();
        if (!ignore) {
          setTransactions(data.recent_transactions || []);
          setLoading(false);
        }
      } catch (e) {
        console.error('Failed to load transaction history:', e);
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    fetchData();
    return () => {
      ignore = true;
    };
  }, [refreshIndex]);

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
    <div className="min-h-screen bg-[#F8FAFC] text-[#000000] flex flex-col font-sans">
      <Navbar onOpenVoiceModal={() => setIsVoiceOpen(true)} isLoggedIn={true} />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
          <div>
            <h1 className="text-2xl font-normal text-[#000000] tracking-tight">Ledger Transaction History</h1>
            <p className="text-xs text-[#5B6472]">Complete audit log of all voice and manual entries with integer paise precision.</p>
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded border border-[#E5E7EB] bg-white hover:bg-[#F8FAFC] px-4 py-2 text-xs font-medium text-[#000000] transition-colors shadow-sm"
          >
            <Download className="h-3.5 w-3.5 text-[#2075CC]" />
            <span>Export Statement (CSV)</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#5B6472]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by customer, note, or speech..."
              className="w-full rounded border border-[#E5E7EB] bg-white pl-10 pr-4 py-2 text-xs text-[#000000] placeholder-[#5B6472] focus:border-[#2075CC] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(['ALL', 'CREDIT', 'PAYMENT', 'VOICE'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`rounded px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  filterType === type
                    ? 'bg-[#2075CC] text-white shadow-sm'
                    : 'border border-[#E5E7EB] bg-white text-[#5B6472] hover:bg-[#F8FAFC]'
                }`}
              >
                {type === 'ALL' ? 'All Transactions' : type === 'CREDIT' ? 'Udhaar (Credit)' : type === 'PAYMENT' ? 'Jama (Payment)' : 'Voice Entries'}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="rounded-lg border border-[#E5E7EB] bg-white overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-20 text-center text-xs text-[#5B6472]">Loading transaction history...</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-xs text-[#5B6472]">No transactions found.</div>
          ) : (
            <div className="divide-y divide-[#E5E7EB]">
              {filtered.map((t) => {
                const isCredit = t.transaction_type === 'CREDIT';
                return (
                  <div
                    key={t.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-[#F8FAFC] transition-colors gap-3"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded ${
                        isCredit ? 'bg-[#C62828]/10 text-[#C62828]' : 'bg-[#059669]/10 text-[#059669]'
                      }`}>
                        {isCredit ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#000000]">{t.customer_name || 'Customer'}</span>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                            isCredit ? 'bg-[#C62828]/10 text-[#C62828]' : 'bg-[#059669]/10 text-[#059669]'
                          }`}>
                            {isCredit ? 'Udhaar' : 'Jama'}
                          </span>
                          {t.source === 'VOICE' && (
                            <span className="flex items-center gap-1 rounded bg-[#2075CC]/10 border border-[#2075CC]/20 px-1.5 py-0.5 text-[9px] font-medium text-[#2075CC]">
                              <Mic className="h-2.5 w-2.5" /> Voice
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#5B6472] mt-0.5">{t.description || 'No description'}</p>
                        {t.raw_transcript && (
                          <p className="text-[11px] text-[#2075CC] italic mt-0.5">
                            Spoken: &ldquo;{t.raw_transcript}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right sm:shrink-0">
                      <span className={`text-base font-medium ${
                        isCredit ? 'text-[#C62828]' : 'text-[#059669]'
                      }`}>
                        {isCredit ? '+' : '-'} ₹{t.amount_rupees.toFixed(2)}
                      </span>
                      <span className="text-[11px] text-[#5B6472] block mt-0.5">
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
        onSuccess={() => setRefreshIndex(prev => prev + 1)}
      />
    </div>
  );
}
