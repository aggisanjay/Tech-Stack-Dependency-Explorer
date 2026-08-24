import React, { useRef, useEffect, useState, useMemo } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';
import { GraphData, PackageNode, DependencyLink } from '../types/index.js';

interface GraphCanvasProps {
  data: GraphData;
  rootPackageName?: string | null;
  selectedPackageName?: string | null;
  onSelectNode: (pkg: PackageNode) => void;
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

  // Resize observer
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
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Zoom to fit on initial load
  useEffect(() => {
    if (fgRef.current && data.nodes.length > 0) {
      const timer = setTimeout(() => {
        fgRef.current?.zoomToFit(400, 80);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [data, rootPackageName]);

  // Category mapping for badge
  const getNodeCategory = (name: string): { label: string; color: string; tier: number } => {
    const n = name.toLowerCase();
    if (['react', 'react-dom', 'next', 'vue', 'nuxt', 'angular', 'svelte', 'solid', 'preact', 'remix', 'astro', 'gatsby', 'tailwindcss'].includes(n)) {
      return { label: 'FRONTEND', color: '#00d4d4', tier: 1 };
    }
    if (['javascript', 'typescript', 'python', 'go', 'rust'].includes(n)) {
      return { label: 'LANGUAGE', color: '#38bdf8', tier: 2 };
    }
    if (['node.js', 'deno', 'bun', 'express', 'fastify', 'koa', 'nestjs', 'socket.io', 'cors', 'dotenv'].includes(n)) {
      return { label: 'BACKEND', color: '#a855f7', tier: 2 };
    }
    if (['prisma', 'drizzle', 'typeorm', 'mongoose', 'neo4j-driver', 'redis', 'rabbitmq', 'kafka'].includes(n)) {
      return { label: 'DATABASE', color: '#10b981', tier: 3 };
    }
    if (['docker', 'kubernetes', 'grafana', 'prometheus'].includes(n)) {
      return { label: 'DEVOPS', color: '#f59e0b', tier: 3 };
    }
    return { label: 'TOOLING', color: '#f43f5e', tier: 2 };
  };

  // Connected nodes set for active package
  const connectedNodeNames = useMemo(() => {
    const active = selectedPackageName || rootPackageName;
    if (!active) return new Set<string>();
    const set = new Set<string>([active]);
    data.links.forEach((l) => {
      const src = typeof l.source === 'object' ? (l.source as any).name : l.source;
      const tgt = typeof l.target === 'object' ? (l.target as any).name : l.target;
      if (src === active) set.add(tgt);
      if (tgt === active) set.add(src);
    });
    return set;
  }, [data.links, selectedPackageName, rootPackageName]);

  // Clone data and assign clean locked tiered grid coordinates
  const graphData = useMemo(() => {
    const tierGroups: Record<number, PackageNode[]> = { 1: [], 2: [], 3: [] };
    data.nodes.forEach((node) => {
      const cat = getNodeCategory(node.name);
      tierGroups[cat.tier].push(node);
    });

    const nodesWithPos: any[] = [];
    const colStep = 185; // 145px card width + 40px gap

    [1, 2, 3].forEach((tier) => {
      const group = tierGroups[tier] || [];
      const total = group.length;
      const baseY = (tier - 2) * 160; // Row 1 = -160, Row 2 = 0, Row 3 = +160

      group.forEach((node, idx) => {
        const posX = (idx - (total - 1) / 2) * colStep;
        const posY = baseY;
        nodesWithPos.push({
          ...node,
          x: posX,
          y: posY,
          fx: posX, // Lock X position so D3 physics does not collapse nodes
          fy: posY, // Lock Y position so D3 physics does not collapse nodes
        });
      });
    });

    return {
      nodes: nodesWithPos,
      links: data.links.map((link) => ({ ...link })),
    };
  }, [data]);

  const handleNodeClick = (node: any) => {
    onSelectNode(node as PackageNode);
    if (fgRef.current && node.x !== undefined && node.y !== undefined) {
      fgRef.current.centerAt(node.x, node.y, 400);
      fgRef.current.zoom(1.8, 400);
    }
  };

  const handleZoomIn = () => {
    if (fgRef.current) fgRef.current.zoom(fgRef.current.zoom() * 1.3, 300);
  };

  const handleZoomOut = () => {
    if (fgRef.current) fgRef.current.zoom(fgRef.current.zoom() / 1.3, 300);
  };

  const handleFitView = () => {
    if (fgRef.current) fgRef.current.zoomToFit(400, 80);
  };

  const handleResetCenter = () => {
    if (fgRef.current) {
      fgRef.current.centerAt(0, 0, 400);
      fgRef.current.zoom(1, 400);
    }
  };

  const activeFocusName = selectedPackageName || rootPackageName;

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#080808] overflow-hidden select-none bg-grid-pattern font-mono">
      {/* Force Graph 2D Canvas */}
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeId="id"
        nodeLabel={() => ''}
        linkSource="source"
        linkTarget="target"
        linkCanvasObjectMode={() => 'replace'}
        linkCanvasObject={(link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const src = link.source;
          const tgt = link.target;
          if (!src || !tgt || src.x === undefined || tgt.x === undefined) return;

          const isOutgoing = activeFocusName && src.name === activeFocusName;
          const isIncoming = activeFocusName && tgt.name === activeFocusName;
          const isHovered = hoveredLink === link;
          const isConnected = isOutgoing || isIncoming || isHovered;

          ctx.save();
          if (activeFocusName && !isConnected) {
            ctx.globalAlpha = 0.08;
          } else {
            ctx.globalAlpha = isConnected ? 1.0 : 0.35;
          }

          // Smooth Bezier Curve connecting from source bottom/top to target top/bottom
          const cardHeight = 44 / globalScale;
          const startX = src.x;
          const startY = src.y + (tgt.y > src.y ? cardHeight / 2 : -cardHeight / 2);
          const endX = tgt.x;
          const endY = tgt.y + (tgt.y > src.y ? -cardHeight / 2 : cardHeight / 2);

          const deltaY = endY - startY;

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.bezierCurveTo(
            startX,
            startY + deltaY * 0.5,
            endX,
            endY - deltaY * 0.5,
            endX,
            endY
          );

          if (isHovered) {
            ctx.setLineDash([]);
            ctx.strokeStyle = '#00d4d4';
            ctx.lineWidth = 3.2 / globalScale;
            ctx.shadowColor = '#00d4d4';
            ctx.shadowBlur = 10 / globalScale;
          } else if (isIncoming) {
            ctx.setLineDash([5 / globalScale, 5 / globalScale]);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2.4 / globalScale;
          } else if (isOutgoing) {
            ctx.setLineDash([]);
            ctx.strokeStyle = '#00d4d4';
            ctx.lineWidth = 2.8 / globalScale;
            ctx.shadowColor = '#00d4d4';
            ctx.shadowBlur = 8 / globalScale;
          } else {
            ctx.setLineDash([]);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1.2 / globalScale;
          }

          ctx.stroke();
          ctx.restore();
        }}
        linkDirectionalParticles={(link: any) => {
          const src = typeof link.source === 'object' ? link.source?.name : link.source;
          const tgt = typeof link.target === 'object' ? link.target?.name : link.target;
          const isConnected = activeFocusName && (src === activeFocusName || tgt === activeFocusName);
          return isConnected ? 3 : 0;
        }}
        linkDirectionalParticleSpeed={0.008}
        linkDirectionalParticleWidth={3}
        linkDirectionalParticleColor={() => '#00d4d4'}
        onNodeClick={handleNodeClick}
        onNodeHover={(node: any) => setHoveredNode(node || null)}
        onLinkHover={(link: any) => setHoveredLink(link || null)}
        onNodeDrag={(node: any) => {
          node.fx = node.x;
          node.fy = node.y;
        }}
        onNodeDragEnd={(node: any) => {
          node.fx = node.x;
          node.fy = node.y;
        }}
        cooldownTicks={0}
        warmupTicks={0}
        nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const isRoot = node.name === rootPackageName;
          const isSelected = node.name === selectedPackageName;
          const isHovered = hoveredNode?.name === node.name;
          const isConnected = !activeFocusName || connectedNodeNames.has(node.name);

          const cat = getNodeCategory(node.name);
          const label = node.name || 'node';
          
          // Card dimensions matching screenshot
          const nodeWidth = 145 / globalScale;
          const nodeHeight = 46 / globalScale;
          const radius = 10 / globalScale;

          const x = node.x - nodeWidth / 2;
          const y = node.y - nodeHeight / 2;

          ctx.save();
          if (!isConnected && activeFocusName) {
            ctx.globalAlpha = 0.2; // Dim non-connected
          }

          // Outer Glow if focused
          if (isRoot || isSelected || isHovered) {
            ctx.save();
            ctx.shadowColor = '#00d4d4';
            ctx.shadowBlur = 18 / globalScale;
            ctx.strokeStyle = '#00d4d4';
            ctx.lineWidth = 2 / globalScale;
            ctx.beginPath();
            ctx.roundRect(x - 2 / globalScale, y - 2 / globalScale, nodeWidth + 4 / globalScale, nodeHeight + 4 / globalScale, radius + 2 / globalScale);
            ctx.stroke();
            ctx.restore();
          }

          // Main Card Background
          ctx.fillStyle = isSelected ? '#162b30' : '#111215';
          ctx.beginPath();
          ctx.roundRect(x, y, nodeWidth, nodeHeight, radius);
          ctx.fill();

          // Card Border
          ctx.lineWidth = (isSelected || isRoot ? 1.8 : 1) / globalScale;
          ctx.strokeStyle = isSelected || isRoot ? '#00d4d4' : isHovered ? 'rgba(0,212,212,0.8)' : 'rgba(255, 255, 255, 0.1)';
          ctx.stroke();

          // Left Icon Circle
          const iconCircleRadius = 14 / globalScale;
          const iconCircleX = x + 20 / globalScale;
          const iconCircleY = node.y;
          ctx.beginPath();
          ctx.arc(iconCircleX, iconCircleY, iconCircleRadius, 0, 2 * Math.PI);
          ctx.fillStyle = '#1a1c22';
          ctx.fill();
          ctx.lineWidth = 1 / globalScale;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.stroke();

          // Brand initial / glyph inside icon circle
          ctx.font = `bold ${11 / globalScale}px 'Space Mono', monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = cat.color;
          ctx.fillText(label.slice(0, 2).toUpperCase(), iconCircleX, iconCircleY);

          // Tool Name Title
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.font = `bold ${11 / globalScale}px 'Space Mono', monospace`;
          ctx.fillStyle = '#ffffff';
          ctx.fillText(label, iconCircleX + iconCircleRadius + 8 / globalScale, node.y - 7 / globalScale);

          // Category Subtitle
          ctx.font = `bold ${7.5 / globalScale}px 'Space Mono', monospace`;
          ctx.fillStyle = cat.color;
          ctx.fillText(cat.label, iconCircleX + iconCircleRadius + 8 / globalScale, node.y + 8 / globalScale);

          // Top Connection Port Dot (Incoming)
          const portRadius = 3.2 / globalScale;
          ctx.beginPath();
          ctx.arc(node.x, y, portRadius, 0, 2 * Math.PI);
          ctx.fillStyle = isConnected ? '#00d4d4' : '#333333';
          ctx.fill();
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1 / globalScale;
          ctx.stroke();

          // Bottom Connection Port Dot (Outgoing)
          ctx.beginPath();
          ctx.arc(node.x, y + nodeHeight, portRadius, 0, 2 * Math.PI);
          ctx.fillStyle = isConnected ? '#00d4d4' : '#333333';
          ctx.fill();
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1 / globalScale;
          ctx.stroke();

          ctx.restore();
        }}
      />

      {/* Floating Legend HUD — Exact match to screenshot */}
      <div className="absolute top-6 left-6 bg-[#141414]/95 border border-white/[0.1] backdrop-blur-xl p-4 rounded-2xl shadow-2xl text-xs z-20 hidden md:block w-52">
        <div className="flex items-center gap-2 mb-3 text-[10px] uppercase tracking-[0.2em] text-[#888] font-bold">
          <span className="text-[#00d4d4]">ⓘ</span>
          <span>LEGEND</span>
        </div>

        <div className="space-y-2.5 text-[11px] text-[#ccc]">
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-0.5 bg-[#00d4d4] rounded-full inline-block shrink-0" />
            <span className="text-[#e5e5e5]">Focused tool</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-0.5 border-t-2 border-dashed border-[#00d4d4] inline-block shrink-0" />
            <span className="text-[#888]">Depends on / Used by</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-0.5 bg-white/20 rounded-full inline-block shrink-0" />
            <span className="text-[#666]">Other links</span>
          </div>
        </div>
      </div>

      {/* Floating Zoom & Center HUD */}
      <div className="absolute bottom-6 left-6 flex items-center gap-1 bg-[#141414]/90 border border-white/[0.08] backdrop-blur-md p-1 rounded-xl shadow-2xl z-20">
        <button onClick={handleZoomIn} title="Zoom In" className="p-2 text-[#888] hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={handleZoomOut} title="Zoom Out" className="p-2 text-[#888] hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors">
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-white/[0.08] mx-0.5" />
        <button onClick={handleFitView} title="Fit to Screen" className="p-2 text-[#888] hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors">
          <Maximize2 className="w-4 h-4" />
        </button>
        <button onClick={handleResetCenter} title="Reset View" className="p-2 text-[#888] hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Minimap Box on Bottom Right — Matching Screenshot */}
      <div className="absolute bottom-6 right-6 w-40 h-28 bg-[#111215]/95 border border-white/[0.08] backdrop-blur-md rounded-xl p-3 hidden sm:flex flex-col justify-between shadow-2xl z-20 pointer-events-none">
        <div className="flex items-center justify-between text-[9px] uppercase tracking-widest text-[#666] font-bold">
          <span>Overview</span>
          <span className="text-[#00d4d4] font-mono">{data.nodes.length} N</span>
        </div>
        <div className="grid grid-cols-6 gap-1 opacity-60 my-auto py-1">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className={`h-1.5 rounded-sm ${i % 4 === 0 ? 'bg-[#00d4d4]' : i % 2 === 0 ? 'bg-[#38bdf8]' : 'bg-white/20'}`} />
          ))}
        </div>
        <div className="text-[8px] text-[#666] font-mono text-right flex items-center justify-between">
          <span className="text-emerald-400">Live CognoDB</span>
          <span>{data.links.length} Edges</span>
        </div>
      </div>

      {/* Floating Hover Card */}
      {hoveredNode && (
        <div className="absolute bottom-6 right-6 bg-[#161616]/95 border border-[#00d4d4]/40 backdrop-blur-xl p-4 rounded-2xl shadow-2xl max-w-sm z-20 pointer-events-none animate-fade-in">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="font-bold text-white text-sm">{hoveredNode.name}</span>
            <span className="text-[10px] text-[#00d4d4] font-mono bg-[#00d4d4]/10 px-2 py-0.5 rounded-full border border-[#00d4d4]/30">
              v{hoveredNode.version}
            </span>
          </div>
          <p className="text-xs text-[#888] line-clamp-2 mb-2">
            {hoveredNode.description || 'No description provided'}
          </p>
          <div className="text-[10px] text-[#666] pt-1.5 border-t border-white/[0.06] flex items-center justify-between">
            <span>📥 {hoveredNode.weeklyDownloads.toLocaleString()} /wk</span>
            <span className="text-[#00d4d4]">Click to inspect</span>
          </div>
        </div>
      )}
    </div>
  );
};
