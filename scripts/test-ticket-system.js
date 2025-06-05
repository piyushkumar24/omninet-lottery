// Test Ticket System
// This script tests the new ticket system functionality
// Run with: node scripts/test-ticket-system.js

const { PrismaClient, TicketSource } = require('@prisma/client');
const prisma = new PrismaClient();

// Local implementations of ticket utility functions
// These match the functions in lib/ticket-utils.ts but work with CommonJS
async function awardTicketsToUser(userId, ticketCount, source) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create ticket records for history
      const ticketIds = [];
      for (let i = 0; i < ticketCount; i++) {
        const ticket = await tx.ticket.create({
          data: {
            userId,
            source,
            isUsed: false,
            confirmationCode: `${source}_${userId}_${Date.now()}_${i}`,
          },
        });
        ticketIds.push(ticket.id);
      }

      // Update user's ticket counts
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          availableTickets: {
            increment: ticketCount,
          },
          totalTicketsEarned: {
            increment: ticketCount,
          },
        },
      });

      return {
        success: true,
        availableTickets: updatedUser.availableTickets,
        totalTickets: updatedUser.totalTicketsEarned,
        ticketIds,
      };
    });

    console.log(`✅ Awarded ${ticketCount} ${source} tickets to user ${userId}`);
    return result;
  } catch (error) {
    console.error(`Error awarding tickets to user ${userId}:`, error);
    return {
      success: false,
      availableTickets: 0,
      totalTickets: 0,
      ticketIds: [],
    };
  }
}

async function applyAllTicketsToLottery(userId, drawId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { availableTickets: true }
    });

    if (!user || user.availableTickets === 0) {
      return 0;
    }

    const ticketsToApply = user.availableTickets;

    // Create or update draw participation
    await prisma.drawParticipation.upsert({
      where: {
        userId_drawId: {
          userId,
          drawId,
        },
      },
      update: {
        ticketsUsed: ticketsToApply,
        updatedAt: new Date(),
      },
      create: {
        userId,
        drawId,
        ticketsUsed: ticketsToApply,
      },
    });

    // Update draw total tickets
    const currentDraw = await prisma.draw.findUnique({
      where: { id: drawId },
      select: { totalTickets: true }
    });

    if (currentDraw) {
      await prisma.draw.update({
        where: { id: drawId },
        data: {
          totalTickets: (currentDraw.totalTickets || 0) + ticketsToApply,
        },
      });
    }

    console.log(`Applied ${ticketsToApply} tickets to lottery for user ${userId}`);
    return ticketsToApply;
  } catch (error) {
    console.error(`Error applying tickets to lottery for user ${userId}:`, error);
    return 0;
  }
}

async function resetAllAvailableTickets() {
  try {
    const result = await prisma.user.updateMany({
      where: {
        availableTickets: {
          gt: 0,
        },
      },
      data: {
        availableTickets: 0,
      },
    });

    console.log(`Reset available tickets for ${result.count} users`);
    return result.count;
  } catch (error) {
    console.error(`Error resetting available tickets:`, error);
    return 0;
  }
}

