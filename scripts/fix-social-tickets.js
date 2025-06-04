#!/usr/bin/env node

/**
 * Fix Social Media Tickets Script
 * 
 * This script fixes social media tickets that were marked as used
 * but should be visible on the dashboard.
 * 
 * Usage:
 * node scripts/fix-social-tickets.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSocialTickets() {
  console.log('Starting social media tickets fix...');
  
  try {
    // Find all social media tickets that are marked as used
    const socialTickets = await prisma.ticket.findMany({
      where: {
        source: "SOCIAL",
        isUsed: true
      },
      select: {
        id: true,
        userId: true,
        createdAt: true
      }
    });
    
    console.log(`Found ${socialTickets.length} used social media tickets`);
    
    if (socialTickets.length === 0) {
      console.log('No social media tickets to fix');
      return;
    }
    
    // Fix the tickets by marking them as unused
    const updateResult = await prisma.ticket.updateMany({
      where: {
        source: "SOCIAL",
        isUsed: true
      },
      data: {
        isUsed: false,
        drawId: null
      }
    });
    
    console.log(`Fixed ${updateResult.count} social media tickets`);
    
    // Check if each user has only one social media ticket
    const userCounts = {};
    for (const ticket of socialTickets) {
      userCounts[ticket.userId] = (userCounts[ticket.userId] || 0) + 1;
    }
    
    const usersWithMultipleTickets = Object.entries(userCounts)
      .filter(([_, count]) => count > 1)
      .map(([userId, count]) => ({ userId, count }));
    
    if (usersWithMultipleTickets.length > 0) {
      console.log(`Found ${usersWithMultipleTickets.length} users with multiple social media tickets`);
      
      for (const { userId, count } of usersWithMultipleTickets) {
        console.log(`User ${userId} has ${count} social media tickets`);
        
        // Keep only the most recent ticket for each user
        const userTickets = socialTickets
          .filter(t => t.userId === userId)
          .sort((a, b) => b.createdAt - a.createdAt);
        
        // Delete all but the most recent ticket
        if (userTickets.length > 1) {
          const ticketsToDelete = userTickets.slice(1).map(t => t.id);
          
          const deleteResult = await prisma.ticket.deleteMany({
            where: {
              id: {
                in: ticketsToDelete
              }
            }
          });
          
          console.log(`Deleted ${deleteResult.count} duplicate social media tickets for user ${userId}`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error fixing social media tickets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSocialTickets()
  .then(() => console.log('Social media tickets fix completed'))
  .catch(e => console.error('Script failed:', e)); 