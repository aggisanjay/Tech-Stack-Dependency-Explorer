import dotenv from 'dotenv';
import { runQuery, closeDriver, verifyConnectivity } from '../src/db.js';

dotenv.config();

interface SeedPackage {
  name: string;
  version: string;
  description: string;
  license: string;
  weeklyDownloads: number;
}

interface SeedRelationship {
  from: string;
  to: string;
  versionRange: string;
  type: 'prod' | 'dev' | 'peer';
}

const PACKAGES: SeedPackage[] = [
  // Languages
  { name: 'javascript', version: 'ES2024', description: 'The universal language of the web', license: 'ECMA', weeklyDownloads: 80000000 },
  { name: 'typescript', version: '5.4.5', description: 'Typed superset of JavaScript that compiles to plain JS', license: 'Apache-2.0', weeklyDownloads: 55000000 },
  { name: 'python', version: '3.12.3', description: 'High-level dynamic language for AI, data, and web backends', license: 'PSF', weeklyDownloads: 70000000 },
  { name: 'rust', version: '1.78.0', description: 'Systems programming language focused on safety and speed', license: 'MIT', weeklyDownloads: 35000000 },
  { name: 'go', version: '1.22.2', description: 'Fast, reliable, and memory-safe language from Google', license: 'BSD-3', weeklyDownloads: 40000000 },

  // Frontend Core & Frameworks
  { name: 'react', version: '18.3.1', description: 'Declarative UI library for component-based web applications', license: 'MIT', weeklyDownloads: 24000000 },
  { name: 'react-dom', version: '18.3.1', description: 'DOM rendering engine for React components', license: 'MIT', weeklyDownloads: 23000000 },
  { name: 'vue', version: '3.4.27', description: 'Approachable, performant, and versatile frontend framework', license: 'MIT', weeklyDownloads: 5000000 },
  { name: 'angular', version: '17.3.0', description: 'Enterprise frontend platform by Google', license: 'MIT', weeklyDownloads: 3500000 },
  { name: 'svelte', version: '4.2.17', description: 'Cybernetically enhanced web apps with zero-runtime compiler', license: 'MIT', weeklyDownloads: 1200000 },
  { name: 'solid', version: '1.8.17', description: 'Fine-grained reactive UI library with no virtual DOM', license: 'MIT', weeklyDownloads: 450000 },
  { name: 'preact', version: '10.20.2', description: 'Fast 3kB alternative to React with identical modern API', license: 'MIT', weeklyDownloads: 2800000 },

  // Meta-Frameworks
  { name: 'next', version: '14.2.3', description: 'The React Framework for the Web with Server Components', license: 'MIT', weeklyDownloads: 7500000 },
  { name: 'nuxt', version: '3.11.2', description: 'The Intuitive Vue Framework for full-stack SSR and SSG', license: 'MIT', weeklyDownloads: 1100000 },
  { name: 'gatsby', version: '5.13.5', description: 'Static site generator powered by React and GraphQL', license: 'MIT', weeklyDownloads: 600000 },
  { name: 'remix', version: '2.9.2', description: 'Full stack web framework focused on web standards and UI UX', license: 'MIT', weeklyDownloads: 800000 },
  { name: 'astro', version: '4.8.3', description: 'Content-driven web framework with Islands architecture', license: 'MIT', weeklyDownloads: 950000 },

  // Build Tools & Compilers
  { name: 'vite', version: '5.2.11', description: 'Next generation fast frontend build tool and dev server', license: 'MIT', weeklyDownloads: 12000000 },
  { name: 'webpack', version: '5.91.0', description: 'Configurable module bundler for modern JavaScript apps', license: 'MIT', weeklyDownloads: 26000000 },
  { name: 'babel-core', version: '7.24.5', description: 'Babel compiler core for next-generation JavaScript', license: 'MIT', weeklyDownloads: 19000000 },
  { name: 'parcel', version: '2.12.0', description: 'Zero configuration build tool for the modern web', license: 'MIT', weeklyDownloads: 850000 },
  { name: 'rollup', version: '4.17.2', description: 'Next-generation ES module bundler for JavaScript libraries', license: 'MIT', weeklyDownloads: 18000000 },
  { name: 'esbuild', version: '0.21.3', description: 'Extremely fast JavaScript and TypeScript bundler written in Go', license: 'MIT', weeklyDownloads: 25000000 },
  { name: 'swc', version: '1.5.7', description: 'Rust-based platform for compilation and bundling', license: 'Apache-2.0', weeklyDownloads: 15000000 },

  // CSS & Styling
  { name: 'tailwindcss', version: '3.4.3', description: 'A utility-first CSS framework for rapid UI development', license: 'MIT', weeklyDownloads: 11000000 },

  // Backend & Servers
  { name: 'express', version: '4.19.2', description: 'Fast, unopinionated, minimalist web framework for Node.js', license: 'MIT', weeklyDownloads: 32000000 },
  { name: 'fastify', version: '4.26.2', description: 'Fast and low overhead web framework for Node.js', license: 'MIT', weeklyDownloads: 1800000 },
  { name: 'koa', version: '2.15.3', description: 'Expressive HTTP middleware framework for Node.js by Express team', license: 'MIT', weeklyDownloads: 1500000 },
  { name: 'nestjs', version: '10.3.8', description: 'Progressive Node.js framework for scalable enterprise servers', license: 'MIT', weeklyDownloads: 3200000 },
  { name: 'cors', version: '2.8.5', description: 'Node.js CORS middleware for Express and Connect servers', license: 'MIT', weeklyDownloads: 23000000 },
  { name: 'dotenv', version: '16.4.5', description: 'Loads environment variables from .env for Node.js projects', license: 'BSD-2', weeklyDownloads: 38000000 },
  { name: 'socket.io', version: '4.7.5', description: 'Real-time bidirectional event-based communication library', license: 'MIT', weeklyDownloads: 6200000 },

  // Runtimes
  { name: 'node.js', version: '20.13.1', description: 'JavaScript runtime built on Chrome\'s V8 JavaScript engine', license: 'MIT', weeklyDownloads: 60000000 },
  { name: 'deno', version: '1.43.3', description: 'Secure runtime for JavaScript and TypeScript with batteries included', license: 'MIT', weeklyDownloads: 2000000 },
  { name: 'bun', version: '1.1.8', description: 'Incredibly fast all-in-one JavaScript runtime and toolkit', license: 'MIT', weeklyDownloads: 1500000 },

  // Databases & ORMs
  { name: 'prisma', version: '5.14.0', description: 'Next-generation ORM for Node.js and TypeScript', license: 'Apache-2.0', weeklyDownloads: 3800000 },
  { name: 'neo4j-driver', version: '5.20.0', description: 'Official Bolt-protocol database driver for CognoDB and Neo4j', license: 'Apache-2.0', weeklyDownloads: 650000 },
  { name: 'mongoose', version: '8.4.0', description: 'MongoDB object modeling designed to work in an asynchronous environment', license: 'MIT', weeklyDownloads: 4200000 },
  { name: 'typeorm', version: '0.3.20', description: 'ORM for TypeScript and JavaScript (ES7, ES6, ES5)', license: 'MIT', weeklyDownloads: 2100000 },
  { name: 'drizzle', version: '0.30.10', description: 'TypeScript ORM that lets you write SQL with full type safety', license: 'Apache-2.0', weeklyDownloads: 1400000 },

  // Cache & Message Queues
  { name: 'redis', version: '4.6.13', description: 'High-performance Redis client for Node.js', license: 'MIT', weeklyDownloads: 4800000 },
  { name: 'rabbitmq', version: '0.11.1', description: 'AMQP client for RabbitMQ message broker architectures', license: 'MIT', weeklyDownloads: 950000 },
  { name: 'kafka', version: '2.2.4', description: 'Distributed event streaming platform client for Node.js', license: 'Apache-2.0', weeklyDownloads: 1200000 },

  // Testing & Quality
  { name: 'jest', version: '29.7.0', description: 'Delightful JavaScript Testing with a focus on simplicity', license: 'MIT', weeklyDownloads: 22000000 },
  { name: 'vitest', version: '1.6.0', description: 'Blazing fast Vite-native unit test framework', license: 'MIT', weeklyDownloads: 4500000 },
  { name: 'cypress', version: '13.9.0', description: 'Fast, easy and reliable testing for anything that runs in a browser', license: 'MIT', weeklyDownloads: 5800000 },
  { name: 'playwright', version: '1.44.0', description: 'Cross-browser end-to-end automation for modern web apps', license: 'Apache-2.0', weeklyDownloads: 5100000 },

  // DevOps & Code Quality
  { name: 'eslint', version: '9.2.0', description: 'Find and fix problems in your JavaScript code statically', license: 'MIT', weeklyDownloads: 34000000 },
  { name: 'prettier', version: '3.2.5', description: 'An opinionated code formatter with multi-language support', license: 'MIT', weeklyDownloads: 30000000 },
  { name: 'docker', version: '26.1.1', description: 'Containerization platform to build, ship, and run any app anywhere', license: 'Apache-2.0', weeklyDownloads: 45000000 },
  { name: 'kubernetes', version: '1.30.0', description: 'Production-grade container orchestration system', license: 'Apache-2.0', weeklyDownloads: 28000000 },
  { name: 'graphql', version: '16.8.1', description: 'A query language for your API and runtime for fulfilling queries', license: 'MIT', weeklyDownloads: 14000000 },

  // Utility Libraries
  { name: 'lodash', version: '4.17.21', description: 'Modern JavaScript utility library delivering modularity and performance', license: 'MIT', weeklyDownloads: 48000000 },
  { name: 'zod', version: '3.23.8', description: 'TypeScript-first schema declaration and validation library with static type inference', license: 'MIT', weeklyDownloads: 14500000 },
  { name: 'axios', version: '1.7.2', description: 'Promise based HTTP client for the browser and node.js', license: 'MIT', weeklyDownloads: 44000000 },
  { name: 'react-query', version: '5.37.1', description: 'Powerful asynchronous state management and server cache for React', license: 'MIT', weeklyDownloads: 6200000 },

  // Monitoring
  { name: 'grafana', version: '10.4.2', description: 'Open-source platform for metrics visualization, alerting, and observability', license: 'AGPL-3.0', weeklyDownloads: 8500000 },
  { name: 'prometheus', version: '2.52.0', description: 'Monitoring system and time series database with PromQL queries', license: 'Apache-2.0', weeklyDownloads: 9200000 },
];

