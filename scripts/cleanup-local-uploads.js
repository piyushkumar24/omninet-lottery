#!/usr/bin/env node

/**
 * Cleanup Local Uploads Script
 * 
 * This script removes all local uploads from the public/uploads directory
 * to ensure that only Cloudflare R2 storage is used for profile pictures.
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma client
const prisma = new PrismaClient();

// Path to local uploads directory
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

async function cleanup() {
  console.log('Starting cleanup of local uploads...');
  
  // Check if uploads directory exists
  if (!fs.existsSync(uploadsDir)) {
    console.log('✓ No local uploads directory found.');
    return;
  }

  try {
    // Get all files in the uploads directory
    const files = fs.readdirSync(uploadsDir);
    console.log(`Found ${files.length} files in the uploads directory.`);

    // Count how many files are deleted
    let deletedCount = 0;

    // Delete each file
    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      
      // Check if it's a file (not a directory)
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }

    console.log(`✓ Deleted ${deletedCount} local upload files.`);

    // Find all users with local profile images
    const users = await prisma.user.findMany({
      where: {
        profileImage: {
          startsWith: '/uploads/'
        }
      },
      select: {
        id: true,
        profileImage: true
      }
    });

    console.log(`Found ${users.length} users with local profile images.`);
    console.log('NOTE: These users will need to upload new profile pictures to R2.');
    
    // For each user with a local profile image, reset it to null
    for (const user of users) {
      await prisma.user.update({
        where: { id: user.id },
        data: { profileImage: null }
      });
    }

    console.log(`✓ Reset profile images for ${users.length} users.`);
    console.log('✓ Cleanup complete! All local uploads have been removed.');
    console.log('Now all profile images will be stored in Cloudflare R2 exclusively.');
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanup(); 