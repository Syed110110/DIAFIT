import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { createIdentity, findIdentityByEmail } from './Services/identityService';
import { postgresPool } from './config/postgres';

const seedAdmin = async (): Promise<void> => {
  const email = process.env.SEED_ADMIN_EMAIL?.trim();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) {
    throw new Error('Set SEED_ADMIN_EMAIL and a SEED_ADMIN_PASSWORD of at least 12 characters');
  }

  const existing = await findIdentityByEmail(email);
  if (existing) {
    if (existing.role !== 'ADMIN') throw new Error('The configured seed email already belongs to a non-admin account');
    console.log('Admin account already exists; no changes made.');
    return;
  }

  await createIdentity({
    id: new mongoose.Types.ObjectId().toString(),
    name: process.env.SEED_ADMIN_NAME?.trim() || 'DiaFit Administrator',
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role: 'ADMIN',
  });
  console.log('Initial admin account created.');
};

seedAdmin()
  .catch((error) => {
    console.error('Admin bootstrap failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => postgresPool.end());