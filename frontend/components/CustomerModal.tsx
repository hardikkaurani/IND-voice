'use client';

import React, { useState, useEffect } from 'react';
import { X, Phone, Calendar, ArrowUpRight, ArrowDownLeft, Mic, Clock, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { Customer, Transaction } from '@/types';

interface CustomerModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenVoiceForCustomer?: (customerName: string) => void;
}

export default function CustomerModal({ customer, isOpen, onClose, onOpenVoiceForCustomer }: CustomerModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer && isOpen) {
      setLoading(true);
      api.getCustomerTransactions(customer.id)
        .then(setTransactions)
        .catch(() => setTransactions([]))
        .finally(() => setLoading(false));
    }
  }, [customer, isOpen]);

  if (!isOpen || !customer) return null;

  const isDebtor = customer.current_balance_paise > 0;
  const isAdvance = customer.current_balance_paise < 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-[#374151] bg-[#171721] p-6 shadow-2xl text-[#EDEDF3]">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#374151] pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-[#EDEDF3]">{customer.name}</h2>
              {customer.phone && (
                <div className="flex items-center gap-1 text-xs text-[#70707D]">
                  <Phone className="h-3 w-3" />
                  <span>{customer.phone}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-[#70707D] mt-1">Customer ID: #{customer.id}</p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-[#70707D] hover:bg-[#20202D] hover:text-[#EDEDF3] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Balance KPI Banner */}
        <div className="my-4 rounded-xl border border-[#374151] bg-[#20202D] p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#70707D] uppercase tracking-wider block">
              Current Ledger Balance
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className={`text-2xl font-black ${
                isDebtor ? 'text-[#EF4444]' : isAdvance ? 'text-[#10B981]' : 'text-[#EDEDF3]'
              }`}>
                ₹{Math.abs(customer.current_balance_rupees).toFixed(2)}
              </span>
              <span className="text-xs font-semibold uppercase text-[#70707D]">
                {isDebtor ? 'Total Baaki (Owed to Shop)' : isAdvance ? 'Advance Paid' : 'Settled'}
              </span>
            </div>
          </div>

          {onOpenVoiceForCustomer && (
            <button
              onClick={() => {
                onClose();
                onOpenVoiceForCustomer(customer.name);
              }}
              className="flex items-center gap-2 rounded-full bg-[#5266EB] hover:bg-[#4055E6] px-4 py-2 text-xs font-semibold text-white shadow transition-all active:scale-95"
            >
              <Mic className="h-3.5 w-3.5" />
              <span>Voice Entry</span>
            </button>
          )}
        </div>

        {/* Statement History */}
        <div className="flex-1 overflow-y-auto pr-1">
          <h4 className="text-xs font-bold text-[#70707D] uppercase tracking-wider mb-2">
            Ledger Statement History
          </h4>

          {loading ? (
            <p className="text-center text-xs text-[#70707D] py-8">Loading transactions...</p>
          ) : transactions.length === 0 ? (
            <p className="text-center text-xs text-[#70707D] py-8">No transactions recorded for this customer yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {transactions.map((tx) => {
                const isCredit = tx.transaction_type === 'CREDIT';
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-xl border border-[#374151] bg-[#20202D]/60 p-3 hover:border-[#5266EB]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${
                        isCredit ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-[#10B981]/20 text-[#10B981]'
                      }`}>
                        {isCredit ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#EDEDF3]">
                            {isCredit ? 'Udhaar (Credit)' : 'Jama (Payment)'}
                          </span>
                          {tx.source === 'VOICE' && (
                            <span className="flex items-center gap-0.5 rounded-full bg-[#5266EB]/20 border border-[#5266EB]/30 px-1.5 py-0.2 text-[9px] text-[#5266EB]">
                              <Mic className="h-2.5 w-2.5" /> Voice
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#70707D]">{tx.description || 'No remarks'}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-sm font-bold block ${
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

      </div>
    </div>
  );
}
