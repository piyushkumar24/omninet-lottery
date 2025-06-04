#!/usr/bin/env node

/**
 * Fix Referral Tickets Script
 * 
 * This script fixes referral tickets that were marked as used
 * but should be visible on the dashboard.
 * 
 * Usage:
 * node scripts/fix-referral-tickets.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixReferralTickets() {
  console.log('Starting referral tickets fix...');
  
  try {
    // Find all referral tickets that are marked as used
    const referralTickets = await prisma.ticket.findMany({
      where: {
        source: "REFERRAL",
        isUsed: true
      },
      select: {
        id: true,
        userId: true,
        createdAt: true
      }
    });
    
    console.log(`Found ${referralTickets.length} used referral tickets`);
    
    if (referralTickets.length === 0) {
      console.log('No referral tickets to fix');
      return;
    }
    
    // Fix the tickets by marking them as unused
    const updateResult = await prisma.ticket.updateMany({
      where: {
        source: "REFERRAL",
        isUsed: true
      },
      data: {
        isUsed: false,
        drawId: null
      }
    });
    
    console.log(`Fixed ${updateResult.count} referral tickets`);
    
    // Get all users with referral tickets
    const userIds = [...new Set(referralTickets.map(ticket => ticket.userId))];
    console.log(`Found ${userIds.length} users with referral tickets`);
    
  } catch (error) {
    console.error('Error fixing referral tickets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixReferralTickets()
  .then(() => console.log('Referral tickets fix completed'))
  .catch(e => console.error('Script failed:', e)); 