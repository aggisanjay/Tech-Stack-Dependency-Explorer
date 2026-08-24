import React, { useState, useEffect, useMemo } from 'react';
import {
  Package as PackageIcon,
  Download,
  Shield,
  ArrowUpRight,
  GitBranch,
  X,
  Compass,
  AlertCircle,
  Loader2,
  Share2,
  Copy,
  Check,
  Search,
} from 'lucide-react';
import { PackageNode } from '../types/index.js';
import { api } from '../api/client.js';

interface PackageCardProps {
  pkg: PackageNode;
  depth: number;
  onDepthChange: (newDepth: number) => void;
  onExplore: (packageName: string) => void;
  onClose: () => void;
}

export const PackageCard: React.FC<PackageCardProps> = ({
  pkg,
  depth,
  onDepthChange,
  onExplore,
  onClose,
}) => {
  const [dependents, setDependents] = useState<PackageNode[]>([]);
  const [loadingDependents, setLoadingDependents] = useState(false);
  const [errorDependents, setErrorDependents] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dependentFilter, setDependentFilter] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchDependents = async () => {
      setLoadingDependents(true);
      setErrorDependents(null);
      try {
        const data = await api.getPackageDependents(pkg.name);
        if (isMounted) {
          setDependents(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorDependents(err.message || 'Failed to load reverse dependents');
        }
      } finally {
        if (isMounted) {
          setLoadingDependents(false);
        }
      }
    };

    fetchDependents();
    return () => {
      isMounted = false;
    };
  }, [pkg.name]);

  const handleCopyInstall = () => {
    navigator.clipboard.writeText(`npm i ${pkg.name}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredDependents = useMemo(() => {
    if (!dependentFilter.trim()) return dependents;
    return dependents.filter((d) =>
      d.name.toLowerCase().includes(dependentFilter.toLowerCase().trim())
    );
  }, [dependents, dependentFilter]);

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const getDownloadTier = (num: number) => {
    if (num >= 35000000) return { label: 'Top 0.1% Package', color: 'text-rose-400 bg-rose-950/60 border-rose-800/40' };
    if (num >= 20000000) return { label: 'High Velocity', color: 'text-amber-400 bg-amber-950/60 border-amber-800/40' };
    if (num >= 5000000) return { label: 'Mainstream', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40' };
    return { label: 'Standard Ecosystem', color: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/40' };
  };

  const tier = getDownloadTier(pkg.weeklyDownloads);

  return (
    <div className="w-full h-full flex flex-col bg-[#0b0f1c]/95 border-l border-white/[0.08] backdrop-blur-2xl shadow-2xl overflow-y-auto text-slate-200 divide-y divide-white/[0.06]">
      {/* Header Section */}
      <div className="p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl transition-colors"
          title="Close inspector"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5 mb-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-500 text-white shadow-glow-sm">
            <PackageIcon className="w-6 h-6" />
          </div>
          <div className="min-w-0 pr-8">
            <h2 className="text-xl font-extrabold text-white tracking-tight truncate">
              {pkg.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs font-semibold text-brand-300 bg-brand-950/70 px-2 py-0.5 rounded-md border border-brand-800/50">
                v{pkg.version}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${tier.color}`}>
                {tier.label}
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          {pkg.description || 'No description provided for this package.'}
        </p>

        {/* Copy Install Command Snippet */}
        <div className="flex items-center justify-between p-2.5 bg-slate-950/80 border border-white/[0.06] rounded-xl text-xs font-mono mb-4 group">
          <span className="text-slate-400 select-all truncate">
            npm i <strong className="text-white">{pkg.name}</strong>
          </span>
          <button
            onClick={handleCopyInstall}
            className="flex items-center gap-1 px-2 py-1 bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white rounded-lg transition-colors shrink-0 ml-2"
            title="Copy install command"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-[10px]">Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Action Button: Center and Explore */}
        <button
          onClick={() => onExplore(pkg.name)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-600/30 transition-all hover:scale-[1.01]"
        >
          <Compass className="w-4 h-4" />
          <span>Center & Explore Graph</span>
        </button>
      </div>

      {/* Traversal Depth Filter Section */}
      <div className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-brand-400" />
            <span>Traversal Depth</span>
          </label>
          <span className="text-xs text-brand-300 font-mono font-semibold">
            {depth} {depth === 1 ? 'hop' : 'hops'} deep
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-1.5 rounded-xl border border-white/[0.06]">
          {[1, 2, 3].map((level) => (
            <button
              key={level}
              onClick={() => onDepthChange(level)}
              className={`py-2 px-3 rounded-lg text-xs font-semibold font-mono transition-all flex items-center justify-center gap-1 ${
                depth === level
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <span>{level} Hop{level > 1 ? 's' : ''}</span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-400">
          Traverses up to <strong className="text-slate-300">{depth} levels</strong> of multi-hop package dependencies in CognoDB.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="p-6 grid grid-cols-2 gap-3">
        <div className="bg-slate-950/50 border border-white/[0.06] p-3.5 rounded-2xl">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Downloads</span>
          </div>
          <div className="text-sm font-bold text-white font-mono">
            {formatNumber(pkg.weeklyDownloads)}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">weekly count</span>
        </div>

        <div className="bg-slate-950/50 border border-white/[0.06] p-3.5 rounded-2xl">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>License</span>
          </div>
          <div className="text-sm font-bold text-white font-mono uppercase">
            {pkg.license}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">verified spdx</span>
        </div>
      </div>

      {/* Reverse Dependents (What depends on me?) */}
      <div className="p-6 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Direct Dependents
            </h3>
          </div>
          <span className="text-xs font-mono font-bold bg-rose-950/60 text-rose-300 px-2 py-0.5 rounded-full border border-rose-800/40">
            {dependents.length}
          </span>
        </div>

        <p className="text-[11px] text-slate-400 mb-3">
          Packages in dataset that depend on <span className="text-slate-200 font-medium">{pkg.name}</span> (Reverse Cypher lookup):
        </p>

        {/* Quick filter if multiple dependents */}
        {dependents.length > 4 && (
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={dependentFilter}
              onChange={(e) => setDependentFilter(e.target.value)}
              placeholder="Filter dependents..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950/60 border border-white/[0.06] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-1">
          {loadingDependents ? (
            <div className="flex items-center justify-center py-10 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-brand-400 mr-2" />
              Loading reverse dependents...
            </div>
          ) : errorDependents ? (
            <div className="p-3.5 bg-red-950/40 border border-red-800/50 rounded-xl text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{errorDependents}</span>
            </div>
          ) : dependents.length === 0 ? (
            <div className="p-6 bg-slate-950/40 border border-white/[0.05] rounded-2xl text-center text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">No Upstream Dependents</p>
              <p className="text-[11px]">No other packages in this dataset depend on this module.</p>
            </div>
          ) : filteredDependents.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No dependents matching &quot;{dependentFilter}&quot;
            </div>
          ) : (
            <ul className="space-y-2">
              {filteredDependents.map((dep) => (
                <li
                  key={dep.id || dep.name}
                  onClick={() => onExplore(dep.name)}
                  className="group p-3 bg-slate-950/60 hover:bg-brand-950/40 border border-white/[0.06] hover:border-brand-500/40 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white group-hover:text-brand-300 transition-colors">
                        {dep.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">v{dep.version}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      📥 {formatNumber(dep.weeklyDownloads)} /wk
                    </span>
                  </div>

                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-400 transition-transform transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
