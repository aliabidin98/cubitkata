import React, { useState } from 'react';
import { KeyRound, ShieldAlert, CheckCircle2, Lock, Sparkles, User, X } from 'lucide-react';
import { playSound } from '../utils/audio';

interface ActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivate: (code: string) => boolean;
  onSelectDemo: () => void;
  currentMode: 'demo' | 'activated' | 'unauthenticated';
}

export const ActivationModal: React.FC<ActivationModalProps> = ({
  isOpen,
  onClose,
  onActivate,
  onSelectDemo,
  currentMode
}) => {
  const [inputCode, setInputCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!inputCode.trim()) {
      setErrorMessage('Harap masukkan kode aktivasi!');
      playSound('wrong');
      return;
    }

    const success = onActivate(inputCode.trim());
    if (success) {
      playSound('victory');
      setInputCode('');
    } else {
      playSound('wrong');
      setErrorMessage('Kode aktivasi salah! Tidak dapat mengakses menu utama.');
    }
  };

  const handleDemoClick = () => {
    playSound('click');
    onSelectDemo();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white border-3 border-slate-900 rounded-3xl w-full max-w-md shadow-[8px_8px_0px_#0f172a] overflow-hidden flex flex-col relative">
        
        {/* Allow close ONLY if already in demo or activated mode (e.g. user voluntarily clicked upgrade) */}
        {currentMode !== 'unauthenticated' && (
          <button
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center transition border border-slate-300 z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white text-center border-b-2 border-slate-800 relative">
          <div className="w-14 h-14 rounded-2xl bg-teal-500 border-2 border-teal-400 text-slate-900 flex items-center justify-center font-black text-2xl mx-auto mb-3 shadow-[0_4px_0_#0f766e]">
            👌
          </div>
          <h2 className="text-xl font-black tracking-tight text-white mb-1">
            Aktivasi Cubit Kata
          </h2>
          <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
            Masukkan kode aktivasi untuk membuka versi penuh atau coba mode demo.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          
          {/* Error Notice */}
          {errorMessage && (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-3 flex items-center gap-2.5 text-xs text-rose-800 font-bold">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Activation Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-teal-600" />
                <span>Kode Aktivasi:</span>
              </label>
              <input
                type="text"
                autoFocus
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Masukkan kode aktivasi..."
                className="w-full bg-slate-50 border-2 border-slate-300 rounded-2xl px-4 py-3 text-sm font-black text-slate-800 tracking-widest text-center uppercase focus:outline-none focus:bg-white focus:border-teal-600 transition"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-black shadow-[0_4px_0_#0f766e] active:translate-y-1 active:shadow-none transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Aktivasi Versi Penuh</span>
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Atau
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Demo Mode Button */}
          <button
            type="button"
            onClick={handleDemoClick}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border-2 border-slate-300 rounded-2xl text-xs font-black shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-none transition flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4 text-slate-600" />
            <span>Coba Mode Demo (Hanya 1 Pemain)</span>
          </button>

          {/* Info note */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 font-semibold text-center leading-relaxed">
            ℹ️ Pada <b>Mode Demo</b>, hanya menu <b>1 Pemain (Solo)</b> yang tampil, sedangkan fitur lainnya disembunyikan.
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[10px] text-slate-500 font-bold">
          Cubit Kata • Media Belajar Interaktif AR
        </div>

      </div>
    </div>
  );
};
