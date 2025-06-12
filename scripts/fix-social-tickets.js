#!/usr/bin/env node

/**
 * Fix Social Media Tickets Script
 * 
 * This script fixes social media tickets that were marked as used
 * but should be visible on the dashboard.
 * 
 * Usage:
 * node scripts/fix-social-tickets.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSocialMediaTickets() {
  console.log('🔧 Starting to fix social media tickets...');

  try {
    // Get the next lottery draw
    const nextDraw = await prisma.draw.findFirst({
      where: {
        status: 'PENDING',
      },
      orderBy: {
        drawDate: 'asc',
      },
    });

    if (!nextDraw) {
      console.log('❌ No pending draw found. Creating a new draw...');
      
      // Create a new draw if none exists
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const newDraw = await prisma.draw.create({
        data: {
          drawDate: nextWeek,
          status: 'PENDING',
          prizeAmount: 50,
          totalTickets: 0,
        },
      });
      
      console.log(`✅ Created new draw with ID: ${newDraw.id}`);
      nextDrawId = newDraw.id;
    } else {
      console.log(`✅ Found next draw with ID: ${nextDraw.id}`);
      nextDrawId = nextDraw.id;
    }

    // Find all social media tickets that don't have a drawId
    const unassignedSocialTickets = await prisma.ticket.findMany({
      where: {
        source: 'SOCIAL',
        drawId: null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        }
      }
    });

    console.log(`🎫 Found ${unassignedSocialTickets.length} unassigned social media tickets`);

    // Process each ticket
    for (const ticket of unassignedSocialTickets) {
      console.log(`Processing ticket ${ticket.id} for user ${ticket.user.email || ticket.userId}`);
      
      // Update the ticket to assign it to the next draw
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { drawId: nextDrawId },
      });

      // Check if a draw participation record exists
      const existingParticipation = await prisma.drawParticipation.findUnique({
        where: {
          userId_drawId: {
            userId: ticket.userId,
            drawId: nextDrawId,
          },
        },
      });

      if (existingParticipation) {
        // Update existing participation record
        await prisma.drawParticipation.update({
          where: { id: existingParticipation.id },
          data: { ticketsUsed: existingParticipation.ticketsUsed + 1 },
        });
        console.log(`✅ Updated existing participation for user ${ticket.userId}`);
      } else {
        // Create new participation record
        await prisma.drawParticipation.create({
          data: {
            userId: ticket.userId,
            drawId: nextDrawId,
            ticketsUsed: 1,
          },
        });
        console.log(`✅ Created new participation for user ${ticket.userId}`);
      }
    }

    // Update the draw's total tickets count
    const totalParticipations = await prisma.drawParticipation.aggregate({
      where: { drawId: nextDrawId },
      _sum: { ticketsUsed: true },
    });

    const totalTickets = totalParticipations._sum.ticketsUsed || 0;

    await prisma.draw.update({
      where: { id: nextDrawId },
      data: { totalTickets },
    });

    console.log(`✅ Updated draw ${nextDrawId} total tickets to ${totalTickets}`);
    console.log('🎉 Successfully fixed social media tickets!');
  } catch (error) {
    console.error('❌ Error fixing social media tickets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
fixSocialMediaTickets()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    console.log('Script execution completed');
  }); 