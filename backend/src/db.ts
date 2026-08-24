import neo4j, { Driver, Session, QueryResult, Neo4jError } from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

export class AppError extends Error {
  public statusCode: number;
  public details?: unknown;
  public isDatabaseError: boolean;

  constructor(message: string, statusCode: number = 500, details?: unknown, isDatabaseError: boolean = false) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    this.isDatabaseError = isDatabaseError;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

let driver: Driver | null = null;
let hasLoggedConnection = false;

export function getDriver(): Driver {
  if (!driver) {
    const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
    const user = process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'password';

    driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
      maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 5000, // 5s timeout
      disableLosslessIntegers: true, // Auto-convert Neo4j Integers to JS numbers
    });
  }
  return driver;
}

export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
    hasLoggedConnection = false;
  }
}

export async function runQuery<T extends Record<string, any> = Record<string, any>>(
  cypher: string,
  params: Record<string, any> = {}
): Promise<QueryResult<T>> {
  const currentDriver = getDriver();
  const session: Session = currentDriver.session();

  try {
    const result = await session.run<T>(cypher, params);
    if (!hasLoggedConnection) {
      console.log('⚡ Connected to CognoDB (Neo4j Bolt Protocol)');
      hasLoggedConnection = true;
    }
    return result;
  } catch (error: any) {
    const isServiceUnavailable =
      error?.name === 'ServiceUnavailable' ||
      error?.code === 'ServiceUnavailable' ||
      error?.code === 'Neo.ClientError.Security.AuthenticationRateLimit' ||
      error?.message?.includes('Could not perform discovery') ||
      error?.message?.includes('Failed to connect') ||
      error?.message?.includes('ECONNREFUSED') ||
      error?.message?.includes('ETIMEDOUT') ||
      error instanceof neo4j.Neo4jError;

    if (isServiceUnavailable) {
      throw new AppError(
        'Database unavailable',
        503,
        error.message || 'Unable to establish connection to CognoDB instance',
        true
      );
    }

    throw new AppError(
      error.message || 'Database query error',
      500,
      error,
      true
    );
  } finally {
    await session.close();
  }
}

export async function verifyConnectivity(): Promise<{ ok: boolean; message?: string }> {
  try {
    const d = getDriver();
    const serverInfo = await d.getServerInfo();
    return { ok: true, message: `Connected to ${serverInfo.agent || 'CognoDB/Neo4j'}` };
  } catch (error: any) {
    return { ok: false, message: error.message || 'Database unreachable' };
  }
}
