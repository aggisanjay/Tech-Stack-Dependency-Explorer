import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Package as PackageIcon, ArrowRight, X, Command, Sparkles } from 'lucide-react';
import { api } from '../api/client.js';
import { PackageNode } from '../types/index.js';

interface SearchBarProps {
  onSelectPackage: (packageName: string) => void;
  selectedPackage?: string | null;
  onError: (msg: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSelectPackage,
  selectedPackage,
  onError,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PackageNode[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync query when selectedPackage changes externally
  useEffect(() => {
    if (selectedPackage) {
      setQuery(selectedPackage);
    }
  }, [selectedPackage]);

  // Global hotkey '/' or 'Cmd+K' to focus search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.searchPackages(query);
        setResults(data);
        setIsOpen(true);
        setHighlightedIndex(-1);
      } catch (err: any) {
        onError(err.message || 'Failed to search packages');
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, onError]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        handleSelect(query.trim());
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < results.length) {
        handleSelect(results[highlightedIndex].name);
      } else if (results.length > 0) {
        handleSelect(results[0].name);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (name: string) => {
    setQuery(name);
    setIsOpen(false);
    onSelectPackage(name);
  };

  const formatDownloads = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M/wk`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K/wk`;
    return `${num}/wk`;
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto z-30">
      {/* Search Input Bar */}
      <div className="relative flex items-center group">
        <div className="absolute left-4 text-slate-400 group-focus-within:text-brand-400 transition-colors pointer-events-none">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search npm packages (e.g. next, react, express, vite, jest)..."
          className="w-full pl-11 pr-24 py-2.5 bg-slate-900/80 text-white placeholder-slate-400 rounded-xl border border-white/[0.08] shadow-lg shadow-black/20 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/80 text-sm backdrop-blur-xl transition-all"
        />

        {/* Action icons inside search bar */}
        <div className="absolute right-3 flex items-center gap-1.5 pointer-events-auto">
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-mono font-medium text-slate-400 bg-slate-800/80 border border-white/[0.08] rounded-md shadow-sm">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
          )}
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-[#0d1222]/95 border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-2xl animate-in fade-in duration-150">
          <div className="px-3.5 py-2 border-b border-white/[0.06] flex items-center justify-between text-[11px] font-medium text-slate-400 bg-white/[0.02]">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-brand-400" />
              <span>Matching Packages</span>
            </span>
            <span>Use ↑ ↓ to navigate, Enter to select</span>
          </div>

          {results.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">
              No packages found matching &quot;<span className="text-white font-medium">{query}</span>&quot;
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-white/[0.04]">
              {results.map((pkg, idx) => {
                const isSelected = idx === highlightedIndex;
                return (
                  <li
                    key={pkg.id || pkg.name}
                    onClick={() => handleSelect(pkg.name)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-4 py-3 cursor-pointer flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-brand-600/15 text-white pl-5'
                        : 'hover:bg-white/[0.03] text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-4">
                      <div
                        className={`p-2 rounded-xl shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-brand-500 text-white shadow-glow-sm'
                            : 'bg-slate-800/80 text-brand-400 border border-white/[0.06]'
                        }`}
                      >
                        <PackageIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm tracking-tight text-white">{pkg.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono bg-slate-800/70 px-1.5 py-0.5 rounded border border-white/[0.06]">
                            v{pkg.version}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                          {pkg.description || 'No description available'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-right">
                      <div>
                        <span className="text-xs font-mono font-semibold text-brand-300 block">
                          {formatDownloads(pkg.weeklyDownloads)}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                          {pkg.license}
                        </span>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                          isSelected ? 'bg-brand-500 text-white translate-x-0.5' : 'text-slate-600'
                        }`}
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
