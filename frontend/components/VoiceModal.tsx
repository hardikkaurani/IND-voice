'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

  const handleModalClose = useCallback(() => {
    cancelRecording();
    setStep('record');
    setExtracted(null);
    setActionError(null);
    setAudioUrl(null);
    setTextInput('');
    onClose();
  }, [cancelRecording, onClose]);

  useEffect(() => {
    if (!isOpen) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1A2F]/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-lg border border-[#E5E7EB] bg-white p-6 sm:p-8 shadow-xl text-[#000000]">
        
        {/* Close Button */}
        <button
          onClick={handleModalClose}
          className="absolute right-4 top-4 rounded p-2 text-[#5B6472] hover:bg-[#F8FAFC] hover:text-[#000000] transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* STEP 1: RECORDING INTERFACE */}
        {step === 'record' && (
          <div className="flex flex-col items-center text-center">
            
            <div className="mb-2 inline-flex items-center gap-2 rounded bg-[#2075CC]/10 border border-[#2075CC]/20 px-3 py-1 text-xs text-[#2075CC] font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Gnani Prisma v3 Multilingual STT</span>
            </div>

            <h2 className="text-2xl font-normal tracking-tight text-[#000000]">
              Speak Transaction
            </h2>
            <p className="mt-1 text-xs text-[#5B6472]">
              Record naturally in Hindi, Hinglish, Marathi, or English.
            </p>

            {/* Mic Animation Container */}
            <div className="relative my-8 flex items-center justify-center">
              {status === 'recording' && (
                <div className="absolute h-32 w-32 animate-ping rounded-full bg-[#C62828]/20" />
              )}
              
              <button
                onClick={status === 'recording' ? handleStopAndProcess : startRecording}
                disabled={isProcessing}
                className={`relative z-10 flex h-24 w-24 items-center justify-center rounded-full text-white shadow-md transition-all active:scale-95 ${
                  status === 'recording'
                    ? 'bg-[#C62828] hover:bg-[#B71C1C]'
                    : 'bg-[#2075CC] hover:bg-[#115AA4]'
                }`}
              >
                {isProcessing ? (
                  <RefreshCw className="h-8 w-8 animate-spin" />
                ) : status === 'recording' ? (
                  <Square className="h-8 w-8 fill-white" />
                ) : (
                  <Mic className="h-10 w-10" />
                )}
              </button>
            </div>

            {/* Status & Timer */}
            {status === 'recording' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-1.5">
                  <div className="h-5 w-1 rounded-full bg-[#2075CC] wave-bar" style={{ animationDelay: '0.1s' }} />
                  <div className="h-7 w-1 rounded-full bg-[#2075CC] wave-bar" style={{ animationDelay: '0.3s' }} />
                  <div className="h-9 w-1 rounded-full bg-[#2075CC] wave-bar" style={{ animationDelay: '0.2s' }} />
                  <div className="h-6 w-1 rounded-full bg-[#2075CC] wave-bar" style={{ animationDelay: '0.4s' }} />
                  <div className="h-8 w-1 rounded-full bg-[#2075CC] wave-bar" style={{ animationDelay: '0.15s' }} />
                </div>
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-[#C62828]">
                  <span className="h-2 w-2 rounded-full bg-[#C62828] animate-pulse" />
                  <span>Recording... {formatTimer(duration)}</span>
                </div>
                <button
                  onClick={handleStopAndProcess}
                  className="rounded bg-[#2075CC] px-4 py-2 text-xs font-medium text-white hover:bg-[#115AA4]"
                >
                  Done Speaking
                </button>
              </div>
            ) : (
              <p className="text-xs text-[#5B6472]">
                Click the microphone icon and speak clearly.
              </p>
            )}

            {/* Error Message */}
            {(errorMessage || actionError) && (
              <div className="mt-4 flex items-center gap-2 rounded border border-[#C62828]/20 bg-[#C62828]/5 p-3 text-xs text-[#C62828] text-left w-full">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMessage || actionError}</span>
              </div>
            )}

            {/* Quick Demo Voice Phrases */}
            <div className="mt-6 w-full border-t border-[#E5E7EB] pt-4 text-left">
              <span className="text-[11px] font-medium text-[#5B6472] uppercase tracking-wider block mb-2">
                Sample Voice Commands
              </span>
              <div className="space-y-1.5">
                {[
                  'Rahul ko paanch sau rupaye udhaar diye',
                  'Amit ne do sau rupaye wapas kiye',
                  'Suresh udhaar le gaya 150 rupaye',
                  'Pooja ne 350 rupaye jama karwa diye'
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTextInput(sample)}
                    className="w-full text-left text-xs text-[#5B6472] hover:text-[#2075CC] hover:bg-[#F8FAFC] p-2 rounded border border-[#E5E7EB] transition-colors"
                  >
                    &ldquo;{sample}&rdquo;
                  </button>
                ))}
              </div>
            </div>

            {/* Direct Text Input Fallback */}
            <div className="mt-4 w-full">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Or type voice text directly..."
                  className="flex-1 rounded border border-[#E5E7EB] bg-white px-3 py-2 text-xs text-[#000000] placeholder-[#5B6472] focus:border-[#2075CC] focus:outline-none"
                />
                <button
                  onClick={handleTextParse}
                  disabled={!textInput.trim() || isProcessing}
                  className="rounded bg-[#2075CC] px-4 py-2 text-xs font-medium text-white hover:bg-[#115AA4] disabled:opacity-50"
                >
                  Parse
                </button>
              </div>
            </div>

          </div>
        )}

        {/* STEP 2: HUMAN CONFIRMATION & EDIT STEP */}
        {step === 'review' && (
          <div className="space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded bg-[#2075CC]/10 border border-[#2075CC]/20 px-2.5 py-0.5 text-xs font-medium text-[#2075CC] mb-2">
                <Edit2 className="h-3 w-3" />
                <span>Explicit Human Confirmation Required</span>
              </div>
              <h2 className="text-xl font-normal text-[#000000]">
                Review Interpreted Transaction
              </h2>
              <p className="text-xs text-[#5B6472]">
                Check details before saving to ledger. AI will never alter balances automatically.
              </p>
            </div>

            {/* Original Transcript Box */}
            {extracted?.original_transcript && (
              <div className="rounded border border-[#E5E7EB] bg-[#F8FAFC] p-3 text-left">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#5B6472] block">
                  Original Transcript (बोल कर रिकॉर्ड किया)
                </span>
                <p className="text-xs font-medium text-[#000000] mt-1">
                  &ldquo;{extracted.original_transcript}&rdquo;
                </p>
                {extracted.language && (
                  <span className="mt-1 inline-block text-[10px] text-[#2075CC]">
                    Language: {extracted.language}
                  </span>
                )}
              </div>
            )}

            {/* Editable Form */}
            <div className="space-y-4">
              
              {/* Customer Name */}
              <div>
                <label className="text-xs font-medium text-[#5B6472] block mb-1">
                  Customer Name (ग्राहक का नाम) *
                </label>
                <input
                  type="text"
                  value={editCustomer}
                  onChange={(e) => setEditCustomer(e.target.value)}
                  placeholder="e.g. Rahul, Amit"
                  className="w-full rounded border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#000000] focus:border-[#2075CC] focus:outline-none"
                />
              </div>

              {/* Amount & Direction */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#5B6472] block mb-1">
                    Amount (रुपये) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#000000] focus:border-[#2075CC] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#5B6472] block mb-1">
                    Transaction Type (प्रकार) *
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditType('CREDIT')}
                      className={`rounded py-2 text-xs font-medium transition-colors ${
                        editType === 'CREDIT'
                          ? 'bg-[#C62828] text-white'
                          : 'border border-[#E5E7EB] bg-white text-[#5B6472] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      Udhaar (उधार)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditType('PAYMENT')}
                      className={`rounded py-2 text-xs font-medium transition-colors ${
                        editType === 'PAYMENT'
                          ? 'bg-[#059669] text-white'
                          : 'border border-[#E5E7EB] bg-white text-[#5B6472] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      Jama (जमा)
                    </button>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-[#5B6472] block mb-1">
                  Description / Items (विवरण)
                </label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="e.g. Milk, bread, cold drink"
                  className="w-full rounded border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#000000] focus:border-[#2075CC] focus:outline-none"
                />
              </div>

            </div>

            {actionError && (
              <div className="flex items-center gap-2 rounded border border-[#C62828]/20 bg-[#C62828]/5 p-3 text-xs text-[#C62828]">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('record')}
                className="flex-1 rounded border border-[#E5E7EB] bg-white py-2.5 text-sm font-medium text-[#5B6472] hover:bg-[#F8FAFC]"
              >
                Re-record
              </button>
              <button
                type="button"
                onClick={handleConfirmTransaction}
                disabled={isProcessing}
                className="flex-1 rounded bg-[#2075CC] hover:bg-[#115AA4] py-2.5 text-sm font-medium text-white shadow-sm flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Confirm & Save</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

          </div>
        )}

        {/* STEP 3: SUCCESS & VOICE CONFIRMATION */}
        {step === 'success' && (
          <div className="py-6 flex flex-col items-center text-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#059669]/10 text-[#059669]">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div>
              <h2 className="text-2xl font-normal text-[#000000]">
                Transaction Recorded
              </h2>
              <p className="mt-1 text-xs text-[#5B6472]">
                Double-entry financial ledger updated atomically.
              </p>
            </div>

            {audioUrl && (
              <div className="flex items-center justify-between rounded border border-[#2075CC]/20 bg-[#2075CC]/5 p-3 text-xs text-[#2075CC] w-full">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  <span>Gnani Timbre Voice Confirmation</span>
                </div>
                <button
                  onClick={() => {
                    const audio = new Audio(audioUrl);
                    setIsPlayingAudio(true);
                    audio.play().catch(() => {});
                    audio.onended = () => setIsPlayingAudio(false);
                  }}
                  className="rounded bg-[#2075CC] px-3 py-1 text-xs font-medium text-white hover:bg-[#115AA4]"
                >
                  {isPlayingAudio ? 'Playing...' : 'Replay'}
                </button>
              </div>
            )}

            <button
              onClick={handleModalClose}
              className="w-full rounded bg-[#2075CC] hover:bg-[#115AA4] py-3 text-sm font-medium text-white shadow-sm"
            >
              Done
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
