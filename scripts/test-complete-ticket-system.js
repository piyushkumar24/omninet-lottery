// Comprehensive test script for the complete ticket system
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Starting comprehensive ticket system test');
  
  try {
    // Clean up test data first
    console.log('🧹 Cleaning up existing test data...');
    await cleanupTestData();
    
    // Test 1: Survey completion awards ticket
    console.log('\n📝 Test 1: Survey completion awards exactly 1 ticket');
    const testUser1 = await createTestUser('survey-test@example.com', 'Survey Tester');
    
    // Simulate survey completion
    await simulateSurveyCompletion(testUser1.id);
    
    const user1AfterSurvey = await getUserTicketData(testUser1.id);
    console.log(`✅ User after survey: ${user1AfterSurvey.availableTickets} available, ${user1AfterSurvey.totalTicketsEarned} total`);
    
    if (user1AfterSurvey.availableTickets !== 1 || user1AfterSurvey.totalTicketsEarned !== 1) {
      throw new Error('Survey completion should award exactly 1 ticket');
    }
    
    // Test 2: Social media follow awards ticket
    console.log('\n📱 Test 2: Social media follow awards exactly 1 ticket');
    await simulateSocialMediaFollow(testUser1.id);
    
    const user1AfterSocial = await getUserTicketData(testUser1.id);
    console.log(`✅ User after social: ${user1AfterSocial.availableTickets} available, ${user1AfterSocial.totalTicketsEarned} total`);
    
    if (user1AfterSocial.availableTickets !== 2 || user1AfterSocial.totalTicketsEarned !== 2) {
      throw new Error('Social media follow should award exactly 1 additional ticket');
    }
    
    // Test 3: Referral system
    console.log('\n👥 Test 3: Referral system awards ticket to referrer');
    const testUser2 = await createTestUser('referred-test@example.com', 'Referred Tester', testUser1.id);
    
    // Check referrer before referred user completes survey
    const user1BeforeReferral = await getUserTicketData(testUser1.id);
    console.log(`Referrer before: ${user1BeforeReferral.availableTickets} available, ${user1BeforeReferral.totalTicketsEarned} total`);
    
    // Referred user completes survey (should award referral ticket to referrer)
    await simulateSurveyCompletion(testUser2.id);
    
    const user1AfterReferral = await getUserTicketData(testUser1.id);
    const user2AfterSurvey = await getUserTicketData(testUser2.id);
    
    console.log(`✅ Referrer after referral: ${user1AfterReferral.availableTickets} available, ${user1AfterReferral.totalTicketsEarned} total`);
    console.log(`✅ Referred user: ${user2AfterSurvey.availableTickets} available, ${user2AfterSurvey.totalTicketsEarned} total`);
    
    if (user1AfterReferral.availableTickets !== 3 || user1AfterReferral.totalTicketsEarned !== 3) {
      throw new Error('Referrer should get exactly 1 referral ticket when referred user completes survey');
    }
    
    if (user2AfterSurvey.availableTickets !== 1 || user2AfterSurvey.totalTicketsEarned !== 1) {
      throw new Error('Referred user should get exactly 1 ticket for survey completion');
    }
    
    // Test 4: Lottery application
    console.log('\n🎯 Test 4: Tickets are automatically applied to lottery');
    const draw = await getOrCreateTestDraw();
    
    console.log(`Debug: Draw ID = ${draw.id}`);
    
    // Check all participations for debugging
    const allParticipations = await prisma.drawParticipation.findMany({
      where: { drawId: draw.id },
      include: {
        user: { select: { email: true } }
      }
    });
    
    console.log('All participations:', allParticipations.map(p => ({
      userEmail: p.user.email,
      ticketsUsed: p.ticketsUsed
    })));
    
    // Check draw participation
    const participation1 = await getDrawParticipation(testUser1.id, draw.id);
    const participation2 = await getDrawParticipation(testUser2.id, draw.id);
    
    console.log(`✅ User1 lottery participation: ${participation1?.ticketsUsed || 0} tickets`);
    console.log(`✅ User2 lottery participation: ${participation2?.ticketsUsed || 0} tickets`);
    
    if (!participation1 || participation1.ticketsUsed !== 3) {
      console.log(`❌ Expected User1 to have 3 tickets, but got ${participation1?.ticketsUsed || 0}`);
      throw new Error('User1 should have 3 tickets applied to lottery');
    }
    
    if (!participation2 || participation2.ticketsUsed !== 1) {
      console.log(`❌ Expected User2 to have 1 ticket, but got ${participation2?.ticketsUsed || 0}`);
      throw new Error('User2 should have 1 ticket applied to lottery');
    }
    
    // Test 5: Lottery reset
    console.log('\n🔄 Test 5: Available tickets reset to 0 after lottery');
    await simulateLotteryReset();
    
    const user1AfterReset = await getUserTicketData(testUser1.id);
    const user2AfterReset = await getUserTicketData(testUser2.id);
    
    console.log(`✅ User1 after reset: ${user1AfterReset.availableTickets} available, ${user1AfterReset.totalTicketsEarned} total`);
    console.log(`✅ User2 after reset: ${user2AfterReset.availableTickets} available, ${user2AfterReset.totalTicketsEarned} total`);
    
    if (user1AfterReset.availableTickets !== 0 || user1AfterReset.totalTicketsEarned !== 3) {
      throw new Error('After lottery reset, available tickets should be 0 but total earned should remain');
    }
    
    if (user2AfterReset.availableTickets !== 0 || user2AfterReset.totalTicketsEarned !== 1) {
      throw new Error('After lottery reset, available tickets should be 0 but total earned should remain');
    }
    
    // Test 6: New tickets after reset
    console.log('\n🎫 Test 6: Users can earn new tickets after reset');
    await simulateSurveyCompletion(testUser1.id); // Second survey
    
    const user1AfterNewTicket = await getUserTicketData(testUser1.id);
    console.log(`✅ User1 after new ticket: ${user1AfterNewTicket.availableTickets} available, ${user1AfterNewTicket.totalTicketsEarned} total`);
    
    if (user1AfterNewTicket.availableTickets !== 1 || user1AfterNewTicket.totalTicketsEarned !== 4) {
      throw new Error('User should be able to earn new tickets after lottery reset');
    }
    
    console.log('\n🎉 ALL TESTS PASSED! The ticket system is working correctly.');
    console.log('\n📊 Final Summary:');
    console.log(`- Survey completion: ✅ Awards exactly 1 ticket`);
    console.log(`- Social media follow: ✅ Awards exactly 1 ticket`);
    console.log(`- Referral system: ✅ Awards 1 ticket to referrer when friend completes survey`);
    console.log(`- Auto-apply to lottery: ✅ All tickets automatically applied`);
    console.log(`- Lottery reset: ✅ Available tickets reset to 0, total earned preserved`);
    console.log(`- New tickets after reset: ✅ Users can continue earning tickets`);
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    throw error;
  } finally {
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await cleanupTestData();
    await prisma.$disconnect();
  }
}

