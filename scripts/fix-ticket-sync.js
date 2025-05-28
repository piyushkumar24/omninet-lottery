/**
 * Ticket Synchronization Repair Script
 * 
 * This script helps diagnose and fix discrepancies between ticket counts in
 * the database and what's shown in the admin panel.
 * 
 * Usage: node scripts/fix-ticket-sync.js [userId]
 * If userId is provided, it will only check that specific user
 * Otherwise, it will check all users with tickets
 */

const { PrismaClient } = require('@prisma/client');
const readline = require('readline');
const prisma = new PrismaClient();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to prompt for input
function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

// Function to scan for discrepancies for a specific user
async function checkUserTickets(userId) {
  console.log(`\nChecking tickets for user ${userId}...`);
  
  // Get all tickets for this user
  const tickets = await prisma.ticket.findMany({
    where: { userId },
    select: {
      id: true,
      source: true,
      isUsed: true,
      drawId: true,
      createdAt: true
    }
  });
  
  // Get all draw participations for this user
  const participations = await prisma.drawParticipation.findMany({
    where: { userId },
    include: {
      draw: {
        select: {
          status: true,
          drawDate: true
        }
      }
    }
  });
  
  // Count tickets by draw
  const ticketsByDraw = tickets.reduce((acc, ticket) => {
    if (ticket.drawId) {
      acc[ticket.drawId] = (acc[ticket.drawId] || 0) + 1;
    }
    return acc;
  }, {});
  
  // Count tickets in participation records
  const participationCount = participations.reduce((sum, p) => sum + p.ticketsUsed, 0);
  
  // Calculate discrepancy
  const totalTickets = tickets.length;
  const hasDiscrepancy = totalTickets !== participationCount;
  
  console.log(`Total tickets in database: ${totalTickets}`);
  console.log(`Total tickets in participations: ${participationCount}`);
  
  if (hasDiscrepancy) {
    console.log(`\n⚠️ DISCREPANCY DETECTED: Database shows ${totalTickets} tickets, but participations show ${participationCount}`);
    
    // Check for specific issues
    const unusedTickets = tickets.filter(t => !t.isUsed);
    if (unusedTickets.length > 0) {
      console.log(`- Found ${unusedTickets.length} unused tickets that aren't applied to any draw`);
    }
    
    // Check for tickets without a draw
    const ticketsWithoutDraw = tickets.filter(t => !t.drawId);
    if (ticketsWithoutDraw.length > 0) {
      console.log(`- Found ${ticketsWithoutDraw.length} tickets not assigned to any draw`);
    }
    
    // Check for participations without matching tickets
    for (const participation of participations) {
      const actualTickets = ticketsByDraw[participation.drawId] || 0;
      if (participation.ticketsUsed !== actualTickets) {
        console.log(`- Participation in draw ${participation.drawId} shows ${participation.ticketsUsed} tickets, but found ${actualTickets} actual tickets`);
      }
    }
    
    // Check for draw IDs in tickets that don't have participations
    for (const [drawId, count] of Object.entries(ticketsByDraw)) {
      const participation = participations.find(p => p.drawId === drawId);
      if (!participation) {
        console.log(`- Found ${count} tickets for draw ${drawId} but no participation record`);
      }
    }
    
    return {
      userId,
      totalTickets,
      participationCount,
      hasDiscrepancy: true,
      ticketsByDraw,
      participations,
      unusedTickets: unusedTickets.length,
      ticketsWithoutDraw: ticketsWithoutDraw.length
    };
  } else {
    console.log('✅ No discrepancy found for this user');
    return {
      userId,
      totalTickets,
      participationCount,
      hasDiscrepancy: false
    };
  }
}

