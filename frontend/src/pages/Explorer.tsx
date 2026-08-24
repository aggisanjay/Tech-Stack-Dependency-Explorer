import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { GraphCanvas } from '../components/GraphCanvas.js';
import { PackageCard } from '../components/PackageCard.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { ToolIcon } from '../components/ToolIcon.js';
import { api } from '../api/client.js';
import { GraphData, PackageNode } from '../types/index.js';
import { getCategoryForPackage } from '../components/SearchBar.js';
import {
  AlertTriangle,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  GitFork,
  ArrowUpRight,
  X,
  SlidersHorizontal,
} from 'lucide-react';

interface ExplorerProps {
  onShowToast: (msg: string, type?: 'error' | 'success' | 'info') => void;
  externalPackage?: string | null;
  onConsumeExternal?: () => void;
}

// Filter lists
const ALL_CATEGORIES = [
  'ALL', 'FRONTEND', 'BACKEND', 'DATABASE', 'CACHE', 'QUEUE',
  'DEVOPS', 'LANGUAGE', 'TESTING', 'MONITORING',
] as const;

const ALL_TYPES = [
  'ANY', 'FRAMEWORK', 'LIBRARY', 'RUNTIME', 'TOOL', 'SERVICE', 'LANGUAGE',
] as const;

const PACKAGE_TYPES: Record<string, string> = {
  react: 'LIBRARY', 'react-dom': 'LIBRARY', vue: 'FRAMEWORK', angular: 'FRAMEWORK', svelte: 'FRAMEWORK',
  next: 'FRAMEWORK', nuxt: 'FRAMEWORK', gatsby: 'FRAMEWORK', remix: 'FRAMEWORK', astro: 'FRAMEWORK',
  express: 'FRAMEWORK', fastify: 'FRAMEWORK', koa: 'FRAMEWORK', nestjs: 'FRAMEWORK',
  vite: 'TOOL', webpack: 'TOOL', 'babel-core': 'TOOL', parcel: 'TOOL', rollup: 'TOOL', esbuild: 'TOOL', swc: 'TOOL',
  javascript: 'LANGUAGE', typescript: 'LANGUAGE', python: 'LANGUAGE', rust: 'LANGUAGE', go: 'LANGUAGE',
  'node.js': 'RUNTIME', nodejs: 'RUNTIME', deno: 'RUNTIME', bun: 'RUNTIME',
  prisma: 'LIBRARY', 'neo4j-driver': 'LIBRARY', mongoose: 'LIBRARY',
  redis: 'SERVICE', docker: 'TOOL', kubernetes: 'TOOL',
  jest: 'FRAMEWORK', vitest: 'FRAMEWORK', mocha: 'FRAMEWORK', cypress: 'FRAMEWORK',
  eslint: 'TOOL', prettier: 'TOOL',
  lodash: 'LIBRARY', zod: 'LIBRARY', axios: 'LIBRARY', cors: 'LIBRARY', dotenv: 'LIBRARY',
  tailwindcss: 'FRAMEWORK', 'react-query': 'LIBRARY',
};

function getTypeForPackage(name: string): string {
  return PACKAGE_TYPES[name.toLowerCase()] || 'LIBRARY';
}

function getCategoryPillClass(category: string): string {
  switch (category.toUpperCase()) {
    case 'LANGUAGE':
      return 'bg-[#2a1338] text-[#c084fc] border-purple-500/30';
    case 'FRONTEND':
      return 'bg-[#092b30] text-[#22d3ee] border-cyan-500/30';
    case 'BACKEND':
      return 'bg-[#1b1938] text-[#818cf8] border-indigo-500/30';
    case 'DATABASE':
      return 'bg-[#0e2a1e] text-[#34d399] border-emerald-500/30';
    case 'CACHE':
      return 'bg-[#332211] text-[#fbbf24] border-amber-500/30';
    case 'QUEUE':
      return 'bg-[#331122] text-[#f472b6] border-pink-500/30';
    case 'TESTING':
      return 'bg-[#331118] text-[#fb7185] border-rose-500/30';
    case 'DEVOPS':
      return 'bg-[#332011] text-[#fb923c] border-orange-500/30';
    case 'MONITORING':
      return 'bg-[#1e1b38] text-[#a5b4fc] border-indigo-500/30';
    default:
      return 'bg-[#1a1a1a] text-[#888888] border-white/10';
  }
}

