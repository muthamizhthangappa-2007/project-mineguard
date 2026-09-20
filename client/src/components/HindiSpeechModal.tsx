import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, ArrowRight, Check, X, Sparkles } from 'lucide-react';
import { HindiSpeechRecognitionManager, translateHindiToEnglish } from '../services/voiceService';

interface HindiSpeechModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (hindiTranscript: string, englishReport: string) => void;
}

export const HindiSpeechModal: React.FC<HindiSpeechModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [hindiTranscript, setHindiTranscript] = useState('कन्वेयर बेल्ट का गार्ड टूट गया है।');
  const [englishReport, setEnglishReport] = useState('The conveyor belt guard is damaged.');
  const [speechManager, setSpeechManager] = useState<HindiSpeechRecognitionManager | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSpeechManager(new HindiSpeechRecognitionManager());
    }
  }, []);

  const handleToggleListening = () => {
    if (!speechManager) return;

    if (isListening) {
      speechManager.stopListening();
      setIsListening(false);
    } else {
      setErrorNotice(null);
      setIsListening(true);
      speechManager.startListening(
        (hindi, english) => {
          setHindiTranscript(hindi);
          setEnglishReport(english);
          setIsListening(false);
        },
        (error) => {
          setErrorNotice(error);
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        }
      );
    }
  };

  const handleHindiTextChange = (text: string) => {
    setHindiTranscript(text);
    const translated = translateHindiToEnglish(text);
    setEnglishReport(translated);
  };

  // Preset demo phrases (Section 8)
  const demoPhrases = [
    {
      hindi: 'कन्वेयर बेल्ट का गार्ड टूट गया है।',
      english: 'The conveyor belt guard is damaged.',
    },
    {
      hindi: 'पानी का पंप खराब हो गया है।',
      english: 'The water dewatering pump has malfunctioned.',
    },
    {
      hindi: 'इलेक्ट्रिकल पैनल में स्पार्क हो रहा है।',
      english: 'Sparks observed in the electrical distribution panel.',
    },
    {
      hindi: 'वेंटिलेशन पंखा बंद है।',
      english: 'The primary ventilation fan has stopped operating.',
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-white">Hindi Voice Hazard Reporting</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {errorNotice && (
            <div className="p-3 bg-amber-950/60 border border-amber-800/80 rounded-xl text-xs text-amber-300">
              {errorNotice}
            </div>
          )}

          {/* Large Interactive Microphone Button */}
          <div className="flex flex-col items-center justify-center py-4">
            <button
              onClick={handleToggleListening}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl ${
                isListening
                  ? 'bg-red-500 text-white animate-ping ring-4 ring-red-400/50'
                  : 'bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 hover:scale-105 ring-4 ring-amber-500/20'
              }`}
            >
              {isListening ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
            </button>
            <p className="mt-3 text-xs font-bold uppercase tracking-wider text-amber-400">
              {isListening ? 'Listening in Hindi (बोलिए)...' : 'Tap to Speak Hindi'}
            </p>
            <p className="text-[11px] text-slate-400">
              Example: &ldquo;कन्वेयर बेल्ट का गार्ड टूट गया है।&rdquo;
            </p>
          </div>

          {/* Quick Demo Voice Phrases */}
          <div>
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Demo Mining Voice Queries:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {demoPhrases.map((phrase, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setHindiTranscript(phrase.hindi);
                    setEnglishReport(phrase.english);
                  }}
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/60 text-left transition-all"
                >
                  <p className="text-xs font-bold text-white leading-tight">{phrase.hindi}</p>
                  <p className="text-[10px] text-amber-400/90 mt-0.5">{phrase.english}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Dual Transcription & Translation Display */}
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Original Language (हिन्दी प्रतिलेख):
              </label>
              <textarea
                value={hindiTranscript}
                onChange={(e) => handleHindiTextChange(e.target.value)}
                rows={2}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-medium leading-relaxed"
                placeholder="यहाँ बोलें या टाइप करें..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" /> English Report (Editable):
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Worker can review &amp; edit before submit
                </span>
              </label>
              <textarea
                value={englishReport}
                onChange={(e) => setEnglishReport(e.target.value)}
                rows={2}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-emerald-300 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-semibold leading-relaxed"
                placeholder="English report preview..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm(hindiTranscript, englishReport);
                onClose();
              }}
              disabled={!englishReport.trim()}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> Use This Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