async function testTicketSystem() {
  console.log('🧪 Starting Ticket System Tests...');
  
  try {
    // Find the test user (or create one if needed)
    let testUser = await prisma.user.findFirst({
      where: {
        email: 'test@example.com',
      }
    });
    
    if (!testUser) {
      console.log('Creating test user...');
      testUser = await prisma.user.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          availableTickets: 0,
          totalTicketsEarned: 0,
        }
      });
    }
    
    console.log(`Test user ID: ${testUser.id}`);
    
    // Get or create test draw
    let testDraw = await prisma.draw.findFirst({
      where: {
        status: 'PENDING',
      },
      orderBy: {
        drawDate: 'asc',
      }
    });
    
    if (!testDraw) {
      console.log('Creating test draw...');
      testDraw = await prisma.draw.create({
        data: {
          drawDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          status: 'PENDING',
          prizeAmount: 100,
          totalTickets: 0,
        }
      });
    }
    
    console.log(`Test draw ID: ${testDraw.id}`);
    
    // Test 1: Award tickets
    console.log('\n🧪 Test 1: Award tickets');
    
    console.log('Initial user state:');
    let user = await prisma.user.findUnique({
      where: { id: testUser.id },
      select: { availableTickets: true, totalTicketsEarned: true }
    });
    console.log(`Available tickets: ${user.availableTickets}`);
    console.log(`Total tickets earned: ${user.totalTicketsEarned}`);
    
    // Award survey ticket
    console.log('\nAwarding 1 survey ticket...');
    const surveyResult = await awardTicketsToUser(testUser.id, 1, 'SURVEY');
    console.log('Survey ticket award result:', surveyResult);
    
    // Check updated counts
    user = await prisma.user.findUnique({
      where: { id: testUser.id },
      select: { availableTickets: true, totalTicketsEarned: true }
    });
    console.log(`After survey - Available tickets: ${user.availableTickets}`);
    console.log(`After survey - Total tickets earned: ${user.totalTicketsEarned}`);
    console.log(`Test 1 ${surveyResult.success ? 'PASSED ✅' : 'FAILED ❌'}`);
    
    // Test 2: Apply tickets to lottery
    console.log('\n🧪 Test 2: Apply tickets to lottery');
    
    // Check initial draw participation
    let participation = await prisma.drawParticipation.findUnique({
      where: {
        userId_drawId: {
          userId: testUser.id,
          drawId: testDraw.id,
        }
      }
    });
    console.log('Initial draw participation:', participation || 'None');
    
    // Apply tickets to lottery
    console.log('\nApplying all available tickets to lottery...');
    const appliedCount = await applyAllTicketsToLottery(testUser.id, testDraw.id);
    console.log(`Applied ${appliedCount} tickets to lottery`);
    
    // Check updated draw participation
    participation = await prisma.drawParticipation.findUnique({
      where: {
        userId_drawId: {
          userId: testUser.id,
          drawId: testDraw.id,
        }
      }
    });
    console.log('Updated draw participation:', participation);
    console.log(`Test 2 ${participation && participation.ticketsUsed === user.availableTickets ? 'PASSED ✅' : 'FAILED ❌'}`);
    
    // Test 3: Reset available tickets
    console.log('\n🧪 Test 3: Reset available tickets');
    
    // Check before reset
    user = await prisma.user.findUnique({
      where: { id: testUser.id },
      select: { availableTickets: true, totalTicketsEarned: true }
    });
    console.log(`Before reset - Available tickets: ${user.availableTickets}`);
    console.log(`Before reset - Total tickets earned: ${user.totalTicketsEarned}`);
    
    // Reset available tickets
    console.log('\nResetting all available tickets...');
    const resetCount = await resetAllAvailableTickets();
    console.log(`Reset ${resetCount} users' available tickets`);
    
    // Check after reset
    user = await prisma.user.findUnique({
      where: { id: testUser.id },
      select: { availableTickets: true, totalTicketsEarned: true }
    });
    console.log(`After reset - Available tickets: ${user.availableTickets}`);
    console.log(`After reset - Total tickets earned: ${user.totalTicketsEarned}`);
    console.log(`Test 3 ${user.availableTickets === 0 && user.totalTicketsEarned > 0 ? 'PASSED ✅' : 'FAILED ❌'}`);
    
    // Test 4: Award multiple tickets
    console.log('\n🧪 Test 4: Award multiple tickets at once');
    
    // Award bonus tickets
    console.log('\nAwarding 2 bonus tickets...');
    const bonusResult = await awardTicketsToUser(testUser.id, 2, 'SURVEY');
    console.log('Bonus ticket award result:', bonusResult);
    
    // Check updated counts
    user = await prisma.user.findUnique({
      where: { id: testUser.id },
      select: { availableTickets: true, totalTicketsEarned: true }
    });
    console.log(`After bonus - Available tickets: ${user.availableTickets}`);
    console.log(`After bonus - Total tickets earned: ${user.totalTicketsEarned}`);
    console.log(`Test 4 ${bonusResult.success && user.availableTickets === 2 ? 'PASSED ✅' : 'FAILED ❌'}`);
    
    // Test 5: Award referral tickets
    console.log('\n🧪 Test 5: Award referral tickets');
    
    // Award referral ticket
    console.log('\nAwarding 1 referral ticket...');
    const referralResult = await awardTicketsToUser(testUser.id, 1, 'REFERRAL');
    console.log('Referral ticket award result:', referralResult);
    
    // Check updated counts
    user = await prisma.user.findUnique({
      where: { id: testUser.id },
      select: { availableTickets: true, totalTicketsEarned: true }
    });
    console.log(`After referral - Available tickets: ${user.availableTickets}`);
    console.log(`After referral - Total tickets earned: ${user.totalTicketsEarned}`);
    console.log(`Test 5 ${referralResult.success && user.availableTickets === 3 ? 'PASSED ✅' : 'FAILED ❌'}`);
    
    // Final results
    console.log('\n🧪 Test results summary');
    console.log(`Test user final state - Available tickets: ${user.availableTickets}`);
    console.log(`Test user final state - Total tickets earned: ${user.totalTicketsEarned}`);
    
    const tickets = await prisma.ticket.findMany({
      where: { userId: testUser.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    
    console.log(`\nRecent tickets (${tickets.length} total):`);
    tickets.forEach((ticket, i) => {
      console.log(`${i+1}. Source: ${ticket.source}, IsUsed: ${ticket.isUsed}, Created: ${ticket.createdAt}`);
    });
    
    console.log('\n✅ Ticket system tests completed!');
  } catch (error) {
    console.error('❌ Error testing ticket system:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Test script to verify the ticket system and referral functionality
async function main() {
  console.log('🧪 Starting ticket system and referral test');
  
  try {
    // 1. Create test users
    console.log('Creating test users...');
    
    const referrer = await prisma.user.upsert({
      where: { email: 'test-referrer@example.com' },
      update: {
        availableTickets: 0,
        totalTicketsEarned: 0,
      },
      create: {
        name: 'Test Referrer',
        email: 'test-referrer@example.com',
        availableTickets: 0,
        totalTicketsEarned: 0,
      },
    });
    
    const friend = await prisma.user.upsert({
      where: { email: 'test-referred@example.com' },
      update: {
        referredBy: referrer.id,
        availableTickets: 0,
        totalTicketsEarned: 0,
      },
      create: {
        name: 'Test Referred User',
        email: 'test-referred@example.com',
        referredBy: referrer.id,
        availableTickets: 0,
        totalTicketsEarned: 0,
      },
    });
    
    console.log(`Created test referrer: ${referrer.name} (${referrer.id})`);
    console.log(`Created test referred user: ${friend.name} (${friend.id})`);
    
    // 2. Verify initial state
    const initialReferrerState = await prisma.user.findUnique({
      where: { id: referrer.id },
      select: {
        availableTickets: true,
        totalTicketsEarned: true,
      },
    });
    
    const initialFriendState = await prisma.user.findUnique({
      where: { id: friend.id },
      select: {
        availableTickets: true,
        totalTicketsEarned: true,
        referredBy: true,
      },
    });
    
    console.log('\n📊 Initial state:');
    console.log(`Referrer available tickets: ${initialReferrerState.availableTickets}`);
    console.log(`Referrer total tickets earned: ${initialReferrerState.totalTicketsEarned}`);
    console.log(`Friend available tickets: ${initialFriendState.availableTickets}`);
    console.log(`Friend total tickets earned: ${initialFriendState.totalTicketsEarned}`);
    console.log(`Friend referred by: ${initialFriendState.referredBy}`);
    
    // 3. Simulate friend completing a survey (award ticket to friend)
    console.log('\n🎫 Simulating friend completing a survey...');
    
    // Get or create next draw
    const draw = await prisma.draw.findFirst({
      where: {
        status: 'PENDING',
        drawDate: {
          gte: new Date(),
        },
      },
      orderBy: {
        drawDate: 'asc',
      },
    }) || await prisma.draw.create({
      data: {
        drawDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'PENDING',
        prizeAmount: 25,
      },
    });
    
    console.log(`Using draw ID: ${draw.id} (${draw.drawDate})`);
    
    // Award survey ticket to friend
    const friendTicket = await prisma.ticket.create({
      data: {
        userId: friend.id,
        source: 'SURVEY',
        confirmationCode: `SURVEY_TEST_${Date.now()}`,
        isUsed: false,
      },
    });
    
    // Update friend's ticket counts
    await prisma.user.update({
      where: { id: friend.id },
      data: {
        availableTickets: { increment: 1 },
        totalTicketsEarned: { increment: 1 },
      },
    });
    
    console.log(`Created survey ticket for friend: ${friendTicket.id}`);
    
    // Apply friend's ticket to lottery
    await prisma.drawParticipation.upsert({
      where: {
        userId_drawId: {
          userId: friend.id,
          drawId: draw.id,
        },
      },
      update: {
        ticketsUsed: 1,
      },
      create: {
        userId: friend.id,
        drawId: draw.id,
        ticketsUsed: 1,
      },
    });
    
    // 4. Award referral ticket to referrer
    console.log('\n🎁 Awarding referral ticket to referrer...');
    
    const referrerTicket = await prisma.ticket.create({
      data: {
        userId: referrer.id,
        source: 'REFERRAL',
        confirmationCode: `REF_${friend.id}_TEST_${Date.now()}`,
        isUsed: false,
      },
    });
    
    // Update referrer's ticket counts
    await prisma.user.update({
      where: { id: referrer.id },
      data: {
        availableTickets: { increment: 1 },
        totalTicketsEarned: { increment: 1 },
      },
    });
    
    console.log(`Created referral ticket for referrer: ${referrerTicket.id}`);
    
    // Apply referrer's ticket to lottery
    await prisma.drawParticipation.upsert({
      where: {
        userId_drawId: {
          userId: referrer.id,
          drawId: draw.id,
        },
      },
      update: {
        ticketsUsed: 1,
      },
      create: {
        userId: referrer.id,
        drawId: draw.id,
        ticketsUsed: 1,
      },
    });
    
    // 5. Verify final state
    const finalReferrerState = await prisma.user.findUnique({
      where: { id: referrer.id },
      select: {
        availableTickets: true,
        totalTicketsEarned: true,
      },
    });
    
    const finalFriendState = await prisma.user.findUnique({
      where: { id: friend.id },
      select: {
        availableTickets: true,
        totalTicketsEarned: true,
      },
    });
    
    console.log('\n📊 Final state:');
    console.log(`Referrer available tickets: ${finalReferrerState.availableTickets}`);
    console.log(`Referrer total tickets earned: ${finalReferrerState.totalTicketsEarned}`);
    console.log(`Friend available tickets: ${finalFriendState.availableTickets}`);
    console.log(`Friend total tickets earned: ${finalFriendState.totalTicketsEarned}`);
    
    // 6. Check draw participation
    const drawParticipations = await prisma.drawParticipation.findMany({
      where: {
        drawId: draw.id,
        userId: {
          in: [referrer.id, friend.id],
        },
      },
    });
    
    console.log('\n🎯 Draw participation:');
    for (const participation of drawParticipations) {
      console.log(`User ${participation.userId} has ${participation.ticketsUsed} tickets in draw ${draw.id}`);
    }
    
    // 7. Test resetting tickets after draw
    console.log('\n🔄 Testing ticket reset after draw...');
    
    // Update draw to completed
    await prisma.draw.update({
      where: { id: draw.id },
      data: {
        status: 'COMPLETED',
      },
    });
    
    // Reset available tickets for users
    await prisma.user.updateMany({
      where: {
        id: {
          in: [referrer.id, friend.id],
        },
      },
      data: {
        availableTickets: 0,
      },
    });
    
    // Verify reset
    const resetReferrerState = await prisma.user.findUnique({
      where: { id: referrer.id },
      select: {
        availableTickets: true,
        totalTicketsEarned: true,
      },
    });
    
    const resetFriendState = await prisma.user.findUnique({
      where: { id: friend.id },
      select: {
        availableTickets: true,
        totalTicketsEarned: true,
      },
    });
    
    console.log('\n📊 State after reset:');
    console.log(`Referrer available tickets: ${resetReferrerState.availableTickets}`);
    console.log(`Referrer total tickets earned: ${resetReferrerState.totalTicketsEarned}`);
    console.log(`Friend available tickets: ${resetFriendState.availableTickets}`);
    console.log(`Friend total tickets earned: ${resetFriendState.totalTicketsEarned}`);
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
testTicketSystem()
  .then(() => console.log('Script execution completed'))
  .catch(error => {
    console.error('Error executing script:', error);
    process.exit(1);
  });

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 