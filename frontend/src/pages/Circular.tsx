import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Repeat,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { api } from '../api/client.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';

interface CircularProps {
  onShowToast: (msg: string, type?: 'error' | 'success' | 'info') => void;
  onNavigateToExplorer?: (pkgName: string) => void;
}

export const Circular: React.FC<CircularProps> = ({ onShowToast, onNavigateToExplorer }) => {
  const [cycles, setCycles] = useState<string[][]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCycles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCircularDependencies();
      setCycles(data.cycles);
      setCount(data.count);
    } catch (err: any) {
      const msg = err?.message || 'Failed to detect circular dependencies';
      setError(msg);
      onShowToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCycles();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-[#070a12] p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500/20 to-rose-500/20 border border-amber-500/30 text-amber-400">
                <Repeat className="w-6 h-6" />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Circular Dependency Detector
              </h1>
            </div>
            <p className="mt-2 text-sm text-slate-400 max-w-2xl">
              Detects recursive dependency loops (<code className="text-amber-300 font-mono text-xs bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">(:Package)-[:DEPENDS_ON*2..]-&gt;(:Package)</code>) in real-time using CognoDB graph path traversal.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchCycles}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 rounded-xl text-xs font-semibold shadow-md transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
              <span>Re-scan Graph</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="py-20">
            <LoadingSpinner
              label="Scanning Entire Graph for Cycles..."
              sublabel="MATCH path = (p:Package)-[:DEPENDS_ON*2..]->(p) RETURN path"
            />
          </div>
        ) : error ? (
          <div className="p-8 bg-red-950/20 border border-red-500/30 rounded-2xl text-center space-y-4 max-w-lg mx-auto">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Detection Failed</h3>
            <p className="text-xs text-slate-400">{error}</p>
            <button
              onClick={fetchCycles}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold"
            >
              Retry Scan
            </button>
          </div>
        ) : cycles.length === 0 ? (
          /* Empty State - No Cycles (Healthy Graph) */
          <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl shadow-xl max-w-2xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">No Circular Dependencies Detected</h2>
              <p className="text-sm text-slate-400 max-w-md">
                The current npm dependency dataset forms a clean Directed Acyclic Graph (DAG) with zero circular loops.
              </p>
            </div>

            <div className="pt-4 flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-800/40">
              <ShieldCheck className="w-4 h-4" />
              <span>0 circular chains detected across all packages</span>
            </div>
          </div>
        ) : (
          /* Circular Cycles List */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <span>{count} circular {count === 1 ? 'chain' : 'chains'} detected</span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Sorted by cycle length
              </span>
            </div>

            <div className="grid gap-4">
              {cycles.map((cycle, idx) => (
                <div
                  key={idx}
                  className="p-5 bg-slate-900/70 border border-amber-500/30 hover:border-amber-500/60 rounded-2xl shadow-xl space-y-4 transition-all"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono font-semibold text-amber-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      Cycle #{idx + 1} ({cycle.length - 1} hops)
                    </span>
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-mono text-slate-300">
                      Infinite Loop Risk
                    </span>
                  </div>

                  {/* Horizontal Chain Visualization */}
                  <div className="flex items-center flex-wrap gap-2.5 py-2">
                    {cycle.map((pkgName, pIdx) => {
                      const isEnd = pIdx === cycle.length - 1;
                      return (
                        <React.Fragment key={pIdx}>
                          <button
                            onClick={() => onNavigateToExplorer && onNavigateToExplorer(pkgName)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 shadow-md ${
                              isEnd
                                ? 'bg-rose-950/80 text-rose-300 border border-rose-700/60 hover:bg-rose-900'
                                : 'bg-slate-800/90 text-white border border-slate-700 hover:border-indigo-500 hover:bg-slate-700'
                            }`}
                            title="Click to view in Explorer"
                          >
                            <span>{pkgName}</span>
                          </button>

                          {!isEnd && (
                            <div className="flex items-center text-amber-400/80 px-0.5">
                              <ArrowRight className="w-4 h-4 animate-pulse" />
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Informative Graph Architecture Card */}
        <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Info className="w-4 h-4 text-indigo-400" />
            <span>Why Graph Cycle Detection Outperforms SQL</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            In relational databases (SQL), detecting cyclic loops requires recursive Common Table Expressions (<code className="text-indigo-300 font-mono">WITH RECURSIVE</code>) with complex array tracking to avoid infinite loops and massive query degradation. In <strong className="text-white">CognoDB / Cypher</strong>, cycle detection is a native graph primitive:
          </p>
          <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto">
{`MATCH path = (p:Package)-[:DEPENDS_ON*2..]->(p)
RETURN [n IN nodes(path) | n.name] AS cycle
LIMIT 20`}
          </pre>
        </div>
      </div>
    </div>
  );
};