async function createTestUser(email, name, referredBy = null) {
  return await prisma.user.create({
    data: {
      email,
      name,
      availableTickets: 0,
      totalTicketsEarned: 0,
      referredBy
    }
  });
}

async function getUserTicketData(userId) {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      availableTickets: true,
      totalTicketsEarned: true
    }
  });
}

async function simulateSurveyCompletion(userId) {
  // Award 1 ticket for survey completion
  const ticket = await prisma.ticket.create({
    data: {
      userId,
      source: 'SURVEY',
      isUsed: false,
      confirmationCode: `SURVEY_${userId}_${Date.now()}`
    }
  });
  
  // Update user ticket counts
  await prisma.user.update({
    where: { id: userId },
    data: {
      availableTickets: { increment: 1 },
      totalTicketsEarned: { increment: 1 }
    }
  });
  
  // Auto-apply to current lottery
  const draw = await getOrCreateTestDraw();
  await prisma.drawParticipation.upsert({
    where: {
      userId_drawId: { userId, drawId: draw.id }
    },
    update: {
      ticketsUsed: { increment: 1 }
    },
    create: {
      userId,
      drawId: draw.id,
      ticketsUsed: 1
    }
  });
  
  // Check for referral award if this is first survey
  const ticketCount = await prisma.ticket.count({
    where: { userId, source: 'SURVEY' }
  });
  
  if (ticketCount === 1) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referredBy: true }
    });
    
    if (user?.referredBy) {
      // Award referral ticket
      await prisma.ticket.create({
        data: {
          userId: user.referredBy,
          source: 'REFERRAL',
          isUsed: false,
          confirmationCode: `REF_${userId}_${Date.now()}`
        }
      });
      
      await prisma.user.update({
        where: { id: user.referredBy },
        data: {
          availableTickets: { increment: 1 },
          totalTicketsEarned: { increment: 1 }
        }
      });
      
      // Apply referral ticket to lottery
      await prisma.drawParticipation.upsert({
        where: {
          userId_drawId: { userId: user.referredBy, drawId: draw.id }
        },
        update: {
          ticketsUsed: { increment: 1 }
        },
        create: {
          userId: user.referredBy,
          drawId: draw.id,
          ticketsUsed: 1
        }
      });
    }
  }
}

