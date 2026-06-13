import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Prevent idle client errors from crashing the process
pool.on('error', (err) => {
  console.error('Postgres pool error:', err.message);
});

export async function query(text, params) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}
