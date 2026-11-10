export type TransactionType = 'CREDIT' | 'PAYMENT';
export type TransactionSource = 'VOICE' | 'MANUAL';

export interface Customer {
  id: number;
  name: string;
  phone?: string | null;
  notes?: string | null;
  current_balance_paise: number;
  current_balance_rupees: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  customer_id: number;
  customer_name?: string | null;
  transaction_type: TransactionType;
  amount_paise: number;
  amount_rupees: number;
  currency: string;
  description?: string | null;
  source: TransactionSource;
  raw_transcript?: string | null;
  confidence_score?: number | null;
  detected_language?: string | null;
  idempotency_key?: string | null;
  created_at: string;
}

export interface ExtractedTransaction {
  customer_name?: string | null;
  customer_id?: number | null;
  amount_paise?: number | null;
  amount_rupees?: number | null;
  transaction_type?: TransactionType | null;
  description?: string | null;
  currency: string;
  confidence: number;
  language?: string | null;
  original_transcript: string;
  needs_clarification: boolean;
  clarification_reason?: string | null;
}

export interface VoiceTranscribeResponse {
  success: boolean;
  transcript: string;
  detected_language: string;
  confidence?: number | null;
  processing_time?: number | null;
  request_id?: string | null;
}

export interface VoiceSynthesisResponse {
  success: boolean;
  audio_base64?: string | null;
  content_type: string;
  error?: string | null;
}

export interface DashboardSummary {
  total_outstanding_paise: number;
  total_outstanding_rupees: number;
  today_credit_paise: number;
  today_credit_rupees: number;
  today_payment_paise: number;
  today_payment_rupees: number;
  total_customers: number;
  active_credit_customers: number;
  recent_transactions: Transaction[];
  top_debtors: Customer[];
}
