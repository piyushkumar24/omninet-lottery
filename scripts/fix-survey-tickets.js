#!/usr/bin/env node

/**
 * Fix Survey Tickets Script
 * 
 * This script fixes survey tickets that were marked as used
 * but should be visible on the dashboard.
 * 
 * Usage:
 * node scripts/fix-survey-tickets.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSurveyTickets() {
  console.log('Starting survey tickets fix...');
  
  try {
    // Find all survey tickets that are marked as used
    const surveyTickets = await prisma.ticket.findMany({
      where: {
        source: "SURVEY",
        isUsed: true
      },
      select: {
        id: true,
        userId: true,
        createdAt: true
      }
    });
    
    console.log(`Found ${surveyTickets.length} used survey tickets`);
    
    if (surveyTickets.length === 0) {
      console.log('No survey tickets to fix');
      return;
    }
    
    // Fix the tickets by marking them as unused
    const updateResult = await prisma.ticket.updateMany({
      where: {
        source: "SURVEY",
        isUsed: true
      },
      data: {
        isUsed: false,
        drawId: null
      }
    });
    
    console.log(`Fixed ${updateResult.count} survey tickets`);
    
    // Get all users with survey tickets
    const userIds = [...new Set(surveyTickets.map(ticket => ticket.userId))];
    console.log(`Found ${userIds.length} users with survey tickets`);
    
  } catch (error) {
    console.error('Error fixing survey tickets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSurveyTickets()
  .then(() => console.log('Survey tickets fix completed'))
  .catch(e => console.error('Script failed:', e)); 