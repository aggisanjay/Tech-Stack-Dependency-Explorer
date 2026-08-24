import React from 'react';
import { Database } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
  sublabel?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Traversing Dependency Graph...',
  sublabel = 'Executing Cypher multi-hop query across CognoDB'
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
      <div className="relative flex items-center justify-center">
        {/* Outer pulsing radar ring */}
        <div className="w-16 h-16 rounded-full border-2 border-brand-500/25 animate-ping absolute" />
        {/* Spinning gradient ring */}
        <div className="w-14 h-14 rounded-full border-2 border-transparent border-t-brand-500 border-r-cyan-400 animate-spin" />
        {/* Inner static surface */}
        <div className="w-8 h-8 rounded-full bg-slate-900 border border-white/[0.1] flex items-center justify-center shadow-lg shadow-brand-500/30">
          <Database className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-bold text-white tracking-wide">{label}</h3>
        <p className="text-xs text-slate-400 font-mono max-w-sm">{sublabel}</p>
      </div>
    </div>
  );
};
