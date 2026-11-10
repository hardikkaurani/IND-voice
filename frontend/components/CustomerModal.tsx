'use client';

import React, { useState, useEffect } from 'react';
import { X, Phone, ArrowUpRight, ArrowDownLeft, Mic } from 'lucide-react';
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
    let isSubscribed = true;
    if (customer && isOpen) {
      api.getCustomerTransactions(customer.id)
        .then((data) => {
          if (isSubscribed) {
            setTransactions(data);
            setLoading(false);
          }
        })
        .catch(() => {
          if (isSubscribed) {
            setTransactions([]);
            setLoading(false);
          }
        });
    }
    return () => {
      isSubscribed = false;
    };
  }, [customer, isOpen]);

  if (!isOpen || !customer) return null;

  const isDebtor = customer.current_balance_paise > 0;
  const isAdvance = customer.current_balance_paise < 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1A2F]/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-lg border border-[#E5E7EB] bg-white p-6 sm:p-8 shadow-xl text-[#000000]">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#E5E7EB] pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-normal text-[#000000]">{customer.name}</h2>
              {customer.phone && (
                <div className="flex items-center gap-1 text-xs text-[#5B6472]">
                  <Phone className="h-3 w-3" />
                  <span>{customer.phone}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-[#5B6472] mt-1">Khata Account: #{customer.id}</p>
          </div>

          <button
            onClick={onClose}
            className="rounded p-2 text-[#5B6472] hover:bg-[#F8FAFC] hover:text-[#000000] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Balance Status Banner */}
        <div className={`mt-4 rounded border p-4 flex items-center justify-between ${
          isDebtor
            ? 'border-[#C62828]/20 bg-[#C62828]/5 text-[#C62828]'
            : isAdvance
            ? 'border-[#059669]/20 bg-[#059669]/5 text-[#059669]'
            : 'border-[#E5E7EB] bg-[#F8FAFC] text-[#5B6472]'
        }`}>
          <div>
            <span className="text-[10px] font-medium uppercase tracking-wider block">
              Current Outstanding Balance (बाकी राशि)
            </span>
            <span className="text-2xl font-light">
              ₹{Math.abs(customer.current_balance_rupees).toFixed(2)}
            </span>
          </div>
          <span className="rounded px-2.5 py-1 text-xs font-medium">
            {isDebtor ? 'Udhaar (Pending Payment)' : isAdvance ? 'Advance Paid' : 'Settled (हिसाब बराबर)'}
          </span>
        </div>

        {/* Action Toolbar */}
        <div className="my-4 flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium text-[#000000]">Transaction Ledger</h3>
          {onOpenVoiceForCustomer && (
            <button
              onClick={() => {
                onClose();
                onOpenVoiceForCustomer(customer.name);
              }}
              className="flex items-center gap-1.5 rounded bg-[#2075CC] hover:bg-[#115AA4] text-white px-3 py-1.5 text-xs font-medium transition-colors"
            >
              <Mic className="h-3.5 w-3.5" />
              <span>Record Voice for {customer.name}</span>
            </button>
          )}
        </div>

        {/* Transactions List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#5B6472]">Loading ledger transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#5B6472]">
              No transactions recorded for this customer yet.
            </div>
          ) : (
            transactions.map((tx) => {
              const isCredit = tx.transaction_type === 'CREDIT';
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded border border-[#E5E7EB] bg-white p-3 hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded ${
                      isCredit ? 'bg-[#C62828]/10 text-[#C62828]' : 'bg-[#059669]/10 text-[#059669]'
                    }`}>
                      {isCredit ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[#000000]">
                          {isCredit ? 'Udhaar (Credit)' : 'Jama (Payment)'}
                        </span>
                        {tx.source === 'VOICE' && (
                          <span className="rounded bg-[#2075CC]/10 border border-[#2075CC]/20 px-1.5 py-0.5 text-[9px] font-medium text-[#2075CC]">
                            Voice
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#5B6472]">{tx.description || '-'}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-sm font-medium block ${
                      isCredit ? 'text-[#C62828]' : 'text-[#059669]'
                    }`}>
                      {isCredit ? '+' : '-'} ₹{tx.amount_rupees.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-[#5B6472]">
                      {new Date(tx.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex justify-end">
          <button
            onClick={onClose}
            className="rounded border border-[#E5E7EB] bg-white px-4 py-2 text-xs font-medium text-[#5B6472] hover:bg-[#F8FAFC]"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
