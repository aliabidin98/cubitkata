import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Cubit Kata:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetAll = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch (e) {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="bg-white border-3 border-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full text-slate-800 shadow-[8px_8px_0px_#000] text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 border-2 border-amber-300 text-amber-700 flex items-center justify-center text-2xl mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-900 mb-1">
                Terjadi Kendala Memuat Aplikasi
              </h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Aplikasi mengalami kendala teknis ringan. Anda dapat memuat ulang halaman atau mereset data lokal browser.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-[0_4px_0_#0f766e] active:translate-y-1 active:shadow-none transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Muat Ulang Halaman</span>
              </button>

              <button
                onClick={this.handleResetAll}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border-2 border-slate-300 rounded-xl text-xs font-bold transition"
              >
                Reset Data & Cache Lokal
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
