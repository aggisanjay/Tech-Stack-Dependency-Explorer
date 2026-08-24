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
        <div className="w-16 h-16 rounded-full border-2 border-[#00d4d4]/20 animate-ping absolute" />
        {/* Spinning gradient ring */}
        <div className="w-14 h-14 rounded-full border-2 border-transparent border-t-[#00d4d4] border-r-[#00d4d4]/50 animate-spin" />
        {/* Inner static surface */}
        <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-white/[0.1] flex items-center justify-center shadow-lg shadow-[#00d4d4]/20">
          <Database className="w-3.5 h-3.5 text-[#00d4d4] animate-pulse" />
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-bold text-white tracking-wide">{label}</h3>
        <p className="text-xs text-[#666] font-mono max-w-sm">{sublabel}</p>
      </div>
    </div>
  );
};