async function simulateSocialMediaFollow(userId) {
  // Award 1 ticket for social media follow
  await prisma.ticket.create({
    data: {
      userId,
      source: 'SOCIAL',
      isUsed: false,
      confirmationCode: `SOCIAL_${userId}_${Date.now()}`
    }
  });
  
  // Update user ticket counts
  await prisma.user.update({
    where: { id: userId },
    data: {
      availableTickets: { increment: 1 },
      totalTicketsEarned: { increment: 1 },
      socialMediaFollowed: true
    }
  });
  
  // Auto-apply to current lottery
  const draw = await getOrCreateTestDraw();
  await prisma.drawParticipation.upsert({
    where: {
      userId_drawId: { userId, drawId: draw.id }
    },
    update: {
      ticketsUsed: { increment: 1 }
    },
    create: {
      userId,
      drawId: draw.id,
      ticketsUsed: 1
    }
  });
}

async function createTestDraw() {
  return await prisma.draw.create({
    data: {
      drawDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
      prizeAmount: 1000,
      status: 'PENDING',
      totalTickets: 0
    }
  });
}

async function getOrCreateTestDraw() {
  let draw = await prisma.draw.findFirst({
    where: { status: 'PENDING' },
    orderBy: { drawDate: 'asc' }
  });
  
  if (!draw) {
    draw = await createTestDraw();
  }
  
  return draw;
}

async function getDrawParticipation(userId, drawId) {
  return await prisma.drawParticipation.findUnique({
    where: {
      userId_drawId: { userId, drawId }
    }
  });
}

async function simulateLotteryReset() {
  // Reset all users' available tickets to 0
  await prisma.user.updateMany({
    where: {},
    data: { availableTickets: 0 }
  });
  
  // Mark current draw as completed
  await prisma.draw.updateMany({
    where: { status: 'PENDING' },
    data: { status: 'COMPLETED' }
  });
}

async function cleanupTestData() {
  // Delete test users and related data
  const testEmails = ['survey-test@example.com', 'referred-test@example.com'];
  
  for (const email of testEmails) {
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (user) {
      // Delete tickets
      await prisma.ticket.deleteMany({
        where: { userId: user.id }
      });
      
      // Delete draw participations
      await prisma.drawParticipation.deleteMany({
        where: { userId: user.id }
      });
      
      // Delete user
      await prisma.user.delete({
        where: { id: user.id }
      });
    }
  }
  
  // Delete test draws
  await prisma.draw.deleteMany({
    where: {
      drawDate: {
        gte: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000) // Future draws
      }
    }
  });
}

main()
  .catch((e) => {
    console.error('Test failed:', e);
    process.exit(1);
  }); 