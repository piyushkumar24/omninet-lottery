#!/usr/bin/env node

/**
 * Fix All Tickets Script
 * 
 * This script fixes all types of tickets (survey, social, referral) 
 * by marking them as unused so they show up on the dashboard.
 * 
 * Usage:
 * node scripts/fix-all-tickets.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAllTickets() {
  console.log('Starting fix all tickets script...');
  
  try {
    // Find all tickets that are marked as used but should be visible
    const usedTickets = await prisma.ticket.findMany({
      where: {
        isUsed: true,
        drawId: null, // Tickets that are used but not in any draw
      },
      select: {
        id: true,
        userId: true,
        source: true,
        createdAt: true
      }
    });
    
    console.log(`Found ${usedTickets.length} used tickets with no draw`);
    
    // Fix these tickets by marking them as unused
    if (usedTickets.length > 0) {
      const updateResult = await prisma.ticket.updateMany({
        where: {
          isUsed: true,
          drawId: null
        },
        data: {
          isUsed: false
        }
      });
      
      console.log(`Fixed ${updateResult.count} tickets with no draw`);
    }
    
    // Count tickets by source that are still marked as used
    const surveyTickets = await prisma.ticket.count({
      where: {
        source: "SURVEY",
        isUsed: true
      }
    });
    
    const socialTickets = await prisma.ticket.count({
      where: {
        source: "SOCIAL",
        isUsed: true
      }
    });
    
    const referralTickets = await prisma.ticket.count({
      where: {
        source: "REFERRAL",
        isUsed: true
      }
    });
    
    console.log(`Tickets still marked as used: Survey: ${surveyTickets}, Social: ${socialTickets}, Referral: ${referralTickets}`);
    
    // Fix all remaining tickets by source
    if (surveyTickets > 0) {
      const updateSurvey = await prisma.ticket.updateMany({
        where: {
          source: "SURVEY",
          isUsed: true
        },
        data: {
          isUsed: false,
          drawId: null
        }
      });
      
      console.log(`Fixed ${updateSurvey.count} survey tickets`);
    }
    
    if (socialTickets > 0) {
      const updateSocial = await prisma.ticket.updateMany({
        where: {
          source: "SOCIAL",
          isUsed: true
        },
        data: {
          isUsed: false,
          drawId: null
        }
      });
      
      console.log(`Fixed ${updateSocial.count} social tickets`);
    }
    
    if (referralTickets > 0) {
      const updateReferral = await prisma.ticket.updateMany({
        where: {
          source: "REFERRAL",
          isUsed: true
        },
        data: {
          isUsed: false,
          drawId: null
        }
      });
      
      console.log(`Fixed ${updateReferral.count} referral tickets`);
    }
    
    // Get final counts
    const finalUnusedTickets = await prisma.ticket.count({
      where: {
        isUsed: false
      }
    });
    
    const finalUsedTickets = await prisma.ticket.count({
      where: {
        isUsed: true
      }
    });
    
    console.log(`Final ticket counts: Unused: ${finalUnusedTickets}, Used: ${finalUsedTickets}`);
    
  } catch (error) {
    console.error('Error fixing tickets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllTickets()
  .then(() => console.log('All tickets fix completed'))
  .catch(e => console.error('Script failed:', e)); 