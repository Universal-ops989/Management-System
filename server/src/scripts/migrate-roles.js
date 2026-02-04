/**
 * Role Migration Script
 *
 * Converts BOSS → ADMIN (and any other legacy role mappings).
 * Idempotent: safe to run multiple times; only migrates users that still have BOSS.
 *
 * Run:
 *   node server/src/scripts/migrate-roles.js
 *   node server/src/scripts/migrate-roles.js --dry-run   # Log only, no writes
 *
 * Requires: MONGO_URI in .env (or defaults to mongodb://localhost:27017/teammanagement)
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { connectDB } from '../config/db.js';
import { LEGACY_ROLES, ROLES } from '../constants/roles.js';

dotenv.config();

const ROLE_MAPPINGS = [
  { from: LEGACY_ROLES.BOSS, to: ROLES.ADMIN }
  // Add other legacy→current mappings here if needed
];

const isDryRun = process.argv.includes('--dry-run');

const migrateRoles = async () => {
  try {
    console.log('🔄 Starting role migration...');
    if (isDryRun) console.log('   [DRY RUN – no changes will be written]\n');

    await connectDB();
    console.log('✅ Connected to database\n');

    let totalMigrated = 0;

    for (const { from: fromRole, to: toRole } of ROLE_MAPPINGS) {
      const users = await User.find({ role: fromRole }).lean();
      console.log(`📊 ${fromRole} → ${toRole}: found ${users.length} user(s)`);

      if (users.length === 0) continue;

      for (const u of users) {
        console.log(`   • ${u.email} (${u.name}) [${u._id}]`);
        if (!isDryRun) {
          await User.updateOne({ _id: u._id }, { $set: { role: toRole } });
        }
        totalMigrated++;
      }
      console.log(`   → ${isDryRun ? 'Would migrate' : 'Migrated'} ${users.length} user(s)\n`);
    }

    console.log(`✅ Role migration complete. ${totalMigrated} user(s) ${isDryRun ? 'would be ' : ''}migrated.\n`);

    // Verification
    for (const { from: fromRole } of ROLE_MAPPINGS) {
      const remaining = await User.countDocuments({ role: fromRole });
      if (remaining === 0) {
        console.log(`✅ Verification: no users left with role "${fromRole}"`);
      } else {
        console.log(`⚠️  Warning: ${remaining} user(s) still have role "${fromRole}"`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
};

migrateRoles();
