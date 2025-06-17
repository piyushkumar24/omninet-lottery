#!/usr/bin/env node

/**
 * Ticket Award Verification Script
 * 
 * This script helps administrators verify that tickets are being properly
 * awarded through all available methods, including the CPX survey system.
 * 
 * Usage:
 * node scripts/verify-tickets.js <userId>
 */

const axios = require('axios');
const readline = require('readline');
const crypto = require('crypto');

// Configuration
const CONFIG = {
  SECURE_HASH_KEY: 'mZ6JNyV7SeZh9CMPwU9mKe24A0IyfAxC',
  BASE_URL: 'https://0mninetlottery.com',
  
  // API endpoints
  CPX_POSTBACK_URL: 'https://0mninetlottery.com/api/cpx-postback',
  SURVEY_COMPLETE_URL: 'https://0mninetlottery.com/api/survey/complete',
  TICKETS_VERIFY_URL: 'https://0mninetlottery.com/api/tickets/verify',
  TICKETS_VERIFY_ALL_URL: 'https://0mninetlottery.com/api/tickets/verify-all',
};

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Generate CPX secure hash
function generateCPXSecureHash(userId) {
  const hashString = `${userId}-${CONFIG.SECURE_HASH_KEY}`;
  return crypto.createHash('md5').update(hashString).digest('hex');
}

// Generate CPX postback URL
function generateCPXPostbackURL(userId, status = '1') {
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

  return `${CONFIG.CPX_POSTBACK_URL}?${params.toString()}`;
}

// Main function
async function main() {
  const userId = process.argv[2];
  
  if (!userId) {
    console.error('❌ Error: User ID is required');
    console.log('Usage: node scripts/verify-tickets.js <userId>');
    process.exit(1);
  }

  console.log('\n🔍 Ticket Award Verification Tool');
  console.log('='.repeat(50));
  console.log(`Testing ticket awards for user: ${userId}`);
  console.log('='.repeat(50));

  // Display menu
  console.log('\nAvailable tests:');
  console.log('1. Test CPX postback (completed survey)');
  console.log('2. Test CPX postback (incomplete survey)');
  console.log('3. Test survey fallback API');
  console.log('4. Test force-award for "no surveys available"');
  console.log('5. Verify recent tickets');
  console.log('6. Exit');
  
  rl.question('\nSelect a test to run (1-6): ', async (answer) => {
    try {
      switch (answer.trim()) {
        case '1':
          await testCPXPostback(userId, '1');
          break;
        case '2':
          await testCPXPostback(userId, '0');
          break;
        case '3':
          await testFallbackAPI(userId);
          break;
        case '4':
          await testForceAward(userId);
          break;
        case '5':
          await verifyTickets(userId);
          break;
        case '6':
          console.log('Exiting...');
          process.exit(0);
          break;
        default:
          console.log('Invalid option. Please select a number between 1-6.');
      }
    } catch (error) {
      console.error('\n❌ Error:', error.message);
    } finally {
      rl.close();
    }
  });
}

// Test CPX postback
async function testCPXPostback(userId, status) {
  console.log(`\n🧪 Testing CPX postback (status=${status})`);
  
  const postbackUrl = generateCPXPostbackURL(userId, status);
  console.log(`URL: ${postbackUrl}`);
  
  try {
    const response = await axios.get(postbackUrl);
    console.log('\n✅ CPX postback response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Verify ticket was awarded
    setTimeout(async () => {
      await verifyTickets(userId);
    }, 2000);
  } catch (error) {
    console.error('\n❌ CPX postback error:');
    console.error(error.response?.data || error.message);
  }
}

// Test fallback API
async function testFallbackAPI(userId) {
  console.log('\n🧪 Testing survey fallback API');
  
  try {
    // First need to get a cookie with the user's session
    console.log('Note: This test requires being logged in as the target user');
    console.log('You should run this on the local development environment');
    
    const fallbackUrl = `${CONFIG.SURVEY_COMPLETE_URL}`;
    console.log(`URL: ${fallbackUrl}`);
    
    const response = await axios.post(fallbackUrl, {}, {
      withCredentials: true,
    });
    
    console.log('\n✅ Fallback API response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Verify ticket was awarded
    setTimeout(async () => {
      await verifyTickets(userId);
    }, 2000);
  } catch (error) {
    console.error('\n❌ Fallback API error:');
    console.error(error.response?.data || error.message);
  }
}

// Test force award for "no surveys available"
async function testForceAward(userId) {
  console.log('\n🧪 Testing force-award for "no surveys available" scenario');
  
  try {
    // First need to get a cookie with the user's session
    console.log('Note: This test requires being logged in as the target user');
    console.log('You should run this on the local development environment');
    
    const forceAwardUrl = `${CONFIG.BASE_URL}/api/survey/force-award`;
    console.log(`URL: ${forceAwardUrl}`);
    
    const response = await axios.post(forceAwardUrl, {
      reason: 'no_surveys_available'
    }, {
      withCredentials: true,
    });
    
    console.log('\n✅ Force award response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Verify ticket was awarded
    setTimeout(async () => {
      await verifyTickets(userId);
    }, 2000);
  } catch (error) {
    console.error('\n❌ Force award error:');
    console.error(error.response?.data || error.message);
  }
}

// Verify tickets
async function verifyTickets(userId) {
  console.log('\n🔍 Verifying tickets for user:', userId);
  
  try {
    // This requires being logged in as the user
    console.log('Note: This test requires being logged in as the target user');
    console.log('You should run this on the local development environment');
    
    const verifyUrl = `${CONFIG.TICKETS_VERIFY_URL}`;
    console.log(`URL: ${verifyUrl}`);
    
    const response = await axios.get(verifyUrl, {
      withCredentials: true,
    });
    
    if (response.data.success) {
      const { totalTickets, recentTickets, activeDraw, drawParticipation } = response.data.data;
      
      console.log('\n✅ Ticket verification successful:');
      console.log(`Total tickets: ${totalTickets}`);
      
      if (recentTickets.length > 0) {
        console.log('\nRecent tickets:');
        recentTickets.forEach(ticket => {
          console.log(`- ID: ${ticket.id.substring(0, 8)}... (${ticket.source}, ${ticket.timeAgo})`);
        });
      } else {
        console.log('\n⚠️ No recent tickets found');
      }
      
      if (activeDraw) {
        console.log(`\nActive draw: ${activeDraw.id.substring(0, 8)}...`);
        console.log(`Draw date: ${new Date(activeDraw.drawDate).toLocaleString()}`);
        console.log(`Total draw tickets: ${activeDraw.totalTickets}`);
      }
      
      if (drawParticipation) {
        console.log(`\nUser participation: ${drawParticipation.ticketsUsed} tickets in current draw`);
      } else {
        console.log('\n⚠️ User not participating in current draw');
      }
    } else {
      console.error('\n❌ Verification failed:');
      console.error(response.data.message);
    }
  } catch (error) {
    console.error('\n❌ Verification error:');
    console.error(error.response?.data || error.message);
  }
}

// Run the script
main(); 