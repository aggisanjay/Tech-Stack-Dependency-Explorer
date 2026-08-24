import { useState, useEffect, useCallback } from 'react';
import { Explorer } from './pages/Explorer.js';
import { Circular } from './pages/Circular.js';
import { api } from './api/client.js';
import {
  Compass,
  Repeat,
  AlertCircle,
  X,
  CheckCircle,
  GitBranch,
} from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
}

export function App() {
  const [activeTab, setActiveTab] = useState<'explorer' | 'circular'>('explorer');
  const [dbStatus, setDbStatus] = useState<'connected' | 'error' | 'checking'>('checking');
  const [dbErrorMessage, setDbErrorMessage] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Health check loop
  const checkHealth = useCallback(async () => {
    try {
      const res = await api.checkHealth();
      if (res.status === 'ok') {
        setDbStatus('connected');
        setDbErrorMessage(null);
      } else {
        setDbStatus('error');
        setDbErrorMessage(res.message || 'Database unavailable');
      }
    } catch (err: any) {
      setDbStatus('error');
      setDbErrorMessage(err.message || 'Cannot reach backend server / database');
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const addToast = (message: string, type: 'error' | 'success' | 'info' = 'error') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#080b13] text-slate-100 font-sans overflow-hidden select-none">
      {/* Top Warning Banner if DB is unreachable */}
      {dbStatus === 'error' && (
        <div className="bg-rose-600/90 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-xl z-50 animate-in slide-in-from-top duration-200 backdrop-blur-md">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <AlertCircle className="w-4 h-4 shrink-0 animate-bounce" />
            <span>
              ⚠ Cannot reach CognoDB database. Verify your credentials in <code className="bg-rose-950/80 px-1.5 py-0.5 rounded font-mono text-[11px] border border-rose-800/60">backend/.env</code> and ensure the backend server is running.
            </span>
          </div>
          <button
            onClick={() => checkHealth()}
            className="px-2.5 py-1 bg-rose-900/90 hover:bg-rose-800 rounded-lg text-[11px] font-mono transition-colors shrink-0 border border-rose-700/60"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Main Navigation Header */}
      <header className="h-16 shrink-0 px-6 bg-[#0c101d]/90 border-b border-white/[0.08] backdrop-blur-xl flex items-center justify-between z-40">
        {/* Brand Logo */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-cyan-400 flex items-center justify-center shadow-glow-sm">
            <GitBranch className="w-5 h-5 text-white transform -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">StackGraph</span>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-950 text-brand-300 border border-brand-800/40">
                CognoDB
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden sm:block">Tech Stack Dependency Explorer</p>
          </div>
        </div>

        {/* Center Nav Tabs */}
        <nav className="flex items-center p-1 bg-slate-950/80 rounded-2xl border border-white/[0.08] shadow-inner">
          <button
            onClick={() => setActiveTab('explorer')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'explorer'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Explorer</span>
          </button>

          <button
            onClick={() => setActiveTab('circular')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'circular'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Circular Deps</span>
          </button>
        </nav>

        {/* Right DB Connectivity Status Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => checkHealth()}
            title={dbErrorMessage || (dbStatus === 'connected' ? 'CognoDB Bolt Connected - Click to re-verify' : 'Checking connection...')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono border transition-all hover:scale-[1.02] active:scale-[0.98] ${
              dbStatus === 'connected'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50 shadow-sm'
                : dbStatus === 'error'
                ? 'bg-rose-950/40 text-rose-300 border-rose-800/50'
                : 'bg-slate-950 text-slate-400 border-white/[0.08]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                dbStatus === 'connected'
                  ? 'bg-emerald-400 animate-pulse'
                  : dbStatus === 'error'
                  ? 'bg-rose-400'
                  : 'bg-amber-400 animate-ping'
              }`}
            />
            <span className="hidden sm:inline font-bold">
              {dbStatus === 'connected' ? 'CognoDB Live' : dbStatus === 'error' ? 'DB Offline' : 'Connecting...'}
            </span>
          </button>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {activeTab === 'explorer' ? (
          <Explorer onShowToast={addToast} />
        ) : (
          <Circular
            onShowToast={addToast}
            onNavigateToExplorer={(_pkg) => {
              setActiveTab('explorer');
            }}
          />
        )}
      </main>

      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border backdrop-blur-2xl flex items-start justify-between gap-3 text-xs animate-in slide-in-from-right duration-200 ${
              toast.type === 'error'
                ? 'bg-rose-950/90 text-rose-100 border-rose-700/60 shadow-rose-950/50'
                : toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-100 border-emerald-700/60 shadow-emerald-950/50'
                : 'bg-slate-900/90 text-slate-100 border-white/[0.1]'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-snug font-medium">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-0.5 hover:bg-white/[0.08] rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
