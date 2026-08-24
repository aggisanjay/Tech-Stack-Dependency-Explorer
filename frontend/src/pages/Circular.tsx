import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckCircle2,
  RefreshCw,
  Repeat,
  ArrowRight,
  ShieldCheck,
  Terminal,
  RotateCcw,
  ChevronDown,
  Play,
  Flame,
  X,
  ExternalLink,
} from 'lucide-react';
import { api } from '../api/client.js';
import { GraphData, PackageNode } from '../types/index.js';
import { GraphCanvas } from '../components/GraphCanvas.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { ToolIcon } from '../components/ToolIcon.js';

interface CircularProps {
  onShowToast: (msg: string, type?: 'error' | 'success' | 'info') => void;
  onNavigateToExplorer?: (pkgName: string) => void;
}

// Preset circular loop simulations for testing & visual validation
const SIMULATION_CYCLES: { id: string; title: string; hops: number; nodes: string[]; desc: string }[] = [
  {
    id: 'webpack-babel',
    title: '2-Hop Recursive Loop',
    hops: 2,
    nodes: ['webpack', 'babel-core', 'webpack'],
    desc: 'webpack depends on babel-core for transpilation, while babel-core requires webpack bundle plugins, creating an infinite module resolution loop.',
  },
  {
    id: 'next-react-cycle',
    title: '3-Hop Framework Deadlock',
    hops: 3,
    nodes: ['next', 'react-dom', 'react', 'next'],
    desc: 'next requires react-dom, react-dom requires react core, while a customized build plugin in react references next utilities.',
  },
  {
    id: 'auth-orm-cycle',
    title: '4-Hop Enterprise Architectural Cycle',
    hops: 4,
    nodes: ['express', 'prisma', 'zod', 'axios', 'express'],
    desc: 'express server imports prisma client, prisma hooks utilize zod schemas, zod custom transformers rely on axios client, and axios interceptors import express middlewares.',
  },
];

