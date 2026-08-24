import { useState, useEffect, useCallback } from 'react';
import { Explorer } from './pages/Explorer.js';
import { Circular } from './pages/Circular.js';
import { SearchBar } from './components/SearchBar.js';
import { api } from './api/client.js';
import {
  AlertCircle,
  X,
  CheckCircle,
  Zap,
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
  const [searchTriggeredPackage, setSearchTriggeredPackage] = useState<string | null>(null);

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

  const handleSearchSelect = (packageName: string) => {
    setSearchTriggeredPackage(packageName);
    setActiveTab('explorer');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0d0d0d] text-[#e5e5e5] font-mono overflow-hidden select-none">
      {/* Top Warning Banner if DB is unreachable */}
      {dbStatus === 'error' && (
        <div className="bg-rose-600/90 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-xl z-50">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <AlertCircle className="w-4 h-4 shrink-0 animate-bounce" />
            <span>
              ⚠ Cannot reach CognoDB database. Verify your credentials in <code className="bg-rose-950/80 px-1.5 py-0.5 rounded font-mono text-[11px]">backend/.env</code> and ensure the backend server is running.
            </span>
          </div>
          <button
            onClick={() => checkHealth()}
            className="px-2.5 py-1 bg-rose-900/90 hover:bg-rose-800 rounded text-[11px] font-mono transition-colors shrink-0"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* Main Navigation Header — Exact Reference Design     */}
      {/* ═══════════════════════════════════════════════════ */}
      <header className="h-16 shrink-0 px-6 bg-[#0a0a0a] border-b border-white/[0.08] flex items-center justify-between z-40">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-8 h-8 rounded-lg bg-[#00d4d4]/10 border border-[#00d4d4]/30 flex items-center justify-center shadow-[0_0_12px_rgba(0,212,212,0.2)]">
            <Zap className="w-4 h-4 text-[#00d4d4]" />
          </div>
          <div className="flex items-baseline gap-3">
            <span className="font-bold text-base tracking-tight text-white">stackscope</span>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#666] font-medium hidden sm:inline">
              DEPENDENCY EXPLORER
            </span>
          </div>
        </div>

        {/* Center: Tabs with accurate pill styling */}
        <nav className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('explorer')}
            className={`px-4 py-1.5 rounded-lg text-xs uppercase tracking-[0.15em] font-bold transition-all ${
              activeTab === 'explorer'
                ? 'bg-[#00d4d4]/15 border border-[#00d4d4] text-[#00d4d4] shadow-[0_0_15px_-3px_rgba(0,212,212,0.3)]'
                : 'text-[#888] hover:text-white border border-transparent'
            }`}
          >
            Explorer
          </button>

          <button
            onClick={() => setActiveTab('circular')}
            className={`px-4 py-1.5 rounded-lg text-xs uppercase tracking-[0.15em] font-bold transition-all ${
              activeTab === 'circular'
                ? 'bg-[#00d4d4]/15 border border-[#00d4d4] text-[#00d4d4] shadow-[0_0_15px_-3px_rgba(0,212,212,0.3)]'
                : 'text-[#888] hover:text-white border border-transparent'
            }`}
          >
            Graph
          </button>
        </nav>

        {/* Right: Embedded SearchBar + GitHub + Theme + Status */}
        <div className="flex items-center gap-3.5">
          {/* Top Search with Autocomplete Dropdown */}
          <SearchBar
            onSelectPackage={handleSearchSelect}
            onError={(msg) => addToast(msg, 'error')}
            variant="navbar"
          />

          {/* Database connection indicator */}
          <button
            onClick={() => checkHealth()}
            title={dbErrorMessage || (dbStatus === 'connected' ? 'CognoDB Live' : 'Checking connection...')}
            className="flex items-center gap-1.5 px-2 py-1 bg-[#141414] border border-white/[0.08] rounded-md text-[10px] font-mono text-[#888]"
          >
            <div
              className={`w-2 h-2 rounded-full ${
                dbStatus === 'connected'
                  ? 'bg-[#00d4d4] animate-pulse'
                  : dbStatus === 'error'
                  ? 'bg-rose-400'
                  : 'bg-amber-400 animate-ping'
              }`}
            />
            <span className="hidden lg:inline">{dbStatus === 'connected' ? 'Live' : 'Offline'}</span>
          </button>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {activeTab === 'explorer' ? (
          <Explorer
            onShowToast={addToast}
            externalPackage={searchTriggeredPackage}
            onConsumeExternal={() => setSearchTriggeredPackage(null)}
          />
        ) : (
          <Circular
            onShowToast={addToast}
            onNavigateToExplorer={(pkg) => {
              handleSearchSelect(pkg);
            }}
          />
        )}
      </main>

      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-2xl border flex items-start justify-between gap-3 text-xs animate-fade-in ${
              toast.type === 'error'
                ? 'bg-rose-950/90 text-rose-100 border-rose-700/60'
                : toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-100 border-emerald-700/60'
                : 'bg-[#1a1a1a] text-[#e5e5e5] border-white/[0.1]'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-snug font-bold">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#666] hover:text-white p-0.5 hover:bg-white/[0.08] rounded transition-colors"
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
