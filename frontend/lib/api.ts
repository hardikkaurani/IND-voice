import {
  Customer,
  Transaction,
  DashboardSummary,
  ExtractedTransaction,
  VoiceTranscribeResponse,
  VoiceSynthesisResponse,
  TransactionType
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Accept': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorDetail = `HTTP Error ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Dashboard
  async getDashboardSummary(): Promise<DashboardSummary> {
    return fetchApi<DashboardSummary>('/api/dashboard/summary');
  },

  // Customers
  async listCustomers(query?: string, hasBalanceOnly: boolean = false): Promise<Customer[]> {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (hasBalanceOnly) params.append('has_balance_only', 'true');
    return fetchApi<Customer[]>(`/api/customers?${params.toString()}`);
  },

  async getCustomer(id: number): Promise<Customer> {
    return fetchApi<Customer>(`/api/customers/${id}`);
  },

  async getCustomerTransactions(id: number): Promise<Transaction[]> {
    return fetchApi<Transaction[]>(`/api/customers/${id}/transactions`);
  },

  async createCustomer(name: string, phone?: string): Promise<Customer> {
    return fetchApi<Customer>('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone }),
    });
  },

  // Voice
  async processVoiceAudio(audioBlob: Blob): Promise<{
    stt: VoiceTranscribeResponse;
    extracted: ExtractedTransaction;
  }> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.wav');

    return fetchApi<{
      stt: VoiceTranscribeResponse;
      extracted: ExtractedTransaction;
    }>('/api/voice/process-audio', {
      method: 'POST',
      body: formData,
    });
  },

  async synthesizeSpeech(text: string, language: string = 'hi-IN'): Promise<VoiceSynthesisResponse> {
    return fetchApi<VoiceSynthesisResponse>('/api/voice/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language }),
    });
  },

  // Transactions
  async parseTranscript(transcript: string, language: string = 'hi-IN'): Promise<ExtractedTransaction> {
    const params = new URLSearchParams({ transcript, detected_language: language });
    return fetchApi<ExtractedTransaction>(`/api/transactions/parse?${params.toString()}`, {
      method: 'POST',
    });
  },

  async confirmTransaction(payload: {
    customer_name: string;
    customer_id?: number | null;
    transaction_type: TransactionType;
    amount_paise: number;
    description?: string | null;
    raw_transcript?: string | null;
    detected_language?: string | null;
    idempotency_key?: string | null;
  }): Promise<{
    transaction: Transaction;
    customer_balance_rupees: number;
    voice_confirmation: VoiceSynthesisResponse;
  }> {
    return fetchApi('/api/transactions/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  async createManualTransaction(payload: {
    customer_id?: number;
    customer_name?: string;
    transaction_type: TransactionType;
    amount_paise: number;
    description?: string;
    idempotency_key?: string;
  }): Promise<Transaction> {
    return fetchApi<Transaction>('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, source: 'MANUAL' }),
    });
  },
};