export const Circular: React.FC<CircularProps> = ({ onShowToast, onNavigateToExplorer }) => {
  const [cycles, setCycles] = useState<string[][]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Full graph state
  const [fullGraphData, setFullGraphData] = useState<GraphData | null>(null);
  const [graphLoading, setGraphLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<PackageNode | null>(null);
  const [viewMode, setViewMode] = useState<'full' | 'cycles'>('full');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Cycle visualization state
  const [activeCycleSimulation, setActiveCycleSimulation] = useState<string>('db-live');
  const [selectedLiveCycleIndex, setSelectedLiveCycleIndex] = useState<number>(0);
  const [selectedToolFilter, setSelectedToolFilter] = useState<string | null>(null);
  const [scanDurationMs, setScanDurationMs] = useState<number>(14);

  const fetchCycles = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const data = await api.getCircularDependencies();
      setCycles(data.cycles);
      setCount(data.count);
      setScanDurationMs(Math.round(performance.now() - start));
    } catch (err: any) {
      const msg = err?.message || 'Failed to detect circular dependencies';
      onShowToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Build full stack graph from database
  const loadFullGraph = useCallback(async () => {
    setGraphLoading(true);
    try {
      const letters = ['a', 'e', 'i', 'o', 'r', 's', 't', 'n', 'l', 'c', 'b', 'p', 'm', 'd', 'v', 'w', 'j'];
      const allPkgs = new Map<string, PackageNode>();

      await Promise.all(
        letters.map(async (letter) => {
          try {
            const data = await api.searchPackages(letter);
            data.forEach((pkg) => allPkgs.set(pkg.name, pkg));
          } catch {
            // ignore
          }
        })
      );

      const pkgNames = Array.from(allPkgs.keys());
      const nodesMap = new Map<string, PackageNode>();
      const linksSet = new Set<string>();
      const links: any[] = [];

      await Promise.all(
        pkgNames.map(async (name) => {
          try {
            const graph = await api.getPackageDependencies(name, 1);
            graph.nodes.forEach((n) => nodesMap.set(n.name, n));
            graph.links.forEach((l) => {
              const src = typeof l.source === 'object' ? (l.source as any).name : l.source;
              const tgt = typeof l.target === 'object' ? (l.target as any).name : l.target;
              const key = `${src}->${tgt}`;
              if (!linksSet.has(key)) {
                linksSet.add(key);
                links.push({ ...l, source: src, target: tgt });
              }
            });
          } catch {
            // ignore
          }
        })
      );

      allPkgs.forEach((pkg, name) => {
        if (!nodesMap.has(name)) {
          nodesMap.set(name, pkg);
        }
      });

      setFullGraphData({
        nodes: Array.from(nodesMap.values()),
        links: links,
      });
    } catch (err) {
      onShowToast('Failed to load full graph', 'error');
    } finally {
      setGraphLoading(false);
    }
  }, [onShowToast]);

  useEffect(() => {
    fetchCycles();
    loadFullGraph();
  }, [loadFullGraph]);

  const handleResetFocus = () => {
    setSelectedNode(null);
  };

  // Filter live cycles by selected tool if any
  const displayedLiveCycles = useMemo(() => {
    if (!selectedToolFilter) return cycles;
    return cycles.filter((c) => c.includes(selectedToolFilter));
  }, [cycles, selectedToolFilter]);

  // All unique tool names present in live cycles
  const allCycleTools = useMemo(() => {
    const set = new Set<string>();
    cycles.forEach((c) => c.forEach((name) => set.add(name)));
    return Array.from(set).sort();
  }, [cycles]);

  // Build cycle graph data for the selected simulation or live detected cycle
  const currentCycleGraphData: GraphData = useMemo(() => {
    let cycleNodes: string[] = [];

    if (activeCycleSimulation === 'db-live') {
      if (displayedLiveCycles.length > 0) {
        const idx = Math.min(selectedLiveCycleIndex, displayedLiveCycles.length - 1);
        cycleNodes = displayedLiveCycles[idx];
      } else {
        return { nodes: [], links: [] };
      }
    } else {
      const sim = SIMULATION_CYCLES.find((s) => s.id === activeCycleSimulation);
      if (sim) {
        cycleNodes = sim.nodes;
      }
    }

    if (cycleNodes.length < 2) return { nodes: [], links: [] };

    const uniqueNodeNames = Array.from(new Set(cycleNodes));
    const nodes: PackageNode[] = uniqueNodeNames.map((name) => ({
      id: name,
      name: name,
      version: '1.0.0',
      description: `Package in circular dependency chain: ${name}`,
      license: 'MIT',
      weeklyDownloads: 25000000,
    }));

    const links: any[] = [];
    for (let i = 0; i < cycleNodes.length - 1; i++) {
      links.push({
        source: cycleNodes[i],
        target: cycleNodes[i + 1],
        versionRange: '^1.0.0',
        type: 'prod',
      });
    }

    return { nodes, links };
  }, [activeCycleSimulation, selectedLiveCycleIndex, displayedLiveCycles]);

  // Live direct connections calculation for the selected node in Full Graph
  const selectedNodeConnections = useMemo(() => {
    if (!selectedNode || !fullGraphData) return null;
    const outgoing: string[] = [];
    const incoming: string[] = [];

    fullGraphData.links.forEach((l) => {
      const src = typeof l.source === 'object' ? (l.source as any).name : l.source;
      const tgt = typeof l.target === 'object' ? (l.target as any).name : l.target;
      if (src === selectedNode.name) outgoing.push(tgt);
      if (tgt === selectedNode.name) incoming.push(src);
    });

    return {
      outgoing: Array.from(new Set(outgoing)),
      incoming: Array.from(new Set(incoming)),
    };
  }, [selectedNode, fullGraphData]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0d0d] font-mono">
      {/* ── Top Header Section (Exact Reference Layout) ── */}
      <div className="px-6 md:px-10 pt-6 pb-4 border-b border-white/[0.08] flex flex-col md:flex-row md:items-end justify-between gap-4 bg-[#0a0a0a]">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#666] font-bold mb-1">
            DEPENDENCY EXPLORER
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <span>{viewMode === 'full' ? 'Full stack graph' : 'Circular dependency detection'}</span>
          </h1>
        </div>

        {/* View Mode Selector & Reset Focus */}
        <div className="flex items-center gap-2.5">
          {/* Dropdown to switch between Full Graph and Cycle Detection */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-[#141414] hover:bg-[#181818] border border-white/[0.1] rounded-xl text-xs font-bold text-white font-mono transition-colors shadow-lg"
            >
              <span>{viewMode === 'full' ? 'Full graph' : 'Cycle detection'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#181818] border border-white/[0.12] rounded-xl shadow-2xl overflow-hidden z-50 py-1 font-mono text-xs animate-fade-in">
                <button
                  onClick={() => {
                    setViewMode('full');
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 transition-colors flex items-center justify-between ${
                    viewMode === 'full' ? 'bg-[#00d4d4]/10 text-[#00d4d4] font-bold' : 'text-[#888] hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <span>Full graph</span>
                  {viewMode === 'full' && <span className="w-1.5 h-1.5 rounded-full bg-[#00d4d4]" />}
                </button>
                <button
                  onClick={() => {
                    setViewMode('cycles');
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 transition-colors flex items-center justify-between ${
                    viewMode === 'cycles' ? 'bg-[#00d4d4]/10 text-[#00d4d4] font-bold' : 'text-[#888] hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <span>Cycle detection</span>
                  {viewMode === 'cycles' && <span className="w-1.5 h-1.5 rounded-full bg-[#00d4d4]" />}
                </button>
              </div>
            )}
          </div>

          {/* Reset Focus Button */}
          <button
            onClick={handleResetFocus}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#141414] hover:bg-[#181818] border border-white/[0.08] hover:border-white/[0.16] rounded-xl text-xs text-[#888] hover:text-white font-mono transition-colors shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wider font-bold text-[10px]">RESET</span>
          </button>
        </div>
      </div>

      {/* ── Main View Content ── */}
      {viewMode === 'full' ? (
        /* Full Stack Interactive Graph */
        <div className="flex-1 relative overflow-hidden">
          {graphLoading ? (
            <div className="flex-1 flex items-center justify-center h-full">
              <LoadingSpinner
                label="Loading full stack graph topology..."
                sublabel="Streaming all registered packages from CognoDB Bolt instance"
              />
            </div>
          ) : fullGraphData ? (
            <>
              <GraphCanvas
                data={fullGraphData}
                rootPackageName={null}
                selectedPackageName={selectedNode?.name}
                onSelectNode={(node) => {
                  setSelectedNode(node);
                }}
              />

              {/* Floating Node Connection Details Card on Full Graph View */}
              {selectedNode && selectedNodeConnections && (
                <div className="absolute top-6 right-6 w-80 bg-[#121316]/95 border border-[#00d4d4]/40 backdrop-blur-2xl rounded-2xl shadow-2xl p-4 z-30 font-mono space-y-3 animate-fade-in">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2.5">
                      <ToolIcon name={selectedNode.name} size="sm" />
                      <div>
                        <div className="text-sm font-bold text-white leading-tight">{selectedNode.name}</div>
                        <div className="text-[9px] text-[#00d4d4] font-bold uppercase tracking-wider">ACTIVE TOOL CONNECTIONS</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="p-1 hover:bg-white/[0.08] text-[#888] hover:text-white rounded-lg transition-colors"
                      title="Clear focus"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Direct Outgoing Dependencies */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-[#888] font-bold">
                      <span className="flex items-center gap-1 text-white">
                        <span className="w-2 h-2 rounded-full bg-[#00d4d4] inline-block" />
                        DEPENDS ON (OUTGOING)
                      </span>
                      <span className="text-[#00d4d4] font-bold">{selectedNodeConnections.outgoing.length}</span>
                    </div>
                    {selectedNodeConnections.outgoing.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                        {selectedNodeConnections.outgoing.map((depName) => (
                          <button
                            key={depName}
                            onClick={() => {
                              const targetNode = fullGraphData?.nodes.find((n) => n.name === depName);
                              if (targetNode) setSelectedNode(targetNode);
                            }}
                            className="px-2.5 py-1 bg-[#181a20] hover:bg-[#20222a] border border-white/[0.08] hover:border-[#00d4d4] text-[10px] text-white rounded-lg transition-colors flex items-center gap-1.5"
                            title="Click to focus in graph"
                          >
                            <ToolIcon name={depName} size="xs" />
                            <span>{depName}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-[#666] italic bg-[#0d0e12] p-2 rounded-lg border border-white/[0.04]">
                        Leaf package • No outgoing dependencies
                      </div>
                    )}
                  </div>

                  {/* Direct Incoming Dependents */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[10px] text-[#888] font-bold">
                      <span className="flex items-center gap-1 text-white">
                        <span className="w-2 h-2 rounded-full border border-[#38bdf8] border-dashed inline-block" />
                        USED BY (INCOMING)
                      </span>
                      <span className="text-[#38bdf8] font-bold">{selectedNodeConnections.incoming.length}</span>
                    </div>
                    {selectedNodeConnections.incoming.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                        {selectedNodeConnections.incoming.map((depName) => (
                          <button
                            key={depName}
                            onClick={() => {
                              const targetNode = fullGraphData?.nodes.find((n) => n.name === depName);
                              if (targetNode) setSelectedNode(targetNode);
                            }}
                            className="px-2.5 py-1 bg-[#181a20] hover:bg-[#20222a] border border-white/[0.08] hover:border-[#38bdf8] text-[10px] text-white rounded-lg transition-colors flex items-center gap-1.5"
                            title="Click to focus in graph"
                          >
                            <ToolIcon name={depName} size="xs" />
                            <span>{depName}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-[#666] italic bg-[#0d0e12] p-2 rounded-lg border border-white/[0.04]">
                        Root package • No reverse dependents
                      </div>
                    )}
                  </div>

                  {/* Footer Action */}
                  <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between">
                    <span className="text-[9px] text-[#666]">Click any connection to focus</span>
                    {onNavigateToExplorer && (
                      <button
                        onClick={() => onNavigateToExplorer(selectedNode.name)}
                        className="text-[10px] text-[#00d4d4] hover:underline font-bold flex items-center gap-1"
                      >
                        <span>Catalog view</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center h-full text-[#666] text-sm">
              Failed to load graph data
            </div>
          )}
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════ */
        /* Cycle Detection Visualizer & Topology Scanner          */
        /* ══════════════════════════════════════════════════════ */
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-radial-gradient">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Top Scanning Status Card */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
              <div className="p-4 bg-[#141414] border border-white/[0.08] rounded-xl shadow-sm">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#666] font-bold mb-1">SCAN STATUS</div>
                <div className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  <span>{cycles.length === 0 ? 'Healthy DAG' : `${count} Cycles`}</span>
                </div>
              </div>

              <div className="p-4 bg-[#141414] border border-white/[0.08] rounded-xl shadow-sm">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#666] font-bold mb-1">EXECUTION TIME</div>
                <div className="text-xl font-bold text-white tracking-tight">{scanDurationMs} ms</div>
              </div>

              <div className="p-4 bg-[#141414] border border-white/[0.08] rounded-xl shadow-sm">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#666] font-bold mb-1">TRAVERSAL ENGINE</div>
                <div className="text-xl font-bold text-[#00d4d4] tracking-tight">CognoDB Bolt</div>
              </div>

              <div className="p-4 bg-[#141414] border border-white/[0.08] rounded-xl shadow-sm">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#666] font-bold mb-1">CYCLE RISK</div>
                <div className="text-xl font-bold text-white">
                  {cycles.length === 0 && activeCycleSimulation === 'db-live' ? (
                    <span className="text-emerald-400 font-bold">0% (Safe)</span>
                  ) : (
                    <span className="text-amber-400 font-bold flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-rose-500" /> High Risk
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Interactive Cycle Simulator & Selector */}
            <div className="p-6 bg-[#141414] border border-white/[0.08] rounded-2xl shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Play className="w-4 h-4 text-[#00d4d4]" />
                  <span>Cycle Traversal Mode & Simulations</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-[#666] font-bold">
                  Select a live or simulated loop to render
                </span>
              </div>

              {/* Cycle selector buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <button
                  onClick={() => setActiveCycleSimulation('db-live')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    activeCycleSimulation === 'db-live'
                      ? 'bg-[#00d4d4]/15 border-[#00d4d4] text-[#00d4d4] shadow-[0_0_15px_-3px_rgba(0,212,212,0.3)]'
                      : 'bg-[#181818] border-white/[0.08] text-[#888] hover:text-white hover:border-white/[0.16]'
                  }`}
                >
                  <div className="text-xs font-bold text-white flex items-center justify-between mb-1">
                    <span>Live Database</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                      {cycles.length} Found
                    </span>
                  </div>
                  <p className="text-[10px] text-[#666] line-clamp-1">Current CognoDB live dataset</p>
                </button>

                {SIMULATION_CYCLES.map((sim) => (
                  <button
                    key={sim.id}
                    onClick={() => setActiveCycleSimulation(sim.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      activeCycleSimulation === sim.id
                        ? 'bg-amber-500/15 border-amber-500 text-amber-400 shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)]'
                        : 'bg-[#181818] border-white/[0.08] text-[#888] hover:text-white hover:border-white/[0.16]'
                    }`}
                  >
                    <div className="text-xs font-bold text-white flex items-center justify-between mb-1">
                      <span>{sim.hops}-Hop Cycle</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/40">
                        Test Demo
                      </span>
                    </div>
                    <p className="text-[10px] text-[#666] line-clamp-1">{sim.nodes.join(' ➔ ')}</p>
                  </button>
                ))}
              </div>

              {/* Filter by Specific Tool Chips */}
              {allCycleTools.length > 0 && (
                <div className="pt-3 border-t border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#888] font-bold">Filter Cycles by Tool:</span>
                    {selectedToolFilter && (
                      <button
                        onClick={() => setSelectedToolFilter(null)}
                        className="text-[10px] text-[#00d4d4] hover:underline font-bold"
                      >
                        Show All Tools ({cycles.length})
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedToolFilter(null)}
                      className={`px-3 py-1 rounded-full text-xs font-bold font-mono transition-all ${
                        selectedToolFilter === null
                          ? 'bg-[#00d4d4] text-black shadow-[0_0_10px_rgba(0,212,212,0.3)]'
                          : 'bg-[#181818] border border-white/[0.08] text-[#888] hover:text-white'
                      }`}
                    >
                      All Tools ({cycles.length})
                    </button>
                    {allCycleTools.map((toolName) => {
                      const toolCycleCount = cycles.filter((c) => c.includes(toolName)).length;
                      const isSelected = selectedToolFilter === toolName;
                      return (
                        <button
                          key={toolName}
                          onClick={() => {
                            setSelectedToolFilter(isSelected ? null : toolName);
                            setSelectedLiveCycleIndex(0);
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                              : 'bg-[#181818] border border-white/[0.08] text-[#888] hover:text-white'
                          }`}
                        >
                          <ToolIcon name={toolName} size="xs" />
                          <span>{toolName}</span>
                          <span className="text-[10px] opacity-75">({toolCycleCount})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Visual Animated Graph of the Active Cycle */}
            <div className="p-6 bg-[#141414] border border-white/[0.08] rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Repeat className="w-4 h-4 text-amber-400 animate-spin" />
                  <span>
                    {activeCycleSimulation === 'db-live'
                      ? 'Live Cycle Visualizer'
                      : `Visual Graph Representation (${activeCycleSimulation})`}
                  </span>
                </div>

                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-800/40">
                  Continuous Closed Loop
                </span>
              </div>

              {/* Mini Graph Canvas for the Circular Chain */}
              {currentCycleGraphData.nodes.length > 0 ? (
                <div className="h-80 w-full rounded-xl overflow-hidden border border-white/[0.08] relative bg-[#090909]">
                  <GraphCanvas
                    data={currentCycleGraphData}
                    rootPackageName={currentCycleGraphData.nodes[0]?.name}
                    selectedPackageName={currentCycleGraphData.nodes[0]?.name}
                    onSelectNode={(node) => {
                      if (onNavigateToExplorer) onNavigateToExplorer(node.name);
                    }}
                  />
                  <div className="absolute top-3 right-3 text-[10px] font-mono text-[#888] bg-[#141414]/90 px-2.5 py-1 rounded-md border border-white/[0.08]">
                    Click any node to explore in catalog
                  </div>
                </div>
              ) : (
                <div className="p-10 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h3 className="text-base font-bold text-white">Zero Circular Loops in Database</h3>
                  <p className="text-xs text-[#888] max-w-md mx-auto">
                    The database graph forms a strictly acyclic Directed Acyclic Graph (DAG). Click any of the test simulation buttons above to preview cycle detection graph rendering.
                  </p>
                </div>
              )}

              {/* Chain Node Hop Breakdown for Live Database */}
              {activeCycleSimulation === 'db-live' && cycles.length > 0 && (
                <div className="pt-4 border-t border-white/[0.06] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      Live Detected Chains in CognoDB ({cycles.length}):
                    </span>
                    <span className="text-[10px] text-[#888]">
                      Viewing Chain #{selectedLiveCycleIndex + 1}
                    </span>
                  </div>

                  {/* Chain switcher if multiple cycles */}
                  {cycles.length > 1 && (
                    <div className="flex flex-wrap gap-2">
                      {cycles.map((c, cIdx) => (
                        <button
                          key={cIdx}
                          onClick={() => setSelectedLiveCycleIndex(cIdx)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                            selectedLiveCycleIndex === cIdx
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                              : 'bg-[#181818] border-white/[0.08] text-[#888] hover:text-white'
                          }`}
                        >
                          Chain #{cIdx + 1} ({c.length - 1} hops)
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center flex-wrap gap-2.5 pt-1">
                    {cycles[selectedLiveCycleIndex]?.map((nodeName, idx, arr) => {
                      const isEnd = idx === arr.length - 1;
                      return (
                        <React.Fragment key={idx}>
                          <button
                            onClick={() => onNavigateToExplorer && onNavigateToExplorer(nodeName)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 shadow-md ${
                              isEnd
                                ? 'bg-rose-950/90 text-rose-300 border border-rose-700/60 hover:bg-rose-900'
                                : 'bg-[#1a1a1a] text-white border border-white/[0.08] hover:border-[#00d4d4] hover:bg-[#222]'
                            }`}
                            title="Click to inspect in Explorer"
                          >
                            <ToolIcon name={nodeName} size="xs" />
                            <span>{nodeName}</span>
                          </button>
                          {!isEnd && (
                            <ArrowRight className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Chain Node Hop Breakdown for Test Simulations */}
              {activeCycleSimulation !== 'db-live' && (
                <div className="pt-3 border-t border-white/[0.06] space-y-3">
                  <div className="text-xs text-[#888]">
                    {SIMULATION_CYCLES.find((s) => s.id === activeCycleSimulation)?.desc}
                  </div>

                  <div className="flex items-center flex-wrap gap-2.5 pt-1">
                    {SIMULATION_CYCLES.find((s) => s.id === activeCycleSimulation)?.nodes.map((nodeName, idx, arr) => {
                      const isEnd = idx === arr.length - 1;
                      return (
                        <React.Fragment key={idx}>
                          <button
                            onClick={() => onNavigateToExplorer && onNavigateToExplorer(nodeName)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 shadow-md ${
                              isEnd
                                ? 'bg-rose-950/90 text-rose-300 border border-rose-700/60 hover:bg-rose-900'
                                : 'bg-[#1a1a1a] text-white border border-white/[0.08] hover:border-[#00d4d4] hover:bg-[#222]'
                            }`}
                            title="Click to inspect in Explorer"
                          >
                            <ToolIcon name={nodeName} size="xs" />
                            <span>{nodeName}</span>
                          </button>
                          {!isEnd && (
                            <ArrowRight className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Technical Cypher Execution Console */}
            <div className="p-6 bg-[#141414] border border-white/[0.08] rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Terminal className="w-4 h-4 text-[#00d4d4]" />
                  <span>Cypher Graph Path Traversal Query</span>
                </div>
                <button
                  onClick={fetchCycles}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-[#181818] hover:bg-[#202020] border border-white/[0.08] text-[10px] text-[#00d4d4] rounded-md transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  <span>Re-run Query</span>
                </button>
              </div>

              <div className="p-4 bg-[#090909] rounded-xl border border-white/[0.06] font-mono text-xs text-[#00d4d4] overflow-x-auto shadow-inner">
{`MATCH path = (p:Package)-[:DEPENDS_ON*2..]->(p)
RETURN [n IN nodes(path) | n.name] AS cycle
LIMIT 20`}
              </div>

              <div className="text-[11px] text-[#888] flex items-center justify-between pt-1">
                <span>Result: <strong className="text-white">{cycles.length} circular paths found</strong></span>
                <span className="text-[#666]">Index-free adjacency traversal in CognoDB</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
