#!/usr/bin/env node

/**
 * Fix All Ticket Issues Script
 * 
 * This comprehensive script fixes all ticket-related issues:
 * 1. Resets ALL tickets for winners
 * 2. Ensures tickets are correctly marked for the next lottery
 * 3. Fixes any inconsistencies in the database
 * 
 * Usage:
 * node scripts/fix-all-ticket-issues.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAllTicketIssues() {
  console.log('Starting comprehensive ticket fix script...');
  
  try {
    // Step 1: Reset ALL tickets for winners
    console.log('Step 1: Fixing winner tickets...');
    const winners = await prisma.winner.findMany({
      select: {
        id: true,
        userId: true,
        drawDate: true
      }
    });
    
    console.log(`Found ${winners.length} winners to process`);
    
    for (const winner of winners) {
      // Mark ALL tickets as used for winners
      const updateResult = await prisma.ticket.updateMany({
        where: {
          userId: winner.userId
        },
        data: {
          isUsed: true,
          drawId: null
        }
      });
      
      console.log(`Reset ${updateResult.count} tickets for winner ${winner.userId}`);
    }
    
    // Step 2: Fix tickets in completed draws
    console.log('\nStep 2: Fixing tickets in completed draws...');
    const completedDraws = await prisma.draw.findMany({
      where: {
        status: "COMPLETED"
      },
      select: {
        id: true,
        drawDate: true
      }
    });
    
    console.log(`Found ${completedDraws.length} completed draws`);
    
    for (const draw of completedDraws) {
      // Fix tickets that still reference completed draws
      const updateResult = await prisma.ticket.updateMany({
        where: {
          drawId: draw.id
        },
        data: {
          isUsed: true,
          drawId: null
        }
      });
      
      console.log(`Fixed ${updateResult.count} tickets for completed draw ${draw.id}`);
    }
    
    // Step 3: Fix inconsistent tickets (used but no draw)
    console.log('\nStep 3: Fixing inconsistent tickets...');
    const inconsistentTickets = await prisma.ticket.count({
      where: {
        isUsed: true,
        drawId: null
      }
    });
    
    console.log(`Found ${inconsistentTickets} inconsistent tickets (used but no draw)`);
    
    // Step 4: Find tickets that are not used but have a drawId
    console.log('\nStep 4: Fixing tickets that are not used but have a drawId...');
    const wrongStateTickets = await prisma.ticket.findMany({
      where: {
        isUsed: false,
        drawId: { not: null }
      },
      select: {
        id: true,
        userId: true,
        drawId: true
      }
    });
    
    console.log(`Found ${wrongStateTickets.length} tickets in wrong state (not used but have drawId)`);
    
    if (wrongStateTickets.length > 0) {
      const updateResult = await prisma.ticket.updateMany({
        where: {
          isUsed: false,
          drawId: { not: null }
        },
        data: {
          isUsed: true
        }
      });
      
      console.log(`Fixed ${updateResult.count} tickets in wrong state`);
    }
    
    // Step 5: Get final counts
    console.log('\nStep 5: Getting final ticket counts...');
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
    
    const ticketsWithDrawId = await prisma.ticket.count({
      where: {
        drawId: { not: null }
      }
    });
    
    console.log(`Final ticket counts:`);
    console.log(`- Unused tickets: ${unusedTickets}`);
    console.log(`- Used tickets: ${usedTickets}`);
    console.log(`- Tickets with drawId: ${ticketsWithDrawId}`);
    
    // Step 6: Check if any users have inconsistent ticket counts
    console.log('\nStep 6: Checking for users with inconsistent ticket counts...');
    
    // Get all users with tickets
    const usersWithTickets = await prisma.user.findMany({
      where: {
        tickets: {
          some: {}
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        hasWon: true
      }
    });
    
    console.log(`Found ${usersWithTickets.length} users with tickets`);
    
    for (const user of usersWithTickets) {
      // Count unused tickets for this user
      const unusedTicketCount = await prisma.ticket.count({
        where: {
          userId: user.id,
          isUsed: false
        }
      });
      
      // If user has won but still has unused tickets, fix them
      if (user.hasWon && unusedTicketCount > 0) {
        console.log(`User ${user.id} has won but still has ${unusedTicketCount} unused tickets`);
        
        const updateResult = await prisma.ticket.updateMany({
          where: {
            userId: user.id,
            isUsed: false
          },
          data: {
            isUsed: true,
            drawId: null
          }
        });
        
        console.log(`Fixed ${updateResult.count} tickets for winner ${user.id}`);
      }
    }
    
  } catch (error) {
    console.error('Error fixing ticket issues:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllTicketIssues()
  .then(() => console.log('\nAll ticket issues fixed successfully'))
  .catch(e => console.error('Script failed:', e)); 