const RELATIONSHIPS: SeedRelationship[] = [
  // Framework connections
  { from: 'react-dom', to: 'react', versionRange: '^18.3.0', type: 'prod' },
  { from: 'next', to: 'react', versionRange: '^18.3.0', type: 'prod' },
  { from: 'next', to: 'react-dom', versionRange: '^18.3.0', type: 'prod' },
  { from: 'next', to: 'typescript', versionRange: '^5.0.0', type: 'peer' },
  { from: 'next', to: 'webpack', versionRange: '^5.90.0', type: 'prod' },
  { from: 'next', to: 'babel-core', versionRange: '^7.24.0', type: 'prod' },
  { from: 'remix', to: 'react', versionRange: '^18.3.0', type: 'prod' },
  { from: 'remix', to: 'react-dom', versionRange: '^18.3.0', type: 'prod' },
  { from: 'gatsby', to: 'react', versionRange: '^18.3.0', type: 'prod' },
  { from: 'gatsby', to: 'graphql', versionRange: '^16.8.0', type: 'prod' },
  { from: 'gatsby', to: 'webpack', versionRange: '^5.90.0', type: 'prod' },
  { from: 'nuxt', to: 'vue', versionRange: '^3.4.0', type: 'prod' },
  { from: 'nuxt', to: 'vite', versionRange: '^5.2.0', type: 'prod' },
  { from: 'astro', to: 'vite', versionRange: '^5.2.0', type: 'prod' },

  // Tooling & Bundlers
  { from: 'vite', to: 'rollup', versionRange: '^4.17.0', type: 'prod' },
  { from: 'vite', to: 'esbuild', versionRange: '^0.21.0', type: 'prod' },
  { from: 'vite', to: 'typescript', versionRange: '^5.0.0', type: 'peer' },
  { from: 'vite', to: 'eslint', versionRange: '^9.0.0', type: 'dev' },
  { from: 'webpack', to: 'babel-core', versionRange: '^7.24.0', type: 'prod' },
  { from: 'webpack', to: 'esbuild', versionRange: '^0.21.0', type: 'dev' },
  { from: 'babel-core', to: 'lodash', versionRange: '^4.17.0', type: 'prod' },
  { from: 'parcel', to: 'swc', versionRange: '^1.5.0', type: 'prod' },
  { from: 'parcel', to: 'babel-core', versionRange: '^7.24.0', type: 'prod' },

  // Testing Frameworks
  { from: 'jest', to: 'babel-core', versionRange: '^7.24.0', type: 'prod' },
  { from: 'jest', to: 'lodash', versionRange: '^4.17.0', type: 'prod' },
  { from: 'vitest', to: 'vite', versionRange: '^5.2.0', type: 'prod' },
  { from: 'vitest', to: 'esbuild', versionRange: '^0.21.0', type: 'prod' },
  { from: 'cypress', to: 'typescript', versionRange: '^5.0.0', type: 'peer' },
  { from: 'playwright', to: 'typescript', versionRange: '^5.0.0', type: 'peer' },

  // Linters & Code Quality
  { from: 'eslint', to: 'lodash', versionRange: '^4.17.0', type: 'prod' },
  { from: 'eslint', to: 'typescript', versionRange: '^5.0.0', type: 'peer' },
  { from: 'prettier', to: 'typescript', versionRange: '^5.0.0', type: 'peer' },

  // CSS Frameworks
  { from: 'tailwindcss', to: 'typescript', versionRange: '^5.0.0', type: 'peer' },
  { from: 'tailwindcss', to: 'postcss', versionRange: '^8.4.0', type: 'dev' },

  // Backend Frameworks
  { from: 'express', to: 'cors', versionRange: '^2.8.5', type: 'prod' },
  { from: 'express', to: 'dotenv', versionRange: '^16.4.0', type: 'prod' },
  { from: 'fastify', to: 'dotenv', versionRange: '^16.4.0', type: 'prod' },
  { from: 'koa', to: 'dotenv', versionRange: '^16.4.0', type: 'prod' },
  { from: 'nestjs', to: 'express', versionRange: '^4.19.0', type: 'prod' },
  { from: 'nestjs', to: 'rxjs', versionRange: '^7.8.0', type: 'prod' },
  { from: 'nestjs', to: 'typescript', versionRange: '^5.0.0', type: 'prod' },
  { from: 'socket.io', to: 'express', versionRange: '^4.19.0', type: 'peer' },

  // Databases & ORMs
  { name: 'prisma', to: 'dotenv', versionRange: '^16.4.0', type: 'prod' },
  { name: 'prisma', to: 'typescript', versionRange: '^5.0.0', type: 'peer' },
  { name: 'typeorm', to: 'typescript', versionRange: '^5.0.0', type: 'prod' },
  { name: 'drizzle', to: 'typescript', versionRange: '^5.0.0', type: 'prod' },
  { name: 'drizzle', to: 'dotenv', versionRange: '^16.4.0', type: 'prod' },
  { name: 'mongoose', to: 'dotenv', versionRange: '^16.4.0', type: 'prod' },
  { name: 'neo4j-driver', to: 'dotenv', versionRange: '^16.4.0', type: 'dev' },

  // Cache & Queues
  { from: 'redis', to: 'dotenv', versionRange: '^16.4.0', type: 'dev' },
  { from: 'rabbitmq', to: 'dotenv', versionRange: '^16.4.0', type: 'dev' },
  { from: 'kafka', to: 'dotenv', versionRange: '^16.4.0', type: 'dev' },

  // Client State & APIs
  { from: 'react-query', to: 'react', versionRange: '^18.3.0', type: 'peer' },
  { from: 'react-query', to: 'zod', versionRange: '^3.23.0', type: 'prod' },
  { from: 'axios', to: 'dotenv', versionRange: '^16.4.0', type: 'dev' },

  // Language & Runtime Base Connections
  { from: 'typescript', to: 'javascript', versionRange: '^ES2022', type: 'prod' },
  { from: 'node.js', to: 'javascript', versionRange: '^ES2024', type: 'prod' },
  { from: 'deno', to: 'javascript', versionRange: '^ES2024', type: 'prod' },
  { from: 'deno', to: 'typescript', versionRange: '^5.0.0', type: 'prod' },
  { from: 'bun', to: 'javascript', versionRange: '^ES2024', type: 'prod' },
  { from: 'bun', to: 'typescript', versionRange: '^5.0.0', type: 'prod' },
  { from: 'babel-core', to: 'javascript', versionRange: '^ES2024', type: 'prod' },
  { from: 'swc', to: 'javascript', versionRange: '^ES2024', type: 'prod' },
  { from: 'esbuild', to: 'javascript', versionRange: '^ES2024', type: 'prod' },
  { from: 'express', to: 'node.js', versionRange: '^20.0.0', type: 'peer' },
  { from: 'fastify', to: 'node.js', versionRange: '^20.0.0', type: 'peer' },
  { from: 'nestjs', to: 'node.js', versionRange: '^20.0.0', type: 'peer' },

  // Python & Systems Stack
  { from: 'grafana', to: 'docker', versionRange: '^26.0.0', type: 'dev' },
  { from: 'prometheus', to: 'docker', versionRange: '^26.0.0', type: 'dev' },
  { from: 'docker', to: 'python', versionRange: '^3.12.0', type: 'dev' },
  { from: 'kubernetes', to: 'go', versionRange: '^1.22.0', type: 'prod' },
  { from: 'swc', to: 'rust', versionRange: '^1.78.0', type: 'prod' },
  { from: 'esbuild', to: 'go', versionRange: '^1.22.0', type: 'prod' },

  // DevOps & Observability
  { from: 'kubernetes', to: 'docker', versionRange: '^26.0.0', type: 'prod' },
  { from: 'grafana', to: 'prometheus', versionRange: '^2.52.0', type: 'prod' },

  // Intentional Circular Dependency Chains for CognoDB Graph Cycle Detection Showcase
  { from: 'babel-core', to: 'webpack', versionRange: '^5.91.0', type: 'dev' },
  { from: 'lodash', to: 'next', versionRange: '^14.2.0', type: 'peer' },
  { from: 'esbuild', to: 'vite', versionRange: '^5.2.0', type: 'dev' },
].map((item: any) => ({
  from: item.from || item.name,
  to: item.to,
  versionRange: item.versionRange || '^1.0.0',
  type: item.type || 'prod',
}));

