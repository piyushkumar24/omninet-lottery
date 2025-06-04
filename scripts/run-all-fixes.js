#!/usr/bin/env node

/**
 * Run All Fixes Script
 * 
 * This script runs all the lottery ticket system fix scripts in the correct order.
 * 
 * Usage:
 * node scripts/run-all-fixes.js
 */

const { execSync } = require('child_process');
const path = require('path');

// Define the scripts to run in order
const scripts = [
  'fix-winner-tickets.js',
  'fix-social-tickets.js',
  'fix-survey-tickets.js',
  'fix-referral-tickets.js',
  'fix-referral-tickets-display.js',
  'fix-referral-dashboard.js',
  'fix-ticket-flags.js',
  'update-draw-tickets.js',
  'fix-participation-records.js',
  'fix-all-ticket-issues.js'
];

console.log('🚀 Running all lottery ticket system fixes...\n');

// Run each script in sequence
scripts.forEach((script, index) => {
  const scriptPath = path.join(__dirname, script);
  
  console.log(`\n🔧 [${index + 1}/${scripts.length}] Running ${script}...`);
  console.log('='.repeat(80));
  
  try {
    // Run the script and capture its output
    const output = execSync(`node ${scriptPath}`, { encoding: 'utf8' });
    console.log(output);
    console.log(`✅ ${script} completed successfully\n`);
  } catch (error) {
    console.error(`❌ Error running ${script}:`);
    console.error(error.message);
    console.error('\nContinuing with next script...\n');
  }
});

console.log('\n🎉 All fixes completed!');
console.log(`
Summary of fixes:
- Fixed tickets not being properly reset after lottery draws
- Fixed winners still seeing tickets for the next lottery
- Fixed ticket counts in admin pages
- Fixed participation records
- Fixed draw ticket counts
- Ensured new tickets are properly marked as unused
`); 