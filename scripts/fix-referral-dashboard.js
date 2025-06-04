#!/usr/bin/env node

/**
 * Fix Referral Dashboard Script
 * 
 * This script ensures all referral tickets are properly set to show up on the dashboard
 * by setting isUsed=false and drawId=null for all referral tickets that should be visible.
 * 
 * Usage:
 * node scripts/fix-referral-dashboard.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixReferralDashboard() {
  console.log('Starting referral dashboard fix...');
  
  try {
    // Get all referral tickets
    const referralTickets = await prisma.ticket.findMany({
      where: {
        source: "REFERRAL",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            hasWon: true
          }
        }
      }
    });
    
    console.log(`Found ${referralTickets.length} total referral tickets`);
    
    // Group tickets by user
    const ticketsByUser = {};
    referralTickets.forEach(ticket => {
      if (!ticketsByUser[ticket.userId]) {
        ticketsByUser[ticket.userId] = [];
      }
      ticketsByUser[ticket.userId].push(ticket);
    });
    
    console.log(`Found referral tickets for ${Object.keys(ticketsByUser).length} users`);
    
    // Process each user's tickets
    for (const userId in ticketsByUser) {
      const userTickets = ticketsByUser[userId];
      const user = userTickets[0].user;
      
      // Skip winners - they shouldn't have tickets showing
      if (user.hasWon) {
        console.log(`Skipping user ${userId} (${user.name || user.email}) - marked as winner`);
        continue;
      }
      
      console.log(`Processing ${userTickets.length} tickets for user ${userId} (${user.name || user.email})`);
      
      // Count tickets that need fixing
      const ticketsToFix = userTickets.filter(ticket => 
        ticket.isUsed === true || ticket.drawId !== null
      );
      
      if (ticketsToFix.length > 0) {
        console.log(`Found ${ticketsToFix.length} referral tickets to fix for user ${userId}`);
        
        // Fix each ticket
        for (const ticket of ticketsToFix) {
          await prisma.ticket.update({
            where: { id: ticket.id },
            data: {
              isUsed: false,
              drawId: null
            }
          });
          
          console.log(`Fixed ticket ${ticket.id} - set isUsed=false, drawId=null`);
        }
      } else {
        console.log(`All tickets for user ${userId} are already correctly configured`);
      }
    }
    
    // Get final counts for verification
    const unusedReferralTickets = await prisma.ticket.count({
      where: {
        source: "REFERRAL",
        isUsed: false,
        drawId: null
      }
    });
    
    const usedReferralTickets = await prisma.ticket.count({
      where: {
        source: "REFERRAL",
        isUsed: true
      }
    });
    
    const referralTicketsWithDrawId = await prisma.ticket.count({
      where: {
        source: "REFERRAL",
        drawId: {
          not: null
        }
      }
    });
    
    console.log(`\nFinal counts:`);
    console.log(`- Unused referral tickets (should show on dashboard): ${unusedReferralTickets}`);
    console.log(`- Used referral tickets: ${usedReferralTickets}`);
    console.log(`- Referral tickets with drawId: ${referralTicketsWithDrawId}`);
    
  } catch (error) {
    console.error('Error fixing referral dashboard:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixReferralDashboard()
  .then(() => console.log('\nReferral dashboard fix completed successfully'))
  .catch(e => console.error('Script failed:', e)); 