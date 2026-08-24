import React, { useState, useEffect } from 'react';
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
  Share2
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

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0f1422]/95 border-l border-slate-800/80 backdrop-blur-xl shadow-2xl overflow-y-auto text-slate-200 divide-y divide-slate-800/60">
      {/* Header Section */}
      <div className="p-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors"
          title="Close details"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/20">
            <PackageIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>{pkg.name}</span>
            </h2>
            <span className="inline-block font-mono text-xs text-indigo-400 font-semibold bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
              v{pkg.version}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {pkg.description || 'No description provided for this package.'}
        </p>

        {/* Action Button */}
        <div className="mt-4">
          <button
            onClick={() => onExplore(pkg.name)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01]"
          >
            <Compass className="w-4 h-4" />
            <span>Center & Explore This Package</span>
          </button>
        </div>
      </div>

      {/* Traversal Depth Filter Section */}
      <div className="p-5 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
            <span>Traversal Depth</span>
          </label>
          <span className="text-xs text-indigo-300 font-mono font-semibold">
            {depth} {depth === 1 ? 'hop' : 'hops'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
          {[1, 2, 3].map((level) => (
            <button
              key={level}
              onClick={() => onDepthChange(level)}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold font-mono transition-all flex items-center justify-center gap-1 ${
                depth === level
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{level} Hop{level > 1 ? 's' : ''}</span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-400">
          Traverses up to <span className="font-semibold text-slate-300">{depth} levels</span> of nested dependencies in CognoDB.
        </p>
      </div>

      {/* Metadata Metrics */}
      <div className="p-5 grid grid-cols-2 gap-3">
        <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Downloads</span>
          </div>
          <div className="text-sm font-bold text-white font-mono">
            {formatNumber(pkg.weeklyDownloads)}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">per week</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl">
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
      <div className="p-5 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Direct Dependents
            </h3>
          </div>
          <span className="text-xs font-mono font-semibold bg-rose-950/60 text-rose-300 px-2 py-0.5 rounded-full border border-rose-800/40">
            {dependents.length}
          </span>
        </div>

        <p className="text-[11px] text-slate-400 mb-3">
          Packages that break or require this package if removed (Reverse Cypher lookup):
        </p>

        <div className="flex-1 overflow-y-auto pr-1">
          {loadingDependents ? (
            <div className="flex items-center justify-center py-8 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400 mr-2" />
              Loading reverse dependents...
            </div>
          ) : errorDependents ? (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorDependents}</span>
            </div>
          ) : dependents.length === 0 ? (
            <div className="p-4 bg-slate-900/40 border border-slate-800/60 rounded-xl text-center text-xs text-slate-400">
              No other packages in the dataset depend on <strong className="text-slate-300">{pkg.name}</strong>.
            </div>
          ) : (
            <ul className="space-y-2">
              {dependents.map((dep) => (
                <li
                  key={dep.id || dep.name}
                  onClick={() => onExplore(dep.name)}
                  className="group p-2.5 bg-slate-900/70 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-white group-hover:text-indigo-300 transition-colors">
                        {dep.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">v{dep.version}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      {formatNumber(dep.weeklyDownloads)} dl/wk
                    </span>
                  </div>

                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-transform transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
