# CPX Integration Fix Guide

## Issue Identified

After thorough investigation, we have identified the core issue with the CPX survey integration:

**The CPX postback system is implemented correctly in the code, but the postback requests from CPX are either not reaching our server or contain incorrect parameters.**

The system is designed to:
1. Receive postback requests from CPX when surveys are completed
2. Award tickets only for completed surveys (status=1)
3. Send confirmation emails to users
4. Update the dashboard with the new ticket

## Fix Implementation (UPDATED)

We have implemented comprehensive fixes to ensure the system works reliably:

1. **Enhanced logging** in the CPX postback endpoint to track every incoming request
2. **Updated URL configuration** to ensure the postback URL is correct
3. **Created verification scripts** to validate the integration
4. **Added detailed documentation** for testing and troubleshooting
5. **Enhanced ticket verification** to confirm tickets are properly created in the database
6. **Added draw participation verification** to ensure tickets are applied to the next lottery
7. **Improved email delivery reliability** with better retry mechanisms and priority flags
8. **Added database transaction monitoring** for troubleshooting failed operations

## Complete Verification Steps

Follow these steps to verify the integration is working:

### 1. Check CPX Dashboard Configuration

Verify these settings in your CPX Research dashboard:

- **Postback URL**: Must be exactly `https://0mninetlottery.com/api/cpx-postback`
- **App ID**: Should be `27172`
- **Secure Hash Key**: Should match our configuration (`mZ6JNyV7SeZh9CMPwU9mKe24A0IyfAxC`)
- **User Parameters**: Ensure user_id parameter maps to your database user IDs

### 2. Run the Full Survey Flow Test

This comprehensive test validates the entire process from postback to ticket award, draw application, and email confirmation:

```bash
# Replace USER_ID with a valid user ID from your database
node scripts/test-full-survey-flow.js USER_ID
```

This script tests and validates:
- Postback processing
- Ticket awarding
- Draw participation
- Email sending records
- Database transaction records
- Dashboard data visibility

### 3. Check Server Logs

After running the test, look for these specific patterns in your server logs:

```
🚨🚨🚨 CPX POSTBACK RECEIVED 🚨🚨🚨
✅ Survey completed successfully (status=1) for user ...
✅ Ticket award result: { success: true, ... }
✅ Ticket creation verified in database: [TICKET_ID]
✅ Draw participation verified: { userId: ..., drawId: ..., ticketsApplied: 1 }
📧 ✅ Survey completion email sent successfully
✅ ✅ ✅ CPX TRANSACTION COMPLETED SUCCESSFULLY ✅ ✅ ✅
```

### 4. Verify Email Delivery

Check the email account associated with the test user for a confirmation email with:
- Subject: "🎫 IMPORTANT: Your Lottery Ticket [CONFIRMATION_CODE] - 0MNINET"
- Confirmation code matching the ticket ID
- Details about the next lottery draw

## Troubleshooting Common Issues

### 1. No Postbacks Being Received

**Solution:**
- Contact CPX Research support to verify they are sending postbacks correctly
- Confirm the exact postback URL in their system: `https://0mninetlottery.com/api/cpx-postback`
- Check server access logs to confirm if requests are reaching the server
- Use the `scripts/simulate-cpx-postback.js` script to test the endpoint directly

### 2. Tickets Not Being Applied to Draw

**Solution:**
- Check if the `drawParticipation` records exist in the database
- Run `scripts/test-full-survey-flow.js` to test the entire flow
- Review server logs for any errors in the ticket application process
- Make sure there is an active (non-completed) draw in the database

### 3. Email Delivery Issues

**Solution:**
- Verify Resend API credentials are correct
- Check email settings records in the database
- Review spam/junk folders for the ticket confirmation emails
- Test with `scripts/test-full-survey-flow.js` to verify the email sending process

## New Diagnostic Features

We've added several new diagnostic features to help troubleshoot issues:

1. **Enhanced Transaction Logging**
   - Every step of the postback processing is now logged in the database
   - Check the `settings` table with keys starting with:
     - `cpx_transaction_` - Successful transactions
     - `cpx_raw_request_` - Raw incoming requests
     - `email_sent_` - Email delivery records

2. **Verification Tools**
   - `scripts/simulate-cpx-postback.js` - Simple postback simulation
   - `scripts/verify-cpx-integration.js` - Basic integration verification
   - `scripts/test-full-survey-flow.js` - Comprehensive end-to-end test

3. **Health Endpoint**
   - Check system status at `/api/health`

## Next Steps

1. Run the verification scripts with a valid user ID
2. Contact CPX Research support with the results
3. Ask CPX to verify postbacks are being sent correctly
4. Monitor logs for the next 24 hours to confirm fix

If you need further assistance, please reach out with:
- Server logs showing the issue
- Output from the verification scripts
- User IDs that completed surveys but didn't receive tickets

## For CPX Research Support

If contacting CPX Research support, please provide:

1. Your App ID: `27172`
2. Postback URL: `https://0mninetlottery.com/api/cpx-postback`
3. Request them to verify postbacks are being sent with:
   - status=1 for completed surveys
   - correct user_id parameter
   - valid hash for authentication

Request them to send a test postback while you monitor server logs. 