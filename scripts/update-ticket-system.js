// Update User Ticket System
// This script updates all users to use the new ticket system with availableTickets and totalTicketsEarned
// Run with: node scripts/update-ticket-system.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateTicketSystem() {
  console.log('🎫 Starting Ticket System Update...');
  
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      }
    });
    
    console.log(`Found ${users.length} users to process`);
    
    // Process each user
    for (const user of users) {
      console.log(`Processing user: ${user.name || user.email || user.id}`);
      
      // Count total tickets earned
      const totalTickets = await prisma.ticket.count({
        where: {
          userId: user.id,
        }
      });
      
      // Get the most recent completed draw
      const mostRecentDraw = await prisma.draw.findFirst({
        where: {
          status: 'COMPLETED',
        },
        orderBy: {
          drawDate: 'desc',
        }
      });
      
      // Count available tickets (tickets created after the most recent draw)
      const availableTickets = mostRecentDraw 
        ? await prisma.ticket.count({
            where: {
              userId: user.id,
              isUsed: false,
              createdAt: {
                gt: mostRecentDraw.drawDate,
              },
            }
          })
        : await prisma.ticket.count({
            where: {
              userId: user.id,
              isUsed: false,
            }
          });
      
      // Update user with ticket counts
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          availableTickets,
          totalTicketsEarned: totalTickets,
        }
      });
      
      console.log(`✅ Updated user ${user.id}: Total tickets: ${totalTickets}, Available tickets: ${availableTickets}`);
    }
    
    console.log('✅ Ticket system update completed successfully!');
  } catch (error) {
    console.error('❌ Error updating ticket system:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateTicketSystem()
  .then(() => console.log('Script execution completed'))
  .catch(error => {
    console.error('Error executing script:', error);
    process.exit(1);
  }); 