#!/usr/bin/env node

/**
 * Cloudflare R2 Setup Script
 * 
 * This script creates the necessary .env.local file with Cloudflare R2 credentials
 * and provides instructions for setting up the R2 bucket manually.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Extract the account ID from the endpoint URL
const ACCOUNT_ID = 'bd5e8fdcf204f2176a5054c83d305f64';

const R2_CONFIG = `# Cloudflare R2 Storage Configuration
R2_ACCESS_KEY_ID="55fc5f80c61658b7e377f24753627533"
R2_SECRET_ACCESS_KEY="eeb26ad402ad81e3a9b4ae5cbf8105ec9a01cda43403dffe76759179d5d09217"
R2_ENDPOINT="https://${ACCOUNT_ID}.r2.cloudflarestorage.com"
R2_BUCKET_NAME="profile-pictures"
R2_PUBLIC_URL="https://pub-${ACCOUNT_ID}.r2.dev"
`;

// Path to .env.local file
const envPath = path.join(process.cwd(), '.env.local');

// Check if .env.local exists
let existingEnv = '';
try {
  if (fs.existsSync(envPath)) {
    existingEnv = fs.readFileSync(envPath, 'utf8');
    console.log('Found existing .env.local file');
  }
} catch (err) {
  console.error('Error checking for existing .env.local file:', err);
}

// Add R2 config if it doesn't already exist
if (!existingEnv.includes('R2_ACCESS_KEY_ID')) {
  try {
    fs.writeFileSync(envPath, existingEnv + '\n' + R2_CONFIG);
    console.log('✅ Successfully added Cloudflare R2 configuration to .env.local');
    console.log('The following variables have been added:');
    console.log('- R2_ACCESS_KEY_ID');
    console.log('- R2_SECRET_ACCESS_KEY');
    console.log('- R2_ENDPOINT');
    console.log('- R2_BUCKET_NAME');
    console.log('- R2_PUBLIC_URL');
  } catch (err) {
    console.error('❌ Error writing to .env.local file:', err);
    process.exit(1);
  }
} else {
  console.log('ℹ️ Cloudflare R2 configuration already exists in .env.local');
  
  // Check if we need to add the R2_PUBLIC_URL
  if (!existingEnv.includes('R2_PUBLIC_URL')) {
    try {
      const updatedEnv = existingEnv + `\nR2_PUBLIC_URL="https://pub-${ACCOUNT_ID}.r2.dev"\n`;
      fs.writeFileSync(envPath, updatedEnv);
      console.log('✅ Added missing R2_PUBLIC_URL to .env.local');
    } catch (err) {
      console.error('❌ Error updating .env.local file:', err);
    }
  }
}

// Print instructions for manual bucket setup
console.log('\n📝 IMPORTANT: Manual Bucket Setup Required');
console.log('-----------------------------------');
console.log('You need to manually create the "profile-pictures" bucket in your Cloudflare dashboard:');
console.log('1. Log in to your Cloudflare dashboard at https://dash.cloudflare.com');
console.log('2. Navigate to R2 from the sidebar');
console.log('3. Click "Create bucket"');
console.log('4. Enter "profile-pictures" as the bucket name');
console.log('5. Click "Create bucket"');
console.log('\nAfter creating the bucket, enable Public Access:');
console.log('1. Select the "profile-pictures" bucket');
console.log('2. Go to "Settings" > "Public access"');
console.log('3. Toggle "Public access" to On');
console.log('\nThen set up CORS configuration:');
console.log('1. In the bucket settings, go to "Settings" > "CORS"');
console.log('2. Add a new rule with:');
console.log('   - Allowed origins: *');
console.log('   - Allowed methods: GET, PUT, POST, DELETE');
console.log('   - Allowed headers: *');
console.log('   - Max age: 86400');
console.log('\n✅ For detailed instructions, see docs/cloudflare-r2-setup.md');

// Test if we can connect to R2
console.log('\n🔍 Testing R2 connection...');
try {
  const testResult = execSync('node -e "const { S3Client, HeadBucketCommand } = require(\'@aws-sdk/client-s3\'); const s3 = new S3Client({ region: \'auto\', endpoint: process.env.R2_ENDPOINT, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY } }); (async () => { try { await s3.send(new HeadBucketCommand({ Bucket: process.env.R2_BUCKET_NAME })); console.log(\'✅ R2 connection successful - bucket exists\'); } catch (err) { if (err.name === \'NotFound\') { console.log(\'❌ R2 bucket not found - please create it manually\'); } else if (err.name === \'AccessDenied\') { console.log(\'❌ R2 access denied - check your credentials\'); } else { console.log(\'❌ R2 connection error: \' + err.message); } } })()"', { 
    env: { 
      ...process.env, 
      R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || '55fc5f80c61658b7e377f24753627533',
      R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || 'eeb26ad402ad81e3a9b4ae5cbf8105ec9a01cda43403dffe76759179d5d09217',
      R2_ENDPOINT: process.env.R2_ENDPOINT || `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
      R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || 'profile-pictures',
    },
  }).toString();
  console.log(testResult);
} catch (error) {
  console.log('❌ R2 connection test failed. Please check your credentials and network connection.');
  if (error.stdout) {
    console.log(error.stdout.toString());
  }
}

// Exit successfully
process.exit(0); 