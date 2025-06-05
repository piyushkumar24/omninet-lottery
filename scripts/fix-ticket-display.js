#!/usr/bin/env node

/**
 * Fix Ticket Display Script
 * 
 * This script fixes any inconsistencies in ticket display by ensuring:
 * 1. All tickets are properly applied to the current lottery draw
 * 2. Draw participation records are accurate
 * 3. Ticket counts match between dashboard and tickets tab
 * 
 * Usage:
 * node scripts/fix-ticket-display.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixTicketDisplay() {
  console.log('🔧 Starting ticket display fix...\n');
  
  try {
    // Get the current active draw
    const currentDraw = await prisma.draw.findFirst({
      where: { status: 'PENDING' },
      orderBy: { drawDate: 'asc' }
    });

    if (!currentDraw) {
      console.log('❌ No active draw found. Please create a draw first.');
      return;
    }

    console.log(`📅 Current active draw: ${currentDraw.drawDate.toLocaleDateString()}`);
    console.log(`🎯 Draw ID: ${currentDraw.id}\n`);

    // Get all users with tickets
    const usersWithTickets = await prisma.user.findMany({
      where: {
        tickets: {
          some: {}
        }
      },
      include: {
        tickets: true,
        drawParticipations: {
          where: {
            drawId: currentDraw.id
          }
        }
      }
    });

    console.log(`👥 Found ${usersWithTickets.length} users with tickets\n`);

    let fixedUsers = 0;
    let totalTicketsProcessed = 0;

    for (const user of usersWithTickets) {
      const userTickets = user.tickets;
      const userParticipation = user.drawParticipations[0];
      
      if (userTickets.length === 0) continue;

      console.log(`👤 Processing user: ${user.name || user.email}`);
      console.log(`   Total tickets: ${userTickets.length}`);
      console.log(`   Current participation: ${userParticipation?.ticketsUsed || 0} tickets`);

      // Calculate expected participation
      const expectedTickets = userTickets.length;
      const currentTickets = userParticipation?.ticketsUsed || 0;

      if (expectedTickets !== currentTickets) {
        console.log(`   ⚠️  Mismatch detected! Expected: ${expectedTickets}, Current: ${currentTickets}`);
        
        try {
          if (userParticipation) {
            // Update existing participation
            await prisma.drawParticipation.update({
              where: { id: userParticipation.id },
              data: {
                ticketsUsed: expectedTickets,
                updatedAt: new Date(),
              },
            });
            console.log(`   ✅ Updated participation: ${expectedTickets} tickets`);
          } else {
            // Create new participation
            await prisma.drawParticipation.create({
              data: {
                userId: user.id,
                drawId: currentDraw.id,
                ticketsUsed: expectedTickets,
              },
            });
            console.log(`   ✅ Created participation: ${expectedTickets} tickets`);
          }

          fixedUsers++;
          totalTicketsProcessed += expectedTickets;
        } catch (error) {
          console.log(`   ❌ Error fixing user ${user.id}:`, error.message);
        }
      } else {
        console.log(`   ✅ Already correct`);
      }
      
      console.log(''); // Empty line for readability
    }

    // Update draw total tickets
    const totalDrawParticipations = await prisma.drawParticipation.aggregate({
      where: { drawId: currentDraw.id },
      _sum: { ticketsUsed: true }
    });

    const correctTotalTickets = totalDrawParticipations._sum.ticketsUsed || 0;

    if (currentDraw.totalTickets !== correctTotalTickets) {
      console.log(`🎯 Updating draw total tickets: ${currentDraw.totalTickets} → ${correctTotalTickets}`);
      
      await prisma.draw.update({
        where: { id: currentDraw.id },
        data: { totalTickets: correctTotalTickets },
      });
      
      console.log(`✅ Draw total tickets updated`);
    }

    // Summary
    console.log('\n📊 SUMMARY');
    console.log('='.repeat(50));
    console.log(`Users processed: ${usersWithTickets.length}`);
    console.log(`Users fixed: ${fixedUsers}`);
    console.log(`Total tickets processed: ${totalTicketsProcessed}`);
    console.log(`Current draw total tickets: ${correctTotalTickets}`);

    if (fixedUsers > 0) {
      console.log('\n🎉 Ticket display issues have been fixed!');
      console.log('Users should now see correct ticket counts on their dashboard.');
    } else {
      console.log('\n✅ No issues found. All ticket displays are already correct.');
    }

  } catch (error) {
    console.error('❌ Error fixing ticket display:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to verify fix
async function verifyFix() {
  console.log('\n🔍 Verifying fix...\n');
  
  try {
    const currentDraw = await prisma.draw.findFirst({
      where: { status: 'PENDING' },
      orderBy: { drawDate: 'asc' }
    });

    if (!currentDraw) {
      console.log('❌ No active draw found');
      return;
    }

    // Check a few random users
    const users = await prisma.user.findMany({
      where: {
        tickets: { some: {} }
      },
      include: {
        tickets: true,
        drawParticipations: {
          where: { drawId: currentDraw.id }
        }
      },
      take: 5
    });

    console.log('📋 Verification results:');
    console.log('-'.repeat(30));

    for (const user of users) {
      const totalTickets = user.tickets.length;
      const participationTickets = user.drawParticipations[0]?.ticketsUsed || 0;
      const isCorrect = totalTickets === participationTickets;
      
      console.log(`${user.name || user.email}: ${totalTickets} tickets, ${participationTickets} in draw ${isCorrect ? '✅' : '❌'}`);
    }

  } catch (error) {
    console.error('❌ Error verifying fix:', error);
  }
}

// Run the fix
if (require.main === module) {
  fixTicketDisplay()
    .then(() => verifyFix())
    .then(() => {
      console.log('\n🏁 Ticket display fix completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { fixTicketDisplay, verifyFix }; 