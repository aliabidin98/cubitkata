import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  X,
  Sliders,
  Camera,
  MousePointer,
  Trophy,
  PlusCircle,
  MinusCircle,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  FileSpreadsheet,
  Upload,
  Search,
  CheckCircle,
  AlertTriangle,
  SlidersHorizontal,
  Check
} from 'lucide-react';
import { InputMode, Question } from '../types/game';
import { DEFAULT_QUESTIONS, saveStoredQuestions } from '../utils/defaultQuestions';
import { playSound } from '../utils/audio';

export type ConfigTab = 'control' | 'score' | 'questions';

interface UnifiedConfigModalProps {
  isOpen: boolean;
  initialTab?: ConfigTab;
  onClose: () => void;
  // Controls
  inputMode: InputMode;
  onChangeInputMode: (mode: InputMode) => void;
  pinchSensitivity: number;
  onChangeSensitivity: (val: number) => void;
  isMirrored: boolean;
  onToggleMirrored: () => void;
  // Score & Points
  targetScore: number;
  onChangeTargetScore: (score: number) => void;
  pointsCorrect: number;
  onChangePointsCorrect: (pts: number) => void;
  pointsWrong: number;
  onChangePointsWrong: (pts: number) => void;
  // Questions
  questions: Question[];
  onSaveQuestions: (updated: Question[]) => void;
}