// Function to fix discrepancies for a user
async function fixUserTickets(userId, report) {
  console.log(`\nFixing tickets for user ${userId}...`);
  
  // Get the current active draw
  const currentDraw = await prisma.draw.findFirst({
    where: { status: 'PENDING' },
    orderBy: { drawDate: 'asc' }
  });
  
  if (!currentDraw) {
    console.log('❌ No active draw found, cannot fix tickets');
    return;
  }
  
  // Get all tickets
  const tickets = await prisma.ticket.findMany({
    where: { userId },
    select: {
      id: true,
      isUsed: true,
      drawId: true
    }
  });
  
  // Get all participations
  const participations = await prisma.draw.findMany({
    where: { 
      drawParticipation: {
        some: { userId }
      }
    },
    select: {
      id: true,
      status: true,
      drawParticipation: {
        where: { userId },
        select: {
          id: true,
          ticketsUsed: true
        }
      }
    }
  });
  
  // Fix unused tickets
  if (report.unusedTickets > 0) {
    console.log(`- Fixing ${report.unusedTickets} unused tickets...`);
    
    // Find unused tickets
    const unusedTickets = tickets.filter(t => !t.isUsed);
    
    // Apply them to the current draw
    await prisma.ticket.updateMany({
      where: {
        id: {
          in: unusedTickets.map(t => t.id)
        }
      },
      data: {
        isUsed: true,
        drawId: currentDraw.id
      }
    });
    
    console.log(`  Applied ${unusedTickets.length} unused tickets to current draw`);
  }
  
  // Fix tickets without draw
  if (report.ticketsWithoutDraw > 0) {
    console.log(`- Fixing ${report.ticketsWithoutDraw} tickets without draw...`);
    
    // Find tickets without draw
    const ticketsWithoutDraw = tickets.filter(t => !t.drawId);
    
    // Apply them to the current draw
    await prisma.ticket.updateMany({
      where: {
        id: {
          in: ticketsWithoutDraw.map(t => t.id)
        }
      },
      data: {
        drawId: currentDraw.id
      }
    });
    
    console.log(`  Assigned ${ticketsWithoutDraw.length} tickets to current draw`);
  }
  
  // Fix participation records
  console.log(`- Updating participation records...`);
  
  // Count tickets by draw again after fixes
  const updatedTickets = await prisma.ticket.findMany({
    where: { userId },
    select: {
      id: true,
      drawId: true
    }
  });
  
  const updatedTicketsByDraw = updatedTickets.reduce((acc, ticket) => {
    if (ticket.drawId) {
      acc[ticket.drawId] = (acc[ticket.drawId] || 0) + 1;
    }
    return acc;
  }, {});
  
  // Update each participation to match actual ticket count
  for (const draw of participations) {
    const participation = draw.drawParticipation[0];
    const actualTickets = updatedTicketsByDraw[draw.id] || 0;
    
    if (participation && participation.ticketsUsed !== actualTickets) {
      // Update participation to match actual tickets
      await prisma.drawParticipation.update({
        where: { id: participation.id },
        data: { ticketsUsed: actualTickets }
      });
      
      console.log(`  Updated participation in draw ${draw.id} from ${participation.ticketsUsed} to ${actualTickets} tickets`);
    } else if (!participation && actualTickets > 0) {
      // Create missing participation
      await prisma.drawParticipation.create({
        data: {
          userId,
          drawId: draw.id,
          ticketsUsed: actualTickets
        }
      });
      
      console.log(`  Created participation in draw ${draw.id} with ${actualTickets} tickets`);
    }
  }
  
  // Create missing participations for draws with tickets
  for (const [drawId, ticketCount] of Object.entries(updatedTicketsByDraw)) {
    const draw = participations.find(d => d.id === drawId);
    
    if (!draw && ticketCount > 0) {
      // Create missing participation
      await prisma.drawParticipation.create({
        data: {
          userId,
          drawId,
          ticketsUsed: ticketCount
        }
      });
      
      console.log(`  Created missing participation for draw ${drawId} with ${ticketCount} tickets`);
    }
  }
  
  // Check final counts
  const finalCheck = await checkUserTickets(userId);
  
  if (finalCheck.hasDiscrepancy) {
    console.log('❌ Failed to fix all discrepancies');
  } else {
    console.log('✅ All discrepancies fixed successfully');
  }
  
  return finalCheck;
}

// Function to scan all users for discrepancies
async function scanAllUsers() {
  console.log('\nScanning all users for ticket discrepancies...');
  
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
      _count: {
        select: {
          tickets: true
        }
      }
    },
    orderBy: {
      tickets: {
        _count: 'desc'
      }
    }
  });
  
  console.log(`Found ${usersWithTickets.length} users with tickets`);
  
  // Check each user
  const discrepancies = [];
  
  for (const user of usersWithTickets) {
    const report = await checkUserTickets(user.id);
    
    if (report.hasDiscrepancy) {
      discrepancies.push({
        ...report,
        name: user.name,
        email: user.email
      });
    }
  }
  
  console.log(`\nFound ${discrepancies.length} users with discrepancies`);
  
  return discrepancies;
}

// Main function
async function main() {
  try {
    console.log('=== Ticket Synchronization Repair Tool ===');
    console.log('This tool helps fix discrepancies between ticket counts in the database and admin panel.');
    
    // Check if user ID was provided as command line argument
    const specifiedUserId = process.argv[2];
    
    if (specifiedUserId) {
      // Check specific user
      console.log(`Checking specific user: ${specifiedUserId}`);
      const report = await checkUserTickets(specifiedUserId);
      
      if (report.hasDiscrepancy) {
        const shouldFix = await question('\nWould you like to fix these discrepancies? (y/n): ');
        
        if (shouldFix.toLowerCase() === 'y') {
          await fixUserTickets(specifiedUserId, report);
        }
      }
    } else {
      // Interactive mode
      console.log('\n=== Options ===');
      console.log('1. Check a specific user');
      console.log('2. Scan all users for discrepancies');
      console.log('3. Fix all discrepancies');
      
      const option = await question('\nSelect an option (1-3): ');
      
      switch (option) {
        case '1':
          const userId = await question('Enter user ID: ');
          const report = await checkUserTickets(userId);
          
          if (report.hasDiscrepancy) {
            const shouldFix = await question('\nWould you like to fix these discrepancies? (y/n): ');
            
            if (shouldFix.toLowerCase() === 'y') {
              await fixUserTickets(userId, report);
            }
          }
          break;
          
        case '2':
          const discrepancies = await scanAllUsers();
          
          if (discrepancies.length > 0) {
            console.log('\nUsers with discrepancies:');
            
            discrepancies.forEach((d, i) => {
              console.log(`${i + 1}. ${d.name || d.email || d.userId} - DB: ${d.totalTickets}, Admin: ${d.participationCount}`);
            });
            
            const shouldFix = await question('\nWould you like to fix all discrepancies? (y/n): ');
            
            if (shouldFix.toLowerCase() === 'y') {
              for (const d of discrepancies) {
                await fixUserTickets(d.userId, d);
              }
            }
          }
          break;
          
        case '3':
          const allDiscrepancies = await scanAllUsers();
          
          if (allDiscrepancies.length > 0) {
            console.log(`\nFixing discrepancies for ${allDiscrepancies.length} users...`);
            
            for (const d of allDiscrepancies) {
              await fixUserTickets(d.userId, d);
            }
            
            console.log('\nAll discrepancies have been fixed.');
          } else {
            console.log('\nNo discrepancies found.');
          }
          break;
          
        default:
          console.log('Invalid option selected');
      }
    }
    
    rl.close();
  } catch (error) {
    console.error('Error:', error);
    rl.close();
  }
}

// Run the main function
main().finally(async () => {
  await prisma.$disconnect();
}); 