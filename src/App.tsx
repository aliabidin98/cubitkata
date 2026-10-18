import React, { useState, useEffect } from 'react';
import { GameMode, InputMode, Question } from './types/game';
import { Header } from './components/Header';
import { GameCanvas } from './components/GameCanvas';
import { UnifiedConfigModal, ConfigTab } from './components/UnifiedConfigModal';
import { GuideModal } from './components/GuideModal';
import { ActivationModal } from './components/ActivationModal';
import { DEFAULT_QUESTIONS, loadSavedQuestions, saveStoredQuestions } from './utils/defaultQuestions';
import { playSound, setSoundMuted } from './utils/audio';
import {
  Camera,
  MousePointer,
  SlidersHorizontal,
  BookOpen,
  Swords,
  User,
  RotateCcw,
  Trophy,
  CheckCircle2,
  FileSpreadsheet,
  ChevronRight,
  Award,
  Play,
  Sparkles,
  Lock,
  Instagram
} from 'lucide-react';

export default function App() {
  const [questions, setQuestions] = useState<Question[]>([]);

  // Authentication & Mode status ('unauthenticated' shows popup on load)
  const [authStatus, setAuthStatus] = useState<'demo' | 'activated' | 'unauthenticated'>(() => {
    const saved = localStorage.getItem('cubit_kata_activation_status');
    if (saved === 'activated') return 'activated';
    if (saved === 'demo') return 'demo';
    return 'unauthenticated';
  });
  const [isActivationModalOpen, setIsActivationModalOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('cubit_kata_activation_status');
    return saved !== 'activated' && saved !== 'demo';
  });

  const [gameMode, setGameMode] = useState<GameMode>('solo');
  const [inputMode, setInputMode] = useState<InputMode>(() => {
    return (localStorage.getItem('cubit_kata_input_mode') as InputMode) || 'camera';
  });
  const [targetScore, setTargetScore] = useState<number>(() => {
    const saved = localStorage.getItem('cubit_kata_target_score');
    return saved ? parseInt(saved, 10) || 50 : 50;
  });
  const [pointsCorrect, setPointsCorrect] = useState<number>(() => {
    const saved = localStorage.getItem('cubit_kata_points_correct');
    return saved ? parseInt(saved, 10) || 10 : 10;
  });
  const [pointsWrong, setPointsWrong] = useState<number>(() => {
    const saved = localStorage.getItem('cubit_kata_points_wrong');
    return saved !== null ? parseInt(saved, 10) : 5;
  });

  const [pinchSensitivity, setPinchSensitivity] = useState<number>(() => {
    const saved = localStorage.getItem('cubit_kata_sensitivity');
    return saved ? parseFloat(saved) || 0.28 : 0.28;
  });
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const [isGameActive, setIsGameActive] = useState<boolean>(false);

  // Modals state
  const [isUnifiedConfigOpen, setIsUnifiedConfigOpen] = useState<boolean>(false);
  const [configActiveTab, setConfigActiveTab] = useState<ConfigTab>('control');
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [homeNotice, setHomeNotice] = useState<string | null>(null);

  // Load questions on mount
  useEffect(() => {
    const loaded = loadSavedQuestions();
    setQuestions(loaded);
  }, []);

  // Check if initial activation popup is required
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      setIsActivationModalOpen(true);
    }
  }, [authStatus]);

  const handleSaveQuestions = (updated: Question[]) => {
    setQuestions(updated);
    saveStoredQuestions(updated);
  };

  const handleSetInputMode = (mode: InputMode) => {
    setInputMode(mode);
    localStorage.setItem('cubit_kata_input_mode', mode);
  };

  const handleSetTargetScore = (score: number) => {
    setTargetScore(score);
    localStorage.setItem('cubit_kata_target_score', score.toString());
  };

  const handleSetPointsCorrect = (pts: number) => {
    setPointsCorrect(pts);
    localStorage.setItem('cubit_kata_points_correct', pts.toString());
  };

  const handleSetPointsWrong = (pts: number) => {
    setPointsWrong(pts);
    localStorage.setItem('cubit_kata_points_wrong', pts.toString());
  };

  const handleSetSensitivity = (val: number) => {
    setPinchSensitivity(val);
    localStorage.setItem('cubit_kata_sensitivity', val.toString());
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    setSoundMuted(nextMuted);
  };

  const handleStartGame = (mode: GameMode) => {
    playSound('click');
    setGameMode(mode);
    setIsGameActive(true);
  };

  const handleGoHome = () => {
    playSound('click');
    setIsGameActive(false);
  };

  const handleOpenUnifiedConfig = (tab: ConfigTab = 'control') => {
    playSound('click');
    setConfigActiveTab(tab);
    setIsUnifiedConfigOpen(true);
  };

  // Activation Handler (Secret full version code check)
  const handleActivateCode = (code: string): boolean => {
    if (code.trim().toUpperCase() === 'CUBITOKE') {
      setAuthStatus('activated');
      localStorage.setItem('cubit_kata_activation_status', 'activated');
      setIsActivationModalOpen(false);
      setHomeNotice('Aktivasi Berhasil! Semua fitur Versi Penuh telah terbuka 🎉');
      setTimeout(() => setHomeNotice(null), 4000);
      return true;
    }
    return false;
  };

  // Demo Mode Selection Handler
  const handleSelectDemo = () => {
    setAuthStatus('demo');
    localStorage.setItem('cubit_kata_activation_status', 'demo');
    setIsActivationModalOpen(false);
    setHomeNotice('Mode Demo Aktif: Menampilkan menu 1 Pemain (Solo).');
    setTimeout(() => setHomeNotice(null), 4000);
  };

  // Instant Reset to 5 Default Questions directly from landing page
  const handleQuickResetDefaults = () => {
    const fresh = JSON.parse(JSON.stringify(DEFAULT_QUESTIONS));
    setQuestions(fresh);
    saveStoredQuestions(fresh);
    playSound('correct');
    setHomeNotice('Berhasil mereset ke 5 soal default bawaan! ✨');
    setTimeout(() => setHomeNotice(null), 3000);
  };

  const isDemo = authStatus === 'demo';

  return (
    <div className="min-h-screen relative flex flex-col justify-between items-center bg-slate-100 text-slate-800 p-3 sm:p-5 selection:bg-teal-200">
      
      {/* Header */}
      <Header
        isGameActive={isGameActive}
        onGoHome={handleGoHome}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenUnifiedConfig={(tab) => handleOpenUnifiedConfig(tab || 'control')}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        authStatus={authStatus}
        onOpenActivation={() => setIsActivationModalOpen(true)}
      />

      {/* Main Content Area */}
      {isGameActive ? (
        <GameCanvas
          gameMode={gameMode}
          inputMode={inputMode}
          targetScore={targetScore}
          pointsCorrect={pointsCorrect}
          pointsWrong={pointsWrong}
          questionBank={questions}
          pinchSensitivity={pinchSensitivity}
          isMirrored={isMirrored}
          onGoHome={handleGoHome}
          onChangeInputMode={handleSetInputMode}
        />
      ) : (
        <main className="w-full max-w-4xl flex-1 flex flex-col items-center justify-center py-2 sm:py-4">
          
          {/* Toast Notification Banner */}
          {homeNotice && (
            <div className="w-full max-w-2xl mb-3 bg-teal-600 text-white text-xs font-black px-4 py-2.5 rounded-2xl shadow-md flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{homeNotice}</span>
            </div>
          )}

          {/* Mode Demo Upgrade Banner (Shown in Demo mode) */}
          {isDemo && (
            <div className="w-full max-w-4xl mb-3 bg-amber-50 border-2 border-amber-300 p-3.5 px-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">⭐</span>
                <div>
                  <div className="text-xs font-black text-amber-950">Mode Demo (Hanya 1 Pemain)</div>
                  <div className="text-[11px] text-amber-800 font-medium">
                    Menu selain 1 pemain disembunyikan. Punya kode aktivasi? Buka versi penuh sekarang!
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  setIsActivationModalOpen(true);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 transition shrink-0 active:translate-y-0.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Aktivasi Versi Penuh</span>
              </button>
            </div>
          )}

          <div className="w-full bg-white border-3 border-slate-900 rounded-3xl p-5 sm:p-8 shadow-[8px_8px_0px_#0f172a] space-y-6">
            
            {/* HERO TITLE & TEXT */}
            <div className="text-center relative">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border-2 border-teal-200 text-teal-800 text-[11px] font-black uppercase tracking-wider mb-2 shadow-sm">
                <span>Game Edukasi Interaktif Berbasis Augmented Reality</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-2">
                Cubit Kata <span className="text-teal-600">👌</span>
              </h1>
              
              <p className="text-xs sm:text-sm text-slate-600 font-semibold max-w-xl mx-auto leading-relaxed">
                Jepit jari telunjuk & ibu jari (👌) untuk mengambil kartu jawaban, lalu geser ke dalam <b>Kotak Jawaban</b>. Asah kecepatan berpikir & ketangkasan tangan!
              </p>

              {/* Simple gesture flow banner */}
              <div className="mt-4 max-w-md mx-auto bg-slate-50 border-2 border-slate-200 rounded-2xl p-2.5 px-4 flex items-center justify-around text-[11px] font-black text-slate-700 shadow-inner">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">👌</span>
                  <span>Jepit Kartu</span>
                </div>
                <span className="text-slate-400 font-bold">&rarr;</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🖐️</span>
                  <span>Seret Tangan</span>
                </div>
                <span className="text-slate-400 font-bold">&rarr;</span>
                <div className="flex items-center gap-1.5 text-teal-700">
                  <span className="text-base">🎯</span>
                  <span>Lepas di Kotak (+{pointsCorrect})</span>
                </div>
              </div>
            </div>

            {/* UNIFIED CONFIGURATION HUB CARD (Hidden in Demo mode per instruction "hanya menu 1 pemain yang tampil, selain itu disembunyikan") */}
            {!isDemo && (
              <div className="bg-slate-50 border-2 border-slate-300 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black shadow-sm">
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 leading-none">
                        Menu Pengaturan Permainan & Bank Soal
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Pilihan kontrol, target skor, edit sistem poin, dan kelola soal dalam satu menu terpadu.
                      </p>
                    </div>
                  </div>

                  {/* Big Button: Open Unified Menu */}
                  <button
                    type="button"
                    onClick={() => handleOpenUnifiedConfig('control')}
                    className="w-full sm:w-auto px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-[0_3px_0_#0f766e] active:translate-y-0.5 active:shadow-none transition flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Buka Menu Pengaturan Lengkap</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Status Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {/* 1. Kontrol Chip */}
                  <button
                    type="button"
                    onClick={() => handleOpenUnifiedConfig('control')}
                    className="bg-white hover:bg-teal-50/70 border-2 border-slate-200 hover:border-teal-500/60 rounded-2xl p-3 text-left transition flex items-center justify-between group shadow-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                        {inputMode === 'camera' ? <Camera className="w-4 h-4" /> : <MousePointer className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Kontrol Aktif</div>
                        <div className="text-xs font-black text-slate-800">
                          {inputMode === 'camera' ? '📷 Kamera (AR)' : '🖱️ Mouse/Sentuh'}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold text-teal-700">
                      Ubah &rarr;
                    </span>
                  </button>

                  {/* 2. Skor & Sistem Poin Chip */}
                  <button
                    type="button"
                    onClick={() => handleOpenUnifiedConfig('score')}
                    className="bg-white hover:bg-amber-50/70 border-2 border-slate-200 hover:border-amber-500/60 rounded-2xl p-3 text-left transition flex items-center justify-between group shadow-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Target & Poin</div>
                        <div className="text-xs font-black text-slate-800">
                          {targetScore} Poin <span className="text-[11px] text-teal-700 font-bold">(+{pointsCorrect}/-{pointsWrong})</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold text-amber-700">
                      Atur &rarr;
                    </span>
                  </button>

                  {/* 3. Bank Soal Chip */}
                  <button
                    type="button"
                    onClick={() => handleOpenUnifiedConfig('questions')}
                    className="bg-white hover:bg-emerald-50/70 border-2 border-slate-200 hover:border-emerald-500/60 rounded-2xl p-3 text-left transition flex items-center justify-between group shadow-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Bank Soal</div>
                        <div className="text-xs font-black text-slate-800">
                          {questions.length} Soal <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-bold">Excel Siap</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-700">
                      Kelola &rarr;
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* GAME MODE ACTION CARDS */}
            <div className={`grid gap-4 ${isDemo ? 'grid-cols-1 max-w-lg mx-auto' : 'grid-cols-1 sm:grid-cols-2'}`}>
              
              {/* SOLO MODE CARD (Displayed in both Demo & Full Version) */}
              <button
                type="button"
                onClick={() => handleStartGame('solo')}
                className="bg-teal-700 hover:bg-teal-800 text-white border-2 border-teal-900 p-5 sm:p-6 rounded-3xl text-left flex flex-col justify-between shadow-[0_5px_0_#0f766e] active:translate-y-1 active:shadow-none transition group"
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-900 text-white flex items-center justify-center font-bold text-2xl shadow-inner">
                    <User className="w-7 h-7" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-teal-900 text-teal-200 px-2.5 py-1 rounded-full">
                    {isDemo ? 'Mode Demo • 1 Pemain' : '1 Pemain'}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight mb-1">
                    Mode Mandiri (Solo)
                  </h3>
                  <p className="text-xs text-teal-100 font-medium leading-relaxed mb-4">
                    Kumpulkan skor hingga mencapai target {targetScore} poin. Jawaban tepat +{pointsCorrect}, salah -{pointsWrong}.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-teal-600 text-xs font-black">
                  <span className="flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Mulai Main Solo</span>
                  </span>
                  <span className="text-base">&rarr;</span>
                </div>
              </button>

              {/* BATTLE 2P MODE CARD (Strictly hidden in Demo Mode per instruction) */}
              {!isDemo && (
                <button
                  type="button"
                  onClick={() => handleStartGame('battle')}
                  className="bg-orange-600 hover:bg-orange-700 text-white border-2 border-orange-800 p-5 rounded-3xl text-left flex flex-col justify-between shadow-[0_5px_0_#9a3412] active:translate-y-1 active:shadow-none transition group"
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-orange-900 text-white flex items-center justify-center font-bold text-2xl shadow-inner">
                      <Swords className="w-7 h-7" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-orange-900 text-orange-200 px-2.5 py-1 rounded-full">
                      2 Pemain • Split Screen
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight mb-1">
                      Mode Tanding 2P (Battle)
                    </h3>
                    <p className="text-xs text-orange-100 font-medium leading-relaxed mb-4">
                      Layar terbagi dua kiri (P1) & kanan (P2)! Adu cepat mencubit jawaban yang tepat.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-orange-500 text-xs font-black">
                    <span className="flex items-center gap-1.5">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Mulai Bertanding 2P</span>
                    </span>
                    <span className="text-base">&rarr;</span>
                  </div>
                </button>
              )}
            </div>

            {/* QUICK ACTIONS BAR (Only in Full Version) */}
            {!isDemo && (
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 text-xs font-semibold text-slate-500">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleQuickResetDefaults}
                    className="hover:text-amber-700 transition flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-amber-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                    <span>Reset 5 Soal Default</span>
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleOpenUnifiedConfig('questions')}
                    className="hover:text-emerald-700 transition flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-emerald-50"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Impor / Ekspor Excel</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Award className="w-3.5 h-3.5 text-teal-600" />
                  <span>Aturan Nilai: Benar +{pointsCorrect} Poin | Salah -{pointsWrong} Poin</span>
                </div>
              </div>
            )}

          </div>
        </main>
      )}

      {/* FOOTER MEDIA SOSIAL PENGEMBANG */}
      <footer className="w-full max-w-6xl text-center py-4 text-xs text-slate-600 font-medium z-40 relative border-t border-slate-200 mt-4 space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold">
          <span className="text-slate-800 font-black">Pengembang: M. Nur Ali Abidin, S.Pd</span>
          <span className="text-slate-300 hidden sm:inline">|</span>

          {/* Instagram */}
          <a
            href="https://instagram.com/aliabidin988"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-slate-700 hover:text-pink-600 transition px-2.5 py-1 rounded-xl bg-white border border-slate-200 shadow-xs"
          >
            <Instagram className="w-3.5 h-3.5 text-pink-600" />
            <span>Instagram: @aliabidin988</span>
          </a>

          {/* TikTok */}
          <a
            href="https://tiktok.com/@aliabidin98"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-slate-700 hover:text-black transition px-2.5 py-1 rounded-xl bg-white border border-slate-200 shadow-xs"
          >
            {/* TikTok SVG Icon */}
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.42a6.27 6.27 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 8.78 5.86 6.34 6.34 0 0 0 3.9-5.86V8.69a8.18 8.18 0 0 0 4.77 1.51V6.75a4.86 4.86 0 0 1-1-.06z" />
            </svg>
            <span>Tiktok: @aliabidin98</span>
          </a>
        </div>

        <div className="text-[11px] text-slate-400">
          Cubit Kata • Game AR Edukasi Hand-Tracking
        </div>
      </footer>

      {/* ACTIVATION POPUP MODAL */}
      <ActivationModal
        isOpen={isActivationModalOpen}
        onClose={() => setIsActivationModalOpen(false)}
        onActivate={handleActivateCode}
        onSelectDemo={handleSelectDemo}
        currentMode={authStatus}
      />

      {/* UNIFIED CONFIGURATION MODAL (Control, Score & Points, Questions) */}
      <UnifiedConfigModal
        isOpen={isUnifiedConfigOpen}
        initialTab={configActiveTab}
        onClose={() => setIsUnifiedConfigOpen(false)}
        inputMode={inputMode}
        onChangeInputMode={handleSetInputMode}
        pinchSensitivity={pinchSensitivity}
        onChangeSensitivity={handleSetSensitivity}
        isMirrored={isMirrored}
        onToggleMirrored={() => setIsMirrored(!isMirrored)}
        targetScore={targetScore}
        onChangeTargetScore={handleSetTargetScore}
        pointsCorrect={pointsCorrect}
        onChangePointsCorrect={handleSetPointsCorrect}
        pointsWrong={pointsWrong}
        onChangePointsWrong={handleSetPointsWrong}
        questions={questions}
        onSaveQuestions={handleSaveQuestions}
      />

      {/* Guide Modal */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        pointsCorrect={pointsCorrect}
        pointsWrong={pointsWrong}
      />
    </div>
  );
}
