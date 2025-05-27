#!/usr/bin/env tsx

import { initializeDatabase } from "../lib/db-init";

async function main() {
  console.log("🚀 Starting database initialization...");
  
  const result = await initializeDatabase();
  
  if (result.success) {
    console.log("✅ Database initialization successful!");
    console.log(`📊 Stats: ${result.adminCount} admin(s), ${result.settingsCount} setting(s)`);
    process.exit(0);
  } else {
    console.error("❌ Database initialization failed:", result.error);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error("💥 Unexpected error:", error);
  process.exit(1);
}); 