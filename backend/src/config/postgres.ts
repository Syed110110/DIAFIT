import { Pool } from 'pg';

export const postgresPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

postgresPool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message);
});