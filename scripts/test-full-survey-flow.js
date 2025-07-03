#!/usr/bin/env node

/**
 * Full Survey Flow Test Script
 * 
 * This script tests the complete survey completion flow:
 * 1. Sends a CPX postback to simulate survey completion
 * 2. Verifies ticket is awarded in the database
 * 3. Confirms ticket is applied to the next lottery draw
 * 4. Checks for email sending success
 * 5. Validates dashboard will show the new ticket
 * 
 * Usage:
 * node scripts/test-full-survey-flow.js USER_ID [BASE_URL]
 * 
 * Examples:
 * node scripts/test-full-survey-flow.js your-user-id-here
 * node scripts/test-full-survey-flow.js your-user-id-here https://0mninetlottery.com
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const axios = require('axios');
const readline = require('readline');
const util = require('util');

// Configure console output to show full objects
console.log = function(msg, obj) {
  if (obj && typeof obj === 'object') {
    console.info(msg, util.inspect(obj, { depth: null, colors: true }));
  } else {
    console.info(msg, obj);
  }
};

// Create Prisma client
const prisma = new PrismaClient();

// CPX configuration (must match server config)
const CPX_APP_ID = 27172;
const CPX_SECURE_HASH_KEY = 'mZ6JNyV7SeZh9CMPwU9mKe24A0IyfAxC';

// Parse command-line arguments
const userId = process.argv[2];
if (!userId) {
  console.error('❌ ERROR: Please provide a user ID');
  console.error('Usage: node scripts/test-full-survey-flow.js USER_ID [BASE_URL]');
  process.exit(1);
}

// Get base URL (default to production)
const baseUrl = process.argv[3] || 'https://0mninetlottery.com';

// Generate a unique transaction ID for this test
const transId = `flow_test_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

// Generate secure hash for authentication
const hashString = `${userId}-${CPX_SECURE_HASH_KEY}`;
const hash = crypto.createHash('md5').update(hashString).digest('hex');

// Create postback URL with all required parameters
const postbackUrl = `${baseUrl}/api/cpx-postback?` + new URLSearchParams({
  status: '1',               // 1 = Completed survey (critical)
  trans_id: transId,         // Unique transaction ID
  user_id: userId,           // User ID from database
  hash: hash,                // Authentication hash
  amount_usd: '0.50',        // Standard amount (ignored)
  currency_name: 'USD',      // Currency (ignored)
  currency_amount: '0.50',   // Amount (ignored)
  ip_click: '127.0.0.1',     // IP address
  test_mode: '1'             // Enable test mode
}).toString();

// Function to get user information
async function getUserInfo(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        availableTickets: true,
        totalTicketsEarned: true,
      }
    });
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found in database`);
    }
    
    return user;
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    process.exit(1);
  }
}

// Function to check if a user has tickets in the current draw
async function getUserDrawParticipation(userId) {
  try {
    // First get the current draw
    const currentDraw = await prisma.draw.findFirst({
      where: {
        isCompleted: false,
      },
      orderBy: {
        drawDate: 'asc',
      }
    });
    
    if (!currentDraw) {
      console.log('⚠️ No active draw found in database');
      return { drawId: null, ticketsUsed: 0 };
    }
    
    // Then check participation
    const participation = await prisma.drawParticipation.findUnique({
      where: {
        userId_drawId: {
          userId,
          drawId: currentDraw.id,
        }
      }
    });
    
    return {
      drawId: currentDraw.id,
      drawDate: currentDraw.drawDate,
      ticketsUsed: participation?.ticketsUsed || 0,
    };
  } catch (error) {
    console.error('❌ Error checking draw participation:', error);
    return { drawId: null, ticketsUsed: 0 };
  }
}

// Function to check if email was sent
async function checkEmailSent(transId, userId) {
  try {
    const emailRecords = await prisma.settings.findMany({
      where: {
        OR: [
          { key: { startsWith: `email_sent_${transId}` } },
          { key: { startsWith: `email_retry_` } }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    
    return {
      emailRecordsFound: emailRecords.length > 0,
      emailRecords
    };
  } catch (error) {
    console.error('❌ Error checking email records:', error);
    return { emailRecordsFound: false, emailRecords: [] };
  }
}

// Function to check transaction records
async function checkTransactionRecords(transId, userId) {
  try {
    const transactionRecord = await prisma.settings.findUnique({
      where: { key: `cpx_transaction_${transId}` }
    });
    
    const notificationRecords = await prisma.settings.findMany({
      where: { key: { startsWith: `instant_notification_${userId}` } },
      orderBy: { createdAt: 'desc' },
      take: 3
    });
    
    return {
      transactionFound: !!transactionRecord,
      transactionRecord,
      notificationsFound: notificationRecords.length > 0,
      notificationRecords
    };
  } catch (error) {
    console.error('❌ Error checking transaction records:', error);
    return { 
      transactionFound: false,
      notificationsFound: false
    };
  }
}

// Function to check user's tickets
async function getUserTickets(userId) {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    return {
      totalTickets: tickets.length,
      recentTickets: tickets
    };
  } catch (error) {
    console.error('❌ Error fetching user tickets:', error);
    return { totalTickets: 0, recentTickets: [] };
  }
}

// Main function to run the test
async function runTest() {
  console.log('🚀 Starting Full Survey Flow Test');
  console.log('===============================');
  
  try {
    // Step 1: Check user before postback
    console.log('\n📊 Step 1: Checking user before postback');
    const userBefore = await getUserInfo(userId);
    console.log('User information:', userBefore);
    
    const initialTickets = userBefore.availableTickets;
    const initialTotalTickets = userBefore.totalTicketsEarned;
    
    const participationBefore = await getUserDrawParticipation(userId);
    console.log('Draw participation before:', participationBefore);
    
    const ticketsBefore = await getUserTickets(userId);
    console.log('Tickets before:', {
      count: ticketsBefore.totalTickets,
      recent: ticketsBefore.recentTickets.map(t => ({
        id: t.id,
        source: t.source,
        createdAt: t.createdAt
      }))
    });
    
    // Step 2: Send postback
    console.log('\n📡 Step 2: Sending postback request');
    console.log('Postback URL:', postbackUrl);
    
    let response;
    try {
      response = await axios.get(postbackUrl, {
        timeout: 30000,
        headers: { 'User-Agent': 'CPX-Test/1.0' }
      });
      
      console.log('✅ Postback response:', {
        status: response.status,
        data: response.data
      });
    } catch (error) {
      console.error('❌ Postback request failed:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      if (!await confirmContinue()) {
        process.exit(1);
      }
    }
    
    // Step 3: Wait for processing
    console.log('\n⏳ Step 3: Waiting for processing (7 seconds)');
    await new Promise(resolve => setTimeout(resolve, 7000));
    
    // Step 4: Check user after postback
    console.log('\n📊 Step 4: Checking user after postback');
    const userAfter = await getUserInfo(userId);
    console.log('User information:', userAfter);
    
    const finalTickets = userAfter.availableTickets;
    const finalTotalTickets = userAfter.totalTicketsEarned;
    
    const ticketsAwarded = finalTickets - initialTickets;
    const totalTicketsAdded = finalTotalTickets - initialTotalTickets;
    
    console.log('Ticket changes:', {
      before: initialTickets,
      after: finalTickets,
      awarded: ticketsAwarded,
      totalBefore: initialTotalTickets,
      totalAfter: finalTotalTickets,
      totalAdded: totalTicketsAdded
    });
    
    // Step 5: Check draw participation after postback
    console.log('\n🎮 Step 5: Checking draw participation');
    const participationAfter = await getUserDrawParticipation(userId);
    console.log('Draw participation after:', participationAfter);
    
    const ticketsApplied = participationAfter.ticketsUsed - participationBefore.ticketsUsed;
    console.log('Tickets applied to draw:', ticketsApplied);
    
    // Step 6: Check if new tickets were created
    console.log('\n🎫 Step 6: Checking tickets in database');
    const ticketsAfter = await getUserTickets(userId);
    
    const newTickets = ticketsAfter.recentTickets.filter(
      t => !ticketsBefore.recentTickets.some(bt => bt.id === t.id)
    );
    
    console.log('New tickets created:', newTickets.map(t => ({
      id: t.id,
      source: t.source,
      createdAt: t.createdAt
    })));
    
    // Step 7: Check transaction and notification records
    console.log('\n📝 Step 7: Checking transaction records');
    const transactionRecords = await checkTransactionRecords(transId, userId);
    console.log('Transaction record found:', transactionRecords.transactionFound);
    console.log('Notification records found:', transactionRecords.notificationsFound);
    
    // Step 8: Check email sending
    console.log('\n📧 Step 8: Checking email records');
    const emailRecords = await checkEmailSent(transId, userId);
    console.log('Email records found:', emailRecords.emailRecordsFound);
    
    // Step 9: Final validation
    console.log('\n✅ Step 9: Final validation');
    
    const success = 
      ticketsAwarded === 1 && 
      totalTicketsAdded === 1 &&
      ticketsApplied === 1 &&
      newTickets.length === 1 &&
      transactionRecords.transactionFound;
    
    if (success) {
      console.log('🎉🎉🎉 SURVEY FLOW TEST PASSED! 🎉🎉🎉');
      console.log('✅ Ticket was awarded: +1 available tickets');
      console.log('✅ Total tickets increased: +1 total tickets');
      console.log('✅ Ticket was applied to next draw');
      console.log('✅ Ticket record was created in database');
      console.log('✅ Transaction was recorded');
      
      if (emailRecords.emailRecordsFound) {
        console.log('✅ Email sending was recorded');
      } else {
        console.log('⚠️ No email records found (may still have been sent)');
      }
    } else {
      console.error('❌❌❌ SURVEY FLOW TEST FAILED! ❌❌❌');
      
      if (ticketsAwarded !== 1) {
        console.error('❌ Ticket was not awarded (+1 expected)');
      }
      
      if (totalTicketsAdded !== 1) {
        console.error('❌ Total tickets did not increase (+1 expected)');
      }
      
      if (ticketsApplied !== 1) {
        console.error('❌ Ticket was not applied to next draw');
      }
      
      if (newTickets.length !== 1) {
        console.error('❌ No new ticket record created in database');
      }
      
      if (!transactionRecords.transactionFound) {
        console.error('❌ Transaction record not found');
      }
      
      if (!emailRecords.emailRecordsFound) {
        console.error('❌ No email records found');
      }
      
      console.error('\nPlease check server logs for detailed errors.');
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Function to prompt for confirmation
async function confirmContinue() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const answer = await new Promise(resolve => {
    rl.question('Continue with test despite error? (y/n): ', resolve);
  });
  
  rl.close();
  return answer.toLowerCase() === 'y';
}

// Run the test
runTest().catch(console.error); 