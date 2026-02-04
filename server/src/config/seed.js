import dotenv from 'dotenv';
import User from '../models/User.js';
import bcrypt from 'bcrypt';

dotenv.config();

export const seedSuperAdmin = async () => {
  try {
    // Check if any users exist
    const userCount = await User.countDocuments();
    
    if (userCount > 0) {
      console.log('✅ Users already exist, skipping seed');
      return;
    }

    // Check for required environment variables
    const email = process.env.SEED_SUPERADMIN_EMAIL;
    const password = process.env.SEED_SUPERADMIN_PASSWORD;
    const name = process.env.SEED_SUPERADMIN_NAME || 'Super Admin';

    if (!email || !password) {
      console.log('⚠️  SEED_SUPERADMIN_EMAIL and SEED_SUPERADMIN_PASSWORD not set, skipping seed');
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create SUPER_ADMIN user
    // Note: Use SUPER_ADMIN (not ADMIN) for seed user
    const superAdmin = new User({
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: 'SUPER_ADMIN', // Keep as SUPER_ADMIN for system admin
      editor: true,
      status: 'active'
    });

    await superAdmin.save();

    console.log('✅ Super admin user created successfully');
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${name}`);
  } catch (error) {
    console.error('❌ Error seeding super admin:', error.message);
    // Don't throw - allow server to start even if seed fails
  }
};

