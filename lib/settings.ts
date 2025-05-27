import { db } from "@/lib/db";

/**
 * Get a setting value by key
 */
export async function getSetting(key: string, defaultValue?: string): Promise<string | null> {
  try {
    const setting = await db.settings.findUnique({
      where: { key }
    });
    
    return setting?.value || defaultValue || null;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return defaultValue || null;
  }
}

/**
 * Set a setting value
 */
export async function setSetting(key: string, value: string, description?: string): Promise<boolean> {
  try {
    await db.settings.upsert({
      where: { key },
      update: {
        value,
        description,
        updatedAt: new Date(),
      },
      create: {
        key,
        value,
        description,
      },
    });
    
    return true;
  } catch (error) {
    console.error(`Error setting ${key}:`, error);
    return false;
  }
}

/**
 * Get the current prize amount (default: 50)
 */
export async function getPrizeAmount(): Promise<number> {
  const amount = await getSetting("default_prize_amount", "50");
  return parseFloat(amount || "50");
}

/**
 * Set the prize amount
 */
export async function setPrizeAmount(amount: number): Promise<boolean> {
  return await setSetting(
    "default_prize_amount", 
    amount.toString(), 
    "Default prize amount for weekly lottery draws"
  );
}

/**
 * Initialize default settings if they don't exist
 */
export async function initializeDefaultSettings(): Promise<void> {
  try {
    // Initialize default prize amount if it doesn't exist
    const existingPrizeAmount = await getSetting("default_prize_amount");
    if (!existingPrizeAmount) {
      await setPrizeAmount(50);
    }
    
    // Add other default settings here as needed
    
  } catch (error) {
    console.error("Error initializing default settings:", error);
  }
} 