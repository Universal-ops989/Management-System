import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';
import { seedSuperAdmin } from './config/seed.js';

dotenv.config();

const PORT = process.env.PORT || 3002;

// Connect to database and seed
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Seed super admin if no users exist
    await seedSuperAdmin();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

