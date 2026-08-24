import React, { useRef, useEffect, useState, useMemo } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Eye, Layers } from 'lucide-react';
import { GraphData, PackageNode, DependencyLink } from '../types/index.js';

interface GraphCanvasProps {
  data: GraphData;
  rootPackageName?: string | null;
  selectedPackageName?: string | null;
  onSelectNode: (pkg: PackageNode) => void;
}

// Download Heatmap Color Mapper: Blue (low) -> Cyan -> Green -> Amber -> Red (high)
function getNodeColor(downloads: number, isRoot: boolean, isSelected: boolean): string {
  if (isSelected) return '#f43f5e'; // Vibrant Rose for selected
  if (isRoot) return '#6366f1';     // Indigo for current root

  if (downloads >= 35000000) return '#ef4444'; // Red (Ultra High)
  if (downloads >= 20000000) return '#f97316'; // Orange (High)
  if (downloads >= 10000000) return '#eab308'; // Yellow/Amber (Medium-High)
  if (downloads >= 5000000) return '#10b981';  // Emerald (Medium)
  return '#3b82f6';                            // Blue (Base/Low)
}

function getLinkColor(type: string): string {
  switch (type) {
    case 'dev':
      return 'rgba(168, 85, 247, 0.6)'; // Purple for devDeps
    case 'peer':
      return 'rgba(245, 158, 11, 0.6)'; // Amber for peerDeps
    case 'prod':
    default:
      return 'rgba(99, 102, 241, 0.65)'; // Indigo/Cyan for prodDeps
  }
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  data,
  rootPackageName,
  selectedPackageName,
  onSelectNode,
}) => {
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<PackageNode | null>(null);
  const [hoveredLink, setHoveredLink] = useState<DependencyLink | null>(null);
  const [showLabels, setShowLabels] = useState(true);

  // Resize observer to fill container seamlessly
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({
          width: clientWidth || 800,
          height: clientHeight || 600,
        });
      }
    };

    updateDimensions();
    const ro = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }

    return () => ro.disconnect();
  }, []);

  // Zoom to fit on initial data load or root change
  useEffect(() => {
    if (fgRef.current && data.nodes.length > 0) {
      setTimeout(() => {
        fgRef.current?.zoomToFit(400, 50);
      }, 300);
    }
  }, [data, rootPackageName]);

  // Clone data for ForceGraph2D runtime mutation safety
  const graphData = useMemo(() => {
    return {
      nodes: data.nodes.map((node) => ({ ...node })),
      links: data.links.map((link) => ({ ...link })),
    };
  }, [data]);

  const handleNodeClick = (node: any) => {
    onSelectNode(node as PackageNode);

    // Center camera on clicked node
    if (fgRef.current && node.x !== undefined && node.y !== undefined) {
      fgRef.current.centerAt(node.x, node.y, 400);
      fgRef.current.zoom(1.8, 400);
    }
  };

  const handleZoomIn = () => {
    if (fgRef.current) {
      fgRef.current.zoom(fgRef.current.zoom() * 1.3, 300);
    }
  };

  const handleZoomOut = () => {
    if (fgRef.current) {
      fgRef.current.zoom(fgRef.current.zoom() / 1.3, 300);
    }
  };

  const handleFitView = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400, 60);
    }
  };

  const handleResetCenter = () => {
    if (fgRef.current) {
      fgRef.current.centerAt(0, 0, 400);
      fgRef.current.zoom(1, 400);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#070a12] overflow-hidden select-none">
      {/* Visual Canvas */}
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeId="id"
        nodeLabel={() => ''} // Use custom canvas rendering
        linkSource="source"
        linkTarget="target"
        linkColor={(link: any) => getLinkColor(link.type)}
        linkWidth={(link: any) => (hoveredLink === link ? 3 : 1.5)}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={0.95}
        linkDirectionalArrowColor={(link: any) => getLinkColor(link.type)}
        linkDirectionalParticles={(link: any) => (hoveredLink === link ? 4 : 1)}
        linkDirectionalParticleSpeed={0.006}
        linkDirectionalParticleWidth={2.5}
        linkDirectionalParticleColor={() => '#38bdf8'}
        onNodeClick={handleNodeClick}
        onNodeHover={(node: any) => setHoveredNode(node || null)}
        onLinkHover={(link: any) => setHoveredLink(link || null)}
        d3AlphaDecay={0.03}
        d3VelocityDecay={0.2}
        cooldownTicks={120}
        nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const isRoot = node.name === rootPackageName;
          const isSelected = node.name === selectedPackageName;
          const isHovered = hoveredNode?.name === node.name;

          // Node radius calculation based on weekly downloads
          const baseRadius = 8;
          const downloadBonus = Math.min(6, Math.log10(Math.max(1, node.weeklyDownloads || 1)) * 0.8);
          const radius = baseRadius + downloadBonus + (isRoot ? 4 : 0) + (isSelected ? 3 : 0);

          const color = getNodeColor(node.weeklyDownloads, isRoot, isSelected);

          // Outer Glow
          if (isSelected || isRoot || isHovered) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius + 6 / globalScale, 0, 2 * Math.PI, false);
            ctx.fillStyle = isSelected
              ? 'rgba(244, 63, 94, 0.3)'
              : isRoot
              ? 'rgba(99, 102, 241, 0.35)'
              : 'rgba(56, 189, 248, 0.3)';
            ctx.fill();
          }

          // Node Body
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
          ctx.fillStyle = color;
          ctx.fill();

          // Border Ring
          ctx.lineWidth = (isRoot || isSelected ? 2.5 : 1.5) / globalScale;
          ctx.strokeStyle = isSelected ? '#ffffff' : isRoot ? '#c7d2fe' : 'rgba(255, 255, 255, 0.7)';
          ctx.stroke();

          // Text Label
          if (showLabels || globalScale > 1.2 || isRoot || isSelected || isHovered) {
            const fontSize = Math.max(11 / globalScale, 3);
            ctx.font = `600 ${fontSize}px 'Plus Jakarta Sans', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const label = node.name;
            const textY = node.y + radius + 10 / globalScale;

            // Background pill for label for maximum readability
            const textWidth = ctx.measureText(label).width;
            const padding = 3 / globalScale;
            ctx.fillStyle = 'rgba(10, 13, 20, 0.85)';
            ctx.fillRect(
              node.x - textWidth / 2 - padding,
              textY - fontSize / 2 - padding / 2,
              textWidth + padding * 2,
              fontSize + padding
            );

            // Label text
            ctx.fillStyle = isSelected ? '#fda4af' : isRoot ? '#a5b4fc' : '#e2e8f0';
            ctx.fillText(label, node.x, textY);
          }
        }}
      />

      {/* Floating Canvas Controls */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-2 bg-slate-900/90 border border-slate-800/90 backdrop-blur-md p-1.5 rounded-xl shadow-2xl z-20">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="h-px bg-slate-800 my-0.5" />
        <button
          onClick={handleFitView}
          title="Fit to Screen"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetCenter}
          title="Reset Center"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowLabels(!showLabels)}
          title={showLabels ? 'Hide Labels' : 'Show Labels'}
          className={`p-2 rounded-lg transition-colors ${
            showLabels ? 'text-indigo-400 bg-indigo-950/50' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Heatmap & Link Legend */}
      <div className="absolute top-6 left-6 bg-slate-900/90 border border-slate-800/90 backdrop-blur-md p-3 rounded-xl shadow-2xl text-xs z-20 hidden md:block">
        <div className="flex items-center gap-1.5 font-semibold text-slate-300 mb-2 pb-1.5 border-b border-slate-800">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Graph Legend</span>
        </div>

        {/* Heatmap spectrum */}
        <div className="mb-3 space-y-1">
          <div className="text-[11px] text-slate-400 flex justify-between">
            <span>Weekly Downloads</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-[11px] text-slate-400">&lt;5M</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ml-1" />
            <span className="text-[11px] text-slate-400">5M-10M</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ml-1" />
            <span className="text-[11px] text-slate-400">10M-20M</span>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 ml-1" />
            <span className="text-[11px] text-slate-400">35M+</span>
          </div>
        </div>

        {/* Relationship types */}
        <div className="space-y-1 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-indigo-500 inline-block" />
            <span>prod (production)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-purple-400 inline-block" />
            <span>dev (devDependencies)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-amber-400 inline-block" />
            <span>peer (peerDependencies)</span>
          </div>
        </div>
      </div>

      {/* Hover Info Tooltip */}
      {hoveredNode && (
        <div className="absolute bottom-6 right-6 bg-slate-900/95 border border-indigo-500/40 backdrop-blur-md p-3.5 rounded-xl shadow-2xl max-w-xs z-20 pointer-events-none animate-in fade-in duration-150">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-white text-sm">{hoveredNode.name}</span>
            <span className="text-xs text-indigo-300 font-mono">v{hoveredNode.version}</span>
          </div>
          <p className="text-xs text-slate-300 line-clamp-2 mb-2">
            {hoveredNode.description || 'No description provided'}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800 font-mono">
            <span>📥 {hoveredNode.weeklyDownloads.toLocaleString()} /wk</span>
            <span className="uppercase text-slate-400">{hoveredNode.license}</span>
          </div>
        </div>
      )}

      {/* Link Hover Tooltip */}
      {hoveredLink && (
        <div className="absolute top-6 right-6 bg-slate-900/95 border border-purple-500/40 backdrop-blur-md p-3 rounded-xl shadow-2xl z-20 pointer-events-none">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-300 font-bold">
              {typeof hoveredLink.source === 'object' ? (hoveredLink.source as any).name : hoveredLink.source}
            </span>
            <span className="text-indigo-400">→</span>
            <span className="text-white font-bold">
              {typeof hoveredLink.target === 'object' ? (hoveredLink.target as any).name : hoveredLink.target}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400">
            <span>Range: <strong className="text-indigo-300 font-mono">{hoveredLink.versionRange}</strong></span>
            <span className="capitalize px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              {hoveredLink.type}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
