import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, X, Command } from 'lucide-react';
import { api } from '../api/client.js';
import { PackageNode } from '../types/index.js';
import { ToolIcon } from './ToolIcon.js';

// Category mapping for grouping search results
const PACKAGE_CATEGORIES: Record<string, string> = {
  javascript: 'LANGUAGE', typescript: 'LANGUAGE', python: 'LANGUAGE', rust: 'LANGUAGE', go: 'LANGUAGE',
  react: 'FRONTEND', 'react-dom': 'FRONTEND', vue: 'FRONTEND', angular: 'FRONTEND', svelte: 'FRONTEND', solid: 'FRONTEND', preact: 'FRONTEND',
  next: 'FRONTEND', nuxt: 'FRONTEND', gatsby: 'FRONTEND', remix: 'FRONTEND', astro: 'FRONTEND',
  vite: 'FRONTEND', webpack: 'FRONTEND', 'babel-core': 'FRONTEND', parcel: 'FRONTEND', rollup: 'FRONTEND', esbuild: 'FRONTEND', turbopack: 'FRONTEND', swc: 'FRONTEND',
  tailwindcss: 'FRONTEND', 'react-query': 'FRONTEND', axios: 'FRONTEND',
  express: 'BACKEND', fastify: 'BACKEND', koa: 'BACKEND', hapi: 'BACKEND', nestjs: 'BACKEND', cors: 'BACKEND', dotenv: 'BACKEND',
  'node.js': 'RUNTIME', nodejs: 'RUNTIME', deno: 'RUNTIME', bun: 'RUNTIME',
  prisma: 'DATABASE', 'neo4j-driver': 'DATABASE', mongoose: 'DATABASE', typeorm: 'DATABASE', sequelize: 'DATABASE', drizzle: 'DATABASE', knex: 'DATABASE',
  redis: 'CACHE', memcached: 'CACHE', ioredis: 'CACHE',
  jest: 'TESTING', vitest: 'TESTING', mocha: 'TESTING', cypress: 'TESTING', playwright: 'TESTING',
  eslint: 'DEVOPS', prettier: 'DEVOPS', husky: 'DEVOPS', 'lint-staged': 'DEVOPS',
  docker: 'DEVOPS', kubernetes: 'DEVOPS', terraform: 'DEVOPS',
  lodash: 'LIBRARY', zod: 'LIBRARY', 'date-fns': 'LIBRARY', dayjs: 'LIBRARY', ramda: 'LIBRARY', rxjs: 'LIBRARY',
  rabbitmq: 'QUEUE', kafka: 'QUEUE', bullmq: 'QUEUE',
  grafana: 'MONITORING', prometheus: 'MONITORING', datadog: 'MONITORING',
};

export function getCategoryForPackage(name: string): string {
  const lower = name.toLowerCase();
  if (PACKAGE_CATEGORIES[lower]) return PACKAGE_CATEGORIES[lower];
  if (lower.includes('react') || lower.includes('vue') || lower.includes('angular')) return 'FRONTEND';
  if (lower.includes('express') || lower.includes('server')) return 'BACKEND';
  if (lower.includes('test') || lower.includes('jest') || lower.includes('spec')) return 'TESTING';
  if (lower.includes('db') || lower.includes('sql') || lower.includes('mongo')) return 'DATABASE';
  if (lower.includes('lint') || lower.includes('format')) return 'DEVOPS';
  return 'LIBRARY';
}

