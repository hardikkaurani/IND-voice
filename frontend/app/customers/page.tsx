'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import CustomerModal from '@/components/CustomerModal';
import VoiceModal from '@/components/VoiceModal';
import { api } from '@/lib/api';
import { Customer } from '@/types';
import { Search, Plus, Phone, ArrowUpRight } from 'lucide-react';

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

  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      try {
        const data = await api.listCustomers(query, hasBalanceOnly);
        if (!ignore) {
          setCustomers(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load customers:', err);
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    fetchData();
    return () => {
      ignore = true;
    };
  }, [query, hasBalanceOnly, refreshIndex]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    setIsCreating(true);
    try {
      await api.createCustomer(newCustName.trim(), newCustPhone.trim() || undefined);
      setNewCustName('');
      setNewCustPhone('');
      setIsAddCustomerOpen(false);
      setRefreshIndex(prev => prev + 1);
    } catch {
      alert('Failed to create customer');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#000000] flex flex-col font-sans">
      <Navbar onOpenVoiceModal={() => setIsVoiceOpen(true)} isLoggedIn={true} />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
          <div>
            <h1 className="text-2xl font-normal text-[#000000] tracking-tight">Customer Directory (ग्राहक खाता)</h1>
            <p className="text-xs text-[#5B6472]">Search, inspect, and manage customer credit ledgers with institutional double-entry invariants.</p>
          </div>

          <button
            onClick={() => setIsAddCustomerOpen(true)}
            className="flex items-center gap-2 rounded bg-[#2075CC] hover:bg-[#115AA4] px-4 py-2.5 text-xs font-medium text-white shadow-sm transition-colors active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Customer</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#5B6472]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by customer name or phone..."
              className="w-full rounded border border-[#E5E7EB] bg-white pl-10 pr-4 py-2 text-xs text-[#000000] placeholder-[#5B6472] focus:border-[#2075CC] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setHasBalanceOnly(false)}
              className={`rounded px-3.5 py-1.5 text-xs font-medium transition-colors ${
                !hasBalanceOnly
                  ? 'bg-[#2075CC] text-white shadow-sm'
                  : 'border border-[#E5E7EB] bg-white text-[#5B6472] hover:bg-[#F8FAFC]'
              }`}
            >
              All Customers
            </button>
            <button
              onClick={() => setHasBalanceOnly(true)}
              className={`rounded px-3.5 py-1.5 text-xs font-medium transition-colors ${
                hasBalanceOnly
                  ? 'bg-[#C62828] text-white shadow-sm'
                  : 'border border-[#E5E7EB] bg-white text-[#5B6472] hover:bg-[#F8FAFC]'
              }`}
            >
              With Baaki (Udhaar Only)
            </button>
          </div>
        </div>

        {/* Customers Table / Grid */}
        {loading ? (
          <div className="py-20 text-center text-xs text-[#5B6472]">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="py-20 text-center text-xs text-[#5B6472]">
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
                  className="rounded-lg border border-[#E5E7EB] bg-white p-5 hover:bg-[#F8FAFC] cursor-pointer transition-colors shadow-sm flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-[#000000]">{cust.name}</h3>
                      {cust.phone ? (
                        <span className="mt-1 flex items-center gap-1 text-xs text-[#5B6472]">
                          <Phone className="h-3 w-3" /> {cust.phone}
                        </span>
                      ) : (
                        <span className="mt-1 text-xs text-[#5B6472]">Customer #{cust.id}</span>
                      )}
                    </div>
                    <span className={`text-base font-medium ${
                      isDebtor ? 'text-[#C62828]' : isAdvance ? 'text-[#059669]' : 'text-[#000000]'
                    }`}>
                      ₹{Math.abs(cust.current_balance_rupees).toFixed(2)}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#5B6472]">
                    <span>
                      {isDebtor ? 'Baaki (Udhaar)' : isAdvance ? 'Advance' : 'Settled'}
                    </span>
                    <span className="text-[#2075CC] font-medium flex items-center gap-1">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1A2F]/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-xl text-[#000000]">
            <h3 className="text-base font-medium mb-1">Create New Customer</h3>
            <p className="text-xs text-[#5B6472] mb-4">Add a new customer to your shop directory</p>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#5B6472] block mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Sunil Sharma"
                  className="w-full rounded border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#000000] placeholder-[#5B6472] focus:border-[#2075CC] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#5B6472] block mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full rounded border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#000000] placeholder-[#5B6472] focus:border-[#2075CC] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="rounded border border-[#E5E7EB] px-4 py-2 text-xs font-medium text-[#5B6472] hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded bg-[#2075CC] hover:bg-[#115AA4] px-4 py-2 text-xs font-medium text-white shadow-sm"
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
        onSuccess={() => setRefreshIndex(prev => prev + 1)}
      />

    </div>
  );
}
