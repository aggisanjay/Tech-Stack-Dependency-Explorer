import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Repeat,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  Terminal,
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
    <div className="flex-1 overflow-y-auto bg-[#080b13] p-6 md:p-10 bg-radial-gradient">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-rose-500/20 border border-amber-500/30 text-amber-400 shadow-glow-sm">
                <Repeat className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  Circular Dependency Detector
                </h1>
                <span className="text-xs text-slate-400 font-mono">
                  Autonomous Cycle Loop Detection via Bolt Graph Traversal
                </span>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-400 max-w-2xl leading-relaxed">
              Detects recursive dependency chains (<code className="text-amber-300 font-mono text-xs bg-slate-950 px-1.5 py-0.5 rounded border border-white/[0.08]">(:Package)-[:DEPENDS_ON*2..]-&gt;(:Package)</code>) to prevent module bundling deadlocks, infinite loops, and undefined exports at runtime.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchCycles}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-white/[0.1] rounded-xl text-xs font-semibold shadow-md transition-all disabled:opacity-50 hover:scale-[1.02]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-400' : ''}`} />
              <span>Re-scan Graph</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="py-24">
            <LoadingSpinner
              label="Scanning Entire Graph Topology for Loops..."
              sublabel="MATCH path = (p:Package)-[:DEPENDS_ON*2..]->(p) RETURN [n IN nodes(path) | n.name] AS cycle"
            />
          </div>
        ) : error ? (
          <div className="p-8 bg-red-950/20 border border-red-500/30 rounded-3xl text-center space-y-4 max-w-lg mx-auto backdrop-blur-xl">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Detection Query Failed</h3>
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
          <div className="flex flex-col items-center justify-center p-12 text-center bg-[#0d1222]/80 border border-white/[0.08] rounded-3xl shadow-2xl max-w-2xl mx-auto space-y-5 backdrop-blur-xl">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/15">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-white">No Circular Dependencies Detected</h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                The current npm package dependency dataset forms a strict <strong>Directed Acyclic Graph (DAG)</strong> with zero circular loops.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 px-4 py-2 rounded-xl border border-emerald-800/40 shadow-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>0 circular dependency loops found across all nodes</span>
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
                Ranked by cycle depth
              </span>
            </div>

            <div className="grid gap-4">
              {cycles.map((cycle, idx) => (
                <div
                  key={idx}
                  className="p-6 bg-[#0e1324]/90 border border-amber-500/30 hover:border-amber-500/60 rounded-2xl shadow-xl space-y-4 transition-all backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono font-bold text-amber-400 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Cycle #{idx + 1} ({cycle.length - 1} hops)
                    </span>
                    <span className="bg-amber-950/60 text-amber-300 border border-amber-800/40 px-2.5 py-0.5 rounded-full text-[11px] font-mono">
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
                            className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 shadow-md ${
                              isEnd
                                ? 'bg-rose-950/90 text-rose-300 border border-rose-700/60 hover:bg-rose-900'
                                : 'bg-slate-800/90 text-white border border-white/[0.08] hover:border-brand-500 hover:bg-slate-700'
                            }`}
                            title="Click to view in Dependency Explorer"
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

        {/* Technical Architecture Comparison Card */}
        <div className="p-6 bg-[#0c101e]/80 border border-white/[0.08] rounded-3xl space-y-3 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Info className="w-4 h-4 text-brand-400" />
              <span>Why Graph Cycle Detection Beats Relational SQL</span>
            </div>
            <span className="text-[11px] font-mono text-brand-300 bg-brand-950/60 px-2 py-0.5 rounded border border-brand-800/40">
              Cypher vs SQL
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            In SQL databases, finding arbitrary-depth circular loops requires complex recursive Common Table Expressions (<code className="text-brand-300 font-mono">WITH RECURSIVE</code>) with dynamic array accumulation to avoid infinite loops. In <strong className="text-white">CognoDB / Neo4j</strong>, graph path matching is an index-free native operation:
          </p>
          <div className="p-4 bg-slate-950 rounded-2xl border border-white/[0.06] font-mono text-xs text-cyan-300 overflow-x-auto shadow-inner">
            <div className="flex items-center gap-2 text-slate-500 mb-2 pb-1 border-b border-white/[0.06] text-[10px]">
              <Terminal className="w-3.5 h-3.5" />
              <span>Cypher Query Execution</span>
            </div>
{`MATCH path = (p:Package)-[:DEPENDS_ON*2..]->(p)
RETURN [n IN nodes(path) | n.name] AS cycle
LIMIT 20`}
          </div>
        </div>
      </div>
    </div>
  );
};
