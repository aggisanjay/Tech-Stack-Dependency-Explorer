export interface PackageNode {
  id: string;
  name: string;
  version: string;
  description: string;
  license: string;
  weeklyDownloads: number;
  // Graph engine runtime properties
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  index?: number;
  color?: string;
  val?: number;
}

export interface DependencyLink {
  source: string | PackageNode;
  target: string | PackageNode;
  versionRange: string;
  type: 'prod' | 'dev' | 'peer' | string;
  color?: string;
}

export interface GraphData {
  nodes: PackageNode[];
  links: DependencyLink[];
  rootPackage?: PackageNode | null;
}

export interface CircularResponse {
  count: number;
  cycles: string[][];
}

export interface HealthResponse {
  status: 'ok' | 'error';
  message?: string;
  timestamp: string;
}
