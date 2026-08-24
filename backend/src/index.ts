import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { packageRouter, handleHealthCheck } from './routes/packages.js';
import { AppError, closeDriver } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());

// Request logger for development
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint
app.get('/api/health', handleHealthCheck);

// Package routes
app.use('/api/packages', packageRouter);

// Root informative endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'StackGraph API',
    description: 'Tech Dependency Explorer powered by CognoDB / Neo4j',
    version: '1.0.0',
    endpoints: [
      'GET /api/health',
      'GET /api/packages/search?q=:term',
      'GET /api/packages/:name/dependencies?depth=1|2|3',
      'GET /api/packages/:name/dependents',
      'GET /api/packages/circular',
    ],
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Centralized error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('API Error:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
      isDatabaseError: err.isDatabaseError,
    });
  }

  // Check for common Neo4j / Bolt database connection errors
  if (
    err?.name === 'ServiceUnavailable' ||
    err?.code === 'ServiceUnavailable' ||
    err?.message?.includes('Could not perform discovery') ||
    err?.message?.includes('Database unavailable')
  ) {
    return res.status(503).json({
      error: 'Database unavailable',
      details: err.message,
      isDatabaseError: true,
    });
  }

  return res.status(500).json({
    error: err?.message || 'Internal server error',
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 StackGraph Backend server running on http://localhost:${PORT}`);
  console.log(`📡 Health check available at http://localhost:${PORT}/api/health`);
});

// Graceful shutdown handling
const handleShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Closing server and graph database connections...`);
  server.close(async () => {
    try {
      await closeDriver();
      console.log('Graph database connection closed cleanly.');
      process.exit(0);
    } catch (e) {
      console.error('Error during database teardown:', e);
      process.exit(1);
    }
  });
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

export default app;
