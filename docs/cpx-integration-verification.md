# CPX Research Integration Verification Guide

This guide explains how to verify that the CPX Research survey integration is working correctly in the 0mninet Lottery system.

## Integration Overview

The lottery system awards tickets to users when they complete surveys via CPX Research. The flow should be:

1. User clicks "Go to Survey" button in the lottery dashboard
2. CPX Research survey loads in iframe/modal
3. User completes the survey successfully
4. CPX Research sends a postback to our API endpoint (`/api/cpx-postback`) with status=1
5. Our system verifies the postback and awards a ticket
6. An email confirmation is sent to the user
7. The dashboard updates to show the new ticket

## Verification Process

### 1. Manual Test with Script

The most reliable way to verify the integration is to use our verification script:

```bash
# Replace USER_ID with an actual user ID from your system
node scripts/verify-cpx-integration.js USER_ID
```

This script will:
1. Send a test postback to the system
2. Check if the ticket was awarded correctly
3. Verify the database records
4. Confirm email sending (based on logs)
5. Provide detailed results and troubleshooting advice

### 2. CPX Dashboard Configuration Check

Verify these settings in the CPX Research dashboard:

1. **Postback URL**: Should be exactly `https://0mninetlottery.com/api/cpx-postback`
2. **App ID**: Should be `27172`
3. **Secure Hash**: Should match the key in our system (`mZ6JNyV7SeZh9CMPwU9mKe24A0IyfAxC`)
4. **User Parameters**: Should be correctly mapped (user_id should be our database user ID)

### 3. Check Log Files

Look for these log patterns to verify functionality:

```
🚨🚨🚨 CPX POSTBACK RECEIVED 🚨🚨🚨
📩 CPX Postback received: { userId: ... }
✅ Survey completed successfully (status=1) for user ...
✅ Ticket award result: { success: true, ... }
📧 ✅ Survey completion email sent successfully
✅ ✅ ✅ CPX TRANSACTION COMPLETED SUCCESSFULLY ✅ ✅ ✅
```

### 4. Database Records Check

After a successful survey completion, these database records should exist:

1. **Ticket record**: New record in `tickets` table with source="SURVEY"
2. **Transaction record**: In `settings` table with key=`cpx_transaction_[TRANSACTION_ID]`
3. **Notification record**: In `settings` table with key=`instant_notification_[USER_ID]_...`
4. **User record update**: `availableTickets` and `totalTicketsEarned` incremented by 1

## Common Issues and Solutions

### 1. Postback Not Received

**Symptoms:**
- No logs showing "CPX POSTBACK RECEIVED"
- Survey completed but no ticket awarded
- No ticket confirmation email

**Solutions:**
- Verify postback URL in CPX dashboard is exactly `https://0mninetlottery.com/api/cpx-postback`
- Check if CPX is sending the postback correctly (ask CPX support)
- Verify server logs for errors
- Run simulation script to test connectivity

### 2. Postback Received But No Ticket Awarded

**Symptoms:**
- Logs show "CPX POSTBACK RECEIVED"
- But no "TRANSACTION COMPLETED SUCCESSFULLY" log
- No ticket/email sent

**Solutions:**
- Check if status=1 in the postback (completed survey)
- Verify hash validation is working
- Check for database transaction errors
- Look for "CRITICAL ERROR" logs

### 3. Ticket Awarded But No Email Sent

**Symptoms:**
- Ticket appears in dashboard
- Database records created
- But no email received

**Solutions:**
- Check email sending logs for errors
- Verify Resend API credentials
- Check if email is in spam folder
- Verify user has valid email address

### 4. No Surveys Available

**Symptoms:**
- User clicks "Go to Survey" but sees "No surveys available"

**Solutions:**
- This is normal sometimes - CPX may not always have surveys for every user
- Make sure CPX account is properly funded
- Try with different user demographics

## Testing With Test Script

We've created a simulation script to test the integration:

```bash
node scripts/simulate-cpx-postback.js USER_ID
```

This sends a test postback directly to the system, bypassing CPX.

For deeper verification:

```bash
node scripts/verify-cpx-integration.js USER_ID
```

## Contact Support

If issues persist after following this guide:

1. Gather the server logs
2. Run the verification script and save the output
3. Contact CPX Research support at support@cpx-research.com
4. Include all logs, outputs, and user IDs in your support request

## Technical Reference

### Postback Parameters

The CPX postback includes these parameters:

- `status`: 1 (completed) or 0 (not completed/disqualified)
- `trans_id`: Unique transaction ID
- `user_id`: Our user ID
- `hash`: Security validation hash
- `amount_usd`: Amount earned (we ignore this and always award 1 ticket)
- `currency_name`: Always "USD"
- `currency_amount`: Amount earned (we ignore this)
- `ip_click`: User's IP address

### Hash Validation

We validate the postback using this algorithm:

```javascript
const hashString = `${userId}-${CPX_SECURE_HASH_KEY}`;
const hash = crypto.createHash('md5').update(hashString).digest('hex');
```

The hash must match for the postback to be processed.

## Monitoring Tools

You can view system health and CPX integration status at:

`https://0mninetlottery.com/api/health`

This endpoint provides a quick overview of system components including the CPX integration status. 