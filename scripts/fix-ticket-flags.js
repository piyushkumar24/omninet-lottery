#!/usr/bin/env node

/**
 * Fix Ticket Flags Script
 * 
 * This script ensures that all new tickets have the correct isUsed flag:
 * - New tickets should have isUsed = false so they show up on the dashboard
 * - Tickets for winners should be marked as used
 * 
 * Usage:
 * node scripts/fix-ticket-flags.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixTicketFlags() {
  console.log('Starting ticket flags fix...');
  
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
    
    // Step 1: Find all winners
    const winners = await prisma.winner.findMany({
      select: {
        userId: true
      }
    });
    
    const winnerIds = winners.map(w => w.userId);
    console.log(`Found ${winnerIds.length} winners`);
    
    // Step 2: Mark all tickets for winners as used
    const winnerTicketsFixed = await prisma.ticket.updateMany({
      where: {
        userId: {
          in: winnerIds
        },
        isUsed: false
      },
      data: {
        isUsed: true,
        drawId: null
      }
    });
    
    console.log(`Fixed ${winnerTicketsFixed.count} winner tickets`);
    
    // Step 3: Make sure new tickets (created after the most recent draw) are marked as unused
    // unless they belong to a winner
    const newTicketsFixed = await prisma.ticket.updateMany({
      where: {
        createdAt: {
          gt: cutoffDate
        },
        isUsed: true,
        drawId: null,
        userId: {
          notIn: winnerIds
        }
      },
      data: {
        isUsed: false
      }
    });
    
    console.log(`Fixed ${newTicketsFixed.count} new tickets (marked as unused)`);
    
    // Step 4: Make sure tickets assigned to a draw are marked as used
    const drawTicketsFixed = await prisma.ticket.updateMany({
      where: {
        drawId: {
          not: null
        },
        isUsed: false
      },
      data: {
        isUsed: true
      }
    });
    
    console.log(`Fixed ${drawTicketsFixed.count} draw tickets (marked as used)`);
    
    // Step 5: Get final counts for verification
    const unusedTickets = await prisma.ticket.count({
      where: {
        isUsed: false
      }
    });
    
    const usedTickets = await prisma.ticket.count({
      where: {
        isUsed: true
      }
    });
    
    const ticketsInDraw = await prisma.ticket.count({
      where: {
        drawId: {
          not: null
        }
      }
    });
    
    console.log(`\nFinal counts:`);
    console.log(`- Unused tickets: ${unusedTickets}`);
    console.log(`- Used tickets: ${usedTickets}`);
    console.log(`- Tickets in draw: ${ticketsInDraw}`);
    
  } catch (error) {
    console.error('Error fixing ticket flags:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTicketFlags()
  .then(() => console.log('\nTicket flags fix completed successfully'))
  .catch(e => console.error('Script failed:', e)); 