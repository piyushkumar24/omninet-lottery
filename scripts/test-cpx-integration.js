#!/usr/bin/env node

// Enhanced test script for CPX Research integration
const crypto = require('crypto');

// Test configuration
const CPX_CONFIG = {
  APP_ID: '27172',
  SECURE_HASH_KEY: 'mZ6JNyV7SeZh9CMPwU9mKe24A0IyfAxC',
  BASE_URL: 'https://offers.cpx-research.com/index.php',
  POSTBACK_URL: 'https://8bad-2406-7400-81-835f-cc49-26c4-69fc-3b65.ngrok-free.app/api/cpx-postback',
  REDIRECT_URL: 'https://8bad-2406-7400-81-835f-cc49-26c4-69fc-3b65.ngrok-free.app/dashboard?survey=completed',
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

// Run tests
console.log('🧪 Enhanced CPX Research Integration Test\n');

console.log('📊 Configuration Check:');
console.log(`   ✅ App ID: ${CPX_CONFIG.APP_ID}`);
console.log(`   ✅ Base URL: ${CPX_CONFIG.BASE_URL}`);
console.log(`   ✅ Postback URL: ${CPX_CONFIG.POSTBACK_URL}`);
console.log(`   ✅ Redirect URL: ${CPX_CONFIG.REDIRECT_URL}\n`);

console.log('👤 Test User:');
console.log(`   ID: ${testUser.id}`);
console.log(`   Name: ${testUser.name}`);
console.log(`   Email: ${testUser.email}\n`);

console.log('🔐 Security Tests:');
const testHash = generateCPXSecureHash(testUser.id);
console.log(`   Generated Hash: ${testHash}`);
console.log(`   Hash Length: ${testHash.length} characters`);
console.log(`   Hash Validation: ${validateCPXPostbackHash(testUser.id, testHash) ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Invalid Hash Test: ${!validateCPXPostbackHash(testUser.id, 'invalid-hash') ? '✅ PASS' : '❌ FAIL'}\n`);

console.log('🔗 Survey URL Generation:');
const surveyURL = generateCPXSurveyURL(testUser);
console.log(`   URL: ${surveyURL}\n`);

console.log('📋 URL Parameters:');
const url = new URL(surveyURL);
url.searchParams.forEach((value, key) => {
  console.log(`   ${key}: ${value}`);
});

console.log('\n🔄 Postback Simulation:');
const successPostback = simulatePostback(testUser.id, '1', 'success-123');
const failurePostback = simulatePostback(testUser.id, '0', 'failure-456');

console.log(`   Success Postback: ${successPostback}`);
console.log(`   Failure Postback: ${failurePostback}\n`);

console.log('🔍 Troubleshooting Checklist:');
console.log('   ❓ Is your ngrok tunnel running?');
console.log('   ❓ Is the postback URL accessible from external networks?');
console.log('   ❓ Are CPX Research dashboard settings updated?');
console.log('   ❓ Is the database connection working?');
console.log('   ❓ Are there any console errors in the browser?\n');

console.log('🛠️ Common Issues & Solutions:');
console.log('   🔹 "No surveys available" → Normal, try different demographics or wait');
console.log('   🔹 "Survey reward failed" → Check postback URL and hash validation');
console.log('   🔹 "Decimal tickets" → You\'re seeing winning percentage, not ticket count');
console.log('   🔹 "Postback not received" → Verify ngrok tunnel and CPX dashboard URL\n');

console.log('🧪 Test Commands:');
console.log(`   📡 Test postback manually:`);
console.log(`   curl "${successPostback}"`);
console.log(`\n   🎫 Create test ticket (if logged in):`);
console.log(`   curl -X PUT "${CPX_CONFIG.POSTBACK_URL.replace('/api/cpx-postback', '/api/cpx-postback')}?test=true&user_id=YOUR_USER_ID"`);

console.log('\n✅ CPX Integration Test Complete!');
console.log('\n📝 Next Steps:');
console.log('   1. Verify ngrok tunnel is active and accessible');
console.log('   2. Update CPX Research dashboard with correct URLs');
console.log('   3. Test survey completion flow end-to-end');
console.log('   4. Monitor browser console and server logs for errors');
console.log('   5. Check database for ticket creation after surveys');
console.log('\n🎯 Remember: The decimal numbers you see are winning percentages, not ticket counts!');
console.log('💡 Your actual ticket count is always a whole number (1, 2, 3, etc.)'); 