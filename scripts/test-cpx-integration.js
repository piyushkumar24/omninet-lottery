#!/usr/bin/env node

/**
 * CPX Research Integration Tester
 * 
 * This script helps test and debug the CPX Research integration
 * including the new guaranteed ticket system.
 */

const crypto = require('crypto');

// Configuration - Update these to match your setup
const CPX_CONFIG = {
  APP_ID: '27172',
  SECURE_HASH_KEY: 'mZ6JNyV7SeZh9CMPwU9mKe24A0IyfAxC',
  BASE_URL: 'https://offers.cpx-research.com/index.php',
  POSTBACK_URL: 'https://0mninetlottery.com/api/cpx-postback',
  APP_URL: 'https://0mninetlottery.com',
};

// Test user data - Replace with actual user ID from your database
const testUser = {
  id: 'cm3u1p2en0002vgkvuqz8fnkx', // Replace with real user ID
  name: 'Test User',
  email: 'test@example.com',
};

/**
 * Generate CPX secure hash
 */
function generateCPXSecureHash(userId) {
  const hashString = `${userId}-${CPX_CONFIG.SECURE_HASH_KEY}`;
  return crypto.createHash('md5').update(hashString).digest('hex');
}

/**
 * Generate CPX survey URL with 0mninet branding
 */
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
    redirect: `${CPX_CONFIG.APP_URL}/dashboard?survey=completed`,
    // 0mninet branding
    header_color: '#3b82f6',
    text_color: '#ffffff',
    logo_url: `${CPX_CONFIG.APP_URL}/main-logo.png`,
    company_name: '0mninet',
  });

  return `${CPX_CONFIG.BASE_URL}?${params.toString()}`;
}

/**
 * Simulate CPX postback URL for testing
 */
function simulatePostback(userId, status = '1') {
  const hash = generateCPXSecureHash(userId);
  const transId = `test_${Date.now()}`;
  
  const params = new URLSearchParams({
    status: status,
    trans_id: transId,
    user_id: userId,
    amount_usd: '0.50',
    hash: hash,
    ip_click: '127.0.0.1',
    offer_id: 'test_offer',
  });

  return `${CPX_CONFIG.POSTBACK_URL}?${params.toString()}`;
}

// Calculate test values
const testHash = generateCPXSecureHash(testUser.id);
const surveyUrl = generateCPXSurveyURL(testUser);
const completedPostbackUrl = simulatePostback(testUser.id, '1'); // Completed survey
const incompletePostbackUrl = simulatePostback(testUser.id, '0'); // Incomplete survey
const testModeUrl = `${CPX_CONFIG.POSTBACK_URL}?status=1&trans_id=test_${Date.now()}&user_id=${testUser.id}&hash=${testHash}&test_mode=1`;
const fallbackUrl = `${CPX_CONFIG.APP_URL}/api/survey/complete`;

// Display information
console.log('\n🔍 CPX Integration Tester - Guaranteed Ticket System');
console.log('='.repeat(80));

console.log('\n📊 Configuration:');
console.log(`   App ID: ${CPX_CONFIG.APP_ID}`);
console.log(`   User ID: ${testUser.id}`);
console.log(`   User Hash: ${testHash}`);
console.log(`   Postback URL: ${CPX_CONFIG.POSTBACK_URL}`);

console.log('\n🔗 Generated URLs:');
console.log('\n   Survey URL (with 0mninet branding):');
console.log(`   ${surveyUrl}`);

console.log('\n   Test Completed Survey Postback:');
console.log(`   ${completedPostbackUrl}`);

console.log('\n   Test Incomplete Survey Postback (still awards ticket):');
console.log(`   ${incompletePostbackUrl}`);

console.log('\n   Test Mode URL:');
console.log(`   ${testModeUrl}`);

console.log('\n   Fallback Ticket Award URL:');
console.log(`   ${fallbackUrl}`);

console.log('\n🧪 Testing Commands:');
console.log('   Test completed survey postback:');
console.log(`   curl "${completedPostbackUrl}"`);

console.log('\n   Test incomplete survey postback (guaranteed ticket):');
console.log(`   curl "${incompletePostbackUrl}"`);

console.log('\n   Test fallback ticket award:');
console.log(`   curl -X POST "${fallbackUrl}" -H "Content-Type: application/json"`);

console.log('\n   Test mode (no hash validation):');
console.log(`   curl "${testModeUrl}"`);

console.log('\n🎯 New Guaranteed Ticket Features:');
console.log('   ✅ Tickets awarded even for incomplete surveys (status !== 1)');
console.log('   ✅ Fallback API endpoint for manual ticket awards');
console.log('   ✅ Enhanced UI with guaranteed ticket messaging');
console.log('   ✅ 0mninet branding in CPX surveys');
console.log('   ✅ No surveys available = still get ticket');

console.log('\n🔧 Troubleshooting:');
console.log('   🔹 "No surveys available" → Normal! User still gets ticket');
console.log('   🔹 "Survey reward failed" → Check postback URL and hash validation');
console.log('   🔹 "Survey disqualification" → User still gets participation ticket');
console.log('   🔹 "Loading failed" → Fallback API will award ticket');

console.log('\n📝 Expected Behavior:');
console.log('   1. User clicks "Go to Survey"');
console.log('   2. Survey loads with 0mninet branding (blue header, logo)');
console.log('   3. IF survey available → User completes → Gets ticket via postback');
console.log('   4. IF no survey available → User gets ticket via fallback API');
console.log('   5. IF survey fails to load → User gets ticket via fallback API');
console.log('   6. IF user disqualified → User gets ticket via postback (status=0)');
console.log('   7. User returns to dashboard with success message');

console.log('\n🎫 Ticket Award Sources:');
console.log('   • Completed surveys (status=1) → Full reward');
console.log('   • Incomplete surveys (status=0) → Participation reward');
console.log('   • No surveys available → Participation reward (fallback API)');
console.log('   • Loading failures → Participation reward (fallback API)');

console.log('\n🎨 Branding Features:');
console.log('   • Header: 0mninet blue gradient (#3b82f6)');
console.log('   • Logo: /main-logo.png displayed in survey');
console.log('   • Company name: "0mninet" instead of "CPX Research"');
console.log('   • Custom CSS: Professional styling with 0mninet colors');

console.log('\n✅ Success Indicators:');
console.log('   • Survey modal loads with blue 0mninet branding');
console.log('   • "Guaranteed ticket" messaging displayed');
console.log('   • Ticket awarded regardless of survey outcome');
console.log('   • Success toast notification shown');
console.log('   • Dashboard updated with new ticket count');

console.log('\n🚀 Production Checklist:');
console.log('   [ ] Update URLs from ngrok to production domain');
console.log('   [ ] Test all postback scenarios (complete, incomplete, failed)');
console.log('   [ ] Verify 0mninet branding displays correctly');
console.log('   [ ] Confirm guaranteed ticket system works');
console.log('   [ ] Test fallback API endpoint');
console.log('   [ ] Monitor logs for any errors');

console.log('\n' + '='.repeat(80));
console.log('🎯 Remember: Users now get tickets NO MATTER WHAT happens!');
console.log('='.repeat(80) + '\n'); 