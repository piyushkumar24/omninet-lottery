/**
 * Script to simulate a CPX postback for testing
 * 
 * This script simulates a CPX Research postback request to test
 * the ticket award system without having to complete a real survey.
 * 
 * Usage: 
 * node scripts/simulate-cpx-postback.js USER_ID [BASE_URL]
 * 
 * Examples:
 * node scripts/simulate-cpx-postback.js clt5gv91i0009czfxh0ysbdiz
 * node scripts/simulate-cpx-postback.js clt5gv91i0009czfxh0ysbdiz https://0mninetlottery.com
 */

const crypto = require('crypto');
const axios = require('axios');

// CPX config (must match server config exactly)
const CPX_APP_ID = 27172;
const CPX_SECURE_HASH_KEY = 'mZ6JNyV7SeZh9CMPwU9mKe24A0IyfAxC';

// Read user ID from command line
const userId = process.argv[2];
if (!userId) {
  console.error('ERROR: Please provide a user ID as argument');
  console.error('Usage: node scripts/simulate-cpx-postback.js USER_ID [BASE_URL]');
  console.error('');
  console.error('Examples:');
  console.error('  Production: node scripts/simulate-cpx-postback.js USER_ID');
  console.error('  Local dev:  node scripts/simulate-cpx-postback.js USER_ID https://0mninetlottery.com');
  process.exit(1);
}

// Get base URL - default to production for safety
const baseUrl = process.argv[3] || 'https://0mninetlottery.com';

// Generate a random transaction ID
const transId = `production_test_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

// Create the hash using the CORRECT algorithm (MD5 with dash separator)
// This MUST match the generateCPXSecureHash function in cpx-utils.ts
const hashString = `${userId}-${CPX_SECURE_HASH_KEY}`;
const hash = crypto.createHash('md5').update(hashString).digest('hex');

// Build the postback URL with all required parameters
const postbackUrl = `${baseUrl}/api/cpx-postback?` + new URLSearchParams({
  status: '1', // Completed survey
  trans_id: transId,
  user_id: userId,
  hash: hash,
  amount_usd: '0.50',
  currency_name: 'USD',
  currency_amount: '0.50',
  ip_click: '127.0.0.1',
  test_mode: '1', // Enable test mode to bypass additional validations
}).toString();

console.log('🚀 Simulating CPX postback for PRODUCTION:');
console.log('==========================================');
console.log('- Target URL:', baseUrl);
console.log('- User ID:', userId);
console.log('- Transaction ID:', transId);
console.log('- Hash String:', `${userId}-${CPX_SECURE_HASH_KEY}`);
console.log('- Generated Hash:', hash);
console.log('- Status: 1 (completed survey)');
console.log('');
console.log('📡 Postback URL:');
console.log(postbackUrl);
console.log('');
console.log('🔄 Sending request...\n');

// Send the postback request
axios.get(postbackUrl, {
  timeout: 30000, // 30 second timeout
  headers: {
    'User-Agent': 'CPX-Research-Postback/1.0',
  }
})
  .then(response => {
    console.log('✅ SUCCESS! Response received:');
    console.log('- Status Code:', response.status);
    console.log('- Status Text:', response.statusText);
    console.log('- Response Data:', response.data);
    
    if (response.status === 200) {
      console.log('\n🎉 POSTBACK SUCCESSFUL!');
      console.log('✅ Survey completion simulated successfully');
      console.log('✅ Ticket should be awarded to user:', userId);
      console.log('✅ Email should be sent (check inbox/spam)');
      console.log('✅ Dashboard should show new ticket');
      
      console.log('\n📋 Next Steps:');
      console.log('1. Check the server logs for ticket award confirmation');
      console.log('2. Check user email for confirmation message');
      console.log('3. Visit dashboard to verify ticket is visible');
      console.log(`4. Dashboard URL: ${baseUrl}/dashboard`);
    } else {
      console.log('\n⚠️  Unexpected response status');
    }
  })
  .catch(error => {
    console.error('\n❌ ERROR: Request failed');
    console.error('Error message:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      
      if (error.response.status === 404) {
        console.error('\n🔍 Troubleshooting: User not found');
        console.error('- Verify the user ID exists in the database');
        console.error('- Check if user account is active and not blocked');
      } else if (error.response.status === 403) {
        console.error('\n🔍 Troubleshooting: Invalid hash or blocked user');
        console.error('- Verify SECURE_HASH_KEY matches server configuration');
        console.error('- Check if user account is blocked');
      } else if (error.response.status === 400) {
        console.error('\n🔍 Troubleshooting: Bad request');
        console.error('- Check required parameters are present');
        console.error('- Verify URL format is correct');
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n🔍 Troubleshooting: Connection refused');
      console.error('- Check if server is running at:', baseUrl);
      console.error('- Verify URL is correct');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n🔍 Troubleshooting: DNS resolution failed');
      console.error('- Check domain name spelling');
      console.error('- Verify internet connection');
    }
    
    console.error('\n🆘 For further debugging:');
    console.error(`- Check server logs for detailed error information`);
    console.error(`- Verify CPX postback endpoint is accessible: ${baseUrl}/api/cpx-postback`);
    console.error(`- Test with health check: ${baseUrl}/api/health`);
    
    process.exit(1);
  }); 