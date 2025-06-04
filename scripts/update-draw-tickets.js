#!/usr/bin/env node

/**
 * Update Draw Tickets Script
 * 
 * This script updates the totalTickets field in the Draw table
 * based on the actual count of tickets assigned to each draw.
 * 
 * Usage:
 * node scripts/update-draw-tickets.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateDrawTickets() {
  console.log('Starting draw tickets update...');
  
  try {
    // Get all draws
    const draws = await prisma.draw.findMany({
      select: {
        id: true,
        status: true,
        totalTickets: true
      }
    });
    
    console.log(`Found ${draws.length} draws to process`);
    
    // Process each draw
    for (const draw of draws) {
      // Count tickets assigned to this draw
      const ticketCount = await prisma.ticket.count({
        where: {
          drawId: draw.id,
          isUsed: true
        }
      });
      
      // Count tickets from participation records
      const participationTickets = await prisma.$queryRaw`
        SELECT SUM("ticketsUsed") as total 
        FROM "DrawParticipation" 
        WHERE "drawId" = ${draw.id}
      `;
      
      const participationTotal = participationTickets[0]?.total 
        ? Number(participationTickets[0].total) 
        : 0;
      
      console.log(`Draw ${draw.id} (${draw.status}):`);
      console.log(`- Current totalTickets: ${draw.totalTickets}`);
      console.log(`- Actual tickets assigned: ${ticketCount}`);
      console.log(`- Participation records total: ${participationTotal}`);
      
      // Update the draw if the counts don't match
      if (draw.totalTickets !== ticketCount) {
        await prisma.draw.update({
          where: { id: draw.id },
          data: { totalTickets: ticketCount }
        });
        
        console.log(`✅ Updated draw ${draw.id} totalTickets from ${draw.totalTickets} to ${ticketCount}`);
      } else {
        console.log(`✓ Draw ${draw.id} totalTickets already correct`);
      }
      
      // Check if participation records match ticket count
      if (participationTotal !== ticketCount) {
        console.log(`⚠️ Warning: Participation records (${participationTotal}) don't match ticket count (${ticketCount})`);
      }
    }
    
  } catch (error) {
    console.error('Error updating draw tickets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDrawTickets()
  .then(() => console.log('\nDraw tickets update completed successfully'))
  .catch(e => console.error('Script failed:', e)); 