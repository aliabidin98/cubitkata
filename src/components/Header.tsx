import React from 'react';
import { Volume2, VolumeX, HelpCircle, SlidersHorizontal, Home, Maximize2, Sparkles, ShieldCheck } from 'lucide-react';
import { playSound } from '../utils/audio';
import { ConfigTab } from './UnifiedConfigModal';

interface HeaderProps {
  isGameActive: boolean;
  onGoHome: () => void;
  onOpenGuide: () => void;
  onOpenUnifiedConfig: (tab?: ConfigTab) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  authStatus: 'demo' | 'activated' | 'unauthenticated';
  onOpenActivation: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isGameActive,
  onGoHome,
  onOpenGuide,
  onOpenUnifiedConfig,
  isMuted,
  onToggleMute,
  authStatus,
  onOpenActivation
}) => {
  const toggleFullscreen = () => {
    playSound('click');
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const isDemo = authStatus === 'demo';

  return (
    <header className="w-full max-w-6xl bg-white border-2 border-slate-200 rounded-2xl p-3 px-4 sm:px-6 shadow-sm flex flex-wrap items-center justify-between gap-3 mb-3 z-40 relative">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => { if (isGameActive) onGoHome(); }}>
        <div className="w-10 h-10 rounded-xl bg-teal-600 border-2 border-teal-700 flex items-center justify-center text-white font-extrabold text-xl shadow-sm select-none transition-transform hover:scale-105 active:scale-95">
          👌
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">
              Cubit Kata
            </h1>
            {isDemo ? (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Mode Demo (1P)
              </span>
            ) : (
              <span className="bg-teal-100 text-teal-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Versi Penuh
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium">Game AR Edukasi By @aliabidin98</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Activation button if in demo mode */}
        {isDemo && !isGameActive && (
          <button
            onClick={() => {
              playSound('click');
              onOpenActivation();
            }}
            className="bg-amber-500 hover:bg-amber-600 text-white border-2 border-amber-600 px-3 py-1.5 rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 transition active:translate-y-0.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Aktivasi Full</span>
          </button>
        )}

        {/* Sound toggle */}
        <button
          onClick={() => {
            playSound('click');
            onToggleMute();
          }}
          title={isMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
          className={`p-2 rounded-xl text-xs font-bold border-2 transition flex items-center justify-center ${
            isMuted
              ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm'
          }`}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-teal-600" />}
        </button>

        {/* Fullscreen button */}
        <button
          onClick={toggleFullscreen}
          title="Layar Penuh"
          className="hidden sm:flex p-2 rounded-xl text-xs font-bold bg-white text-slate-700 border-2 border-slate-200 hover:bg-slate-50 transition shadow-sm items-center justify-center"
        >
          <Maximize2 className="w-4 h-4 text-slate-600" />
        </button>

        {/* Guide button */}
        <button
          onClick={() => {
            playSound('click');
            onOpenGuide();
          }}
          className="bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200 shadow-sm hover:border-slate-300 px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition active:translate-y-0.5"
        >
          <HelpCircle className="w-4 h-4 text-amber-500" />
          <span className="hidden sm:inline">Cara Bermain</span>
          <span className="sm:hidden">Panduan</span>
        </button>

        {/* Unified Config & Question Manager Menu (Hidden in Demo mode or accessible only for full version) */}
        {!isDemo && (
          <button
            onClick={() => {
              playSound('click');
              onOpenUnifiedConfig('control');
            }}
            className="bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 shadow-sm hover:border-slate-300 px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition active:translate-y-0.5"
          >
            <SlidersHorizontal className="w-4 h-4 text-teal-600" />
            <span>Pengaturan & Soal</span>
          </button>
        )}

        {/* Back to Home if active */}
        {isGameActive && (
          <button
            onClick={() => {
              playSound('click');
              onGoHome();
            }}
            className="bg-slate-800 hover:bg-slate-900 text-white border-2 border-slate-900 shadow-sm px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition active:translate-y-0.5"
          >
            <Home className="w-4 h-4 text-slate-300" />
            <span>Menu</span>
          </button>
        )}
      </div>
    </header>
  );
};