export const UnifiedConfigModal: React.FC<UnifiedConfigModalProps> = ({
  isOpen,
  initialTab = 'control',
  onClose,
  inputMode,
  onChangeInputMode,
  pinchSensitivity,
  onChangeSensitivity,
  isMirrored,
  onToggleMirrored,
  targetScore,
  onChangeTargetScore,
  pointsCorrect,
  onChangePointsCorrect,
  pointsWrong,
  onChangePointsWrong,
  questions,
  onSaveQuestions
}) => {
  const [activeTab, setActiveTab] = useState<ConfigTab>(initialTab);

  // Question editing internal states
  const [editingId, setEditingId] = useState<number | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [correctOpt, setCorrectOpt] = useState('');
  const [wrongOpt, setWrongOpt] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  // Sync initial tab when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleStartEdit = (q: Question) => {
    playSound('click');
    setEditingId(q.id);
    setQuestionText(q.q);
    const correct = q.options.find(o => o.isCorrect)?.text || '';
    const wrong = q.options.find(o => !o.isCorrect)?.text || '';
    setCorrectOpt(correct);
    setWrongOpt(wrong);
  };

  const handleCancelEdit = () => {
    playSound('click');
    setEditingId(null);
    setQuestionText('');
    setCorrectOpt('');
    setWrongOpt('');
  };

  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || !correctOpt.trim() || !wrongOpt.trim()) {
      showFeedback('Harap isi pertanyaan dan kedua pilihan jawaban!');
      playSound('wrong');
      return;
    }

    if (editingId !== null) {
      const updated = questions.map(q => {
        if (q.id === editingId) {
          return {
            ...q,
            q: questionText.trim(),
            options: [
              { text: correctOpt.trim(), isCorrect: true },
              { text: wrongOpt.trim(), isCorrect: false }
            ] as [ { text: string; isCorrect: boolean }, { text: string; isCorrect: boolean } ]
          };
        }
        return q;
      });
      onSaveQuestions(updated);
      saveStoredQuestions(updated);
      showFeedback('Soal berhasil diperbarui! ✨');
      playSound('correct');
    } else {
      const newQuestion: Question = {
        id: Date.now(),
        q: questionText.trim(),
        options: [
          { text: correctOpt.trim(), isCorrect: true },
          { text: wrongOpt.trim(), isCorrect: false }
        ]
      };
      const updated = [newQuestion, ...questions];
      onSaveQuestions(updated);
      saveStoredQuestions(updated);
      showFeedback('Soal baru berhasil ditambahkan! ➕');
      playSound('correct');
    }

    handleCancelEdit();
  };

  const handleDeleteQuestion = (id: number) => {
    if (questions.length <= 1) {
      showFeedback('Minimal harus menyisakan 1 soal untuk bermain!');
      playSound('wrong');
      return;
    }
    playSound('click');
    const updated = questions.filter(q => q.id !== id);
    onSaveQuestions(updated);
    saveStoredQuestions(updated);
    showFeedback('Soal telah dihapus 🗑️');
    if (editingId === id) handleCancelEdit();
  };

  const handleResetDefaults = () => {
    if (!confirmReset) {
      playSound('click');
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 4000);
      return;
    }

    const defaultClone = JSON.parse(JSON.stringify(DEFAULT_QUESTIONS));
    onSaveQuestions(defaultClone);
    saveStoredQuestions(defaultClone);
    setConfirmReset(false);
    handleCancelEdit();
    showFeedback('Berhasil dikembalikan ke 5 soal bawaan default! 🔄');
    playSound('correct');
  };

  const handleExportExcel = () => {
    playSound('click');
    try {
      const exportData = questions.map((q, idx) => ({
        'No': idx + 1,
        'Pertanyaan': q.q,
        'Jawaban Benar': q.options.find(o => o.isCorrect)?.text || '',
        'Jawaban Salah': q.options.find(o => !o.isCorrect)?.text || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet['!cols'] = [
        { wch: 6 },
        { wch: 45 },
        { wch: 20 },
        { wch: 20 }
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar Soal');
      XLSX.writeFile(workbook, `soal-cubit-kata-${new Date().toISOString().slice(0, 10)}.xlsx`);
      showFeedback('File Excel (.xlsx) berhasil diunduh! 📊');
    } catch (err) {
      console.error(err);
      showFeedback('Gagal mengekspor file Excel.');
      playSound('wrong');
    }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const arrayBuffer = evt.target?.result as ArrayBuffer;
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet);

        if (!rawRows || rawRows.length === 0) {
          showFeedback('File Excel kosong atau format tabel tidak terdeteksi!');
          playSound('wrong');
          return;
        }

        const importedQuestions: Question[] = [];

        rawRows.forEach((row, i) => {
          const qText = row['Pertanyaan'] || row['pertanyaan'] || row['Soal'] || row['soal'] || row['Question'] || '';
          const correct = row['Jawaban Benar'] || row['jawaban benar'] || row['Benar'] || row['benar'] || row['Correct'] || '';
          const wrong = row['Jawaban Salah'] || row['jawaban salah'] || row['Salah'] || row['salah'] || row['Pengecoh'] || '';

          if (qText && correct && wrong) {
            importedQuestions.push({
              id: Date.now() + i,
              q: String(qText).trim(),
              options: [
                { text: String(correct).trim(), isCorrect: true },
                { text: String(wrong).trim(), isCorrect: false }
              ]
            });
          }
        });

        if (importedQuestions.length === 0) {
          showFeedback('Pastikan kolom Excel: "Pertanyaan", "Jawaban Benar", "Jawaban Salah"');
          playSound('wrong');
          return;
        }

        onSaveQuestions(importedQuestions);
        saveStoredQuestions(importedQuestions);
        showFeedback(`Berhasil mengimpor ${importedQuestions.length} soal dari Excel! 🎉`);
        playSound('correct');
      } catch (err) {
        console.error(err);
        showFeedback('Gagal membaca file Excel. Pastikan format .xlsx/.xls valid.');
        playSound('wrong');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const filteredQuestions = questions.filter(q => {
    const qLower = searchQuery.toLowerCase();
    return q.q.toLowerCase().includes(qLower) ||
      q.options.some(o => o.text.toLowerCase().includes(qLower));
  });

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white border-3 border-slate-900 rounded-3xl w-full max-w-3xl shadow-[8px_8px_0px_#0f172a] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* MODAL HEADER */}
        <div className="p-4 px-6 bg-slate-900 text-white border-b-2 border-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500 text-slate-900 flex items-center justify-center font-black text-lg shadow-sm">
              ⚙️
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Pusat Pengaturan Permainan</h3>
              <p className="text-xs text-slate-400 font-medium">Kontrol, Target Skor & Poin, dan Bank Soal</p>
            </div>
          </div>
          <button
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-sm flex items-center justify-center transition border border-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* FEEDBACK BANNER */}
        {feedback && (
          <div className="bg-teal-600 text-white text-xs font-bold px-4 py-2.5 text-center transition flex items-center justify-center gap-1.5 shadow-inner">
            <CheckCircle className="w-4 h-4" />
            <span>{feedback}</span>
          </div>
        )}

        {/* UNIFIED TABS BAR */}
        <div className="bg-slate-100 p-2 border-b-2 border-slate-200 flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              playSound('click');
              setActiveTab('control');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
              activeTab === 'control'
                ? 'bg-white text-teal-800 border-2 border-teal-600/40 shadow-sm'
                : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            <Camera className="w-4 h-4 text-teal-600" />
            <span>🎮 Kontrol & Kamera</span>
          </button>

          <button
            onClick={() => {
              playSound('click');
              setActiveTab('score');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
              activeTab === 'score'
                ? 'bg-white text-amber-900 border-2 border-amber-500/40 shadow-sm'
                : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-600" />
            <span>🎯 Skor & Sistem Poin</span>
          </button>

          <button
            onClick={() => {
              playSound('click');
              setActiveTab('questions');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
              activeTab === 'questions'
                ? 'bg-white text-teal-900 border-2 border-teal-600/40 shadow-sm'
                : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            <BookOpen className="w-4 h-4 text-teal-600" />
            <span>📝 Kelola Soal ({questions.length})</span>
          </button>
        </div>

        {/* TAB CONTENTS */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50 space-y-5">
          
          {/* TAB 1: KONTROL & KAMERA */}
          {activeTab === 'control' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Pilihan Metode Kontrol */}
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-teal-600" />
                    Metode Kontrol Input
                  </h4>
                  <span className="text-[11px] font-bold text-slate-500">
                    Aktif: {inputMode === 'camera' ? '📷 Kamera' : '🖱️ Mouse/Sentuh'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click');
                      onChangeInputMode('camera');
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-left transition flex items-center justify-between gap-3 ${
                      inputMode === 'camera'
                        ? 'bg-teal-50 border-teal-600 shadow-sm ring-2 ring-teal-500/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
                        inputMode === 'camera' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        <Camera className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-black text-xs sm:text-sm text-slate-900">Kamera (Hand Tracking AR)</div>
                        <div className="text-[11px] text-slate-500 font-medium">Jepit ibu jari & telunjuk 👌</div>
                      </div>
                    </div>
                    {inputMode === 'camera' && <Check className="w-5 h-5 text-teal-600 shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playSound('click');
                      onChangeInputMode('mouse');
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-left transition flex items-center justify-between gap-3 ${
                      inputMode === 'mouse'
                        ? 'bg-teal-50 border-teal-600 shadow-sm ring-2 ring-teal-500/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
                        inputMode === 'mouse' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        <MousePointer className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-black text-xs sm:text-sm text-slate-900">Mouse / Layar Sentuh</div>
                        <div className="text-[11px] text-slate-500 font-medium">Klik/sentuh & seret langsung</div>
                      </div>
                    </div>
                    {inputMode === 'mouse' && <Check className="w-5 h-5 text-teal-600 shrink-0" />}
                  </button>
                </div>
              </div>

              {/* Sensitivitas Cubitan */}
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-black text-slate-900 text-xs">
                    <Sliders className="w-4 h-4 text-teal-600" />
                    Sensitivitas Deteksi Cubitan Jari
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-teal-100 text-teal-800 text-[11px] font-black">
                    {Math.round(pinchSensitivity * 100)}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Tingkatkan jika cubitan terasa sulit menempel pada kartu; turunkan jika kartu terlalu mudah terambil secara tidak sengaja.
                </p>
                <input
                  type="range"
                  min="0.20"
                  max="0.48"
                  step="0.02"
                  value={pinchSensitivity}
                  onChange={(e) => onChangeSensitivity(parseFloat(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                  <span>Lebih Ketat (20%)</span>
                  <span>Standar (28%)</span>
                  <span>Lebih Mudah Jepit (48%)</span>
                </div>
              </div>

              {/* Mirror Camera */}
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <Camera className="w-5 h-5 text-teal-600" />
                  <div>
                    <div className="font-black text-slate-900 text-xs">Cermin Kamera (Mirror View)</div>
                    <div className="text-[11px] text-slate-500 font-medium">Balikkan tampilan video webcam secara horizontal seperti cermin</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    onToggleMirrored();
                  }}
                  className={`w-12 h-6 rounded-full transition p-1 flex items-center ${
                    isMirrored ? 'bg-teal-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SKOR & SISTEM POIN */}
          {activeTab === 'score' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Target Skor Kemenangan */}
              <div className="bg-white border-2 border-amber-300 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-600" />
                    Target Skor Kemenangan
                  </h4>
                  <span className="text-[11px] font-black text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                    Target Aktif: {targetScore} Poin
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[30, 50, 100, 150].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => {
                        playSound('click');
                        onChangeTargetScore(score);
                      }}
                      className={`py-2.5 px-3 rounded-xl text-center transition flex flex-col items-center justify-center ${
                        targetScore === score
                          ? 'bg-amber-500 text-white border-2 border-amber-700 shadow-[0_3px_0_#b45309]'
                          : 'bg-slate-50 text-amber-950 border-2 border-amber-200 hover:bg-amber-50'
                      }`}
                    >
                      <span className="text-base font-black leading-tight">{score} Poin</span>
                      <span className="text-[10px] font-semibold opacity-90">
                        {score === 30 ? 'Kilat' : score === 50 ? 'Standar' : score === 100 ? 'Tantangan' : 'Maraton'}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Custom Target Score Input */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                  <span className="font-bold text-slate-600">Atur Target Kustom:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="10"
                      max="500"
                      step="5"
                      value={targetScore}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 10;
                        onChangeTargetScore(Math.max(10, Math.min(500, val)));
                      }}
                      className="w-20 px-2 py-1 text-center font-black bg-slate-50 border-2 border-amber-300 rounded-lg text-slate-800 focus:bg-white focus:outline-none"
                    />
                    <span className="font-bold text-slate-500">Poin</span>
                  </div>
                </div>
              </div>

              {/* PENGATURAN EDIT SISTEM POIN */}
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <span>⭐</span> Edit Sistem Poin (Aturan Nilai)
                  </h4>
                  <span className="text-[10px] bg-teal-100 text-teal-800 font-extrabold px-2 py-0.5 rounded-full uppercase">
                    Kustomisasi
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Poin Jawaban Benar */}
                  <div className="bg-emerald-50/70 border-2 border-emerald-300 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-emerald-950 flex items-center gap-1.5">
                        <span>✅</span> Poin Jawaban BENAR
                      </span>
                      <span className="text-emerald-700 font-black text-sm">+{pointsCorrect}</span>
                    </div>
                    <p className="text-[11px] text-emerald-900/80 font-medium">
                      Jumlah skor yang ditambahkan setiap kali kartu jawaban benar dimasukkan ke kotak.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          playSound('click');
                          onChangePointsCorrect(Math.max(1, pointsCorrect - 5));
                        }}
                        className="w-8 h-8 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-black flex items-center justify-center hover:bg-emerald-100 transition"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={pointsCorrect}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          onChangePointsCorrect(Math.max(1, Math.min(100, val)));
                        }}
                        className="flex-1 py-1 px-2 text-center font-black bg-white border-2 border-emerald-400 rounded-lg text-emerald-950 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          playSound('click');
                          onChangePointsCorrect(Math.min(100, pointsCorrect + 5));
                        }}
                        className="w-8 h-8 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-black flex items-center justify-center hover:bg-emerald-100 transition"
                      >
                        +
                      </button>
                    </div>
                    {/* Quick Preset Pills */}
                    <div className="flex gap-1.5 pt-1">
                      {[5, 10, 15, 20].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            playSound('click');
                            onChangePointsCorrect(p);
                          }}
                          className={`flex-1 py-0.5 rounded text-[10px] font-black transition ${
                            pointsCorrect === p
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white text-emerald-900 border border-emerald-300 hover:bg-emerald-100'
                          }`}
                        >
                          +{p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pengurangan Jawaban Salah */}
                  <div className="bg-rose-50/70 border-2 border-rose-300 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-rose-950 flex items-center gap-1.5">
                        <span>❌</span> Pengurangan Jawaban SALAH
                      </span>
                      <span className="text-rose-700 font-black text-sm">-{pointsWrong}</span>
                    </div>
                    <p className="text-[11px] text-rose-900/80 font-medium">
                      Pengurangan skor jika memilih kartu salah (isi 0 jika tidak ingin ada hukuman pengurangan).
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          playSound('click');
                          onChangePointsWrong(Math.max(0, pointsWrong - 1));
                        }}
                        className="w-8 h-8 rounded-lg bg-white border border-rose-300 text-rose-800 font-black flex items-center justify-center hover:bg-rose-100 transition"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={pointsWrong}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          onChangePointsWrong(Math.max(0, Math.min(50, val)));
                        }}
                        className="flex-1 py-1 px-2 text-center font-black bg-white border-2 border-rose-400 rounded-lg text-rose-950 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          playSound('click');
                          onChangePointsWrong(Math.min(50, pointsWrong + 1));
                        }}
                        className="w-8 h-8 rounded-lg bg-white border border-rose-300 text-rose-800 font-black flex items-center justify-center hover:bg-rose-100 transition"
                      >
                        +
                      </button>
                    </div>
                    {/* Quick Preset Pills */}
                    <div className="flex gap-1.5 pt-1">
                      {[0, 2, 5, 10].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            playSound('click');
                            onChangePointsWrong(p);
                          }}
                          className={`flex-1 py-0.5 rounded text-[10px] font-black transition ${
                            pointsWrong === p
                              ? 'bg-rose-600 text-white'
                              : 'bg-white text-rose-900 border border-rose-300 hover:bg-rose-100'
                          }`}
                        >
                          -{p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Simulation Card */}
                <div className="bg-slate-100 rounded-xl p-3 text-[11px] text-slate-700 flex items-center justify-between border border-slate-200">
                  <span className="font-extrabold text-slate-900">💡 Simulasi Permainan:</span>
                  <span>
                    Untuk menang {targetScore} poin: butuh{' '}
                    <b className="text-emerald-700">{Math.ceil(targetScore / (pointsCorrect || 1))} soal benar</b> berturut-turut.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KELOLA BANK SOAL */}
          {activeTab === 'questions' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Form Tambah / Edit Soal */}
              <form
                onSubmit={handleSubmitQuestion}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  editingId !== null
                    ? 'bg-amber-50/70 border-amber-400 shadow-sm'
                    : 'bg-white border-teal-500 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-md font-black text-[10px] uppercase tracking-wider ${
                        editingId !== null ? 'bg-amber-200 text-amber-900' : 'bg-teal-100 text-teal-800'
                      }`}
                    >
                      {editingId !== null ? 'Mode Edit Soal' : 'Formulir Soal Baru'}
                    </span>
                    <span className="text-xs font-bold text-slate-600">
                      {editingId !== null ? 'Ubah kalimat soal atau kunci jawaban' : 'Isi pertanyaan dan 2 pilihan jawaban'}
                    </span>
                  </div>
                  {editingId !== null && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Batal Edit
                    </button>
                  )}
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pertanyaan / Soal <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Contoh: Monumen Nasional (Monas) terletak di kota..."
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-teal-600 transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-300">
                    <label className="block text-xs font-black text-emerald-900 mb-1 flex items-center gap-1">
                      <span>✅</span> Pilihan Jawaban BENAR <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={correctOpt}
                      onChange={(e) => setCorrectOpt(e.target.value)}
                      placeholder="Jawaban yang tepat"
                      className="w-full bg-white border-2 border-emerald-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 transition"
                    />
                  </div>

                  <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-300">
                    <label className="block text-xs font-black text-rose-900 mb-1 flex items-center gap-1">
                      <span>❌</span> Pilihan Jawaban SALAH (Pengecoh) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={wrongOpt}
                      onChange={(e) => setWrongOpt(e.target.value)}
                      placeholder="Pilihan salah"
                      className="w-full bg-white border-2 border-rose-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-rose-500 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full py-2.5 rounded-xl text-xs font-black tracking-wide text-white flex items-center justify-center gap-2 transition active:translate-y-0.5 ${
                    editingId !== null
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-[0_4px_0_#b45309]'
                      : 'bg-teal-600 hover:bg-teal-700 shadow-[0_4px_0_#0f766e]'
                  }`}
                >
                  {editingId !== null ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{editingId !== null ? 'Perbarui Soal Ini' : 'Simpan Soal ke Database'}</span>
                </button>
              </form>

              {/* Action Bar: Search, Excel Import/Export, and Reset */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari kalimat soal..."
                    className="w-full pl-8 pr-3 py-2 text-xs bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 font-semibold"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {/* Ekspor Excel */}
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    title="Ekspor ke file Microsoft Excel (.xlsx)"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition active:translate-y-0.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Ekspor Excel</span>
                  </button>

                  {/* Impor Excel */}
                  <label
                    title="Impor dari file Microsoft Excel (.xlsx, .xls)"
                    className="bg-white border-2 border-emerald-600 hover:bg-emerald-50 text-emerald-800 px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition cursor-pointer active:translate-y-0.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Impor Excel</span>
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleImportExcel}
                      className="hidden"
                    />
                  </label>

                  {/* Reset to 5 Default */}
                  <button
                    type="button"
                    onClick={handleResetDefaults}
                    className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition active:translate-y-0.5 ${
                      confirmReset
                        ? 'bg-rose-600 text-white animate-pulse border-2 border-rose-700'
                        : 'bg-white border-2 border-slate-200 hover:bg-amber-50 hover:border-amber-300 text-slate-700'
                    }`}
                  >
                    {confirmReset ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-200" />
                        <span>Klik Lagi: Reset 5 Soal</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                        <span>Reset 5 Soal Default</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Info Format Excel */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-2.5 px-3.5 text-[11px] text-emerald-900 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold">💡 Format Tabel Excel:</span>
                  <span>Kolom A: <b>Pertanyaan</b> | Kolom B: <b>Jawaban Benar</b> | Kolom C: <b>Jawaban Salah</b></span>
                </div>
                <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full font-bold">.xlsx / .xls</span>
              </div>

              {/* Daftar Soal */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
                  <span>DAFTAR SOAL AKTIF ({filteredQuestions.length} dari {questions.length})</span>
                </div>

                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {filteredQuestions.length === 0 ? (
                    <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500 font-semibold">
                      Tidak ada soal yang cocok dengan pencarian.
                    </div>
                  ) : (
                    filteredQuestions.map((q, idx) => {
                      const isCurrent = editingId === q.id;
                      const correctText = q.options.find(o => o.isCorrect)?.text;
                      const wrongText = q.options.find(o => !o.isCorrect)?.text;

                      return (
                        <div
                          key={q.id}
                          className={`bg-white border-2 ${
                            isCurrent ? 'border-amber-400 bg-amber-50/50' : 'border-slate-200 hover:border-slate-300'
                          } rounded-2xl p-3 flex items-center justify-between gap-3 shadow-sm transition`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black flex items-center justify-center shrink-0 border border-slate-200">
                                {idx + 1}
                              </span>
                              <div className="text-xs font-bold text-slate-800 truncate">{q.q}</div>
                            </div>

                            <div className="flex gap-2 text-[11px] font-bold pl-7 flex-wrap">
                              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg truncate">
                                ✅ {correctText}
                              </span>
                              <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg truncate">
                                ❌ {wrongText}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleStartEdit(q)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold transition border border-slate-200 flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3 text-slate-600" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-extrabold transition border border-rose-200"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-3 px-6 bg-slate-100 border-t-2 border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            Aturan: <b className="text-slate-800">Target {targetScore}</b> (Benar +{pointsCorrect} / Salah -{pointsWrong})
          </div>
          <button
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition shadow-sm"
          >
            Selesai & Simpan
          </button>
        </div>

      </div>
    </div>
  );
};
