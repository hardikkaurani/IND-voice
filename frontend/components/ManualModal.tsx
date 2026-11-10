'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, RefreshCw } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-[#374151] bg-[#171721] p-6 shadow-2xl text-[#EDEDF3]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-[#70707D] hover:bg-[#20202D] hover:text-[#EDEDF3] transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-lg font-bold text-[#EDEDF3] mb-1">Manual Entry</h3>
        <p className="text-xs text-[#70707D] mb-5">Record a transaction without voice</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-[#EDEDF3] block mb-1">Customer Name *</label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="w-full rounded-xl border border-[#374151] bg-[#20202D] px-3.5 py-2 text-sm text-[#EDEDF3] focus:border-[#5266EB] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#EDEDF3] block mb-1">Amount (₹) *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2 text-sm text-[#70707D]">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                  placeholder="250"
                  className="w-full rounded-xl border border-[#374151] bg-[#20202D] pl-8 pr-3.5 py-2 text-sm text-[#EDEDF3] font-semibold focus:border-[#5266EB] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#EDEDF3] block mb-1">Type *</label>
              <div className="grid grid-cols-2 gap-1 rounded-xl border border-[#374151] bg-[#20202D] p-1">
                <button
                  type="button"
                  onClick={() => setTxType('CREDIT')}
                  className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                    txType === 'CREDIT' ? 'bg-[#EF4444] text-white shadow' : 'text-[#70707D] hover:text-[#EDEDF3]'
                  }`}
                >
                  Credit
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('PAYMENT')}
                  className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                    txType === 'PAYMENT' ? 'bg-[#10B981] text-white shadow' : 'text-[#70707D] hover:text-[#EDEDF3]'
                  }`}
                >
                  Payment
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#EDEDF3] block mb-1">Note (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Rice, oil & sugar"
              className="w-full rounded-xl border border-[#374151] bg-[#20202D] px-3.5 py-2 text-xs text-[#EDEDF3] focus:border-[#5266EB] focus:outline-none"
            />
          </div>

          {error && <p className="text-xs text-[#EF4444]">{error}</p>}

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#374151] px-4 py-2 text-xs text-[#EDEDF3] hover:bg-[#20202D] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-full bg-[#5266EB] hover:bg-[#4055E6] px-5 py-2 text-xs font-semibold text-white shadow transition-all disabled:opacity-50"
            >
              {isSubmitting && <RefreshCw className="h-4 w-4 animate-spin" />}
              <span>Save Entry</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