interface SearchBarProps {
  onSelectPackage: (packageName: string) => void;
  selectedPackage?: string | null;
  onError?: (msg: string) => void;
  isModal?: boolean;
  onClose?: () => void;
  variant?: 'navbar' | 'sidebar' | 'modal';
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSelectPackage,
  selectedPackage,
  onError,
  isModal = false,
  onClose,
  variant = 'navbar',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PackageNode[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isModal || variant === 'modal') {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isModal, variant]);

  useEffect(() => {
    if (selectedPackage && !isModal && variant === 'sidebar') {
      setQuery(selectedPackage);
    }
  }, [selectedPackage, isModal, variant]);

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
        setHighlightedIndex(data.length > 0 ? 0 : -1);
      } catch (err: any) {
        if (onError) onError(err.message || 'Failed to search packages');
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query, onError]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        if ((isModal || variant === 'modal') && onClose) onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isModal, variant, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      if (onClose) onClose();
      else inputRef.current?.blur();
      return;
    }

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
    }
  };

  const handleSelect = (name: string) => {
    setQuery('');
    setIsOpen(false);
    onSelectPackage(name);
    if (onClose) onClose();
  };

  // Group results by category
  const groupedResults = results.reduce<Record<string, PackageNode[]>>((acc, pkg) => {
    const cat = getCategoryForPackage(pkg.name);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(pkg);
    return acc;
  }, {});

  // ══════════════════════════════════════════════════════
  // MODAL / COMMAND PALETTE VARIANT
  // ══════════════════════════════════════════════════════
  if (variant === 'modal' || isModal) {
    return (
      <div ref={containerRef} className="w-full bg-[#121212] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden font-mono">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.08] bg-[#161616]">
          <Search className="w-5 h-5 text-[#666] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tools, categories, or types..."
            className="flex-1 bg-transparent text-white text-sm placeholder-[#666] focus:outline-none font-mono"
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-[#00d4d4] shrink-0" />}
          {onClose && (
            <button onClick={onClose} className="p-1.5 text-[#666] hover:text-white rounded transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {isOpen && results.length > 0 && (
          <div className="max-h-[420px] overflow-y-auto divide-y divide-white/[0.04]">
            {Object.entries(groupedResults).map(([category, pkgs]) => (
              <div key={category} className="py-1">
                <div className="px-5 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[#666] font-bold">
                  {category}
                </div>
                {pkgs.map((pkg) => {
                  const globalIdx = results.indexOf(pkg);
                  const isHL = globalIdx === highlightedIndex;
                  return (
                    <button
                      key={pkg.id || pkg.name}
                      onClick={() => handleSelect(pkg.name)}
                      onMouseEnter={() => setHighlightedIndex(globalIdx)}
                      className={`w-full px-5 py-3 flex items-center justify-between text-left transition-colors ${
                        isHL ? 'bg-[#00d4d4] text-black' : 'hover:bg-white/[0.04] text-[#e5e5e5]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <ToolIcon name={pkg.name} size="sm" />
                        <span className="font-bold text-sm tracking-tight">{pkg.name}</span>
                      </div>
                      <span className={`text-[10px] uppercase tracking-wider font-bold shrink-0 ${
                        isHL ? 'text-black/60 font-bold' : 'text-[#666]'
                      }`}>
                        {getCategoryForPackage(pkg.name)}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {isOpen && results.length === 0 && query.trim() && !loading && (
          <div className="px-5 py-10 text-center text-sm text-[#666]">
            No packages found matching "<span className="text-white font-bold">{query}</span>"
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  // NAVBAR SEARCH BAR WITH DROPDOWN BELOW
  // ══════════════════════════════════════════════════════
  if (variant === 'navbar') {
    return (
      <div ref={containerRef} className="relative w-72 sm:w-80">
        <div className="relative flex items-center group">
          <div className="absolute left-3 text-[#666] group-focus-within:text-[#00d4d4] transition-colors pointer-events-none">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00d4d4]" /> : <Search className="w-3.5 h-3.5" />}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (results.length > 0) setIsOpen(true); }}
            onKeyDown={handleKeyDown}
            placeholder="Search tools..."
            className="w-full pl-9 pr-14 py-1.5 bg-[#141414] hover:bg-[#181818] focus:bg-[#181818] text-white text-xs placeholder-[#666] rounded-lg border border-white/[0.08] focus:border-[#00d4d4]/60 focus:outline-none font-mono transition-all"
          />
          <div className="absolute right-2.5 flex items-center pointer-events-none">
            <kbd className="text-[10px] text-[#666] font-mono bg-[#202020] px-1.5 py-0.5 rounded border border-white/[0.06] flex items-center gap-0.5">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
          </div>
        </div>

        {/* Top Dropdown Menu */}
        {isOpen && results.length > 0 && (
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#121212] border border-white/[0.12] rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 font-mono divide-y divide-white/[0.04]">
            <div className="max-h-80 overflow-y-auto">
              {Object.entries(groupedResults).map(([category, pkgs]) => (
                <div key={category} className="py-1">
                  <div className="px-4 py-1.5 text-[9px] uppercase tracking-[0.2em] text-[#666] font-bold bg-[#161616]">
                    {category}
                  </div>
                  {pkgs.map((pkg) => {
                    const globalIdx = results.indexOf(pkg);
                    const isHL = globalIdx === highlightedIndex;
                    return (
                      <button
                        key={pkg.id || pkg.name}
                        onClick={() => handleSelect(pkg.name)}
                        onMouseEnter={() => setHighlightedIndex(globalIdx)}
                        className={`w-full px-4 py-2.5 flex items-center justify-between text-left transition-colors ${
                          isHL ? 'bg-[#00d4d4] text-black' : 'hover:bg-white/[0.04] text-[#e5e5e5]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <ToolIcon name={pkg.name} size="xs" />
                          <span className="font-bold text-xs truncate">{pkg.name}</span>
                        </div>
                        <span className={`text-[9px] uppercase tracking-wider font-bold shrink-0 ${
                          isHL ? 'text-black/60' : 'text-[#666]'
                        }`}>
                          {getCategoryForPackage(pkg.name)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  // SIDEBAR FILTER INLINE SEARCH
  // ══════════════════════════════════════════════════════
  return (
    <div ref={containerRef} className="relative w-full z-30 font-mono">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-3.5 h-3.5 text-[#666] pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder="Search by name..."
          className="w-full pl-9 pr-8 py-2 bg-[#161616] text-white placeholder-[#666] rounded-lg border border-white/[0.08] focus:outline-none focus:border-[#00d4d4]/50 text-xs font-mono transition-colors"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setIsOpen(false); }}
            className="absolute right-2.5 text-[#666] hover:text-white p-0.5 rounded transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
