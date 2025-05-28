#!/usr/bin/env node

/**
 * Deployment Preparation Script
 * 
 * This script prepares the application for deployment by:
 * 1. Cleaning up unnecessary files
 * 2. Running pre-deployment checks
 * 3. Ensuring proper configuration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk') || { green: (t) => t, red: (t) => t, yellow: (t) => t, blue: (t) => t };

console.log(chalk.blue('📦 Starting deployment preparation...'));

// Paths to check and clean
const pathsToClean = [
  '.next/cache',
  'node_modules/.cache',
];

// Clean build directories
try {
  console.log(chalk.blue('🧹 Cleaning build cache...'));
  pathsToClean.forEach(dirPath => {
    const fullPath = path.join(process.cwd(), dirPath);
    if (fs.existsSync(fullPath)) {
      console.log(`   Removing ${dirPath}...`);
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  });
  console.log(chalk.green('✅ Build cache cleaned successfully'));
} catch (error) {
  console.error(chalk.red('❌ Error cleaning build cache:'), error);
}

// Check R2 configuration
try {
  console.log(chalk.blue('🔍 Checking R2 configuration...'));
  
  // Check .env.local for R2 variables
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasR2Config = 
      envContent.includes('R2_ACCESS_KEY_ID') && 
      envContent.includes('R2_SECRET_ACCESS_KEY') && 
      envContent.includes('R2_ENDPOINT') &&
      envContent.includes('R2_BUCKET_NAME') &&
      envContent.includes('R2_PUBLIC_URL');
    
    if (hasR2Config) {
      console.log(chalk.green('✅ R2 configuration found in .env.local'));
    } else {
      console.log(chalk.yellow('⚠️ R2 configuration incomplete in .env.local'));
      console.log(chalk.yellow('   Running R2 setup script...'));
      execSync('node scripts/update-r2-config.js', { stdio: 'inherit' });
    }
  } else {
    console.log(chalk.yellow('⚠️ .env.local not found'));
    console.log(chalk.yellow('   Creating .env.local with R2 configuration...'));
    execSync('node scripts/update-r2-config.js', { stdio: 'inherit' });
  }
} catch (error) {
  console.error(chalk.red('❌ Error checking R2 configuration:'), error);
}

// Verify database connection
try {
  console.log(chalk.blue('🔍 Verifying database connection...'));
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log(chalk.green('✅ Database schema generated successfully'));
} catch (error) {
  console.error(chalk.red('❌ Error verifying database connection:'), error);
  process.exit(1);
}

// Run dependency check
try {
  console.log(chalk.blue('🔍 Checking for outdated dependencies...'));
  execSync('npm outdated --depth=0', { stdio: 'inherit' });
  console.log(chalk.green('✅ Dependency check completed'));
} catch (error) {
  // npm outdated returns non-zero exit code if there are outdated deps
  console.log(chalk.yellow('⚠️ Some dependencies might be outdated'));
}

// Create a production build
try {
  console.log(chalk.blue('🔨 Creating production build...'));
  execSync('npm run build', { stdio: 'inherit' });
  console.log(chalk.green('✅ Production build created successfully'));
} catch (error) {
  console.error(chalk.red('❌ Error creating production build:'), error);
  process.exit(1);
}

// Final instructions
console.log('\n' + chalk.green('🚀 Deployment preparation completed successfully!'));
console.log('\n' + chalk.blue('Next steps:'));
console.log('1. Deploy the application using your preferred hosting provider');
console.log('2. Ensure environment variables are properly configured in your hosting environment');
console.log('3. Make sure your R2 bucket is accessible from your hosting environment');
console.log('4. Set up proper CORS configuration for your R2 bucket');
console.log('\n' + chalk.blue('For more information, see docs/deployment.md'));

// Exit successfully
process.exit(0); 