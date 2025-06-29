import { NextRequest, NextResponse } from "next/server";
import { generateCPXSecureHash } from "@/lib/cpx-utils";

/**
 * Quick CPX Integration Test Endpoint
 * 
 * This endpoint provides a simple way to test CPX postback functionality
 * and verify that the survey completion system is working correctly.
 * 
 * Usage:
 * GET  /api/cpx-test?userId=USER_ID - Test hash generation and create test URLs
 * POST /api/cpx-test - Execute a real postback test
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const baseUrl = `${url.protocol}//${url.host}`;
    
    if (!userId) {
      return NextResponse.json({
        error: "Missing userId parameter",
        usage: "GET /api/cpx-test?userId=USER_ID",
        example: "GET /api/cpx-test?userId=cmb7u4roc00001nfjedl268pr"
      }, { status: 400 });
    }

    // Generate test data
    const testTransId = `quick_test_${Date.now()}`;
    const expectedHash = generateCPXSecureHash(userId);
    
    console.log('🧪 CPX Quick Test for user:', userId);
    console.log('📋 Generated hash:', expectedHash);
    
    // Create test postback URLs
    const testUrls = {
      completed_survey: `${baseUrl}/api/cpx-postback?` + new URLSearchParams({
        status: '1', // Completed
        trans_id: testTransId,
        user_id: userId,
        hash: expectedHash,
        amount_usd: '0.50',
        currency_name: 'USD',
        currency_amount: '0.50',
        ip_click: '127.0.0.1',
        test_mode: '1'
      }).toString(),
      
      incomplete_survey: `${baseUrl}/api/cpx-postback?` + new URLSearchParams({
        status: '0', // Incomplete/DQ
        trans_id: `${testTransId}_inc`,
        user_id: userId,
        hash: generateCPXSecureHash(userId),
        amount_usd: '0.25',
        currency_name: 'USD',
        currency_amount: '0.25',
        ip_click: '127.0.0.1',
        test_mode: '1'
      }).toString()
    };

    return NextResponse.json({
      success: true,
      message: "CPX test URLs generated successfully",
      test_info: {
        user_id: userId,
        transaction_id: testTransId,
        expected_hash: expectedHash,
        hash_input: `${userId}-[SECURE_KEY]`,
        postback_endpoint: `${baseUrl}/api/cpx-postback`,
      },
      test_urls: testUrls,
      manual_tests: {
        curl_completed: `curl "${testUrls.completed_survey}"`,
        curl_incomplete: `curl "${testUrls.incomplete_survey}"`,
      },
      instructions: [
        "1. Copy one of the test URLs above",
        "2. Paste it in your browser or use curl command",
        "3. Check the response - should be 'OK' for completed surveys",
        "4. For completed surveys (status=1), tickets should be awarded",
        "5. For incomplete surveys (status=0), no tickets should be awarded",
        "6. Check server logs for detailed processing information",
        "7. Verify user dashboard shows new tickets (for completed surveys only)"
      ],
      expected_results: {
        completed_survey: {
          response: "OK",
          tickets_awarded: 1,
          email_sent: true,
          user_notified: true
        },
        incomplete_survey: {
          response: "Survey not completed - no ticket awarded",
          tickets_awarded: 0,
          email_sent: false,
          user_notified: false
        }
      }
    });
    
  } catch (error) {
    console.error('CPX test error:', error);
    
    return NextResponse.json({
      success: false,
      error: "Test failed",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * Execute automated CPX postback test
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, testType = 'completed' } = body;
    
    if (!userId) {
      return NextResponse.json({
        error: "Missing userId in request body",
        usage: "POST /api/cpx-test with body: { \"userId\": \"USER_ID\", \"testType\": \"completed\" }"
      }, { status: 400 });
    }

    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const testTransId = `auto_test_${Date.now()}`;
    const expectedHash = generateCPXSecureHash(userId);
    
    console.log('🧪 Automated CPX postback test starting:', {
      userId,
      testType,
      testTransId,
      timestamp: new Date().toISOString()
    });

    // Create test postback URL
    const postbackUrl = `${baseUrl}/api/cpx-postback?` + new URLSearchParams({
      status: testType === 'completed' ? '1' : '0',
      trans_id: testTransId,
      user_id: userId,
      hash: expectedHash,
      amount_usd: '0.50',
      currency_name: 'USD',
      currency_amount: '0.50',
      ip_click: '127.0.0.1',
      test_mode: '1'
    }).toString();

    console.log('📡 Calling postback URL:', postbackUrl);

    // Make the postback request
    const response = await fetch(postbackUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'CPX-Research-Auto-Test/1.0'
      }
    });

    const responseText = await response.text();

    console.log('📥 Postback response:', {
      status: response.status,
      statusText: response.statusText,
      body: responseText
    });

    // Check if test was successful
    const isSuccess = response.ok;
    const shouldAwardTickets = testType === 'completed';
    const expectedResponse = shouldAwardTickets ? 'OK' : 'Survey not completed - no ticket awarded';

    return NextResponse.json({
      success: isSuccess,
      test_results: {
        test_type: testType,
        user_id: userId,
        transaction_id: testTransId,
        postback_url: postbackUrl,
        response_status: response.status,
        response_text: responseText,
        expected_response: expectedResponse,
        test_passed: isSuccess && (shouldAwardTickets ? responseText === 'OK' : responseText.includes('not completed')),
      },
      summary: {
        tickets_should_be_awarded: shouldAwardTickets,
        postback_successful: isSuccess,
        response_correct: responseText === expectedResponse || responseText.includes(expectedResponse),
      },
      next_steps: isSuccess ? [
        "✅ Postback processed successfully",
        shouldAwardTickets ? "✅ Check user dashboard for new tickets" : "✅ No tickets awarded (expected for incomplete surveys)",
        shouldAwardTickets ? "✅ Check user email for confirmation" : "ℹ️ No email sent (expected for incomplete surveys)",
        "📋 Check server logs for detailed processing information",
        "🔍 Use /api/debug/cpx-test for comprehensive debugging"
      ] : [
        "❌ Postback failed",
        "📋 Check server logs for error details",
        "🔍 Use /api/debug/cpx-test for comprehensive debugging",
        "🔧 Verify CPX configuration and user account status"
      ],
      message: isSuccess 
        ? `✅ CPX postback test ${testType === 'completed' ? 'PASSED' : 'COMPLETED'} - ${responseText}`
        : `❌ CPX postback test FAILED - ${responseText}`
    });
    
  } catch (error) {
    console.error('Automated CPX test error:', error);
    
    return NextResponse.json({
      success: false,
      error: "Automated test failed",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 