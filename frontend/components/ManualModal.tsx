'use client';

import React, { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { TransactionType } from '@/types';

interface ManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ManualModal({ isOpen, onClose, onSuccess }: ManualModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [amountRupees, setAmountRupees] = useState('');
  const [txType, setTxType] = useState<TransactionType>('CREDIT');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError('Please enter customer name');
      return;
    }
    const val = parseFloat(amountRupees);
    if (isNaN(val) || val <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const amountPaise = Math.round(val * 100);
      await api.createManualTransaction({
        customer_name: customerName.trim(),
        transaction_type: txType,
        amount_paise: amountPaise,
        description: description.trim() || undefined,
        idempotency_key: `man-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Failed to record manual transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1A2F]/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-lg border border-[#E5E7EB] bg-white p-6 sm:p-8 shadow-xl text-[#000000]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded p-2 text-[#5B6472] hover:bg-[#F8FAFC] hover:text-[#000000] transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-normal tracking-tight text-[#000000]">
          Manual Ledger Entry
        </h2>
        <p className="mt-1 text-xs text-[#5B6472]">
          Fallback direct entry for shop transactions.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          
          {/* Customer Name */}
          <div>
            <label className="text-xs font-medium text-[#5B6472] block mb-1">
              Customer Name (ग्राहक का नाम) *
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="w-full rounded border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#000000] placeholder-[#5B6472] focus:border-[#2075CC] focus:outline-none"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-medium text-[#5B6472] block mb-1">
              Amount (रुपये) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={amountRupees}
              onChange={(e) => setAmountRupees(e.target.value)}
              placeholder="0.00"
              className="w-full rounded border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#000000] placeholder-[#5B6472] focus:border-[#2075CC] focus:outline-none"
            />
          </div>

          {/* Type Toggle */}
          <div>
            <label className="text-xs font-medium text-[#5B6472] block mb-1">
              Transaction Type *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTxType('CREDIT')}
                className={`rounded py-2.5 text-xs font-medium transition-colors ${
                  txType === 'CREDIT'
                    ? 'bg-[#C62828] text-white shadow-sm'
                    : 'border border-[#E5E7EB] bg-white text-[#5B6472] hover:bg-[#F8FAFC]'
                }`}
              >
                Udhaar (उधार / Credit)
              </button>
              <button
                type="button"
                onClick={() => setTxType('PAYMENT')}
                className={`rounded py-2.5 text-xs font-medium transition-colors ${
                  txType === 'PAYMENT'
                    ? 'bg-[#059669] text-white shadow-sm'
                    : 'border border-[#E5E7EB] bg-white text-[#5B6472] hover:bg-[#F8FAFC]'
                }`}
              >
                Jama (जमा / Payment)
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-[#5B6472] block mb-1">
              Description (विवरण)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Rice, sugar, oil"
              className="w-full rounded border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#000000] placeholder-[#5B6472] focus:border-[#2075CC] focus:outline-none"
            />
          </div>

          {error && (
            <p className="rounded border border-[#C62828]/20 bg-[#C62828]/5 p-2 text-xs text-[#C62828]">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded border border-[#E5E7EB] bg-white py-2.5 text-sm font-medium text-[#5B6472] hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded bg-[#2075CC] hover:bg-[#115AA4] py-2.5 text-sm font-medium text-white shadow-sm flex items-center justify-center gap-2"
            >
              {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Record Entry'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
