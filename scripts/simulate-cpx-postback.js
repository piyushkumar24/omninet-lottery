/**
 * Script to simulate a CPX postback for testing
 * 
 * This script simulates a CPX Research postback request to test
 * the ticket award system without having to complete a real survey.
 * 
 * Usage: 
 * node scripts/simulate-cpx-postback.js USER_ID
 * 
 * Example:
 * node scripts/simulate-cpx-postback.js clt5gv91i0009czfxh0ysbdiz
 */

const crypto = require('crypto');
const axios = require('axios');

// CPX config (must match server config)
const CPX_APP_ID = 27172;
const CPX_SECURE_HASH_KEY = 'mZ6JNyV7SeZh9CMPwU9mKe24A0IyfAxC';

// Read user ID from command line
const userId = process.argv[2];
if (!userId) {
  console.error('ERROR: Please provide a user ID as argument');
  console.error('Usage: node scripts/simulate-cpx-postback.js USER_ID');
  process.exit(1);
}

// Get base URL (default to localhost:3000)
const baseUrl = process.argv[3] || 'http://localhost:3000';

// Generate a random transaction ID
const transId = crypto.randomBytes(8).toString('hex');

// Create the hash (normally done by CPX)
const hash = crypto
  .createHash('sha1')
  .update(`${userId}${transId}${CPX_SECURE_HASH_KEY}`)
  .digest('hex');

// Amount settings (in real postbacks, this varies by survey)
const amountUsd = 1.00;
const amountLocal = 1;

// Build the postback URL
const postbackUrl = `${baseUrl}/api/cpx-postback?user_id=${userId}&trans_id=${transId}&status=1&hash=${hash}&offer_id=test&amount_local=${amountLocal}&amount_usd=${amountUsd}`;

console.log('Simulating CPX postback with:');
console.log('- User ID:', userId);
console.log('- Transaction ID:', transId);
console.log('- Generated Hash:', hash);
console.log('- Postback URL:', postbackUrl);
console.log('\nSending request...\n');

// Send the postback request
axios.get(postbackUrl)
  .then(response => {
    console.log('✅ Response status:', response.status);
    console.log('✅ Response data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Check if successful
    if (response.data.success) {
      console.log('\n🎉 SUCCESS! Ticket awarded successfully.');
      
      if (response.data.data && response.data.data.ticketId) {
        console.log('🎫 Ticket ID:', response.data.data.ticketId);
      }
    } else {
      console.log('\n❌ ERROR: Ticket award failed.');
    }
  })
  .catch(error => {
    console.error('❌ ERROR:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }); 