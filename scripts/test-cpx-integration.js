#!/usr/bin/env node

// Test script for CPX Research integration
const crypto = require('crypto');

// Test configuration
const CPX_CONFIG = {
  APP_ID: '27172',
  SECURE_HASH_KEY: 'mZ6JNyV7SeZh9CMPwU9mKe24A0IyfAxC',
  BASE_URL: 'https://offers.cpx-research.com/index.php',
};

// Test user data
const testUser = {
  id: 'test-user-123',
  name: 'John Doe',
  email: 'john@example.com',
};

// Function to generate secure hash
function generateCPXSecureHash(userId) {
  const hashString = `${userId}-${CPX_CONFIG.SECURE_HASH_KEY}`;
  return crypto.createHash('md5').update(hashString).digest('hex');
}

// Function to generate survey URL
function generateCPXSurveyURL(user) {
  const secureHash = generateCPXSecureHash(user.id);
  
  const params = new URLSearchParams({
    app_id: CPX_CONFIG.APP_ID,
    ext_user_id: user.id,
    secure_hash: secureHash,
    username: user.name || '',
    email: user.email || '',
    subid_1: '',
    subid_2: '',
  });

  return `${CPX_CONFIG.BASE_URL}?${params.toString()}`;
}

// Function to validate postback hash
function validateCPXPostbackHash(userId, receivedHash) {
  const expectedHash = generateCPXSecureHash(userId);
  return expectedHash === receivedHash;
}

// Run tests
console.log('🧪 Testing CPX Research Integration\n');

console.log('📊 Test Configuration:');
console.log(`   App ID: ${CPX_CONFIG.APP_ID}`);
console.log(`   User ID: ${testUser.id}`);
console.log(`   User Name: ${testUser.name}`);
console.log(`   User Email: ${testUser.email}\n`);

console.log('🔐 Security Tests:');
const testHash = generateCPXSecureHash(testUser.id);
console.log(`   Generated Hash: ${testHash}`);
console.log(`   Hash Validation: ${validateCPXPostbackHash(testUser.id, testHash) ? '✅ PASS' : '❌ FAIL'}\n`);

console.log('🔗 Survey URL Generation:');
const surveyURL = generateCPXSurveyURL(testUser);
console.log(`   URL: ${surveyURL}\n`);

console.log('📋 URL Components:');
const url = new URL(surveyURL);
url.searchParams.forEach((value, key) => {
  console.log(`   ${key}: ${value}`);
});

console.log('\n✅ CPX Integration Test Complete!');
console.log('\n📝 Next Steps:');
console.log('   1. Update CPX Research dashboard with postback URL');
console.log('   2. Set redirect URL in CPX Research dashboard');
console.log('   3. Test survey completion flow end-to-end');
console.log('   4. Monitor postback logs for successful completions'); 