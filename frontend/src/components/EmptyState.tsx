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
        <div className="w-20 h-20 rounded-2xl bg-[#00d4d4]/10 border border-[#00d4d4]/30 flex items-center justify-center shadow-glow-md">
          <Network className="w-10 h-10 text-[#00d4d4] animate-pulse" />
        </div>
        <div className="absolute -top-2 -right-2 bg-[#00d4d4] rounded-full p-1.5 shadow-lg shadow-[#00d4d4]/40">
          <Sparkles className="w-3.5 h-3.5 text-black" />
        </div>
      </div>

      {/* Main heading */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00d4d4]/10 border border-[#00d4d4]/20 text-[#00d4d4] text-xs font-bold mb-3">
        <Zap className="w-3.5 h-3.5" />
        <span>Graph-Powered Dependency Intelligence</span>
      </div>

      <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
        Explore npm Dependency Networks
      </h2>
      <p className="mt-3 text-sm text-[#888] max-w-2xl leading-relaxed">
        Search for any package or choose an entry point below to visualize its multi-hop dependency tree via <strong className="text-white">CognoDB</strong>.
      </p>

      {/* Feature Pills */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-mono text-[#888]">
        <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center gap-1.5">
          <GitFork className="w-3.5 h-3.5 text-[#00d4d4]" /> Multi-Hop Traversal
        </span>
        <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-[#00d4d4]" /> Reverse Dependents
        </span>
        <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> License & Download Analytics
        </span>
      </div>

      {/* Quick Launch Cards */}
      <div className="mt-10 w-full">
        <div className="flex items-center justify-center gap-2 mb-4 text-xs font-bold uppercase tracking-[0.15em] text-[#666]">
          <Layers className="w-3.5 h-3.5 text-[#00d4d4]" />
          <span>Or select a popular library to inspect:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {FEATURED_PACKAGES.map((pkg) => (
            <button
              key={pkg.name}
              onClick={() => onSelectPackage(pkg.name)}
              className="group relative flex flex-col p-4 text-left bg-[#1a1a1a] hover:bg-[#222] border border-white/[0.07] hover:border-[#00d4d4]/30 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[#00d4d4]/5 hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <span className="text-base font-bold text-white group-hover:text-[#00d4d4] transition-colors flex items-center gap-2">
                  <span>{pkg.icon}</span>
                  <span>{pkg.name}</span>
                </span>
                <ArrowUpRight className="w-4 h-4 text-[#333] group-hover:text-[#00d4d4] transition-colors" />
              </div>
              <p className="text-xs text-[#888] line-clamp-1">{pkg.desc}</p>
              <div className="mt-3.5 flex items-center justify-between text-[11px] font-mono">
                <span className="bg-[#0d0d0d] px-2 py-0.5 rounded text-[#00d4d4]/90 border border-white/[0.05]">
                  {pkg.deps}
                </span>
                <span className="text-[#666] group-hover:text-[#ccc]">Inspect →</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
