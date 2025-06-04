#!/usr/bin/env node

/**
 * Fix Participation Records Script
 * 
 * This script fixes the participation records to match the actual ticket counts.
 * It ensures that the ticketsUsed field in DrawParticipation matches the number
 * of tickets assigned to each user for each draw.
 * 
 * Usage:
 * node scripts/fix-participation-records.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixParticipationRecords() {
  console.log('Starting participation records fix...');
  
  try {
    // Get all draws
    const draws = await prisma.draw.findMany({
      select: {
        id: true,
        status: true,
      }
    });
    
    console.log(`Found ${draws.length} draws to process`);
    
    // Process each draw
    for (const draw of draws) {
      console.log(`\nProcessing draw ${draw.id} (${draw.status})...`);
      
      // Get all participation records for this draw
      const participations = await prisma.drawParticipation.findMany({
        where: {
          drawId: draw.id
        },
        select: {
          id: true,
          userId: true,
          ticketsUsed: true
        }
      });
      
      console.log(`Found ${participations.length} participation records`);
      
      // Process each participation record
      for (const participation of participations) {
        // Count actual tickets for this user in this draw
        const actualTickets = await prisma.ticket.count({
          where: {
            userId: participation.userId,
            drawId: draw.id,
            isUsed: true
          }
        });
        
        // If the counts don't match, update the participation record
        if (participation.ticketsUsed !== actualTickets) {
          console.log(`User ${participation.userId}:`);
          console.log(`- Participation record: ${participation.ticketsUsed} tickets`);
          console.log(`- Actual tickets: ${actualTickets} tickets`);
          
          await prisma.drawParticipation.update({
            where: { id: participation.id },
            data: { ticketsUsed: actualTickets }
          });
          
          console.log(`✅ Updated participation record to ${actualTickets} tickets`);
        }
      }
      
      // Find users with tickets in this draw but no participation record
      const ticketsWithoutParticipation = await prisma.ticket.groupBy({
        by: ['userId'],
        where: {
          drawId: draw.id,
          isUsed: true,
          user: {
            drawParticipations: {
              none: {
                drawId: draw.id
              }
            }
          }
        },
        _count: {
          id: true
        }
      });
      
      // Create missing participation records
      for (const record of ticketsWithoutParticipation) {
        console.log(`User ${record.userId} has ${record._count.id} tickets but no participation record`);
        
        await prisma.drawParticipation.create({
          data: {
            userId: record.userId,
            drawId: draw.id,
            ticketsUsed: record._count.id,
            isWinner: false
          }
        });
        
        console.log(`✅ Created participation record for user ${record.userId}`);
      }
      
      // Update draw total tickets
      const totalTickets = await prisma.ticket.count({
        where: {
          drawId: draw.id,
          isUsed: true
        }
      });
      
      await prisma.draw.update({
        where: { id: draw.id },
        data: { totalTickets: totalTickets }
      });
      
      console.log(`✅ Updated draw ${draw.id} totalTickets to ${totalTickets}`);
    }
    
  } catch (error) {
    console.error('Error fixing participation records:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixParticipationRecords()
  .then(() => console.log('\nParticipation records fix completed successfully'))
  .catch(e => console.error('Script failed:', e)); 