import React, { useState, useEffect, useMemo } from 'react';
import {
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
  Repeat,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { PackageNode } from '../types/index.js';
import { api } from '../api/client.js';
import { ToolIcon } from './ToolIcon.js';

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
  const [packageCycles, setPackageCycles] = useState<string[][]>([]);
  const [copied, setCopied] = useState(false);
  const [dependentFilter, setDependentFilter] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchDependents = async () => {
      setLoadingDependents(true);
      setErrorDependents(null);
      try {
        const [depData, cycleData] = await Promise.all([
          api.getPackageDependents(pkg.name),
          api.getCircularDependencies().catch(() => ({ count: 0, cycles: [] })),
        ]);
        if (isMounted) {
          setDependents(depData);
          // Filter cycles that contain this package
          const matching = (cycleData.cycles || []).filter((c: string[]) => c.includes(pkg.name));
          setPackageCycles(matching);
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
    if (num >= 35000000) return { label: 'Top 0.1%', color: 'text-rose-400 bg-rose-950/60 border-rose-800/40' };
    if (num >= 20000000) return { label: 'High Velocity', color: 'text-amber-400 bg-amber-950/60 border-amber-800/40' };
    if (num >= 5000000) return { label: 'Mainstream', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40' };
    return { label: 'Standard', color: 'text-[#00d4d4] bg-[#00d4d4]/10 border-[#00d4d4]/30' };
  };

  const tier = getDownloadTier(pkg.weeklyDownloads);

  return (
    <div className="w-full h-full flex flex-col bg-[#111] border-l border-white/[0.07] shadow-2xl overflow-y-auto text-[#e5e5e5] divide-y divide-white/[0.06]">
      {/* Header Section */}
      <div className="p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-[#666] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg transition-colors"
          title="Close inspector"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5 mb-3.5">
          <ToolIcon name={pkg.name} size="lg" />
          <div className="min-w-0 pr-8">
            <h2 className="text-xl font-bold text-white tracking-tight truncate">
              {pkg.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs font-bold text-[#00d4d4] bg-[#00d4d4]/10 px-2 py-0.5 rounded border border-[#00d4d4]/30">
                v{pkg.version}
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${tier.color}`}>
                {tier.label}
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-[#888] leading-relaxed mb-4">
          {pkg.description || 'No description provided for this package.'}
        </p>

        {/* Copy Install Command */}
        <div className="flex items-center justify-between p-2.5 bg-[#0d0d0d] border border-white/[0.06] rounded-lg text-xs font-mono mb-4">
          <span className="text-[#666] select-all truncate">
            npm i <strong className="text-white">{pkg.name}</strong>
          </span>
          <button
            onClick={handleCopyInstall}
            className="flex items-center gap-1 px-2 py-1 bg-white/[0.05] hover:bg-white/[0.1] text-[#888] hover:text-white rounded transition-colors shrink-0 ml-2"
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

        {/* Explore Button */}
        <button
          onClick={() => onExplore(pkg.name)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#00d4d4] hover:bg-[#00b3b3] text-black text-xs font-bold rounded-lg shadow-lg shadow-[#00d4d4]/20 transition-all"
        >
          <Compass className="w-4 h-4" />
          <span>Center & Explore Graph</span>
        </button>
      </div>

      {/* Traversal Depth */}
      <div className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#888] flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-[#00d4d4]" />
            <span>Traversal Depth</span>
          </label>
          <span className="text-xs text-[#00d4d4] font-mono font-bold">
            {depth} {depth === 1 ? 'hop' : 'hops'} deep
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 bg-[#0d0d0d] p-1.5 rounded-lg border border-white/[0.06]">
          {[1, 2, 3].map((level) => (
            <button
              key={level}
              onClick={() => onDepthChange(level)}
              className={`py-2 px-3 rounded text-xs font-bold font-mono transition-all flex items-center justify-center gap-1 ${
                depth === level
                  ? 'bg-[#00d4d4] text-black'
                  : 'text-[#666] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <span>{level} Hop{level > 1 ? 's' : ''}</span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-[#666]">
          Traverses up to <strong className="text-[#888]">{depth} levels</strong> of multi-hop package dependencies in CognoDB.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="p-6 grid grid-cols-2 gap-3">
        <div className="bg-[#0d0d0d] border border-white/[0.06] p-3.5 rounded-lg">
          <div className="flex items-center gap-1.5 text-[#666] text-xs mb-1">
            <Download className="w-3.5 h-3.5 text-[#00d4d4]" />
            <span>Downloads</span>
          </div>
          <div className="text-sm font-bold text-white font-mono">
            {formatNumber(pkg.weeklyDownloads)}
          </div>
          <span className="text-[10px] text-[#666] font-mono">weekly count</span>
        </div>

        <div className="bg-[#0d0d0d] border border-white/[0.06] p-3.5 rounded-lg">
          <div className="flex items-center gap-1.5 text-[#666] text-xs mb-1">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>License</span>
          </div>
          <div className="text-sm font-bold text-white font-mono uppercase">
            {pkg.license}
          </div>
          <span className="text-[10px] text-[#666] font-mono">verified spdx</span>
        </div>
      </div>

      {/* Circular Dependency Analysis for this Specific Tool */}
      <div className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#888] flex items-center gap-1.5">
            <Repeat className="w-3.5 h-3.5 text-amber-400" />
            <span>Cycle Detection Analysis</span>
          </label>
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
            packageCycles.length > 0
              ? 'bg-amber-950/60 text-amber-300 border-amber-800/40'
              : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40'
          }`}>
            {packageCycles.length > 0 ? `${packageCycles.length} Cycles Detected` : 'Clean DAG'}
          </span>
        </div>

        {packageCycles.length > 0 ? (
          <div className="space-y-2">
            <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Tool is part of circular dependency loop:</span>
              </div>
              {packageCycles.map((cycle, cIdx) => (
                <div key={cIdx} className="text-[11px] font-mono text-white bg-[#0d0d0d] p-2 rounded border border-white/[0.06] flex items-center flex-wrap gap-1">
                  {cycle.map((nodeName, nIdx) => (
                    <React.Fragment key={nIdx}>
                      <span className={nodeName === pkg.name ? 'text-[#00d4d4] font-bold' : 'text-[#888]'}>
                        {nodeName}
                      </span>
                      {nIdx < cycle.length - 1 && <span className="text-amber-400">➔</span>}
                    </React.Fragment>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-[#0d0d0d] border border-white/[0.06] rounded-xl flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>No circular dependencies found for {pkg.name}</span>
          </div>
        )}
      </div>

      {/* Reverse Dependents */}
      <div className="p-6 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-rose-400" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#888]">
              Direct Dependents
            </h3>
          </div>
          <span className="text-xs font-mono font-bold bg-rose-950/60 text-rose-300 px-2 py-0.5 rounded-full border border-rose-800/40">
            {dependents.length}
          </span>
        </div>

        <p className="text-[11px] text-[#666] mb-3">
          Packages in dataset that depend on <span className="text-[#ccc] font-bold">{pkg.name}</span> (Reverse Cypher lookup):
        </p>

        {/* Filter */}
        {dependents.length > 4 && (
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#666]" />
            <input
              type="text"
              value={dependentFilter}
              onChange={(e) => setDependentFilter(e.target.value)}
              placeholder="Filter dependents..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#0d0d0d] border border-white/[0.06] rounded-lg text-xs text-white placeholder-[#666] focus:outline-none focus:border-[#00d4d4]/50 font-mono"
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-1">
          {loadingDependents ? (
            <div className="flex items-center justify-center py-10 text-xs text-[#666]">
              <Loader2 className="w-4 h-4 animate-spin text-[#00d4d4] mr-2" />
              Loading reverse dependents...
            </div>
          ) : errorDependents ? (
            <div className="p-3.5 bg-red-950/40 border border-red-800/50 rounded-lg text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{errorDependents}</span>
            </div>
          ) : dependents.length === 0 ? (
            <div className="p-6 bg-[#0d0d0d] border border-white/[0.05] rounded-lg text-center text-xs text-[#666] space-y-1">
              <p className="font-bold text-[#888]">No Upstream Dependents</p>
              <p className="text-[11px]">No other packages in this dataset depend on this module.</p>
            </div>
          ) : filteredDependents.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#666]">
              No dependents matching "{dependentFilter}"
            </div>
          ) : (
            <ul className="space-y-2">
              {filteredDependents.map((dep) => (
                <li
                  key={dep.id || dep.name}
                  onClick={() => onExplore(dep.name)}
                  className="group p-3 bg-[#0d0d0d] hover:bg-[#00d4d4]/5 border border-white/[0.06] hover:border-[#00d4d4]/30 rounded-lg cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <ToolIcon name={dep.name} size="xs" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white group-hover:text-[#00d4d4] transition-colors">
                          {dep.name}
                        </span>
                        <span className="text-[10px] text-[#666] font-mono">v{dep.version}</span>
                      </div>
                      <span className="text-[10px] text-[#666] font-mono block mt-0.5">
                        📥 {formatNumber(dep.weeklyDownloads)} /wk
                      </span>
                    </div>
                  </div>

                  <ArrowUpRight className="w-3.5 h-3.5 text-[#333] group-hover:text-[#00d4d4] transition-transform transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
