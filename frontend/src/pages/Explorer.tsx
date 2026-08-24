import React, { useState, useCallback } from 'react';
import { SearchBar } from '../components/SearchBar.js';
import { GraphCanvas } from '../components/GraphCanvas.js';
import { PackageCard } from '../components/PackageCard.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { EmptyState } from '../components/EmptyState.js';
import { api } from '../api/client.js';
import { GraphData, PackageNode } from '../types/index.js';
import { Network, GitFork, AlertTriangle, RefreshCw, SlidersHorizontal } from 'lucide-react';

interface ExplorerProps {
  onShowToast: (msg: string, type?: 'error' | 'success' | 'info') => void;
}

export const Explorer: React.FC<ExplorerProps> = ({ onShowToast }) => {
  const [selectedRoot, setSelectedRoot] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<PackageNode | null>(null);
  const [depth, setDepth] = useState<number>(2);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchGraph = useCallback(
    async (packageName: string, currentDepth: number) => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const data = await api.getPackageDependencies(packageName, currentDepth);
        setGraphData(data);
        setSelectedRoot(packageName);

        // Update selectedNode info
        const matched = data.nodes.find((n) => n.name === packageName);
        if (matched) {
          setSelectedNode(matched);
        } else if (data.nodes.length > 0) {
          setSelectedNode(data.nodes[0]);
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

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#080b13]">
      {/* Top Search & Controls Bar */}
      <div className="z-30 px-6 py-3.5 bg-[#0b0f1c]/90 border-b border-white/[0.08] backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-auto flex-1 max-w-2xl">
          <SearchBar
            onSelectPackage={handleSelectPackage}
            selectedPackage={selectedRoot}
            onError={(msg) => onShowToast(msg, 'error')}
          />
        </div>

        {/* Graph Meta Statistics & Depth Controls */}
        {graphData && (
          <div className="flex flex-wrap items-center gap-3 self-end md:self-center text-xs font-mono">
            {/* Quick depth selector */}
            <div className="flex items-center gap-1 bg-slate-950/80 border border-white/[0.08] p-1 rounded-xl">
              <span className="px-2 text-[11px] text-slate-400 font-sans font-medium flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3 text-brand-400" />
                <span>Depth:</span>
              </span>
              {[1, 2, 3].map((d) => (
                <button
                  key={d}
                  onClick={() => handleDepthChange(d)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    depth === d
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                  title={`Traverse ${d} hop(s)`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Statistics Badges */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 border border-white/[0.08] px-3 py-1.5 rounded-xl text-slate-300">
              <Network className="w-3.5 h-3.5 text-brand-400" />
              <span>
                <strong className="text-white">{graphData.nodes.length}</strong> Packages
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950/80 border border-white/[0.08] px-3 py-1.5 rounded-xl text-slate-300">
              <GitFork className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                <strong className="text-white">{graphData.links.length}</strong> Dependencies
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Graph Area */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#080b13]/85 z-20 backdrop-blur-md">
              <LoadingSpinner
                label={`Traversing dependencies for '${selectedRoot}'...`}
                sublabel={`MATCH path = (root:Package {name: "${selectedRoot}"})-[:DEPENDS_ON*1..${depth}]->(dep:Package)`}
              />
            </div>
          ) : null}

          {errorMessage && !loading ? (
            <div className="p-8 max-w-md bg-[#0e1322]/90 border border-red-500/30 rounded-3xl text-center space-y-4 shadow-2xl z-20 backdrop-blur-xl">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Graph Query Failed</h3>
                <p className="text-xs text-slate-400 mt-1">{errorMessage}</p>
              </div>
              {selectedRoot && (
                <button
                  onClick={() => fetchGraph(selectedRoot, depth)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-brand-600/30 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Cypher Query</span>
                </button>
              )}
            </div>
          ) : !graphData ? (
            <EmptyState onSelectPackage={handleSelectPackage} />
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
};
