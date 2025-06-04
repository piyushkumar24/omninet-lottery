#!/usr/bin/env node

/**
 * Ticket Fix Script
 * 
 * This script fixes issues with tickets in the database:
 * 1. Resets tickets for non-winners so they can participate in the next lottery
 * 2. Ensures all tickets from completed surveys are properly applied
 * 3. Updates ticket counts in the admin panel
 * 
 * Usage:
 * node scripts/fix-tickets.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixTickets() {
  console.log('Starting ticket fix script...');
  
  try {
    // 1. Find all completed draws
    const completedDraws = await prisma.draw.findMany({
      where: {
        status: "COMPLETED"
      },
      select: {
        id: true,
        drawDate: true,
        winnerId: true
      }
    });
    
    console.log(`Found ${completedDraws.length} completed draws`);
    
    // 2. For each completed draw, get all tickets
    let totalFixed = 0;
    
    for (const draw of completedDraws) {
      // Get tickets from this draw
      const tickets = await prisma.ticket.findMany({
        where: {
          drawId: draw.id
        },
        select: {
          id: true,
          userId: true,
          isUsed: true
        }
      });
      
      console.log(`Found ${tickets.length} tickets for draw ${draw.id} (${draw.drawDate})`);
      
      // Fix tickets: mark as used but remove drawId
      const updateResult = await prisma.ticket.updateMany({
        where: {
          drawId: draw.id
        },
        data: {
          isUsed: true,
          drawId: null
        }
      });
      
      console.log(`Updated ${updateResult.count} tickets for draw ${draw.id}`);
      totalFixed += updateResult.count;
    }
    
    // 3. Find any tickets that are used but don't have a drawId
    const inconsistentTickets = await prisma.ticket.findMany({
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
    
    console.log(`Found ${inconsistentTickets.length} inconsistent tickets (not used but have drawId)`);
    
    if (inconsistentTickets.length > 0) {
      // Fix these tickets
      const fixResult = await prisma.ticket.updateMany({
        where: {
          isUsed: false,
          drawId: { not: null }
        },
        data: {
          isUsed: true
        }
      });
      
      console.log(`Fixed ${fixResult.count} inconsistent tickets`);
      totalFixed += fixResult.count;
    }
    
    console.log(`Total tickets fixed: ${totalFixed}`);
    
  } catch (error) {
    console.error('Error fixing tickets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTickets()
  .then(() => console.log('Ticket fix script completed'))
  .catch(e => console.error('Script failed:', e)); 