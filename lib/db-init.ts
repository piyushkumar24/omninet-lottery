import { db } from "@/lib/db";
import { initializeDefaultSettings } from "@/lib/settings";

/**
 * Initialize the database with default data and settings
 */
export async function initializeDatabase() {
  try {
    console.log("🔄 Initializing database...");
    
    // Initialize default settings
    await initializeDefaultSettings();
    console.log("✅ Default settings initialized");
    
    // Check if we have at least one admin user
    const adminCount = await db.user.count({
      where: {
        role: "ADMIN"
      }
    });
    
    if (adminCount === 0) {
      console.log("⚠️  No admin users found. Please create an admin user manually.");
    } else {
      console.log(`✅ Found ${adminCount} admin user(s)`);
    }
    
    // Check Settings table
    const settingsCount = await db.settings.count();
    console.log(`✅ Settings table has ${settingsCount} entries`);
    
    console.log("🎉 Database initialization completed successfully!");
    
    return {
      success: true,
      adminCount,
      settingsCount
    };
    
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Reset database to default state (use with caution)
 */
export async function resetDatabaseToDefaults() {
  try {
    console.log("🔄 Resetting database to defaults...");
    
    // Reset all settings to defaults
    await db.settings.deleteMany({});
    await initializeDefaultSettings();
    
    console.log("✅ Database reset completed");
    
    return { success: true };
  } catch (error) {
    console.error("❌ Database reset failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
} 