'use client';

import React, { useState, useEffect } from 'react';
import {
  Mic,
  Square,
  RefreshCw,
  X,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Edit2
} from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { api } from '@/lib/api';
import { ExtractedTransaction, TransactionType } from '@/types';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function VoiceModal({ isOpen, onClose, onSuccess }: VoiceModalProps) {
  const {
    status,
    duration,
    errorMessage,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder();

  const [step, setStep] = useState<'record' | 'review' | 'success'>('record');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedTransaction | null>(null);

  // Editable fields in review step
  const [editCustomer, setEditCustomer] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState<TransactionType>('CREDIT');
  const [editDesc, setEditDesc] = useState('');

  // Confirmation audio playback
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Text fallback input
  const [textInput, setTextInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep('record');
      setExtracted(null);
      setActionError(null);
      setAudioUrl(null);
      setTextInput('');
    } else {
      cancelRecording();
    }
  }, [isOpen, cancelRecording]);

  if (!isOpen) return null;

  const handleStopAndProcess = async () => {
    setIsProcessing(true);
    setActionError(null);
    try {
      const blob = await stopRecording();
      if (!blob) {
        setActionError('No audio recorded. Please hold the mic and speak.');
        setIsProcessing(false);
        return;
      }

      const res = await api.processVoiceAudio(blob);
      populateReview(res.extracted);
    } catch (err: unknown) {
      const error = err as Error;
      setActionError(error.message || 'Audio processing failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextParse = async () => {
    if (!textInput.trim()) return;
    setIsProcessing(true);
    setActionError(null);
    try {
      const res = await api.parseTranscript(textInput.trim());
      populateReview(res);
    } catch (err: unknown) {
      const error = err as Error;
      setActionError(error.message || 'Failed to parse speech text.');
    } finally {
      setIsProcessing(false);
    }
  };

  const populateReview = (data: ExtractedTransaction) => {
    setExtracted(data);
    setEditCustomer(data.customer_name || '');
    setEditAmount(data.amount_rupees ? String(data.amount_rupees) : '');
    setEditType(data.transaction_type || 'CREDIT');
    setEditDesc(data.description || '');
    setStep('review');
  };

  const handleConfirmTransaction = async () => {
    if (!editCustomer.trim()) {
      setActionError('Please specify the customer name.');
      return;
    }
    const amtNum = parseFloat(editAmount);
    if (isNaN(amtNum) || amtNum <= 0) {
      setActionError('Please specify a valid positive amount.');
      return;
    }

    setIsProcessing(true);
    setActionError(null);

    try {
      const amountPaise = Math.round(amtNum * 100);
      const res = await api.confirmTransaction({
        customer_name: editCustomer.trim(),
        transaction_type: editType,
        amount_paise: amountPaise,
        description: editDesc.trim() || undefined,
        raw_transcript: extracted?.original_transcript,
        detected_language: extracted?.language || 'hi-IN',
        idempotency_key: `voice-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      });

      // Play synthesized audio confirmation if returned
      if (res.voice_confirmation && res.voice_confirmation.audio_base64) {
        const audioSrc = `data:audio/wav;base64,${res.voice_confirmation.audio_base64}`;
        setAudioUrl(audioSrc);
        const audio = new Audio(audioSrc);
        setIsPlayingAudio(true);
        audio.play().catch(() => {});
        audio.onended = () => setIsPlayingAudio(false);
      }

      setStep('success');
      onSuccess();
    } catch (err: unknown) {
      const error = err as Error;
      setActionError(error.message || 'Failed to confirm transaction.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#374151] bg-[#171721] p-6 shadow-2xl text-[#EDEDF3]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-[#70707D] hover:bg-[#20202D] hover:text-[#EDEDF3] transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* STEP 1: RECORDING INTERFACE */}
        {step === 'record' && (
          <div className="flex flex-col items-center text-center">
            
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#5266EB]/30 bg-[#5266EB]/10 px-3 py-1 text-xs text-[#5266EB]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Gnani Prisma v3 Multilingual STT</span>
            </div>

            <h2 className="text-xl font-bold tracking-tight text-[#EDEDF3]">
              Speak Transaction
            </h2>
            <p className="mt-1 text-xs text-[#70707D]">
              Record in Hindi, Hinglish, Marathi, or English.
            </p>

            {/* Mic Animation Container */}
            <div className="relative my-8 flex items-center justify-center">
              {status === 'recording' && (
                <div className="absolute h-36 w-36 animate-ping rounded-full bg-[#5266EB]/20" />
              )}
              
              <button
                onClick={status === 'recording' ? handleStopAndProcess : startRecording}
                disabled={isProcessing}
                className={`relative flex h-24 w-24 items-center justify-center rounded-full transition-all shadow-xl active:scale-95 ${
                  status === 'recording'
                    ? 'bg-[#EF4444] text-white hover:bg-red-600'
                    : 'bg-[#5266EB] text-white hover:bg-[#4055E6]'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {status === 'recording' ? (
                  <Square className="h-8 w-8" />
                ) : (
                  <Mic className="h-10 w-10" />
                )}
              </button>
            </div>

            {/* Recording timer or status */}
            {status === 'recording' ? (
              <div className="flex flex-col items-center gap-2">
                <span className="font-mono text-lg font-semibold text-[#EF4444] animate-pulse">
                  {formatTimer(duration)} / 01:00
                </span>
                <p className="text-xs text-[#70707D]">Listening... Click button when done speaking.</p>
              </div>
            ) : isProcessing ? (
              <div className="flex items-center gap-2 text-sm text-[#5266EB]">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Transcribing & interpreting speech...</span>
              </div>
            ) : (
              <p className="text-xs text-[#70707D]">Tap microphone to start recording</p>
            )}

            {/* Error alerts */}
            {(errorMessage || actionError) && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 p-3 text-xs text-[#EF4444]">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMessage || actionError}</span>
              </div>
            )}

            {/* Example Phrases Chips */}
            <div className="mt-6 w-full text-left">
              <span className="text-[11px] font-medium text-[#70707D] uppercase tracking-wider">
                Try saying:
              </span>
              <div className="mt-2 flex flex-col gap-1.5">
                {[
                  'Rahul ko paanch sau rupaye udhaar diye',
                  'Amit ne do sau rupaye wapas kiye',
                  'Suresh se 1500 rupaye jama hue',
                ].map((phrase, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTextInput(phrase);
                    }}
                    className="rounded-lg border border-[#374151] bg-[#20202D] px-3 py-2 text-left text-xs text-[#EDEDF3] hover:border-[#5266EB] transition-colors"
                  >
                    "{phrase}"
                  </button>
                ))}
              </div>
            </div>

            {/* Text input fallback */}
            <div className="mt-5 w-full pt-4 border-t border-[#374151]">
              <span className="text-[11px] font-medium text-[#70707D] uppercase tracking-wider block text-left mb-1.5">
                Or type speech text manually:
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTextParse()}
                  placeholder="e.g. Rahul ko paanch sau rupaye udhaar diye"
                  className="flex-1 rounded-full border border-[#374151] bg-[#20202D] px-4 py-2 text-xs text-[#EDEDF3] placeholder-[#70707D] focus:border-[#5266EB] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleTextParse}
                  disabled={!textInput.trim() || isProcessing}
                  className="rounded-full bg-[#5266EB] px-4 py-2 text-xs font-medium text-[#EDEDF3] hover:bg-[#4055E6] disabled:opacity-50 transition-colors"
                >
                  Interpret
                </button>
              </div>
            </div>

          </div>
        )}

        {/* STEP 2: HUMAN REVIEW & CONFIRMATION */}
        {step === 'review' && extracted && (
          <div className="flex flex-col gap-4">
            
            <div className="flex items-center justify-between border-b border-[#374151] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#EDEDF3]">Review Transaction</h3>
                <p className="text-xs text-[#70707D]">Please verify details before saving to ledger.</p>
              </div>
              <span className="rounded-full bg-[#5266EB]/20 border border-[#5266EB]/30 px-2.5 py-0.5 text-xs text-[#5266EB]">
                {Math.round(extracted.confidence * 100)}% Confidence
              </span>
            </div>

            {/* Original Transcript Box */}
            <div className="rounded-lg border border-[#374151] bg-[#20202D] p-3">
              <span className="text-[10px] font-bold text-[#70707D] uppercase tracking-wider block">
                Original Audio Transcript
              </span>
              <p className="mt-1 text-sm text-[#EDEDF3] italic">
                "{extracted.original_transcript || 'Speech transcription'}"
              </p>
            </div>

            {/* Clarification Alert if needed */}
            {extracted.needs_clarification && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Review required: </span>
                  <span>{extracted.clarification_reason}</span>
                </div>
              </div>
            )}

            {/* Editable Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Customer Name */}
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-[#EDEDF3] block mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={editCustomer}
                  onChange={(e) => setEditCustomer(e.target.value)}
                  placeholder="Customer Name"
                  className="w-full rounded-xl border border-[#374151] bg-[#20202D] px-3.5 py-2 text-sm text-[#EDEDF3] focus:border-[#5266EB] focus:outline-none"
                />
              </div>

              {/* Amount in Rupees */}
              <div>
                <label className="text-xs font-medium text-[#EDEDF3] block mb-1">
                  Amount (₹ Rupees) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2 text-sm text-[#70707D]">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="500"
                    className="w-full rounded-xl border border-[#374151] bg-[#20202D] pl-8 pr-3.5 py-2 text-sm text-[#EDEDF3] font-semibold focus:border-[#5266EB] focus:outline-none"
                  />
                </div>
              </div>

              {/* Transaction Type */}
              <div>
                <label className="text-xs font-medium text-[#EDEDF3] block mb-1">
                  Direction *
                </label>
                <div className="grid grid-cols-2 gap-1 rounded-xl border border-[#374151] bg-[#20202D] p-1">
                  <button
                    type="button"
                    onClick={() => setEditType('CREDIT')}
                    className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                      editType === 'CREDIT'
                        ? 'bg-[#EF4444] text-white shadow'
                        : 'text-[#70707D] hover:text-[#EDEDF3]'
                    }`}
                  >
                    Udhaar (Credit)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditType('PAYMENT')}
                    className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                      editType === 'PAYMENT'
                        ? 'bg-[#10B981] text-white shadow'
                        : 'text-[#70707D] hover:text-[#EDEDF3]'
                    }`}
                  >
                    Jama (Payment)
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-[#EDEDF3] block mb-1">
                  Description / Note
                </label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="e.g. Groceries, milk, or cash return"
                  className="w-full rounded-xl border border-[#374151] bg-[#20202D] px-3.5 py-2 text-xs text-[#EDEDF3] focus:border-[#5266EB] focus:outline-none"
                />
              </div>

            </div>

            {actionError && (
              <p className="text-xs text-[#EF4444]">{actionError}</p>
            )}

            {/* Action Buttons */}
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#374151] pt-4">
              <button
                type="button"
                onClick={() => setStep('record')}
                className="rounded-full border border-[#374151] px-4 py-2 text-xs font-medium text-[#EDEDF3] hover:bg-[#20202D] transition-colors"
              >
                Re-record
              </button>

              <button
                type="button"
                onClick={handleConfirmTransaction}
                disabled={isProcessing}
                className="flex items-center gap-2 rounded-full bg-[#5266EB] hover:bg-[#4055E6] px-5 py-2 text-xs font-semibold text-white shadow transition-all active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                <span>Confirm & Record to Ledger</span>
              </button>
            </div>

          </div>
        )}

        {/* STEP 3: SUCCESS & VOICE CONFIRMATION */}
        {step === 'success' && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981] mb-3">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h3 className="text-lg font-bold text-[#EDEDF3]">Transaction Recorded!</h3>
            <p className="mt-1 text-xs text-[#70707D]">
              Saved to ledger: ₹{editAmount} for {editCustomer} ({editType === 'CREDIT' ? 'Udhaar' : 'Jama'}).
            </p>

            {/* Voice Audio Feedback button */}
            {audioUrl && (
              <div className="mt-4 flex items-center gap-2 rounded-full border border-[#5266EB]/40 bg-[#5266EB]/10 px-4 py-2 text-xs text-[#5266EB]">
                <Volume2 className="h-4 w-4 animate-pulse" />
                <span>
                  {isPlayingAudio ? 'Playing Timbre Voice Confirmation...' : 'Gnani Voice Confirmation Generated'}
                </span>
              </div>
            )}

            <button
              onClick={onClose}
              className="mt-6 w-full rounded-full bg-[#5266EB] hover:bg-[#4055E6] py-2.5 text-xs font-semibold text-white transition-all shadow"
            >
              Done / Back to Ledger
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
