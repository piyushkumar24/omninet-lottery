import { NextRequest, NextResponse } from "next/server";

/**
 * Force Ticket Award Endpoint - DISABLED
 * 
 * This endpoint has been disabled to prevent improper ticket awarding.
 * Tickets should ONLY be awarded through the CPX postback system 
 * for legitimately completed surveys (status=1).
 * 
 * This ensures the integrity of the survey reward system.
 */
export async function POST(request: NextRequest) {
  console.log('🚫 Force ticket award endpoint called but disabled - tickets only awarded for completed surveys');
  
  return new NextResponse(
    JSON.stringify({
      success: false,
      message: "Force ticket awarding is disabled. Tickets are only awarded for completed surveys verified by CPX Research.",
      error: "FORCE_AWARD_DISABLED"
    }),
    { 
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    }
  );
} 