async function seed() {
  console.log('🌱 Starting StackGraph Database Seeder...');
  console.log(`Connecting to: ${process.env.NEO4J_URI || 'bolt://localhost:7687'}`);

  // Test connectivity
  const conn = await verifyConnectivity();
  if (!conn.ok) {
    console.error('❌ Connection Failed:', conn.message);
    console.error('Please check your NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD in backend/.env');
    process.exit(1);
  }
  console.log(`✅ Connected successfully: ${conn.message}`);

  try {
    // 1. Clear existing database
    console.log('🧹 Clearing existing data (MATCH (n) DETACH DELETE n)...');
    await runQuery('MATCH (n) DETACH DELETE n');
    console.log('   ✓ Database cleared.');

    // 2. Create Unique Constraint / Index
    console.log('🔒 Creating unique constraint on :Package(name)...');
    try {
      await runQuery('CREATE CONSTRAINT package_name_unique IF NOT EXISTS FOR (p:Package) REQUIRE p.name IS UNIQUE');
    } catch (e: any) {
      console.log('   ℹ Constraint note:', e?.message || 'already exists or handled');
    }

    // 3. Insert Packages with MERGE
    console.log(`📦 Merging ${PACKAGES.length} packages...`);
    for (const pkg of PACKAGES) {
      const cypher = `
        MERGE (p:Package {name: $name})
        SET p.version = $version,
            p.description = $description,
            p.license = $license,
            p.weeklyDownloads = $weeklyDownloads
      `;
      await runQuery(cypher, {
        name: pkg.name,
        version: pkg.version,
        description: pkg.description,
        license: pkg.license,
        weeklyDownloads: pkg.weeklyDownloads,
      });
      console.log(`   + [Package] ${pkg.name}@${pkg.version}`);
    }

    // 4. Insert Relationships with MERGE
    console.log(`🔗 Merging ${RELATIONSHIPS.length} dependency relationships...`);
    for (const rel of RELATIONSHIPS) {
      const cypher = `
        MATCH (from:Package {name: $fromName})
        MATCH (to:Package {name: $toName})
        MERGE (from)-[r:DEPENDS_ON {type: $type}]->(to)
        SET r.versionRange = $versionRange
      `;
      await runQuery(cypher, {
        fromName: rel.from,
        toName: rel.to,
        type: rel.type,
        versionRange: rel.versionRange,
      });
      console.log(`   → ${rel.from} -[:DEPENDS_ON (${rel.type}, ${rel.versionRange})]-> ${rel.to}`);
    }

    // 5. Verification & Summary Counts
    const nodeCountRes = await runQuery('MATCH (n:Package) RETURN count(n) AS nodeCount');
    const relCountRes = await runQuery('MATCH ()-[r:DEPENDS_ON]->() RETURN count(r) AS relCount');

    const totalNodes = nodeCountRes.records[0].get('nodeCount');
    const totalRels = relCountRes.records[0].get('relCount');

    console.log('\n========================================');
    console.log('🎉 Seeding Complete!');
    console.log(`📊 Total Packages (:Package nodes): ${totalNodes}`);
    console.log(`📊 Total Dependencies ([:DEPENDS_ON] relationships): ${totalRels}`);
    console.log('========================================\n');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exitCode = 1;
  } finally {
    await closeDriver();
    console.log('👋 Database connection closed.');
  }
}

seed();
