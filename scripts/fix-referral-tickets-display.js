#!/usr/bin/env node

/**
 * Fix Referral Tickets Display Script
 * 
 * This script fixes referral tickets by setting isUsed: false
 * so they show up on the dashboard.
 * 
 * Usage:
 * node scripts/fix-referral-tickets-display.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixReferralTicketsDisplay() {
  console.log('Starting referral tickets display fix...');
  
  try {
    // Get the date of the most recent completed draw
    const mostRecentDraw = await prisma.draw.findFirst({
      where: {
        status: "COMPLETED"
      },
      orderBy: {
        drawDate: "desc"
      },
      select: {
        id: true,
        drawDate: true
      }
    });

    const cutoffDate = mostRecentDraw 
      ? new Date(mostRecentDraw.drawDate) 
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago as fallback
    
    console.log(`Using cutoff date: ${cutoffDate.toISOString()}`);
    
    // Find all referral tickets that were created after the cutoff date
    // but are marked as used (which prevents them from showing on the dashboard)
    const referralTickets = await prisma.ticket.findMany({
      where: {
        source: "REFERRAL",
        isUsed: true,
        createdAt: {
          gt: cutoffDate
        }
      },
      select: {
        id: true,
        userId: true,
        createdAt: true,
        drawId: true
      }
    });
    
    console.log(`Found ${referralTickets.length} referral tickets to fix`);
    
    // Get all winners
    const winners = await prisma.winner.findMany({
      select: {
        userId: true
      }
    });
    
    const winnerIds = winners.map(w => w.userId);
    console.log(`Found ${winnerIds.length} winners to exclude from fix`);
    
    // Process each referral ticket
    for (const ticket of referralTickets) {
      // Skip tickets for winners
      if (winnerIds.includes(ticket.userId)) {
        console.log(`Skipping ticket ${ticket.id} for winner ${ticket.userId}`);
        continue;
      }
      
      // Fix the ticket
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          isUsed: false,
          drawId: null
        }
      });
      
      console.log(`Fixed ticket ${ticket.id} for user ${ticket.userId}`);
    }
    
    // Get final counts for verification
    const unusedReferralTickets = await prisma.ticket.count({
      where: {
        source: "REFERRAL",
        isUsed: false
      }
    });
    
    const usedReferralTickets = await prisma.ticket.count({
      where: {
        source: "REFERRAL",
        isUsed: true
      }
    });
    
    console.log(`\nFinal counts:`);
    console.log(`- Unused referral tickets: ${unusedReferralTickets}`);
    console.log(`- Used referral tickets: ${usedReferralTickets}`);
    
  } catch (error) {
    console.error('Error fixing referral tickets display:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixReferralTicketsDisplay()
  .then(() => console.log('\nReferral tickets display fix completed successfully'))
  .catch(e => console.error('Script failed:', e)); 