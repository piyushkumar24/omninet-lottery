import { NextRequest, NextResponse } from "next/server";
import { generateCPXSecureHash } from "@/lib/cpx-utils";

/**
 * CPX Research Test Endpoint
 * 
 * This endpoint provides a way to test CPX Research postback functionality
 * without actually creating tickets in the database.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Extract user_id parameter
  const userId = searchParams.get('user_id');
  
  if (!userId) {
    return new NextResponse(JSON.stringify({
      success: false,
      message: "Missing user_id parameter",
      example: "/api/cpx-test?user_id=user_123"
    }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Generate the expected hash for this user
  const expectedHash = generateCPXSecureHash(userId);
  
  // Generate the correct postback URL
  const baseUrl = new URL(request.url).origin;
  const postbackUrl = `${baseUrl}/api/cpx-postback?status=1&trans_id=test_${Date.now()}&user_id=${userId}&hash=${expectedHash}&test_mode=1`;
  
  // Return information about how to test the postback
  return new NextResponse(JSON.stringify({
    success: true,
    message: "CPX Test Information",
    user_id: userId,
    expected_hash: expectedHash,
    test_commands: {
      curl: `curl "${postbackUrl}"`,
      fetch: `fetch("${postbackUrl}").then(r => r.json()).then(console.log)`,
    },
    postback_url: postbackUrl
  }), { 
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
} 