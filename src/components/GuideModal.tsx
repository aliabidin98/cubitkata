import React from 'react';
import { X, Hand, MousePointer, Award, Lightbulb, CheckCircle2 } from 'lucide-react';
import { playSound } from '../utils/audio';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  pointsCorrect?: number;
  pointsWrong?: number;
}

export const GuideModal: React.FC<GuideModalProps> = ({
  isOpen,
  onClose,
  pointsCorrect = 10,
  pointsWrong = 5
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white border-3 border-slate-900 rounded-3xl w-full max-w-lg shadow-[8px_8px_0px_#0f172a] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 px-6 bg-slate-900 text-white border-b-2 border-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500 text-slate-900 flex items-center justify-center font-black text-base">
              👌
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Cara Bermain Cubit Kata</h3>
              <p className="text-xs text-slate-400 font-medium">Petunjuk Gestur & Aturan Permainan</p>
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

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 font-medium">
          {/* Section 1: Gestur Kamera */}
          <div className="bg-teal-50 border-2 border-teal-200 rounded-2xl p-4 space-y-2">
            <div className="font-black text-teal-950 text-xs sm:text-sm flex items-center gap-2">
              <Hand className="w-4 h-4 text-teal-700" />
              <span>1. Kontrol Deteksi Tangan (AR MediaPipe)</span>
            </div>
            <div className="text-teal-900 text-xs space-y-1.5 leading-relaxed">
              <p>
                • <b>Jepit Jari (👌):</b> Dekatkan ujung <b>ibu jari</b> dan <b>jari telunjuk</b> untuk mencubit/mengambil kartu jawaban.
              </p>
              <p>
                • <b>Geser & Lepas:</b> Tahan cubitan sambil menggerakkan tangan ke arah <b>Kotak Jawaban</b>, lalu buka jari untuk melepaskannya.
              </p>
              <p>
                • <b>Indikator Kursor:</b> Lingkaran kursor akan berubah menjadi hijau menyala saat cubitan terdeteksi dengan sukses.
              </p>
            </div>
          </div>

          {/* Section 2: Mouse / Layar Sentuh */}
          <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="font-black text-slate-800 text-xs sm:text-sm flex items-center gap-2">
              <MousePointer className="w-4 h-4 text-slate-600" />
              <span>2. Mode Mouse / Layar Sentuh (Touchscreen)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Jika kamera tidak aktif atau Anda ingin bermain lebih cepat: klik / sentuh kartu pilihan jawaban, tahan dan seret (drag & drop) langsung ke dalam kotak jawaban di atas.
            </p>
          </div>

          {/* Section 3: Aturan Skor & Mode Permainan */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 space-y-2">
            <div className="font-black text-amber-950 text-xs sm:text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-700" />
              <span>3. Sistem Poin & Mode Permainan</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-300">
                <span className="font-black text-emerald-700 block mb-0.5">✅ Benar: +{pointsCorrect} Poin</span>
                <span className="text-slate-600 text-[11px]">Jawaban tepat mempercepat kemenangan</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-300">
                <span className="font-black text-rose-700 block mb-0.5">❌ Salah: -{pointsWrong} Poin</span>
                <span className="text-slate-600 text-[11px]">Hati-hati dengan pilihan pengecoh</span>
              </div>
            </div>
            <p className="text-xs text-amber-900 font-semibold pt-1">
              • <b>Mode Solo:</b> Kumpulkan poin mandiri hingga mencapai target kemenangan.
              <br />
              • <b>Mode Battle 2P:</b> Layar terbagi dua! Pemain 1 di kiri & Pemain 2 di kanan berlomba menjawab lebih cepat.
            </p>
          </div>

          {/* Section 4: Tips Kamera */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-3.5 flex items-start gap-2.5">
            <Lightbulb className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 leading-relaxed">
              <b>Tips Pencahayaan:</b> Pastikan ruangan cukup terang dan posisikan tangan sekitar 40–80 cm dari kamera agar deteksi jari akurat dan mulus.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t-2 border-slate-200 shrink-0">
          <button
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-black shadow-[0_4px_0_#0f766e] active:translate-y-1 active:shadow-none transition flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Saya Mengerti, Ayo Main!</span>
          </button>
        </div>
      </div>
    </div>
  );
};
