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
    <div className="flex flex-col h-screen w-screen bg-[#070a12] text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] overflow-hidden select-none">
      {/* Top Warning Banner if DB is unreachable */}
      {dbStatus === 'error' && (
        <div className="bg-red-600/90 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-lg z-50 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <AlertCircle className="w-4 h-4 shrink-0 animate-bounce" />
            <span>
              ⚠ Cannot reach CognoDB graph database. Make sure your CognoDB credentials in <code className="bg-red-950/60 px-1.5 py-0.5 rounded font-mono text-[11px]">backend/.env</code> are valid and backend is running.
            </span>
          </div>
          <button
            onClick={() => checkHealth()}
            className="px-2 py-0.5 bg-red-800 hover:bg-red-700 rounded text-[11px] font-mono transition-colors shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Navigation Header */}
      <header className="h-16 shrink-0 px-6 bg-[#0c101c] border-b border-slate-800/90 flex items-center justify-between z-40">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <span className="text-lg">🔗</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">StackGraph</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/40">
                CognoDB
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden sm:block">Tech Dependency Explorer</p>
          </div>
        </div>

        {/* Center Nav Tabs */}
        <nav className="flex items-center p-1 bg-slate-900/90 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('explorer')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'explorer'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Explorer</span>
          </button>

          <button
            onClick={() => setActiveTab('circular')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'circular'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Circular Deps</span>
          </button>
        </nav>

        {/* Right DB Connectivity Status Badge */}
        <div className="flex items-center gap-3">
          <div
            title={dbErrorMessage || (dbStatus === 'connected' ? 'CognoDB Bolt Connected' : 'Checking connection...')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${
              dbStatus === 'connected'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                : dbStatus === 'error'
                ? 'bg-red-950/40 text-red-300 border-red-800/50'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                dbStatus === 'connected'
                  ? 'bg-emerald-400 animate-pulse'
                  : dbStatus === 'error'
                  ? 'bg-red-400'
                  : 'bg-amber-400 animate-ping'
              }`}
            />
            <span className="hidden sm:inline font-semibold">
              {dbStatus === 'connected' ? 'CognoDB Live' : dbStatus === 'error' ? 'DB Offline' : 'Connecting...'}
            </span>
          </div>
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
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-xl shadow-2xl border backdrop-blur-xl flex items-start justify-between gap-3 text-xs animate-in slide-in-from-right duration-200 ${
              toast.type === 'error'
                ? 'bg-red-950/90 text-red-100 border-red-700/60'
                : toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-100 border-emerald-700/60'
                : 'bg-slate-900/90 text-slate-100 border-slate-700'
            }`}
          >
            <div className="flex items-start gap-2">
              {toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-snug">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white transition-colors"
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
