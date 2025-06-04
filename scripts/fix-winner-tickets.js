#!/usr/bin/env node

/**
 * Fix Winner Tickets Script
 * 
 * This script fixes tickets for users who have won in previous draws
 * but still see tickets for the next lottery.
 * 
 * Usage:
 * node scripts/fix-winner-tickets.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixWinnerTickets() {
  console.log('Starting winner tickets fix...');
  
  try {
    // Find all winners
    const winners = await prisma.winner.findMany({
      select: {
        id: true,
        userId: true,
        drawDate: true,
        prizeAmount: true
      },
      orderBy: {
        drawDate: 'desc'
      }
    });
    
    console.log(`Found ${winners.length} winners to process`);
    
    if (winners.length === 0) {
      console.log('No winners found, nothing to fix');
      return;
    }
    
    // Process each winner
    for (const winner of winners) {
      // Check if winner still has unused tickets
      const unusedTickets = await prisma.ticket.findMany({
        where: {
          userId: winner.userId,
          isUsed: false
        },
        select: {
          id: true,
          source: true,
          createdAt: true
        }
      });
      
      if (unusedTickets.length > 0) {
        console.log(`Winner ${winner.userId} still has ${unusedTickets.length} unused tickets`);
        
        // Mark all tickets as used
        const updateResult = await prisma.ticket.updateMany({
          where: {
            userId: winner.userId,
            isUsed: false
          },
          data: {
            isUsed: true,
            drawId: null
          }
        });
        
        console.log(`Fixed ${updateResult.count} tickets for winner ${winner.userId}`);
        
        // Log the details for verification
        await prisma.settings.create({
          data: {
            key: `winner_tickets_fix_${winner.userId}`,
            value: JSON.stringify({
              winnerId: winner.id,
              userId: winner.userId,
              ticketsFixed: updateResult.count,
              fixedAt: new Date().toISOString(),
              ticketIds: unusedTickets.map(t => t.id)
            }),
            description: `Fixed tickets for winner ${winner.userId} who won on ${winner.drawDate}`
          }
        });
      } else {
        console.log(`Winner ${winner.userId} has no unused tickets, nothing to fix`);
      }
    }
    
  } catch (error) {
    console.error('Error fixing winner tickets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixWinnerTickets()
  .then(() => console.log('Winner tickets fix completed'))
  .catch(e => console.error('Script failed:', e)); 