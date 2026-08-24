import React from 'react';
import { Network, Sparkles, Layers, ArrowUpRight } from 'lucide-react';

interface EmptyStateProps {
  onSelectPackage: (packageName: string) => void;
}

const FEATURED_PACKAGES = [
  { name: 'next', desc: 'React Framework for Production', deps: '6 deps', icon: '⚡' },
  { name: 'vite', desc: 'Next Generation Frontend Tooling', deps: '2 deps', icon: '⚡' },
  { name: 'express', desc: 'Fast, unopinionated Node.js framework', deps: '2 deps', icon: '🌐' },
  { name: 'webpack', desc: 'Static module bundler for JS apps', deps: '1 dep', icon: '📦' },
  { name: 'react-query', desc: 'Asynchronous State Management', deps: '2 deps', icon: '🔄' },
  { name: 'jest', desc: 'Delightful JavaScript Testing Framework', deps: '2 deps', icon: '🃏' },
];

export const EmptyState: React.FC<EmptyStateProps> = ({ onSelectPackage }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center max-w-3xl mx-auto">
      {/* Visual icon badge */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600/20 via-cyan-500/20 to-purple-600/20 border border-indigo-500/30 flex items-center justify-center shadow-2xl backdrop-blur-xl">
          <Network className="w-10 h-10 text-indigo-400 animate-pulse" />
        </div>
        <div className="absolute -top-2 -right-2 bg-indigo-500 rounded-full p-1 shadow-lg shadow-indigo-500/50">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
      </div>

      {/* Main heading */}
      <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
        Explore npm Dependency Networks
      </h2>
      <p className="mt-2 text-sm md:text-base text-slate-400 max-w-xl">
        Select or search for any package to visualize its multi-hop dependency graph, reverse dependents, and license topologies powered by <span className="text-indigo-400 font-semibold">CognoDB</span>.
      </p>

      {/* Quick Launch Cards */}
      <div className="mt-8 w-full">
        <div className="flex items-center justify-center gap-2 mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>Or select a popular entry point:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {FEATURED_PACKAGES.map((pkg) => (
            <button
              key={pkg.name}
              onClick={() => onSelectPackage(pkg.name)}
              className="group flex flex-col p-4 text-left bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 rounded-xl transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-2">
                  <span>{pkg.icon}</span>
                  <span>{pkg.name}</span>
                </span>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
              <p className="text-xs text-slate-400 line-clamp-1">{pkg.desc}</p>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span className="bg-slate-800/80 px-2 py-0.5 rounded text-indigo-300/80">{pkg.deps}</span>
                <span className="text-slate-400 group-hover:text-slate-200">Explore →</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
