#!/usr/bin/env node
// Diagnostic startup script - logs environment before starting app

console.log('=== DATABASE CONFIGURATION ===');
console.log('DATABASE_URL is set:', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  const masked = dbUrl.replace(/:[^@]*@/, ':***@');
  console.log('DATABASE_URL:', masked);
  
  // Extract hostname
  const match = dbUrl.match(/@([^:/]+)/);
  const hostname = match ? match[1] : 'UNKNOWN';
  console.log('Database hostname:', hostname);
} else {
  console.error('❌ ERROR: DATABASE_URL is not set!');
  console.error('Make sure to set DATABASE_URL in Render environment variables');
  process.exit(1);
}

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT || '3000');
console.log('============================\n');

// Run database migrations before starting the app
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

(async () => {
  try {
    console.log('🔄 Running database migrations...');
    const { stdout, stderr } = await execPromise('npx drizzle-kit push');
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    console.log('✅ Migrations completed successfully\n');
  } catch (error) {
    console.warn('⚠️ Migration warning:', error.message);
    console.warn('Continuing with app startup...\n');
  }

  // Now start the actual app
  require('./dist/index.cjs');
})();
