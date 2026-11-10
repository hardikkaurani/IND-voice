'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import CustomerModal from '@/components/CustomerModal';
import VoiceModal from '@/components/VoiceModal';
import { api } from '@/lib/api';
import { Customer } from '@/types';
import { Search, Plus, Phone, ArrowUpRight, CheckCircle2, Mic } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [hasBalanceOnly, setHasBalanceOnly] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  // Add customer modal state
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.listCustomers(query, hasBalanceOnly);
      setCustomers(data);
    } catch (e) {
      console.error('Failed to load customers:', e);
    } finally {
      setLoading(false);
    }
  }, [query, hasBalanceOnly]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    setIsCreating(true);
    try {
      await api.createCustomer(newCustName.trim(), newCustPhone.trim() || undefined);
      setNewCustName('');
      setNewCustPhone('');
      setIsAddCustomerOpen(false);
      loadCustomers();
    } catch (e) {
      alert('Failed to create customer');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#171721] text-[#EDEDF3] flex flex-col">
      <Navbar onOpenVoiceModal={() => setIsVoiceOpen(true)} isLoggedIn={true} />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#374151] pb-5">
          <div>
            <h1 className="text-2xl font-black text-[#EDEDF3]">Customer Directory (ग्राहक खाता)</h1>
            <p className="text-xs text-[#70707D]">View, search and manage customer credit balances</p>
          </div>

          <button
            onClick={() => setIsAddCustomerOpen(true)}
            className="flex items-center gap-2 rounded-full bg-[#5266EB] hover:bg-[#4055E6] px-4 py-2.5 text-xs font-semibold text-white shadow transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Customer</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#70707D]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by customer name or phone..."
              className="w-full rounded-full border border-[#374151] bg-[#20202D] pl-10 pr-4 py-2 text-xs text-[#EDEDF3] placeholder-[#70707D] focus:border-[#5266EB] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setHasBalanceOnly(false)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                !hasBalanceOnly
                  ? 'bg-[#5266EB] text-white'
                  : 'border border-[#374151] bg-[#20202D] text-[#70707D] hover:text-[#EDEDF3]'
              }`}
            >
              All Customers
            </button>
            <button
              onClick={() => setHasBalanceOnly(true)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                hasBalanceOnly
                  ? 'bg-[#EF4444] text-white'
                  : 'border border-[#374151] bg-[#20202D] text-[#70707D] hover:text-[#EDEDF3]'
              }`}
            >
              With Baaki (Udhaar)
            </button>
          </div>
        </div>

        {/* Customers Table / Grid */}
        {loading ? (
          <div className="py-20 text-center text-xs text-[#70707D]">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="py-20 text-center text-xs text-[#70707D]">
            No customers found matching your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customers.map((cust) => {
              const isDebtor = cust.current_balance_paise > 0;
              const isAdvance = cust.current_balance_paise < 0;
              return (
                <div
                  key={cust.id}
                  onClick={() => {
                    setSelectedCustomer(cust);
                    setIsCustomerModalOpen(true);
                  }}
                  className="rounded-xl border border-[#374151] bg-[#20202D] p-4 hover:border-[#5266EB] cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#EDEDF3]">{cust.name}</h3>
                      {cust.phone ? (
                        <span className="mt-1 flex items-center gap-1 text-xs text-[#70707D]">
                          <Phone className="h-3 w-3" /> {cust.phone}
                        </span>
                      ) : (
                        <span className="mt-1 text-xs text-[#70707D]">Customer #{cust.id}</span>
                      )}
                    </div>
                    <span className={`text-base font-extrabold ${
                      isDebtor ? 'text-[#EF4444]' : isAdvance ? 'text-[#10B981]' : 'text-[#EDEDF3]'
                    }`}>
                      ₹{Math.abs(cust.current_balance_rupees).toFixed(2)}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#374151] flex items-center justify-between text-[11px] text-[#70707D]">
                    <span>
                      {isDebtor ? 'Baaki (Udhaar)' : isAdvance ? 'Advance' : 'Settled'}
                    </span>
                    <span className="text-[#5266EB] font-medium flex items-center gap-1">
                      View Ledger <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Add Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#374151] bg-[#171721] p-6 shadow-2xl text-[#EDEDF3]">
            <h3 className="text-base font-bold mb-1">Create New Customer</h3>
            <p className="text-xs text-[#70707D] mb-4">Add a new customer to your shop directory</p>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Sunil Sharma"
                  className="w-full rounded-xl border border-[#374151] bg-[#20202D] px-3.5 py-2 text-sm text-[#EDEDF3] focus:border-[#5266EB] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium block mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full rounded-xl border border-[#374151] bg-[#20202D] px-3.5 py-2 text-sm text-[#EDEDF3] focus:border-[#5266EB] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="rounded-full border border-[#374151] px-4 py-1.5 text-xs text-[#EDEDF3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-full bg-[#5266EB] px-4 py-1.5 text-xs font-semibold text-white"
                >
                  {isCreating ? 'Saving...' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals */}
      <CustomerModal
        customer={selectedCustomer}
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setSelectedCustomer(null);
        }}
        onOpenVoiceForCustomer={() => setIsVoiceOpen(true)}
      />

      <VoiceModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onSuccess={loadCustomers}
      />

    </div>
  );
}
