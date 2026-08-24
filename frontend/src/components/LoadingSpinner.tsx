import React from 'react';

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
        {/* Outer pulsing ring */}
        <div className="w-16 h-16 rounded-full border-2 border-indigo-500/20 animate-ping absolute" />
        {/* Spinning gradient ring */}
        <div className="w-14 h-14 rounded-full border-4 border-slate-800 border-t-indigo-500 border-r-cyan-400 animate-spin" />
        {/* Center glowing node */}
        <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 absolute shadow-lg shadow-indigo-500/50" />
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-slate-200 tracking-wide">{label}</h3>
        <p className="text-xs text-slate-400 font-mono">{sublabel}</p>
      </div>
    </div>
  );
};
