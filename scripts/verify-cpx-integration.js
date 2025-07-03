#!/usr/bin/env node

/**
 * CPX Research Integration Validator
 * 
 * This script performs a comprehensive validation of the CPX Research integration
 * by sending test postbacks and verifying that tickets are properly awarded.
 * 
 * Usage: 
 * node scripts/verify-cpx-integration.js USER_ID [BASE_URL]
 * 
 * Examples:
 * node scripts/verify-cpx-integration.js clt5gv91i0009czfxh0ysbdiz
 * node scripts/verify-cpx-integration.js clt5gv91i0009czfxh0ysbdiz https://0mninetlottery.com
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const axios = require('axios');
const readline = require('readline');

// Instantiate Prisma client
const prisma = new PrismaClient();

// CPX config (must match server config exactly)
const CPX_APP_ID = 27172;
const CPX_SECURE_HASH_KEY = 'mZ6JNyV7SeZh9CMPwU9mKe24A0IyfAxC';

// Read user ID from command line
const userId = process.argv[2];
if (!userId) {
  console.error('ERROR: Please provide a user ID as argument');
  console.error('Usage: node scripts/verify-cpx-integration.js USER_ID [BASE_URL]');
  console.error('');
  console.error('Examples:');
  console.error('  Production: node scripts/verify-cpx-integration.js USER_ID');
  console.error('  Local dev:  node scripts/verify-cpx-integration.js USER_ID https://0mninetlottery.com');
  process.exit(1);
}

// Get base URL - default to production for safety
const baseUrl = process.argv[3] || 'https://0mninetlottery.com';

// Generate a random transaction ID
const transId = `validation_test_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

// Create the hash using the CORRECT algorithm (MD5 with dash separator)
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

// Function to get user tickets from database
async function getUserTickets(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        availableTickets: true,
        totalTicketsEarned: true,
        tickets: {
          where: {
            source: 'SURVEY',
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
      },
    });

    if (!user) {
      console.error(`User ${userId} not found in database`);
      return null;
    }

    return {
      name: user.name,
      email: user.email,
      availableTickets: user.availableTickets,
      totalTicketsEarned: user.totalTicketsEarned,
      recentTickets: user.tickets.map(ticket => ({
        id: ticket.id,
        createdAt: ticket.createdAt,
        source: ticket.source,
        isUsed: ticket.isUsed,
      })),
    };
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    return null;
  }
}

// Function to check if transaction was recorded in settings
async function checkTransactionRecorded(transId) {
  try {
    const transaction = await prisma.settings.findFirst({
      where: {
        key: `cpx_transaction_${transId}`,
      },
    });

    return !!transaction;
  } catch (error) {
    console.error('Error checking transaction:', error);
    return false;
  }
}

// Function to check if notification is in database
async function checkNotificationCreated(userId) {
  try {
    const notifications = await prisma.settings.findMany({
      where: {
        key: {
          startsWith: `instant_notification_${userId}`,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1,
    });

    return notifications.length > 0;
  } catch (error) {
    console.error('Error checking notifications:', error);
    return false;
  }
}

// Main function to run the validation
async function runValidation() {
  console.log('🚀 Starting CPX Integration Validation');
  console.log('=====================================');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('');

  // Step 1: Check if user exists and get initial ticket count
  console.log('Step 1: Checking user and initial tickets...');
  const initialUserData = await getUserTickets(userId);
  
  if (!initialUserData) {
    console.error('❌ CRITICAL: User not found in database. Validation cannot continue.');
    process.exit(1);
  }
  
  console.log(`✅ User found: ${initialUserData.name} (${initialUserData.email})`);
  console.log(`✅ Initial available tickets: ${initialUserData.availableTickets}`);
  console.log(`✅ Initial total tickets earned: ${initialUserData.totalTicketsEarned}`);
  console.log(`✅ Recent survey tickets: ${initialUserData.recentTickets.length}`);
  console.log('');

  // Step 2: Send test postback
  console.log('Step 2: Sending CPX postback...');
  console.log('📡 Postback URL:');
  console.log(postbackUrl);
  console.log('');
  console.log('🔄 Sending request...');
  
  try {
    const response = await axios.get(postbackUrl, {
      timeout: 30000, // 30 second timeout
      headers: {
        'User-Agent': 'CPX-Research-Postback/1.0',
      }
    });
    
    console.log('✅ Response received:');
    console.log(`✅ Status code: ${response.status}`);
    console.log(`✅ Response data: ${response.data}`);
    console.log('');
  } catch (error) {
    console.error('❌ ERROR: Request failed');
    console.error('Error message:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    console.log('\nDo you want to continue validation despite postback error? (y/n)');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      rl.question('Continue? (y/n): ', resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() !== 'y') {
      console.log('Validation aborted by user.');
      process.exit(1);
    }
  }

  // Step 3: Wait for processing
  console.log('Step 3: Waiting for ticket processing (5 seconds)...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Step 4: Check transaction recorded
  console.log('Step 4: Checking transaction record...');
  const isTransactionRecorded = await checkTransactionRecorded(transId);
  
  if (isTransactionRecorded) {
    console.log('✅ Transaction successfully recorded in database');
  } else {
    console.error('❌ WARNING: Transaction not found in database');
  }
  console.log('');

  // Step 5: Check notification created
  console.log('Step 5: Checking notification record...');
  const isNotificationCreated = await checkNotificationCreated(userId);
  
  if (isNotificationCreated) {
    console.log('✅ Notification successfully created in database');
  } else {
    console.error('❌ WARNING: Notification not found in database');
  }
  console.log('');

  // Step 6: Check if tickets were awarded
  console.log('Step 6: Checking if tickets were awarded...');
  const finalUserData = await getUserTickets(userId);
  
  if (!finalUserData) {
    console.error('❌ CRITICAL: Failed to fetch final user data');
    process.exit(1);
  }
  
  const ticketsAwarded = finalUserData.availableTickets - initialUserData.availableTickets;
  const totalTicketsAdded = finalUserData.totalTicketsEarned - initialUserData.totalTicketsEarned;
  
  console.log(`✅ Final available tickets: ${finalUserData.availableTickets}`);
  console.log(`✅ Final total tickets earned: ${finalUserData.totalTicketsEarned}`);
  console.log(`✅ Tickets awarded: ${ticketsAwarded}`);
  console.log(`✅ Total tickets added: ${totalTicketsAdded}`);
  console.log('');
  
  // Step 7: Check if new ticket was created
  console.log('Step 7: Checking for new ticket record...');
  
  if (finalUserData.recentTickets.length > initialUserData.recentTickets.length) {
    const newTicket = finalUserData.recentTickets[0];
    console.log('✅ New ticket created:');
    console.log(`✅ Ticket ID: ${newTicket.id}`);
    console.log(`✅ Created at: ${newTicket.createdAt}`);
    console.log(`✅ Source: ${newTicket.source}`);
    console.log(`✅ Is used: ${newTicket.isUsed}`);
  } else {
    console.error('❌ CRITICAL: No new ticket record found');
  }
  console.log('');

  // Step 8: Final validation
  console.log('Step 8: Final validation...');
  
  if (
    ticketsAwarded === 1 &&
    totalTicketsAdded === 1 &&
    finalUserData.recentTickets.length > initialUserData.recentTickets.length &&
    (isTransactionRecorded || isNotificationCreated)
  ) {
    console.log('✅ ✅ ✅ CPX INTEGRATION VALIDATION SUCCESSFUL ✅ ✅ ✅');
    console.log('🎉 The ticket award system is working correctly!');
  } else {
    console.error('❌ ❌ ❌ CPX INTEGRATION VALIDATION FAILED ❌ ❌ ❌');
    console.error('Please check the following:');
    
    if (ticketsAwarded !== 1) {
      console.error('- No ticket was awarded to the user');
    }
    
    if (totalTicketsAdded !== 1) {
      console.error('- Total tickets earned was not incremented');
    }
    
    if (finalUserData.recentTickets.length <= initialUserData.recentTickets.length) {
      console.error('- No new ticket record was created');
    }
    
    if (!isTransactionRecorded && !isNotificationCreated) {
      console.error('- No transaction or notification records were created');
    }
  }

  // Step 9: Troubleshooting advice
  console.log('\n🔍 Troubleshooting Recommendations:');
  console.log('1. Check server logs for any errors during postback processing');
  console.log('2. Verify CPX postback URL is configured correctly in CPX dashboard');
  console.log(`3. Confirm postback URL is: ${baseUrl}/api/cpx-postback`);
  console.log('4. Check if emails are being sent to user after ticket award');
  console.log('5. Verify the postback hash validation is working correctly');
  console.log('6. Test with a real survey completion if possible');
  
  // Cleanup
  await prisma.$disconnect();
}

// Run the validation
runValidation()
  .catch(error => {
    console.error('Validation error:', error);
    process.exit(1);
  }); 