'use client';

import { useState, useRef, useCallback } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

// Minimal type for Web Speech API
interface SpeechRecognitionInstance extends EventTarget {
  start(): void;
  stop(): void;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: { error: string }) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: { transcript: string };
}

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null;
}

export function VoiceInput({ onTranscript, disabled = false }: VoiceInputProps) {
  const { t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setError('Voice input is not supported in this browser.');
      return;
    }

    setError(null);
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setInterimText(interim);
      if (final) {
        onTranscript(final.trim());
        setInterimText('');
      }
    };

    recognition.onerror = (event: { error: string }) => {
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access.');
      } else if (event.error !== 'no-speech') {
        setError('Voice input failed. Please type your description.');
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [onTranscript]);

  function stopListening() {
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  const isSupported = typeof window !== 'undefined' && !!getSpeechRecognition();

  if (!isSupported) return null;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Pulse animation ring + mic button — matches voice_input_description_mobile */}
      <div className="relative flex items-center justify-center">
        {isListening && (
          <>
            <span className="absolute w-16 h-16 rounded-full bg-[#001e40]/10 animate-[pulse-ring_1.5s_ease-out_infinite]" />
            <span className="absolute w-20 h-20 rounded-full bg-[#001e40]/5 animate-[pulse-ring_1.5s_ease-out_0.5s_infinite]" />
          </>
        )}
        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          disabled={disabled}
          aria-label={isListening ? 'Stop recording' : 'Start voice input'}
          className={[
            'relative z-10 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-[#001e40]/30',
            isListening
              ? 'bg-[#DC2626] text-white scale-110'
              : 'bg-[#001e40] text-white hover:opacity-90',
            disabled ? 'opacity-50 cursor-not-allowed' : '',
          ].join(' ')}
        >
          <span
            className="material-symbols-outlined text-2xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {isListening ? 'stop' : 'mic'}
          </span>
        </button>
      </div>

      <p className="text-xs text-[#545f72] text-center">
        {isListening
          ? interimText || t('listening_speak')
          : t('tap_to_add_voice')}
      </p>

      {error && <p className="text-xs text-[#DC2626] text-center">{error}</p>}
    </div>
  );
}
