#!/usr/bin/env node

/**
 * Update R2 Configuration Script
 * 
 * This script updates the .env.local file with the correct Cloudflare R2 configuration
 * using the specific bucket information provided.
 */

const fs = require('fs');
const path = require('path');

// R2 Configuration with the specific public URL
const R2_CONFIG = `# Cloudflare R2 Storage Configuration
R2_ACCESS_KEY_ID="55fc5f80c61658b7e377f24753627533"
R2_SECRET_ACCESS_KEY="eeb26ad402ad81e3a9b4ae5cbf8105ec9a01cda43403dffe76759179d5d09217"
R2_ENDPOINT="https://bd5e8fdcf204f2176a5054c83d305f64.r2.cloudflarestorage.com"
R2_BUCKET_NAME="profile-pictures"
R2_PUBLIC_URL="https://pub-b2324473ca07422eb03dc71f10cb2b20.r2.dev"
`;

// Path to .env.local file
const envPath = path.join(process.cwd(), '.env.local');

// Update the .env.local file
try {
  // Check if .env.local exists
  let existingEnv = '';
  if (fs.existsSync(envPath)) {
    existingEnv = fs.readFileSync(envPath, 'utf8');
    console.log('Found existing .env.local file');
  }

  // Remove any existing R2 configuration
  const updatedEnv = existingEnv
    .split('\n')
    .filter(line => !line.startsWith('R2_'))
    .join('\n');

  // Add the new R2 configuration
  fs.writeFileSync(envPath, updatedEnv + '\n\n' + R2_CONFIG);
  console.log('✅ Successfully updated Cloudflare R2 configuration in .env.local');
  console.log('The following variables have been updated:');
  console.log('- R2_ACCESS_KEY_ID');
  console.log('- R2_SECRET_ACCESS_KEY');
  console.log('- R2_ENDPOINT');
  console.log('- R2_BUCKET_NAME');
  console.log('- R2_PUBLIC_URL = "https://pub-b2324473ca07422eb03dc71f10cb2b20.r2.dev"');
  
  console.log('\n🔍 Configuration complete. The system will now use ONLY R2 storage for uploads.');
  console.log('🚀 Please restart your Next.js server for changes to take effect.');
} catch (err) {
  console.error('❌ Error updating .env.local file:', err);
  process.exit(1);
}

// Exit successfully
process.exit(0); 