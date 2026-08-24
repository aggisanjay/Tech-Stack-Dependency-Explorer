import React from 'react';
import { Network, Sparkles, Layers, ArrowUpRight, GitFork, Cpu, ShieldCheck, Zap } from 'lucide-react';

interface EmptyStateProps {
  onSelectPackage: (packageName: string) => void;
}

const FEATURED_PACKAGES = [
  { name: 'next', desc: 'React Framework for Production', deps: '6 direct deps', category: 'Framework', icon: '⚡' },
  { name: 'vite', desc: 'Next Generation Frontend Tooling', deps: '2 direct deps', category: 'Build Tool', icon: '🚀' },
  { name: 'express', desc: 'Fast, unopinionated Node.js framework', deps: '2 direct deps', category: 'Backend', icon: '🌐' },
  { name: 'webpack', desc: 'Static module bundler for JS apps', deps: '1 direct dep', category: 'Bundler', icon: '📦' },
  { name: 'react-query', desc: 'Asynchronous State Management', deps: '2 direct deps', category: 'Data Fetching', icon: '🔄' },
  { name: 'jest', desc: 'Delightful JavaScript Testing Framework', deps: '2 direct deps', category: 'Testing', icon: '🃏' },
];

export const EmptyState: React.FC<EmptyStateProps> = ({ onSelectPackage }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-4 py-8 text-center max-w-4xl mx-auto">
      {/* Visual glowing icon badge */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand-600/30 via-cyan-500/20 to-brand-400/10 border border-brand-500/40 flex items-center justify-center shadow-glow-md backdrop-blur-2xl">
          <Network className="w-10 h-10 text-brand-400 animate-pulse" />
        </div>
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-brand-500 to-cyan-400 rounded-full p-1.5 shadow-lg shadow-brand-500/50">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
      </div>

      {/* Main heading */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-3">
        <Zap className="w-3.5 h-3.5 text-brand-400" />
        <span>Graph-Powered Dependency Intelligence</span>
      </div>

      <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
        Explore npm Dependency Networks
      </h2>
      <p className="mt-3 text-sm md:text-base text-slate-400 max-w-2xl leading-relaxed">
        Search for any package or choose an entry point below to visualize its multi-hop dependency tree, downstream breaking impacts, and circular dependency loops via <strong className="text-white">CognoDB</strong>.
      </p>

      {/* Feature Pills */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-mono text-slate-300">
        <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center gap-1.5">
          <GitFork className="w-3.5 h-3.5 text-brand-400" /> Multi-Hop Traversal (1..3 Depth)
        </span>
        <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Reverse Dependents
        </span>
        <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> License & Download Analytics
        </span>
      </div>

      {/* Quick Launch Preset Cards */}
      <div className="mt-10 w-full">
        <div className="flex items-center justify-center gap-2 mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
          <Layers className="w-3.5 h-3.5 text-brand-400" />
          <span>Or select a popular library to inspect:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {FEATURED_PACKAGES.map((pkg) => (
            <button
              key={pkg.name}
              onClick={() => onSelectPackage(pkg.name)}
              className="group relative flex flex-col p-4 text-left bg-slate-900/60 hover:bg-slate-800/80 border border-white/[0.07] hover:border-brand-500/50 rounded-2xl transition-all duration-200 hover:shadow-xl hover:shadow-brand-500/10 hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <span className="text-base font-bold text-white group-hover:text-brand-300 transition-colors flex items-center gap-2">
                  <span>{pkg.icon}</span>
                  <span>{pkg.name}</span>
                </span>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-brand-400 transition-colors transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
              <p className="text-xs text-slate-400 line-clamp-1">{pkg.desc}</p>
              <div className="mt-3.5 flex items-center justify-between text-[11px] font-mono">
                <span className="bg-slate-950/80 px-2 py-0.5 rounded-md text-brand-300/90 border border-white/[0.05]">
                  {pkg.deps}
                </span>
                <span className="text-slate-400 group-hover:text-slate-200">Inspect →</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
