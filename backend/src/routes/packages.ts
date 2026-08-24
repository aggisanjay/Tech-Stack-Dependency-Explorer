import { Router, Request, Response, NextFunction } from 'express';
import {
  searchPackages,
  getPackageDependencies,
  getPackageDependents,
  getCircularDependencies,
  checkDbHealth,
} from '../queries/cypher.js';
import { AppError, verifyConnectivity } from '../db.js';

export const packageRouter = Router();

// Wrap async route handlers
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * GET /api/packages/search?q=<term>
 * Returns packages whose name contains the search term (case-insensitive)
 */
packageRouter.get(
  '/search',
  asyncHandler(async (req: Request, res: Response) => {
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    if (!query.trim()) {
      return res.json([]);
    }

    const results = await searchPackages(query);
    return res.json(results);
  })
);

/**
 * GET /api/packages/circular
 * Detects circular dependency chains
 * (Placed before /:name to prevent route matching collisions)
 */
packageRouter.get(
  '/circular',
  asyncHandler(async (_req: Request, res: Response) => {
    const cycles = await getCircularDependencies();
    return res.json({
      count: cycles.length,
      cycles: cycles,
    });
  })
);

/**
 * GET /api/packages/:name/dependencies?depth=<1|2|3>
 * Returns dependency graph up to depth hops
 */
packageRouter.get(
  '/:name/dependencies',
  asyncHandler(async (req: Request, res: Response) => {
    const packageName = req.params.name;
    const rawDepth = req.query.depth;
    const depth = rawDepth ? parseInt(String(rawDepth), 10) : 2;

    if (isNaN(depth) || depth < 1 || depth > 3) {
      return res.status(400).json({ error: 'Depth must be an integer between 1 and 3' });
    }

    const graph = await getPackageDependencies(packageName, depth);
    return res.json(graph);
  })
);

/**
 * GET /api/packages/:name/dependents
 * Returns all packages that directly depend on this package (reverse lookup)
 */
packageRouter.get(
  '/:name/dependents',
  asyncHandler(async (req: Request, res: Response) => {
    const packageName = req.params.name;
    const dependents = await getPackageDependents(packageName);
    return res.json(dependents);
  })
);

/**
 * Health check handler
 */
export async function handleHealthCheck(_req: Request, res: Response) {
  try {
    const connectivity = await verifyConnectivity();
    if (!connectivity.ok) {
      return res.status(503).json({
        status: 'error',
        message: connectivity.message || 'Database unavailable',
        timestamp: new Date().toISOString(),
      });
    }

    await checkDbHealth();
    return res.json({
      status: 'ok',
      message: 'CognoDB graph connection healthy',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(503).json({
      status: 'error',
      message: error?.message || 'Database unavailable',
      timestamp: new Date().toISOString(),
    });
  }
}
