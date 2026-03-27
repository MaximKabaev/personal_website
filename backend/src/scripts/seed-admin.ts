import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import { query, queryOne } from '../config/database';

async function seedAdmin() {
  const email = 'mkabaevuk@gmail.com';
  const password = 'Vfrcbvrec_2005';

  // Create users table if it doesn't exist
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Check if user already exists
  const existing = await queryOne<{ id: string }>('SELECT id FROM users WHERE email = $1', [email]);
  if (existing) {
    console.log('Admin user already exists, updating password...');
    const hash = await bcrypt.hash(password, 12);
    await query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, email]);
    console.log('Password updated.');
  } else {
    const hash = await bcrypt.hash(password, 12);
    await query('INSERT INTO users (email, password_hash) VALUES ($1, $2)', [email, hash]);
    console.log('Admin user created.');
  }

  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
