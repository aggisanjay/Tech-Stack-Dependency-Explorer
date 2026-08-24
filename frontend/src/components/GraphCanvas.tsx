import React, { useRef, useEffect, useState, useMemo } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Eye, Layers, Activity } from 'lucide-react';
import { GraphData, PackageNode, DependencyLink } from '../types/index.js';

interface GraphCanvasProps {
  data: GraphData;
  rootPackageName?: string | null;
  selectedPackageName?: string | null;
  onSelectNode: (pkg: PackageNode) => void;
}

// Download Heatmap Color Mapper: Blue (low) -> Cyan -> Emerald -> Amber -> Red (high)
function getNodeColor(downloads: number, isRoot: boolean, isSelected: boolean): string {
  if (isSelected) return '#f43f5e'; // Rose-500 for active selection
  if (isRoot) return '#6366f1';     // Brand Indigo for root query package

  if (downloads >= 35000000) return '#ef4444'; // Red (Ultra Popular)
  if (downloads >= 20000000) return '#f97316'; // Orange
  if (downloads >= 10000000) return '#eab308'; // Amber/Yellow
  if (downloads >= 5000000) return '#10b981';  // Emerald
  return '#38bdf8';                            // Cyan/Blue (Base)
}

function getLinkColor(type: string): string {
  switch (type) {
    case 'dev':
      return 'rgba(168, 85, 247, 0.65)'; // Purple for devDependencies
    case 'peer':
      return 'rgba(245, 158, 11, 0.65)'; // Amber for peerDependencies
    case 'prod':
    default:
      return 'rgba(99, 102, 241, 0.65)'; // Indigo/Cyan for prodDependencies
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
  const [enableParticles, setEnableParticles] = useState(true);
  const [showLegend, setShowLegend] = useState(true);

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
      const timer = setTimeout(() => {
        fgRef.current?.zoomToFit(400, 60);
      }, 250);
      return () => clearTimeout(timer);
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

    // Center camera on clicked node with smooth spring motion
    if (fgRef.current && node.x !== undefined && node.y !== undefined) {
      fgRef.current.centerAt(node.x, node.y, 400);
      fgRef.current.zoom(1.6, 400);
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
      fgRef.current.zoomToFit(400, 70);
    }
  };

  const handleResetCenter = () => {
    if (fgRef.current) {
      fgRef.current.centerAt(0, 0, 400);
      fgRef.current.zoom(1, 400);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#06080f] overflow-hidden select-none bg-grid-pattern">
      {/* Visual Force Graph 2D Canvas */}
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeId="id"
        nodeLabel={() => ''} // Handled by custom canvas rendering
        linkSource="source"
        linkTarget="target"
        linkColor={(link: any) => getLinkColor(link.type)}
        linkWidth={(link: any) => (hoveredLink === link ? 3.5 : 1.75)}
        linkDirectionalArrowLength={6.5}
        linkDirectionalArrowRelPos={0.94}
        linkDirectionalArrowColor={(link: any) => getLinkColor(link.type)}
        linkDirectionalParticles={(link: any) => (enableParticles ? (hoveredLink === link ? 5 : 2) : 0)}
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalParticleWidth={2.5}
        linkDirectionalParticleColor={() => '#38bdf8'}
        onNodeClick={handleNodeClick}
        onNodeHover={(node: any) => setHoveredNode(node || null)}
        onLinkHover={(link: any) => setHoveredLink(link || null)}
        d3AlphaDecay={0.035}
        d3VelocityDecay={0.25}
        cooldownTicks={140}
        nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const isRoot = node.name === rootPackageName;
          const isSelected = node.name === selectedPackageName;
          const isHovered = hoveredNode?.name === node.name;

          // Node radius calculation based on weekly downloads
          const baseRadius = 8;
          const downloadBonus = Math.min(6, Math.log10(Math.max(1, node.weeklyDownloads || 1)) * 0.75);
          const radius = baseRadius + downloadBonus + (isRoot ? 4 : 0) + (isSelected ? 3 : 0);

          const color = getNodeColor(node.weeklyDownloads, isRoot, isSelected);

          // Outer Glow Halo
          if (isSelected || isRoot || isHovered) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius + (isRoot ? 8 : 6) / globalScale, 0, 2 * Math.PI, false);
            ctx.fillStyle = isSelected
              ? 'rgba(244, 63, 94, 0.35)'
              : isRoot
              ? 'rgba(99, 102, 241, 0.4)'
              : 'rgba(56, 189, 248, 0.35)';
            ctx.fill();

            // Additional subtle pulsating outer stroke for root
            if (isRoot) {
              ctx.lineWidth = 1.5 / globalScale;
              ctx.strokeStyle = 'rgba(165, 180, 252, 0.7)';
              ctx.stroke();
            }
          }

          // Node Solid Body
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
          ctx.fillStyle = color;
          ctx.fill();

          // Node Inner Specular Ring
          ctx.lineWidth = (isRoot || isSelected ? 2.5 : 1.5) / globalScale;
          ctx.strokeStyle = isSelected ? '#ffffff' : isRoot ? '#e0e7ff' : 'rgba(255, 255, 255, 0.75)';
          ctx.stroke();

          // Text Label Rendering
          if (showLabels || globalScale > 1.1 || isRoot || isSelected || isHovered) {
            const fontSize = Math.max(11 / globalScale, 3.2);
            ctx.font = `600 ${fontSize}px 'Plus Jakarta Sans', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const label = node.name;
            const textY = node.y + radius + 11 / globalScale;

            // Background pill for label to guarantee readability over canvas links
            const textWidth = ctx.measureText(label).width;
            const paddingX = 4 / globalScale;
            const paddingY = 2 / globalScale;
            const pillRadius = 3 / globalScale;

            ctx.fillStyle = 'rgba(8, 11, 19, 0.9)';
            ctx.beginPath();
            ctx.roundRect(
              node.x - textWidth / 2 - paddingX,
              textY - fontSize / 2 - paddingY,
              textWidth + paddingX * 2,
              fontSize + paddingY * 2,
              pillRadius
            );
            ctx.fill();
            ctx.lineWidth = 0.75 / globalScale;
            ctx.strokeStyle = isSelected ? '#f43f5e' : isRoot ? '#818cf8' : 'rgba(255, 255, 255, 0.12)';
            ctx.stroke();

            // Label text typography
            ctx.fillStyle = isSelected ? '#fda4af' : isRoot ? '#c7d2fe' : '#f1f5f9';
            ctx.fillText(label, node.x, textY);
          }
        }}
      />

      {/* Floating Canvas Controls HUD */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-1.5 bg-[#0e1322]/90 border border-white/[0.08] backdrop-blur-xl p-1.5 rounded-2xl shadow-2xl z-20">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2 text-slate-300 hover:text-white hover:bg-white/[0.08] rounded-xl transition-colors"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2 text-slate-300 hover:text-white hover:bg-white/[0.08] rounded-xl transition-colors"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="h-px bg-white/[0.06] my-0.5" />
        <button
          onClick={handleFitView}
          title="Fit to Screen"
          className="p-2 text-slate-300 hover:text-white hover:bg-white/[0.08] rounded-xl transition-colors"
          aria-label="Fit to screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetCenter}
          title="Reset View"
          className="p-2 text-slate-300 hover:text-white hover:bg-white/[0.08] rounded-xl transition-colors"
          aria-label="Reset view"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <div className="h-px bg-white/[0.06] my-0.5" />
        <button
          onClick={() => setShowLabels(!showLabels)}
          title={showLabels ? 'Hide Node Labels' : 'Show Node Labels'}
          className={`p-2 rounded-xl transition-colors ${
            showLabels ? 'text-brand-400 bg-brand-500/20' : 'text-slate-400 hover:bg-white/[0.08]'
          }`}
          aria-label="Toggle labels"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => setEnableParticles(!enableParticles)}
          title={enableParticles ? 'Disable Flow Particles' : 'Enable Flow Particles'}
          className={`p-2 rounded-xl transition-colors ${
            enableParticles ? 'text-cyan-400 bg-cyan-500/20' : 'text-slate-400 hover:bg-white/[0.08]'
          }`}
          aria-label="Toggle flow particles"
        >
          <Activity className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Heatmap & Link Legend HUD */}
      {showLegend && (
        <div className="absolute top-6 left-6 bg-[#0e1322]/90 border border-white/[0.08] backdrop-blur-xl p-3.5 rounded-2xl shadow-2xl text-xs z-20 hidden md:block max-w-[240px]">
          <div className="flex items-center justify-between font-bold text-white mb-2.5 pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-brand-400" />
              <span className="text-xs">Graph Legend</span>
            </div>
            <button
              onClick={() => setShowLegend(false)}
              className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-800"
            >
              Hide
            </button>
          </div>

          {/* Heatmap spectrum */}
          <div className="mb-3 space-y-1.5">
            <div className="text-[11px] text-slate-400 flex justify-between font-medium">
              <span>Weekly Downloads</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300 font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0" />
                <span>&lt; 5M</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span>5M - 10M</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span>10M - 20M</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                <span>35M+</span>
              </div>
            </div>
          </div>

          {/* Relationship types */}
          <div className="space-y-1.5 text-[11px] text-slate-300 pt-2 border-t border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-1 bg-brand-500 rounded-full inline-block" />
              <span>prod (Production)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-1 bg-purple-400 rounded-full inline-block" />
              <span>dev (devDependencies)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-1 bg-amber-400 rounded-full inline-block" />
              <span>peer (peerDependencies)</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Node Hover Card */}
      {hoveredNode && (
        <div className="absolute bottom-6 right-6 bg-[#0e1322]/95 border border-brand-500/40 backdrop-blur-2xl p-4 rounded-2xl shadow-2xl max-w-sm z-20 pointer-events-none animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{hoveredNode.name}</span>
              <span className="text-xs text-brand-300 font-mono bg-brand-950/80 px-2 py-0.5 rounded border border-brand-800/40">
                v{hoveredNode.version}
              </span>
            </div>
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">
              {hoveredNode.license}
            </span>
          </div>

          <p className="text-xs text-slate-300 line-clamp-2 mb-2.5">
            {hoveredNode.description || 'No description provided'}
          </p>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/[0.06] font-mono">
            <span>📥 {hoveredNode.weeklyDownloads.toLocaleString()} /wk</span>
            <span className="text-brand-400 font-semibold">Click to center</span>
          </div>
        </div>
      )}

      {/* Floating Link Hover Card */}
      {hoveredLink && (
        <div className="absolute top-6 right-6 bg-[#0e1322]/95 border border-white/[0.1] backdrop-blur-2xl p-3.5 rounded-2xl shadow-2xl z-20 pointer-events-none">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-300 font-bold">
              {typeof hoveredLink.source === 'object' ? (hoveredLink.source as any).name : hoveredLink.source}
            </span>
            <span className="text-brand-400 font-bold">─[:DEPENDS_ON]─&gt;</span>
            <span className="text-white font-bold">
              {typeof hoveredLink.target === 'object' ? (hoveredLink.target as any).name : hoveredLink.target}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-4 text-[11px] text-slate-400 pt-1.5 border-t border-white/[0.06]">
            <span>SemVer: <strong className="text-brand-300 font-mono">{hoveredLink.versionRange}</strong></span>
            <span className="capitalize px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 font-mono text-[10px]">
              {hoveredLink.type} dependency
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
