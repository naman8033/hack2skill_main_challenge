import fs from 'fs';
import path from 'path';
import { pool } from '../config/db';
import { logger } from '../utils/logger';

const initDb = async () => {
  logger.info('Initializing PostgreSQL database...');
  const sqlPath = path.join(__dirname, '../../database.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    logger.info('Database initialized successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Failed to initialize database:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

initDb();
