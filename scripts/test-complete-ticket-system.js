#!/usr/bin/env node

/**
 * Complete Ticket System Test for Production
 * 
 * This script tests the entire ticket award system in production:
 * 1. CPX postback simulation 
 * 2. Email verification
 * 3. Dashboard ticket visibility
 * 4. Lottery participation
 */

const crypto = require('crypto');

// Production Configuration
const PRODUCTION_CONFIG = {
  APP_ID: '27172',
  SECURE_HASH_KEY: 'mZ6JNyV7SeZh9CMPwU9mKe24A0IyfAxC',
  BASE_URL: 'https://0mninetlottery.com',
  
  // API endpoints
  CPX_POSTBACK_URL: 'https://0mninetlottery.com/api/cpx-postback',
  DASHBOARD_URL: 'https://0mninetlottery.com/dashboard',
  API_VERIFY_URL: 'https://0mninetlottery.com/api/tickets/verify-all',
};

// Test user data - Replace with actual user ID from your database
const TEST_USER = {
  id: 'USER_ID_PLACEHOLDER', // Replace with real user ID
  name: 'Test User',
  email: 'test@example.com',
};

/**
 * Generate CPX secure hash
 */
function generateCPXSecureHash(userId) {
  const hashString = `${userId}-${PRODUCTION_CONFIG.SECURE_HASH_KEY}`;
  return crypto.createHash('md5').update(hashString).digest('hex');
}

/**
 * Simulate completed survey postback
 */
function generateCompletedSurveyPostback(userId) {
  const hash = generateCPXSecureHash(userId);
  const transId = `production_test_${Date.now()}`;
  
  const params = new URLSearchParams({
    status: '1', // Completed survey
    trans_id: transId,
    user_id: userId,
    amount_usd: '0.50',
    hash: hash,
    ip_click: '127.0.0.1',
    currency_name: 'USD',
    currency_amount: '0.50',
    test_mode: '1', // Enable test mode
  });

  return `${PRODUCTION_CONFIG.CPX_POSTBACK_URL}?${params.toString()}`;
}

/**
 * Main test function
 */
async function runProductionTest() {
  console.log('🚀 Starting Complete Production Ticket System Test');
  console.log('===============================================');
  
  if (TEST_USER.id === 'USER_ID_PLACEHOLDER') {
    console.error('❌ ERROR: Please update TEST_USER.id with a real user ID from your database');
    console.error('   You can find user IDs in your database or admin panel');
    process.exit(1);
  }
  
  console.log('\n📋 Test Configuration:');
  console.log(`   Production URL: ${PRODUCTION_CONFIG.BASE_URL}`);
  console.log(`   CPX Postback: ${PRODUCTION_CONFIG.CPX_POSTBACK_URL}`);
  console.log(`   Test User ID: ${TEST_USER.id}`);
  console.log(`   Test User Email: ${TEST_USER.email}`);
  
  // Generate test URLs
  const completedPostbackUrl = generateCompletedSurveyPostback(TEST_USER.id);
  const expectedHash = generateCPXSecureHash(TEST_USER.id);
  
  console.log('\n🔗 Generated Test URLs:');
  console.log('\n   1. Completed Survey Postback:');
  console.log(`   ${completedPostbackUrl}`);
  
  console.log('\n   2. Manual Test Command:');
  console.log(`   curl "${completedPostbackUrl}"`);
  
  console.log('\n   3. Dashboard Check:');
  console.log(`   ${PRODUCTION_CONFIG.DASHBOARD_URL}`);
  
  console.log('\n   4. API Verification:');
  console.log(`   curl "${PRODUCTION_CONFIG.API_VERIFY_URL}"`);
  
  console.log('\n🔐 Security Information:');
  console.log(`   Expected Hash: ${expectedHash}`);
  console.log(`   Hash Algorithm: MD5(${TEST_USER.id}-${PRODUCTION_CONFIG.SECURE_HASH_KEY})`);
  
  console.log('\n📧 Email System Test:');
  console.log(`   Confirmation emails should be sent to: ${TEST_USER.email}`);
  console.log('   Check for emails with subject: "🎯 Ticket Earned - Your Entry is Confirmed!"');
  console.log('   Email should contain direct dashboard link for backup access');
  
  console.log('\n🧪 Test Steps:');
  console.log('   1. Run the curl command above to simulate completed survey');
  console.log('   2. Check server logs for "✅ Survey completed successfully" message');
  console.log('   3. Verify email receipt (check spam folder too)');
  console.log('   4. Visit dashboard to confirm ticket is visible');
  console.log('   5. Check that ticket is applied to current lottery draw');
  
  console.log('\n✅ Expected Results:');
  console.log('   • Server responds with "OK" (200 status)');
  console.log('   • User receives instant confirmation email');
  console.log('   • Dashboard shows +1 available ticket');
  console.log('   • Ticket is automatically entered in lottery');
  console.log('   • Logs show successful ticket award and email sending');
  
  console.log('\n⚠️  Troubleshooting:');
  console.log('   • If no email: Check server logs for email sending errors');
  console.log('   • If no ticket: Check server logs for database transaction errors');
  console.log('   • If hash error: Verify SECURE_HASH_KEY matches CPX configuration');
  console.log('   • If user not found: Verify user ID exists in database');
  
  console.log('\n🔧 Debug Commands:');
  console.log('   Check user tickets:');
  console.log(`   curl "${PRODUCTION_CONFIG.API_VERIFY_URL}?user_id=${TEST_USER.id}"`);
  console.log('\n   Check server health:');
  console.log(`   curl "${PRODUCTION_CONFIG.BASE_URL}/api/health"`);
  
  console.log('\n📊 Success Metrics:');
  console.log('   • Response time < 5 seconds');
  console.log('   • Email delivery < 30 seconds');  
  console.log('   • Dashboard update < 10 seconds');
  console.log('   • Zero error logs');
  
  console.log('\n🎯 Production Readiness Checklist:');
  console.log('   [ ] CPX Research postback URL configured to: ' + PRODUCTION_CONFIG.CPX_POSTBACK_URL);
  console.log('   [ ] Domain environment variable set to: ' + PRODUCTION_CONFIG.BASE_URL);
  console.log('   [ ] Email service (Resend) configured with noreply@0mninetlottery.com');
  console.log('   [ ] Database accessible and responsive');
  console.log('   [ ] All hardcoded localhost URLs replaced');
  
  console.log('\n==========================================');
  console.log('🎬 Ready to test! Run the curl command above');
  console.log('==========================================\n');
}

// Handle command line arguments
if (process.argv.length > 2) {
  const userId = process.argv[2];
  if (userId && userId !== 'USER_ID_PLACEHOLDER') {
    TEST_USER.id = userId;
    console.log(`Using provided user ID: ${userId}`);
  }
}

// Run the test
runProductionTest().catch(error => {
  console.error('❌ Test script error:', error);
  process.exit(1);
}); 