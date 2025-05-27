"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Update the user's hasWon status
 * Used when a user dismisses the winner banner
 */
export async function updateWinnerStatus(isDismissed: boolean) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { error: "User not authenticated" };
    }
    
    // Update user's hasWon status
    await db.user.update({
      where: { id: user.id },
      data: { 
        hasWon: !isDismissed,
      }
    });

    // Revalidate the dashboard path to reflect the changes
    revalidatePath("/dashboard");
    
    return { success: true };
  } catch (error) {
    console.error("Error updating winner status:", error);
    return { error: "Failed to update status" };
  }
} 