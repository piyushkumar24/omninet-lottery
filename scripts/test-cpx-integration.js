#!/usr/bin/env node

// Enhanced test script for CPX Research integration
const crypto = require('crypto');

// Test configuration
const CPX_CONFIG = {
  APP_ID: '27172',
  SECURE_HASH_KEY: 'mZ6JNyV7SeZh9CMPwU9mKe24A0IyfAxC',
  BASE_URL: 'https://offers.cpx-research.com/index.php',
  POSTBACK_URL: 'http://localhost:3000/api/cpx-postback',
  REDIRECT_URL: 'http://localhost:3000/dashboard?survey=completed',
};

// Test user data
const testUser = {
  id: process.argv[2] || 'test-user-123',
  name: 'John Doe',
  email: 'john@example.com',
};

// Function to generate secure hash
function generateCPXSecureHash(userId) {
  const hashString = `${userId}-${CPX_CONFIG.SECURE_HASH_KEY}`;
  return crypto.createHash('md5').update(hashString).digest('hex');
}

// Function to generate survey URL with all required parameters
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
    redirect: CPX_CONFIG.REDIRECT_URL,
  });

  return `${CPX_CONFIG.BASE_URL}?${params.toString()}`;
}

// Function to validate postback hash
function validateCPXPostbackHash(userId, receivedHash) {
  const expectedHash = generateCPXSecureHash(userId);
  return expectedHash === receivedHash;
}

// Function to simulate CPX postback
function simulatePostback(userId, status = '1', transId = 'test-trans-123') {
  const hash = generateCPXSecureHash(userId);
  const params = new URLSearchParams({
    status: status,
    trans_id: transId,
    user_id: userId,
    amount_usd: '0.50',
    hash: hash,
    ip_click: '127.0.0.1',
    offer_id: 'test-offer-456',
  });

  return `${CPX_CONFIG.POSTBACK_URL}?${params.toString()}`;
}

// Calculate test values
const testHash = generateCPXSecureHash(testUser.id);
const surveyUrl = generateCPXSurveyURL(testUser);
const postbackUrl = simulatePostback(testUser.id);
const testModeUrl = `${CPX_CONFIG.POSTBACK_URL}?status=1&trans_id=test_${Date.now()}&user_id=${testUser.id}&hash=${testHash}&test_mode=1`;

// Display information
console.log('\n🔍 CPX Integration Tester');
console.log('=======================\n');

console.log(`Testing with user ID: ${testUser.id}`);
console.log(`Generated secure hash: ${testHash}`);

console.log('\n📋 Test Results:');
console.log('-------------');
console.log(`   Hash Validation: ${validateCPXPostbackHash(testUser.id, testHash) ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Invalid Hash Test: ${!validateCPXPostbackHash(testUser.id, 'invalid-hash') ? '✅ PASS' : '❌ FAIL'}\n`);

console.log('🔗 CPX Survey URL:');
console.log('---------------');
console.log(`   ${surveyUrl}\n`);

console.log('🔗 Simulated Postback URL:');
console.log('----------------------');
console.log(`   ${postbackUrl}\n`);

console.log('🔗 Test Mode URL:');
console.log('--------------');
console.log(`   ${testModeUrl}\n`);

console.log('📝 Debugging Commands:');
console.log('-------------------');
console.log(`   Test API: curl "http://localhost:3000/api/cpx-test?user_id=${testUser.id}"`);
console.log(`   Test Postback: curl "${testModeUrl}"`);
console.log(`   Production Postback: curl "${postbackUrl}"\n`);

console.log('❓ Common Issues:');
console.log('--------------');
console.log('   🔹 "Invalid hash" → Check SECURE_HASH_KEY in lib/cpx-utils.ts');
console.log('   🔹 "Survey reward failed" → Check postback URL and hash validation');
console.log('   🔹 "Redirect not working" → Verify REDIRECT_URL setting\n');

console.log('📚 Next Steps:');
console.log('-----------');
console.log('   1. Run with a specific user ID: node scripts/test-cpx-integration.js USER_ID');
console.log('   2. Update CPX_CONFIG to match your production environment');
console.log('   3. Test with real CPX Research dashboard\n');

console.log('Happy testing! 🎉\n'); 