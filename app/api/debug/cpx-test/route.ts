import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateCPXSecureHash } from "@/lib/cpx-utils";
import { db } from "@/lib/db";

/**
 * Enhanced CPX Debug Test Endpoint
 * 
 * This endpoint helps debug CPX Research integration issues by:
 * 1. Testing postback functionality
 * 2. Checking user account status
 * 3. Verifying transaction history
 * 4. Testing email delivery
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: "Not authenticated"
      }, { status: 401 });
    }

    const baseUrl = new URL(request.url).origin;
    const userId = user.id;
    const expectedHash = generateCPXSecureHash(userId);
    
    // Check for specific user ID from query params (for admin debugging)
    const debugUserId = new URL(request.url).searchParams.get('userId');
    const targetUserId = debugUserId || userId;
    
    // Get user details
    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true,
        availableTickets: true,
        totalTicketsEarned: true,
        isBlocked: true,
        referredBy: true,
        socialMediaFollowed: true,
        createdAt: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({
        success: false,
        error: `User not found: ${targetUserId}`,
        debug_info: {
          requested_user_id: targetUserId,
          current_user_id: userId,
        }
      }, { status: 404 });
    }

    // Get recent CPX transactions for this user
    const recentTransactions = await db.settings.findMany({
      where: {
        OR: [
          {
            key: {
              startsWith: `cpx_transaction_`,
            },
            value: {
              contains: targetUserId,
            },
          },
          {
            key: {
              startsWith: `cpx_error_`,
            },
            value: {
              contains: targetUserId,
            },
          },
          {
            key: {
              startsWith: `cpx_critical_error_`,
            },
            value: {
              contains: targetUserId,
            },
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // Get user's recent tickets
    const recentTickets = await db.ticket.findMany({
      where: {
        userId: targetUserId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      select: {
        id: true,
        source: true,
        isUsed: true,
        drawId: true,
        confirmationCode: true,
        createdAt: true,
      },
    });

    // Get current draw participation
    const currentDraw = await db.draw.findFirst({
      where: {
        status: 'PENDING',
      },
      orderBy: {
        drawDate: 'asc',
      },
    });

    let participation = null;
    if (currentDraw) {
      participation = await db.drawParticipation.findUnique({
        where: {
          userId_drawId: {
            userId: targetUserId,
            drawId: currentDraw.id,
          },
        },
      });
    }

    // Parse transaction data
    const parsedTransactions = recentTransactions.map(tx => {
      try {
        const data = JSON.parse(tx.value);
        return {
          key: tx.key,
          type: tx.key.includes('error') ? 'ERROR' : 'SUCCESS',
          data,
          createdAt: tx.createdAt,
          description: tx.description,
        };
      } catch (e) {
        return {
          key: tx.key,
          type: 'PARSE_ERROR',
          data: tx.value,
          createdAt: tx.createdAt,
          description: tx.description,
        };
      }
    });

    // Generate test URLs for debugging
    const testTransId = `debug_test_${Date.now()}`;
    const testHash = generateCPXSecureHash(targetUserId);
    
    const testUrls = {
      completed_survey: `${baseUrl}/api/cpx-postback?` + new URLSearchParams({
        status: '1',
        trans_id: testTransId,
        user_id: targetUserId,
        hash: testHash,
        amount_usd: '0.50',
        currency_name: 'USD',
        currency_amount: '0.50',
        ip_click: '127.0.0.1',
        test_mode: '1'
      }).toString(),
      
      incomplete_survey: `${baseUrl}/api/cpx-postback?` + new URLSearchParams({
        status: '0',
        trans_id: `${testTransId}_incomplete`,
        user_id: targetUserId,
        hash: generateCPXSecureHash(targetUserId),
        amount_usd: '0.25',
        currency_name: 'USD',
        currency_amount: '0.25',
        ip_click: '127.0.0.1',
        test_mode: '1'
      }).toString(),
    };

    return NextResponse.json({
      success: true,
      debug_info: {
        timestamp: new Date().toISOString(),
        tested_user: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          availableTickets: targetUser.availableTickets,
          totalTicketsEarned: targetUser.totalTicketsEarned,
          isBlocked: targetUser.isBlocked,
          referredBy: targetUser.referredBy,
          socialMediaFollowed: targetUser.socialMediaFollowed,
          accountCreated: targetUser.createdAt,
        },
        current_draw: currentDraw ? {
          id: currentDraw.id,
          drawDate: currentDraw.drawDate,
          status: currentDraw.status,
          totalTickets: currentDraw.totalTickets,
        } : null,
        user_participation: participation ? {
          ticketsUsed: participation.ticketsUsed,
          createdAt: participation.createdAt,
          updatedAt: participation.updatedAt,
        } : null,
        recent_tickets: recentTickets,
        recent_cpx_transactions: parsedTransactions,
        cpx_integration: {
          user_id: targetUserId,
          expected_hash: `***${testHash.slice(-8)}`,
          hash_input: `${targetUserId}-[SECURE_KEY]`,
          postback_endpoint: `${baseUrl}/api/cpx-postback`,
        },
        test_urls: testUrls,
      },
      system_health: {
        database_connection: "OK",
        postback_endpoint: `${baseUrl}/api/cpx-postback`,
        hash_generation: "OK",
        user_lookup: targetUser ? "OK" : "FAILED",
      },
      troubleshooting: {
        common_issues: [
          "CPX Research not configured with correct postback URL",
          "Hash validation failing (check SECURE_HASH_KEY)",
          "User completing surveys but postback not received",
          "Surveys showing as 'no surveys available'",
          "Modal closing before completion detection",
          "Email delivery failing",
          "Database transaction timeouts",
          "User account blocked or not found",
        ],
        checklist: [
          `✅ Postback URL: ${baseUrl}/api/cpx-postback`,
          "✅ Security hash validation enabled",
          "✅ Status parameter required (1=completed, 0=incomplete)",
          "✅ Transaction ID parameter required",
          "✅ User ID parameter required",
          `${targetUser ? '✅' : '❌'} User exists in database`,
          `${targetUser && !targetUser.isBlocked ? '✅' : '❌'} User account active`,
          `${targetUser && targetUser.email ? '✅' : '❌'} User email configured`,
        ],
        next_steps: [
          "1. Test the postback URLs above to simulate survey completion",
          "2. Check server logs for detailed error messages",
          "3. Verify CPX Research dashboard shows completed surveys",
          "4. Confirm postback URL in CPX Research settings",
          "5. Check email delivery status and spam folders",
        ],
      }
    });
    
  } catch (error) {
    console.error('CPX debug test error:', error);
    
    return NextResponse.json({
      success: false,
      error: "Debug test failed",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

/**
 * Test CPX postback manually with enhanced logging
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: "Not authenticated"
      }, { status: 401 });
    }

    const body = await request.json();
    const { userId: targetUserId, testType = 'completed' } = body;
    
    const baseUrl = new URL(request.url).origin;
    const userId = targetUserId || user.id;
    const transId = `manual_test_${Date.now()}`;
    const expectedHash = generateCPXSecureHash(userId);
    
    console.log('🧪 Manual CPX postback test initiated:', {
      userId,
      testType,
      transId,
      initiatedBy: user.id,
    });
    
    // Simulate the postback call
    const testPostbackUrl = `${baseUrl}/api/cpx-postback?` + new URLSearchParams({
      status: testType === 'completed' ? '1' : '0',
      trans_id: transId,
      user_id: userId,
      hash: expectedHash,
      amount_usd: '0.50',
      currency_name: 'USD',
      currency_amount: '0.50',
      ip_click: '127.0.0.1',
      test_mode: '1'
    }).toString();

    // Get user state before test
    const userBefore = await db.user.findUnique({
      where: { id: userId },
      select: {
        availableTickets: true,
        totalTicketsEarned: true,
      },
    });

    // Make the request to our own postback endpoint
    const response = await fetch(testPostbackUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'CPX-Research-Test/1.0'
      }
    });

    const responseText = await response.text();

    // Get user state after test
    const userAfter = await db.user.findUnique({
      where: { id: userId },
      select: {
        availableTickets: true,
        totalTicketsEarned: true,
      },
    });

    // Check for transaction record
    const transactionRecord = await db.settings.findUnique({
      where: { key: `cpx_transaction_${transId}` },
    });

    const ticketChange = {
      availableTickets: (userAfter?.availableTickets || 0) - (userBefore?.availableTickets || 0),
      totalTicketsEarned: (userAfter?.totalTicketsEarned || 0) - (userBefore?.totalTicketsEarned || 0),
    };

    return NextResponse.json({
      success: response.ok,
      test_results: {
        url: testPostbackUrl,
        status: response.status,
        statusText: response.statusText,
        response: responseText,
        transactionId: transId,
        testType,
        userId,
      },
      user_state: {
        before: userBefore,
        after: userAfter,
        changes: ticketChange,
      },
      transaction_logged: !!transactionRecord,
      transaction_data: transactionRecord ? JSON.parse(transactionRecord.value) : null,
      message: response.ok 
        ? `✅ Postback test successful! ${ticketChange.availableTickets > 0 ? `Tickets awarded: ${ticketChange.availableTickets}` : 'No tickets awarded (expected for incomplete surveys)'}` 
        : "❌ Postback test failed. Check server logs for details."
    });
    
  } catch (error) {
    console.error('Manual CPX test error:', error);
    
    return NextResponse.json({
      success: false,
      error: "Manual test failed",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 