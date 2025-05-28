/**
 * Script to test the ticket award flow
 * 
 * This script tests both the regular survey completion flow and the emergency
 * ticket award process to ensure tickets are being properly awarded and
 * showing up in the dashboard.
 * 
 * Run with: node scripts/test-ticket-award.js
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const axios = require('axios');
const readline = require('readline');

const prisma = new PrismaClient();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to prompt for input
function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

// Generate a random transaction ID
function generateTransId() {
  return crypto.randomBytes(8).toString('hex');
}

// Test the emergency ticket award flow directly
async function testEmergencyTicketAward(userId) {
  try {
    console.log('Testing emergency ticket award...');
    
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    });
    
    if (!user) {
      console.error('User not found:', userId);
      return;
    }
    
    // Get the number of tickets before
    const ticketsBefore = await prisma.ticket.count({
      where: { userId }
    });
    
    console.log(`User ${user.name || userId} has ${ticketsBefore} tickets before the test`);
    
    // Get the current draw
    const draw = await prisma.draw.findFirst({
      where: { status: 'PENDING' },
      orderBy: { drawDate: 'asc' }
    });
    
    if (!draw) {
      console.error('No active draw found');
      return;
    }
    
    // Generate a unique emergency ticket ID
    const emergencyId = `emergency_test_${Date.now()}`;
    
    // Create the emergency ticket
    const ticket = await prisma.ticket.create({
      data: {
        userId,
        source: 'SURVEY',
        isUsed: true,
        drawId: draw.id,
        confirmationCode: emergencyId
      }
    });
    
    // Log the emergency ticket
    await prisma.settings.create({
      data: {
        key: `emergency_test_${ticket.id}`,
        value: JSON.stringify({
          userId,
          ticketId: ticket.id,
          timestamp: new Date().toISOString(),
        }),
        description: 'Emergency ticket award test'
      }
    });
    
    // Update participation
    const participation = await prisma.drawParticipation.findUnique({
      where: {
        userId_drawId: {
          userId,
          drawId: draw.id
        }
      }
    });
    
    if (participation) {
      await prisma.drawParticipation.update({
        where: { id: participation.id },
        data: {
          ticketsUsed: participation.ticketsUsed + 1,
          updatedAt: new Date()
        }
      });
    } else {
      await prisma.drawParticipation.create({
        data: {
          userId,
          drawId: draw.id,
          ticketsUsed: 1
        }
      });
    }
    
    // Update draw total tickets
    await prisma.draw.update({
      where: { id: draw.id },
      data: {
        totalTickets: {
          increment: 1
        }
      }
    });
    
    // Get the number of tickets after
    const ticketsAfter = await prisma.ticket.count({
      where: { userId }
    });
    
    console.log(`Emergency ticket created with ID: ${ticket.id}`);
    console.log(`User now has ${ticketsAfter} tickets (before: ${ticketsBefore})`);
    
    return ticket;
  } catch (error) {
    console.error('Error testing emergency ticket award:', error);
  }
}

// Test the force award endpoint
async function testForceAward(userId, baseUrl) {
  try {
    console.log('Testing force award endpoint...');
    
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    });
    
    if (!user) {
      console.error('User not found:', userId);
      return;
    }
    
    // Get the number of tickets before
    const ticketsBefore = await prisma.ticket.count({
      where: { userId }
    });
    
    console.log(`User ${user.name || userId} has ${ticketsBefore} tickets before the test`);
    
    // Create a JWT token for the user
    // Note: This is a simplified test; in production you'd need proper auth
    const response = await axios.post(`${baseUrl}/api/tickets/force-award`, {}, {
      headers: {
        'Content-Type': 'application/json',
        // Add auth headers if needed
      }
    });
    
    console.log('Force award response:', response.data);
    
    // Get the number of tickets after
    const ticketsAfter = await prisma.ticket.count({
      where: { userId }
    });
    
    console.log(`User now has ${ticketsAfter} tickets (before: ${ticketsBefore})`);
    
    return response.data;
  } catch (error) {
    console.error('Error testing force award endpoint:', error);
    console.error('Response:', error.response?.data);
  }
}

// Test the CPX postback URL
async function testCpxPostback(userId, baseUrl) {
  try {
    console.log('Testing CPX postback...');
    
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    });
    
    if (!user) {
      console.error('User not found:', userId);
      return;
    }
    
    // Get the number of tickets before
    const ticketsBefore = await prisma.ticket.count({
      where: { userId }
    });
    
    console.log(`User ${user.name || userId} has ${ticketsBefore} tickets before the test`);
    
    // Generate a unique transaction ID
    const transId = generateTransId();
    
    // Create the hash (normally done by CPX)
    // In production, this would be validated by your secure hash
    const hash = crypto
      .createHash('sha1')
      .update(`${userId}${transId}mZ6JNyV7SeZh9CMPwU9mKe24A0IyfAxC`)
      .digest('hex');
    
    // Simulate a CPX postback by calling your endpoint
    const response = await axios.get(
      `${baseUrl}/api/cpx-postback?user_id=${userId}&trans_id=${transId}&status=1&hash=${hash}&amount_local=1&amount_usd=1.00`
    );
    
    console.log('CPX postback response:', response.data);
    
    // Get the number of tickets after
    const ticketsAfter = await prisma.ticket.count({
      where: { userId }
    });
    
    console.log(`User now has ${ticketsAfter} tickets (before: ${ticketsBefore})`);
    
    return response.data;
  } catch (error) {
    console.error('Error testing CPX postback:', error);
    console.error('Response:', error.response?.data);
  }
}

// Check the user's tickets
async function checkUserTickets(userId) {
  try {
    console.log('Checking user tickets...');
    
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    });
    
    if (!user) {
      console.error('User not found:', userId);
      return;
    }
    
    // Get all tickets for the user
    const tickets = await prisma.ticket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    // Get the current draw
    const draw = await prisma.draw.findFirst({
      where: { status: 'PENDING' },
      orderBy: { drawDate: 'asc' }
    });
    
    // Get user participation in current draw
    let participation = null;
    if (draw) {
      participation = await prisma.drawParticipation.findUnique({
        where: {
          userId_drawId: {
            userId,
            drawId: draw.id
          }
        }
      });
    }
    
    console.log(`User ${user.name || userId} has ${tickets.length} tickets`);
    console.log('Most recent tickets:');
    
    tickets.forEach((ticket, index) => {
      console.log(`${index + 1}. ID: ${ticket.id}`);
      console.log(`   Source: ${ticket.source}`);
      console.log(`   Created: ${ticket.createdAt}`);
      console.log(`   Used: ${ticket.isUsed ? 'Yes' : 'No'}`);
      console.log(`   Draw ID: ${ticket.drawId || 'None'}`);
      console.log(`   Confirmation: ${ticket.confirmationCode || 'None'}`);
      console.log('---');
    });
    
    if (participation) {
      console.log(`Participation in current draw: ${participation.ticketsUsed} tickets`);
    } else {
      console.log('No participation in current draw');
    }
    
    return tickets;
  } catch (error) {
    console.error('Error checking user tickets:', error);
  }
}

// Main function
async function main() {
  try {
    console.log('=== Ticket Award Testing Script ===');
    
    const userId = await question('Enter user ID to test: ');
    const baseUrl = await question('Enter base URL (e.g., http://localhost:3000): ');
    
    console.log('\n=== Testing Options ===');
    console.log('1. Test emergency ticket award (direct DB)');
    console.log('2. Test force award endpoint');
    console.log('3. Test CPX postback');
    console.log('4. Check user tickets');
    console.log('5. Run all tests');
    
    const option = await question('\nSelect an option (1-5): ');
    
    switch (option) {
      case '1':
        await testEmergencyTicketAward(userId);
        break;
      case '2':
        await testForceAward(userId, baseUrl);
        break;
      case '3':
        await testCpxPostback(userId, baseUrl);
        break;
      case '4':
        await checkUserTickets(userId);
        break;
      case '5':
        console.log('\n--- Running All Tests ---\n');
        await checkUserTickets(userId);
        await testEmergencyTicketAward(userId);
        await checkUserTickets(userId);
        await testForceAward(userId, baseUrl);
        await checkUserTickets(userId);
        await testCpxPostback(userId, baseUrl);
        await checkUserTickets(userId);
        break;
      default:
        console.log('Invalid option selected');
    }
    
    rl.close();
  } catch (error) {
    console.error('Error in main function:', error);
    rl.close();
  }
}

// Run the main function
main().finally(async () => {
  await prisma.$disconnect();
}); 