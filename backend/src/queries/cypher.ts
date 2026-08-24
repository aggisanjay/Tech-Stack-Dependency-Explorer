import { runQuery, AppError } from '../db.js';

export interface PackageProperties {
  name: string;
  version: string;
  description: string;
  license: string;
  weeklyDownloads: number;
}

export interface GraphNode {
  id: string;
  name: string;
  version: string;
  description: string;
  license: string;
  weeklyDownloads: number;
}

export interface GraphLink {
  source: string;
  target: string;
  versionRange: string;
  type: 'prod' | 'dev' | 'peer' | string;
}

export interface GraphResponse {
  nodes: GraphNode[];
  links: GraphLink[];
  rootPackage?: GraphNode | null;
}

function normalizeNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  if (typeof val?.toNumber === 'function') return val.toNumber();
  if (typeof val?.toInt === 'function') return val.toInt();
  const parsed = Number(val);
  return isNaN(parsed) ? 0 : parsed;
}

function mapPackageNode(rawProperties: any): GraphNode {
  return {
    id: rawProperties.name,
    name: rawProperties.name,
    version: rawProperties.version || 'unknown',
    description: rawProperties.description || '',
    license: rawProperties.license || 'MIT',
    weeklyDownloads: normalizeNumber(rawProperties.weeklyDownloads),
  };
}

/**
 * Searches packages matching the query term (case-insensitive)
 */
export async function searchPackages(term: string): Promise<GraphNode[]> {
  const cypher = `
    MATCH (p:Package)
    WHERE toLower(p.name) CONTAINS toLower($term)
    RETURN p
    ORDER BY p.weeklyDownloads DESC
    LIMIT 10
  `;

  const result = await runQuery<{ p: { properties: any } }>(cypher, { term: term.trim() });
  return result.records.map((rec) => mapPackageNode(rec.get('p').properties));
}

/**
 * Traverses direct and transitive dependencies up to depth hops (1..3)
 */
export async function getPackageDependencies(name: string, depth: number = 2): Promise<GraphResponse> {
  const validDepth = Math.max(1, Math.min(3, Math.floor(Number(depth) || 2)));

  // First verify root node exists
  const rootQuery = `
    MATCH (root:Package {name: $name})
    RETURN root
  `;
  const rootResult = await runQuery<{ root: { properties: any } }>(rootQuery, { name });

  if (rootResult.records.length === 0) {
    throw new AppError(`Package '${name}' not found`, 404);
  }

  const rootNode = mapPackageNode(rootResult.records[0].get('root').properties);

  const pathQuery = `
    MATCH path = (root:Package {name: $name})-[:DEPENDS_ON*1..${validDepth}]->(dep:Package)
    RETURN root, relationships(path) AS rels, nodes(path) AS nodes, path
  `;

  const pathResult = await runQuery(pathQuery, { name });

  const nodeMap = new Map<string, GraphNode>();
  const linkMap = new Map<string, GraphLink>();

  // Always include root
  nodeMap.set(rootNode.id, rootNode);

  for (const record of pathResult.records) {
    const rawNodes = record.get('nodes');
    const pathObj = record.get('path');

    if (Array.isArray(rawNodes)) {
      for (const n of rawNodes) {
        if (n && n.properties && n.properties.name) {
          const mapped = mapPackageNode(n.properties);
          nodeMap.set(mapped.id, mapped);
        }
      }
    }

    if (pathObj && Array.isArray(pathObj.segments)) {
      for (const segment of pathObj.segments) {
        const sourceName = segment.start?.properties?.name;
        const targetName = segment.end?.properties?.name;
        const relProps = segment.relationship?.properties || {};

        if (sourceName && targetName) {
          const linkKey = `${sourceName}->${targetName}:${relProps.type || 'prod'}`;
          if (!linkMap.has(linkKey)) {
            linkMap.set(linkKey, {
              source: sourceName,
              target: targetName,
              versionRange: relProps.versionRange || '*',
              type: relProps.type || 'prod',
            });
          }
        }
      }
    }
  }

  return {
    nodes: Array.from(nodeMap.values()),
    links: Array.from(linkMap.values()),
    rootPackage: rootNode,
  };
}

/**
 * Returns all packages that directly depend on this package (reverse dependency lookup)
 */
export async function getPackageDependents(name: string): Promise<GraphNode[]> {
  const cypher = `
    MATCH (dependent:Package)-[:DEPENDS_ON]->(p:Package {name: $name})
    RETURN dependent
    ORDER BY dependent.weeklyDownloads DESC
  `;

  const result = await runQuery<{ dependent: { properties: any } }>(cypher, { name });
  return result.records.map((rec) => mapPackageNode(rec.get('dependent').properties));
}

/**
 * Detects circular dependency chains in the dependency graph
 */
export async function getCircularDependencies(): Promise<string[][]> {
  const cypher = `
    MATCH path = (p:Package)-[:DEPENDS_ON*2..]->(p)
    RETURN [n IN nodes(path) | n.name] AS cycle
    LIMIT 20
  `;

  const result = await runQuery<{ cycle: string[] }>(cypher);

  const rawCycles = result.records.map((rec) => rec.get('cycle'));

  // Canonicalize cycle representations so [A, B, A] and [B, A, B] are deduplicated if returned
  const uniqueCycles: string[][] = [];
  const seenFingerprints = new Set<string>();

  for (const cycle of rawCycles) {
    if (!cycle || cycle.length < 2) continue;

    // A cycle path is [A, B, C, A]. Loop elements are A, B, C.
    const loopElements = cycle.slice(0, -1);
    
    // Find min element to create rotational canonical form
    let minIdx = 0;
    for (let i = 1; i < loopElements.length; i++) {
      if (loopElements[i] < loopElements[minIdx]) {
        minIdx = i;
      }
    }

    const rotated = [
      ...loopElements.slice(minIdx),
      ...loopElements.slice(0, minIdx),
    ];
    const canonicalKey = rotated.join('->');

    if (!seenFingerprints.has(canonicalKey)) {
      seenFingerprints.add(canonicalKey);
      uniqueCycles.push(cycle);
    }
  }

  return uniqueCycles;
}

/**
 * Health check query
 */
export async function checkDbHealth(): Promise<boolean> {
  const cypher = `RETURN 1 AS ok`;
  const result = await runQuery(cypher);
  return result.records.length > 0;
}
