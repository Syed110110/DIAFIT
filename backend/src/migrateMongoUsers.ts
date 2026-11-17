import 'dotenv/config';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './models/User';
import { postgresPool } from './config/postgres';
import { userRoles, UserRole } from './Services/identityService';

const isBcryptHash = (value: string): boolean => /^\$2[aby]\$\d{2}\$/.test(value);

const migrateMongoUsers = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI must be set to import existing accounts');

  await mongoose.connect(mongoUri);
  const users = await User.find().select('+password');
  let migrated = 0;
  let skipped = 0;

  for (const user of users) {
    const id = user._id.toString();
    if (!/^[a-fA-F0-9]{24}$/.test(id) || !user.password) {
      console.warn(`Skipping user without a valid legacy id or password: ${id}`);
      skipped += 1;
      continue;
    }

    const role: UserRole = user.role && userRoles.includes(user.role) ? user.role : 'PATIENT';
    const passwordHash = isBcryptHash(user.password)
      ? user.password
      : await bcrypt.hash(user.password, 12);

    try {
      await postgresPool.query(
        `INSERT INTO users (id, name, email, password_hash, role, is_active)
         VALUES ($1, $2, lower($3), $4, $5, true)
         ON CONFLICT (id) DO NOTHING`,
        [id, user.name, user.email, passwordHash, role]
      );
      migrated += 1;
    } catch (error) {
      console.error(`Could not import account ${user.email}:`, error);
      skipped += 1;
    }
  }

  console.log(`Identity import complete. Imported: ${migrated}; skipped: ${skipped}.`);
};

migrateMongoUsers()
  .catch((error) => {
    console.error('Mongo identity import failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await postgresPool.end();
    await mongoose.disconnect();
  });