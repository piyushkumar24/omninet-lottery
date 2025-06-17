import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateCPXSecureHash, generateCPXSurveyURL } from "@/lib/cpx-utils";
import { db } from "@/lib/db";

/**
 * CPX Debug Test Endpoint
 * 
 * This endpoint helps debug CPX Research integration issues
 * by providing comprehensive test information and diagnostics.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: "Not authenticated",
        message: "Please log in to run CPX tests"
      }, { status: 401 });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return NextResponse.json({
        success: false,
        error: "User blocked",
        message: "User account is blocked"
      }, { status: 403 });
    }

    const baseUrl = new URL(request.url).origin;
    const userId = user.id;
    const transId = `debug_test_${Date.now()}`;
    
    // Generate CPX URLs and hashes
    const surveyUrl = generateCPXSurveyURL(user);
    const expectedHash = generateCPXSecureHash(userId);
    
    // Generate test postback URL
    const testPostbackUrl = `${baseUrl}/api/cpx-postback?` + new URLSearchParams({
      status: '1',
      trans_id: transId,
      user_id: userId,
      hash: expectedHash,
      amount_usd: '0.50',
      currency_name: 'USD',
      currency_amount: '0.50',
      ip_click: '127.0.0.1',
      test_mode: '1'
    }).toString();

    // Check user's current ticket status
    const userTickets = await db.user.findUnique({
      where: { id: userId },
      select: {
        availableTickets: true,
        totalTicketsEarned: true,
        _count: {
          select: {
            tickets: {
              where: { source: 'SURVEY' }
            }
          }
        }
      }
    });

    // Check recent CPX transactions
    const recentTransactions = await db.settings.findMany({
      where: {
        key: {
          startsWith: 'cpx_'
        },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    // Check for any errors
    const recentErrors = await db.settings.findMany({
      where: {
        key: {
          startsWith: 'cpx_error_'
        },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 3
    });

    return NextResponse.json({
      success: true,
      debug_info: {
        user: {
          id: userId,
          name: user.name,
          email: user.email,
          isBlocked: user.isBlocked,
          currentTickets: userTickets?.availableTickets || 0,
          totalEarned: userTickets?.totalTicketsEarned || 0,
          surveyTickets: userTickets?._count.tickets || 0
        },
        urls: {
          baseUrl,
          surveyUrl,
          postbackEndpoint: `${baseUrl}/api/cpx-postback`
        },
        security: {
          expectedHash,
          hashAlgorithm: 'MD5',
          hashInput: `${userId}-[SECURE_HASH_KEY]`
        },
        test: {
          transactionId: transId,
          testPostbackUrl,
          manualTestCommand: `curl "${testPostbackUrl}"`
        },
        recent_activity: {
          transactions: recentTransactions.map(t => ({
            key: t.key,
            description: t.description,
            createdAt: t.createdAt,
            data: JSON.parse(t.value)
          })),
          errors: recentErrors.map(e => ({
            key: e.key,
            description: e.description,
            createdAt: e.createdAt,
            error: JSON.parse(e.value)
          }))
        }
      },
      troubleshooting: {
        common_issues: [
          "CPX Research not configured with correct postback URL",
          "Hash validation failing (check SECURE_HASH_KEY)",
          "User completing surveys but postback not received",
          "Surveys showing as 'no surveys available'",
          "Modal closing before completion detection"
        ],
        checklist: [
          `✅ Postback URL: ${baseUrl}/api/cpx-postback`,
          "✅ Security hash validation enabled",
          "✅ Status parameter required (1=completed, 0=incomplete)",
          "✅ Transaction ID parameter required",
          "✅ User ID parameter required"
        ]
      }
    });
    
  } catch (error) {
    console.error('CPX debug test error:', error);
    
    return NextResponse.json({
      success: false,
      error: "Debug test failed",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * Test CPX postback manually
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

    const baseUrl = new URL(request.url).origin;
    const userId = user.id;
    const transId = `manual_test_${Date.now()}`;
    const expectedHash = generateCPXSecureHash(userId);
    
    // Simulate the postback call
    const testPostbackUrl = `${baseUrl}/api/cpx-postback?` + new URLSearchParams({
      status: '1',
      trans_id: transId,
      user_id: userId,
      hash: expectedHash,
      amount_usd: '0.50',
      currency_name: 'USD',
      currency_amount: '0.50',
      ip_click: '127.0.0.1',
      test_mode: '1'
    }).toString();

    // Make the request to our own postback endpoint
    const response = await fetch(testPostbackUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'CPX-Research-Test/1.0'
      }
    });

    const responseText = await response.text();

    return NextResponse.json({
      success: response.ok,
      postback_test: {
        url: testPostbackUrl,
        status: response.status,
        statusText: response.statusText,
        response: responseText,
        transactionId: transId
      },
      message: response.ok 
        ? "✅ Postback test successful! Check your dashboard for the new ticket."
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