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
  { name: 'react', version: '18.2.0', description: 'A JavaScript library for building UIs', license: 'MIT', weeklyDownloads: 22000000 },
  { name: 'react-dom', version: '18.2.0', description: 'React DOM rendering', license: 'MIT', weeklyDownloads: 21000000 },
  { name: 'typescript', version: '5.3.3', description: 'TypeScript language', license: 'Apache-2.0', weeklyDownloads: 50000000 },
  { name: 'vite', version: '5.1.0', description: 'Next gen frontend tooling', license: 'MIT', weeklyDownloads: 8000000 },
  { name: 'express', version: '4.18.2', description: 'Fast web framework for Node.js', license: 'MIT', weeklyDownloads: 30000000 },
  { name: 'lodash', version: '4.17.21', description: 'Utility library', license: 'MIT', weeklyDownloads: 45000000 },
  { name: 'axios', version: '1.6.7', description: 'Promise-based HTTP client', license: 'MIT', weeklyDownloads: 40000000 },
  { name: 'jest', version: '29.7.0', description: 'JavaScript testing framework', license: 'MIT', weeklyDownloads: 20000000 },
  { name: 'webpack', version: '5.90.1', description: 'Module bundler', license: 'MIT', weeklyDownloads: 25000000 },
  { name: 'babel-core', version: '7.23.9', description: 'JavaScript compiler', license: 'MIT', weeklyDownloads: 18000000 },
  { name: 'eslint', version: '8.56.0', description: 'JavaScript linter', license: 'MIT', weeklyDownloads: 32000000 },
  { name: 'prettier', version: '3.2.4', description: 'Code formatter', license: 'MIT', weeklyDownloads: 28000000 },
  { name: 'tailwindcss', version: '3.4.1', description: 'Utility-first CSS framework', license: 'MIT', weeklyDownloads: 9000000 },
  { name: 'next', version: '14.1.0', description: 'React framework for production', license: 'MIT', weeklyDownloads: 6000000 },
  { name: 'prisma', version: '5.9.1', description: 'Next-gen ORM', license: 'Apache-2.0', weeklyDownloads: 3000000 },
  { name: 'zod', version: '3.22.4', description: 'TypeScript-first schema validation', license: 'MIT', weeklyDownloads: 12000000 },
  { name: 'react-query', version: '5.18.1', description: 'Data fetching for React', license: 'MIT', weeklyDownloads: 5000000 },
  { name: 'neo4j-driver', version: '5.17.0', description: 'Official Neo4j driver', license: 'Apache-2.0', weeklyDownloads: 500000 },
  { name: 'dotenv', version: '16.4.1', description: 'Loads environment variables', license: 'BSD-2', weeklyDownloads: 35000000 },
  { name: 'cors', version: '2.8.5', description: 'CORS middleware for Express', license: 'MIT', weeklyDownloads: 22000000 },
];

const RELATIONSHIPS: SeedRelationship[] = [
  { from: 'react-dom', to: 'react', versionRange: '^18.2.0', type: 'prod' },
  { from: 'next', to: 'react', versionRange: '^18.2.0', type: 'prod' },
  { from: 'next', to: 'react-dom', versionRange: '^18.2.0', type: 'prod' },
  { from: 'next', to: 'typescript', versionRange: '^5.0.0', type: 'peer' },
  { from: 'next', to: 'webpack', versionRange: '^5.0.0', type: 'prod' },
  { from: 'next', to: 'babel-core', versionRange: '^7.0.0', type: 'prod' },
  { from: 'vite', to: 'typescript', versionRange: '^5.0.0', type: 'peer' },
  { from: 'vite', to: 'eslint', versionRange: '^8.0.0', type: 'dev' },
  { from: 'webpack', to: 'babel-core', versionRange: '^7.0.0', type: 'prod' },
  { from: 'babel-core', to: 'lodash', versionRange: '^4.17.0', type: 'prod' },
  { from: 'jest', to: 'babel-core', versionRange: '^7.0.0', type: 'prod' },
  { from: 'jest', to: 'lodash', versionRange: '^4.17.0', type: 'prod' },
  { from: 'eslint', to: 'lodash', versionRange: '^4.17.0', type: 'prod' },
  { from: 'prettier', to: 'typescript', versionRange: '^5.0.0', type: 'peer' },
  { from: 'express', to: 'cors', versionRange: '^2.8.5', type: 'prod' },
  { from: 'express', to: 'dotenv', versionRange: '^16.0.0', type: 'prod' },
  { from: 'prisma', to: 'dotenv', versionRange: '^16.0.0', type: 'prod' },
  { from: 'react-query', to: 'react', versionRange: '^18.0.0', type: 'peer' },
  { from: 'react-query', to: 'zod', versionRange: '^3.0.0', type: 'prod' },
  { from: 'axios', to: 'dotenv', versionRange: '^16.0.0', type: 'dev' },
  { from: 'tailwindcss', to: 'typescript', versionRange: '^5.0.0', type: 'peer' },
  { from: 'neo4j-driver', to: 'dotenv', versionRange: '^16.0.0', type: 'dev' },
];

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
      // Constraint syntax might vary across Neo4j versions, fallback gracefully
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