export const Explorer: React.FC<ExplorerProps> = ({ onShowToast, externalPackage, onConsumeExternal }) => {
  const [selectedRoot, setSelectedRoot] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<PackageNode | null>(null);
  const [depth, setDepth] = useState<number>(2);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Catalog state
  const [allPackages, setAllPackages] = useState<PackageNode[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ANY');
  const [filterQuery, setFilterQuery] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(true);
  const [typeOpen, setTypeOpen] = useState(true);

  // Load all packages on mount
  useEffect(() => {
    const loadAll = async () => {
      setCatalogLoading(true);
      try {
        const letters = ['a', 'e', 'i', 'o', 'r', 's', 't', 'n', 'l', 'c', 'b', 'd', 'p', 'v', 'w', 'j', 'z', 'x', 'u', 'y'];
        const allResults = new Map<string, PackageNode>();

        await Promise.all(
          letters.map(async (letter) => {
            try {
              const data = await api.searchPackages(letter);
              data.forEach((pkg) => allResults.set(pkg.name, pkg));
            } catch {
              // ignore
            }
          })
        );

        setAllPackages(Array.from(allResults.values()).sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err: any) {
        onShowToast('Failed to load package catalog', 'error');
      } finally {
        setCatalogLoading(false);
      }
    };
    loadAll();
  }, [onShowToast]);

  // Handle external selection
  useEffect(() => {
    if (externalPackage) {
      handleSelectPackage(externalPackage);
      onConsumeExternal?.();
    }
  }, [externalPackage]);

  const fetchGraph = useCallback(
    async (packageName: string, currentDepth: number) => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const [data, dependents] = await Promise.all([
          api.getPackageDependencies(packageName, currentDepth),
          api.getPackageDependents(packageName).catch(() => []),
        ]);

        const nodesMap = new Map<string, PackageNode>();
        const linksMap = new Map<string, any>();

        data.nodes.forEach((n) => nodesMap.set(n.id, n));
        data.links.forEach((l) => {
          const src = typeof l.source === 'object' ? (l.source as any).name : l.source;
          const tgt = typeof l.target === 'object' ? (l.target as any).name : l.target;
          linksMap.set(`${src}->${tgt}`, { ...l, source: src, target: tgt });
        });

        // Also merge direct reverse dependents so leaf tools (like TypeScript/React) show incoming connections
        dependents.forEach((dep) => {
          if (!nodesMap.has(dep.id)) {
            nodesMap.set(dep.id, dep);
          }
          const key = `${dep.name}->${packageName}`;
          if (!linksMap.has(key)) {
            linksMap.set(key, {
              source: dep.name,
              target: packageName,
              versionRange: '^1.0.0',
              type: 'prod',
            });
          }
        });

        const enrichedGraph: GraphData = {
          nodes: Array.from(nodesMap.values()),
          links: Array.from(linksMap.values()),
          rootPackage: data.rootPackage,
        };

        setGraphData(enrichedGraph);
        setSelectedRoot(packageName);

        const matched = enrichedGraph.nodes.find((n) => n.name === packageName);
        if (matched) {
          setSelectedNode(matched);
        } else if (enrichedGraph.nodes.length > 0) {
          setSelectedNode(enrichedGraph.nodes[0]);
        }
      } catch (err: any) {
        const msg = err?.message || 'Failed to fetch package dependency graph';
        setErrorMessage(msg);
        onShowToast(msg, 'error');
      } finally {
        setLoading(false);
      }
    },
    [onShowToast]
  );

  const handleSelectPackage = (packageName: string) => {
    setSelectedRoot(packageName);
    fetchGraph(packageName, depth);
  };

  const handleDepthChange = (newDepth: number) => {
    setDepth(newDepth);
    if (selectedRoot) {
      fetchGraph(selectedRoot, newDepth);
    }
  };

  const handleNodeClick = (node: PackageNode) => {
    setSelectedNode(node);
  };

  const handleExploreFromNode = (packageName: string) => {
    handleSelectPackage(packageName);
  };

  const handleBackToCatalog = () => {
    setSelectedRoot(null);
    setSelectedNode(null);
    setGraphData(null);
    setErrorMessage(null);
  };

  // Filter packages
  const filteredPackages = useMemo(() => {
    return allPackages.filter((pkg) => {
      if (filterCategory !== 'ALL') {
        const cat = getCategoryForPackage(pkg.name);
        if (cat !== filterCategory) return false;
      }
      if (filterType !== 'ANY') {
        const type = getTypeForPackage(pkg.name);
        if (type !== filterType) return false;
      }
      if (filterQuery.trim()) {
        if (!pkg.name.toLowerCase().includes(filterQuery.toLowerCase().trim())) return false;
      }
      return true;
    });
  }, [allPackages, filterCategory, filterType, filterQuery]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allPackages.forEach((pkg) => {
      const cat = getCategoryForPackage(pkg.name);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [allPackages]);

  // Count unique categories
  const categoryCount = useMemo(() => {
    return Object.keys(categoryCounts).length;
  }, [categoryCounts]);

  // ═══════════════════════════════════════════════════════════
  // GRAPH ACTIVE VIEW (When user clicks a package)
  // ═══════════════════════════════════════════════════════════
  if (graphData && selectedRoot) {
    return (
      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#0d0d0d] font-mono">
        {/* Top Breadcrumb & Controls bar */}
        <div className="z-30 px-6 py-3 bg-[#0a0a0a] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={handleBackToCatalog}
              className="text-[#888] hover:text-[#00d4d4] transition-colors flex items-center gap-1.5 font-bold"
            >
              <X className="w-3.5 h-3.5" />
              <span>Catalog</span>
            </button>
            <span className="text-[#444]">/</span>
            <div className="flex items-center gap-2">
              <ToolIcon name={selectedRoot} size="xs" />
              <span className="text-white font-bold text-sm">{selectedRoot}</span>
            </div>
            <span className="text-[#666] text-[11px]">
              ({graphData.nodes.length} nodes · {graphData.links.length} relationships)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Depth selector */}
            <div className="flex items-center gap-1 bg-[#141414] border border-white/[0.08] p-1 rounded-lg">
              <span className="px-2 text-[10px] text-[#666] flex items-center gap-1 font-bold">
                <SlidersHorizontal className="w-3 h-3 text-[#00d4d4]" />
                Depth:
              </span>
              {[1, 2, 3].map((d) => (
                <button
                  key={d}
                  onClick={() => handleDepthChange(d)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    depth === d
                      ? 'bg-[#00d4d4] text-black shadow-[0_0_10px_rgba(0,212,212,0.3)]'
                      : 'text-[#666] hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Graph + Sidebar */}
        <div className="flex-1 flex relative overflow-hidden">
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d0d]/85 z-20 backdrop-blur-md">
                <LoadingSpinner
                  label={`Traversing dependencies for '${selectedRoot}'...`}
                  sublabel={`MATCH path = (root:Package {name: "${selectedRoot}"})-[:DEPENDS_ON*1..${depth}]->(dep:Package)`}
                />
              </div>
            )}

            {errorMessage && !loading ? (
              <div className="p-8 max-w-md bg-[#161616] border border-red-500/30 rounded-2xl text-center space-y-4 shadow-2xl z-20">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Graph Query Failed</h3>
                  <p className="text-xs text-[#888] mt-1">{errorMessage}</p>
                </div>
                <button
                  onClick={() => fetchGraph(selectedRoot, depth)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#00d4d4] hover:bg-[#00b3b3] text-black rounded-lg text-xs font-bold shadow-lg transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Query</span>
                </button>
              </div>
            ) : (
              <GraphCanvas
                data={graphData}
                rootPackageName={selectedRoot}
                selectedPackageName={selectedNode?.name}
                onSelectNode={handleNodeClick}
              />
            )}
          </div>

          {/* Sidebar Info Drawer */}
          {selectedNode && graphData && (
            <aside className="w-full md:w-96 shrink-0 h-full z-20 relative transition-all duration-300">
              <PackageCard
                pkg={selectedNode}
                depth={depth}
                onDepthChange={handleDepthChange}
                onExplore={handleExploreFromNode}
                onClose={() => setSelectedNode(null)}
              />
            </aside>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // CATALOG VIEW — Hero + Stats + Filters + Cards Grid
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="flex-1 overflow-y-auto bg-[#0d0d0d] font-mono select-none">
      {/* ─── Hero Section (Centered, Clean) ─── */}
      <section className="px-6 md:px-12 pt-14 pb-12 max-w-4xl mx-auto text-center flex flex-col items-center">
        {/* Giant Monospace Two-Tone Heading */}
        <h1 className="text-[clamp(32px,5.5vw,58px)] font-bold leading-[1.12] tracking-tight text-white mb-6 text-center">
          Map every tool in your<br />
          stack &{' '}
          <span className="text-[#00d4d4]">the ties that<br /></span>
          <span className="text-[#00d4d4]">hold it together.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-[#888] text-sm max-w-2xl leading-relaxed mb-10 text-center mx-auto">
          Browse a curated catalog of frameworks, databases, and infra. Click any tool
          to see what it depends on, what depends on it, and how it all connects.
        </p>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 w-full max-w-2xl mx-auto">
          <div className="bg-[#141414] rounded-xl border border-white/[0.08] p-4 shadow-sm text-center">
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#666] font-bold mb-1.5">TOOLS</div>
            <div className="text-3xl font-bold text-white tracking-tight">{allPackages.length || 58}</div>
          </div>
          <div className="bg-[#141414] rounded-xl border border-white/[0.08] p-4 shadow-sm text-center">
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#666] font-bold mb-1.5">DEPENDENCIES</div>
            <div className="text-3xl font-bold text-white tracking-tight">76</div>
          </div>
          <div className="bg-[#141414] rounded-xl border border-white/[0.08] p-4 shadow-sm text-center">
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#666] font-bold mb-1.5">CATEGORIES</div>
            <div className="text-3xl font-bold text-white tracking-tight">{categoryCount || 11}</div>
          </div>
          <div className="bg-[#141414] rounded-xl border border-white/[0.08] p-4 shadow-sm text-center">
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#666] font-bold mb-1.5">UPDATED</div>
            <div className="text-2xl font-bold text-white tracking-tight">8/24/2026</div>
          </div>
        </div>
      </section>

      {/* ─── Two-Column Layout: Filters + Catalog Grid ─── */}
      <section className="px-6 md:px-12 pb-16 max-w-[1440px] mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          {/* ── Left Sidebar Filters ── */}
          <aside className="w-full md:w-60 shrink-0">
            <div className="flex items-center gap-2 mb-4 text-[11px] uppercase tracking-[0.2em] text-[#888] font-bold">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#00d4d4]" />
              <span>FILTERS</span>
            </div>

            {/* Filter search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#555]" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Search by name..."
                className="w-full pl-9 pr-3 py-2 bg-[#141414] text-white placeholder-[#555] rounded-lg border border-white/[0.08] focus:outline-none focus:border-[#00d4d4]/60 text-xs font-mono transition-colors"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="mb-6">
              <button
                onClick={() => setCategoryOpen(!categoryOpen)}
                className="w-full flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[#888] font-bold mb-3"
              >
                <span>CATEGORY</span>
                {categoryOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {categoryOpen && (
                <div className="flex flex-wrap gap-2">
                  {ALL_CATEGORIES.map((cat) => {
                    const isActive = filterCategory === cat;
                    const count = cat === 'ALL' ? allPackages.length || 48 : (categoryCounts[cat] || 0);
                    if (cat !== 'ALL' && count === 0) return null;
                    return (
                      <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold transition-all ${
                          isActive
                            ? 'bg-[#00d4d4] text-black shadow-[0_0_12px_rgba(0,212,212,0.35)]'
                            : 'bg-[#161616] text-[#888] border border-white/[0.08] hover:text-white hover:border-white/[0.16]'
                        }`}
                      >
                        {cat} <span className="opacity-80 ml-0.5">{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Type Filter Pills */}
            <div>
              <button
                onClick={() => setTypeOpen(!typeOpen)}
                className="w-full flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[#888] font-bold mb-3"
              >
                <span>TYPE</span>
                {typeOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {typeOpen && (
                <div className="flex flex-wrap gap-2">
                  {ALL_TYPES.map((type) => {
                    const isActive = filterType === type;
                    return (
                      <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold transition-all ${
                          isActive
                            ? 'bg-[#00d4d4] text-black shadow-[0_0_12px_rgba(0,212,212,0.35)]'
                            : 'bg-[#161616] text-[#888] border border-white/[0.08] hover:text-white hover:border-white/[0.16]'
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          {/* ── Right Catalog Cards Grid ── */}
          <div className="flex-1 min-w-0">
            {/* Catalog header */}
            <div className="flex items-center justify-between mb-5">
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#888] font-bold">CATALOG</span>
              <div className="text-xs text-[#888]">
                <strong className="text-white font-bold">{filteredPackages.length}</strong> / {allPackages.length || 48} tools
              </div>
            </div>

            {catalogLoading ? (
              <div className="py-20">
                <LoadingSpinner
                  label="Loading package catalog..."
                  sublabel="Fetching tools from CognoDB graph"
                />
              </div>
            ) : filteredPackages.length === 0 ? (
              <div className="py-16 text-center text-[#666] text-sm bg-[#121212] rounded-2xl border border-white/[0.06]">
                No packages match the current filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPackages.map((pkg) => {
                  const category = getCategoryForPackage(pkg.name);
                  const pillStyle = getCategoryPillClass(category);
                  const approxDeps = pkg.weeklyDownloads > 15000000 ? '2 deps' : pkg.weeklyDownloads > 5000000 ? '1 dep' : '0 deps';

                  return (
                    <button
                      key={pkg.name}
                      onClick={() => handleSelectPackage(pkg.name)}
                      className="group relative flex flex-col p-5 text-left bg-[#121212] hover:bg-[#181818] border border-white/[0.08] hover:border-[#00d4d4]/60 rounded-2xl transition-all duration-200 hover:shadow-[0_0_25px_-5px_rgba(0,212,212,0.2)] hover:-translate-y-0.5"
                    >
                      {/* Top Bar: Icon + Top-Right Arrow */}
                      <div className="flex items-start justify-between w-full mb-3">
                        <ToolIcon name={pkg.name} size="md" />
                        <ArrowUpRight className="w-4 h-4 text-[#444] group-hover:text-[#00d4d4] transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </div>

                      {/* Tool Name */}
                      <h3 className="text-base font-bold text-white group-hover:text-[#00d4d4] transition-colors mb-1">
                        {pkg.name}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-[#888] leading-relaxed line-clamp-2 mb-5 flex-1">
                        {pkg.description || 'Modern developer tool and ecosystem module.'}
                      </p>

                      {/* Bottom Footer: Category Pill + Dep Count */}
                      <div className="flex items-center justify-between w-full mt-auto pt-2">
                        <span className={`text-[9px] uppercase tracking-[0.15em] font-bold px-2.5 py-0.5 rounded-full border ${pillStyle}`}>
                          {category}
                        </span>

                        <span className="text-[11px] text-[#666] font-mono flex items-center gap-1.5">
                          <GitFork className="w-3 h-3 text-[#555]" />
                          {approxDeps}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
