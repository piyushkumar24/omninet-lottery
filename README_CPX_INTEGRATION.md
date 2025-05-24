# CPX Research Integration Guide

## Overview

This guide explains how the CPX Research survey integration works in the NextJS lottery application. Users can now earn lottery tickets by completing real surveys through CPX Research instead of just clicking a button.

## 🚨 **IMPORTANT: Understanding Ticket Display**

**If you're seeing decimal numbers like 0.42, 0.15** - These are NOT your ticket counts! These are your **winning chance percentages**.

- **Your Ticket Count**: Always whole numbers (1, 2, 3, etc.) - shown in the main ticket display
- **Winning Percentage**: Decimal numbers (0.42%, 0.15%) - shown as "Winning chance: X%"

**Example:**
- ✅ **Tickets: 3** (You have 3 lottery tickets)
- ℹ️ **Winning chance: 0.42%** (You have a 0.42% chance to win)

## Features Implemented

✅ **Secure CPX Research Integration**
- MD5 hash verification for security
- Proper postback handling
- User data protection

✅ **Modern Survey Modal**
- Professional UI design
- Embedded iframe with loading states
- Option to open in new tab
- Auto-close functionality

✅ **Automatic Ticket Rewards**
- Tickets awarded only after actual survey completion
- Duplicate transaction prevention
- Referral tickets for first-time survey completers

✅ **Dashboard Integration**
- Survey completion alerts
- Real-time ticket count updates
- Success notifications

## Configuration

### CPX Research Settings

| Setting | Value |
|---------|-------|
| **App ID** | `27172` |
| **Secure Hash Key** | `mZ6JNyV7SeZh9CMPwU9mKe24A0IyfAxC` |
| **Postback URL** | `https://8bad-2406-7400-81-835f-cc49-26c4-69fc-3b65.ngrok-free.app/api/cpx-postback` |
| **Redirect URL** | `https://8bad-2406-7400-81-835f-cc49-26c4-69fc-3b65.ngrok-free.app/dashboard?survey=completed` |

### Environment Variables

Add these to your `.env.local` file:

```env
# CPX Research Configuration
CPX_APP_ID=27172
CPX_SECURE_HASH_KEY=mZ6JNyV7SeZh9CMPwU9mKe24A0IyfAxC
CPX_POSTBACK_URL=https://8bad-2406-7400-81-835f-cc49-26c4-69fc-3b65.ngrok-free.app
```

## File Structure

### New Files Added

```
lib/
├── cpx-utils.ts                           # CPX utility functions
components/
├── survey/
│   └── cpx-survey-modal.tsx              # Survey modal component
├── dashboard/
│   └── survey-completion-alert.tsx       # Completion alert component
app/
├── api/
│   ├── cpx-postback/
│   │   └── route.ts                       # CPX postback handler
│   └── survey/
│       └── complete/
│           └── route.ts                   # Survey completion API
```

### Modified Files

```
components/dashboard/earn-tickets.tsx      # Updated to use CPX modal
app/dashboard/page.tsx                     # Added survey completion detection
```

## How It Works

### 1. User Clicks "Go to Survey"
- Opens modern survey modal with CPX Research iframe
- Generates secure survey URL with user data
- Provides option to open in new tab

### 2. User Completes Survey
- CPX Research validates completion
- Sends postback to `/api/cpx-postback`
- Our system validates the secure hash

### 3. Ticket Award Process
- Verify user exists and survey completed
- Check for duplicate transactions
- Award 1 ticket for survey completion
- Award referral ticket if first survey

### 4. User Returns to Dashboard
- Redirect to `/dashboard?survey=completed`
- Show success alert and notification
- Update ticket count automatically

## 🛠️ **Troubleshooting Common Issues**

### Issue 1: "Survey Reward Failed"

**Possible Causes:**
- Postback URL not reachable
- Hash validation failed
- Duplicate transaction detected
- Network/server issues

**Solutions:**
1. **Check ngrok tunnel**: Ensure your ngrok tunnel is running and accessible
2. **Verify postback URL**: Test manually with curl:
   ```bash
   curl "https://8bad-2406-7400-81-835f-cc49-26c4-69fc-3b65.ngrok-free.app/api/cpx-postback?status=1&trans_id=test123&user_id=YOUR_USER_ID&hash=GENERATED_HASH"
   ```
3. **Check server logs**: Look for error messages in the console
4. **Verify hash generation**: Use the test script to validate

### Issue 2: "No Surveys Available"

**This is NORMAL behavior from CPX Research!**

**Why this happens:**
- Survey providers target specific demographics
- Limited survey availability for your profile
- Time-based restrictions
- Geographic limitations

**Solutions:**
1. **Try again later**: Survey availability changes throughout the day
2. **Different times**: Try morning, afternoon, and evening
3. **Update profile**: Complete profile surveys to improve targeting
4. **Be patient**: This is how real survey platforms work

**What the modal shows:**
- "Unfortunately we could not find a survey for your profile"
- "Try again in a few hours"
- This is expected and not an error!

### Issue 3: Seeing Decimal Numbers (0.42, 0.15)

**This is NOT a bug!** You're looking at winning percentages, not ticket counts.

**Where to find your actual ticket count:**
- Dashboard main section: Large number showing your tickets
- "Your Lottery Tickets" card: Shows actual count (1, 2, 3, etc.)
- Ticket history page: Lists all your earned tickets

**Understanding the display:**
```
Your Lottery Tickets
       5          ← Your actual ticket count (whole number)
   Tickets Available

Winning Chance
     0.42%        ← Your percentage chance to win (decimal)
```

### Issue 4: Tickets Not Awarded After Survey

**Check these steps:**
1. **Complete the entire survey**: Partial completion doesn't count
2. **Wait for redirection**: Don't close the window early
3. **Check console logs**: Look for postback confirmations
4. **Verify user session**: Ensure you're logged in properly
5. **Test with debug endpoint**: Use the test command below

**Manual test:**
```bash
# Replace YOUR_USER_ID with your actual user ID
curl -X PUT "https://8bad-2406-7400-81-835f-cc49-26c4-69fc-3b65.ngrok-free.app/api/cpx-postback?test=true&user_id=YOUR_USER_ID"
```

## API Endpoints

### `/api/cpx-postback` (GET/POST)
Handles survey completion notifications from CPX Research.

**Parameters:**
- `status`: 1 (completed) or 0 (not completed)
- `trans_id`: Unique transaction ID
- `user_id`: Our user ID
- `amount_usd`: Amount earned
- `hash`: Secure hash for validation

**Enhanced Logging:**
- All postbacks are logged with emojis for easy identification
- Success: ✅ Survey completion processed successfully
- Warning: ⚠️ Recent survey ticket found (duplicate)
- Error: ❌ Invalid hash / User not found

### `/api/cpx-postback` (PUT - Test Endpoint)
Create test tickets for debugging.

**Usage:**
```bash
curl -X PUT "https://your-domain.com/api/cpx-postback?test=true&user_id=USER_ID"
```

## Security Features

### Hash Validation
```typescript
// Generate secure hash
const hash = md5(`${userId}-${secureHashKey}`);

// Validate postback
if (!validateCPXPostbackHash(userId, receivedHash)) {
  return new NextResponse('Invalid hash', { status: 403 });
}
```

### Duplicate Prevention
- Check for recent survey tickets within 5 minutes
- Prevent multiple awards for same transaction
- Transaction logging for audit trail

### Data Protection
- No sensitive data passed to CPX Research
- Secure iframe with proper sandbox attributes
- Hash-based authentication only

## Testing & Debugging

### 1. Run Test Script
```bash
node scripts/test-cpx-integration.js
```

### 2. Check Logs
Look for these log patterns:
- 🔔 CPX Postback received
- ✅ Hash validation passed
- 🎫 Survey ticket created
- ✅ Survey completion processed successfully

### 3. Manual Testing
```bash
# Test postback endpoint
curl "https://your-domain.com/api/cpx-postback?status=1&trans_id=test123&user_id=YOUR_USER_ID&hash=VALID_HASH"

# Create test ticket
curl -X PUT "https://your-domain.com/api/cpx-postback?test=true&user_id=YOUR_USER_ID"
```

## Common Misconceptions

❌ **"I'm not getting whole ticket numbers"**
→ You're looking at winning percentages, not ticket counts

❌ **"Survey rewards are failing"**
→ Check if ngrok tunnel is running and postback URL is correct

❌ **"No surveys are available"**
→ This is normal CPX Research behavior, try again later

❌ **"System is broken"**
→ Usually configuration or timing issues, not code problems

## Production Checklist

- [ ] Update all URLs from ngrok to production domain
- [ ] Set `debug: false` in CPX configuration
- [ ] Test postback endpoint accessibility from external networks
- [ ] Verify SSL certificate is valid
- [ ] Monitor postback logs for errors
- [ ] Test complete user flow end-to-end
- [ ] Confirm CPX Research dashboard settings

## Support

For issues with:
- **CPX Research**: Contact their support team
- **Integration Code**: Check console logs and API responses
- **Postback Issues**: Verify URLs and hash validation
- **"No surveys available"**: Normal behavior, try again later
- **Decimal numbers**: You're seeing percentages, not ticket counts

## Success Indicators

✅ **Working Correctly When:**
- Survey modal opens and loads iframe
- "No surveys available" message appears (this is normal!)
- Successful survey completion redirects to dashboard
- Success alert appears with celebration animation
- Ticket count increases by whole numbers (1, 2, 3)
- Console shows: "✅ Survey completion processed successfully"

🎯 **Remember:** Real survey platforms have limited availability. The system is working even when no surveys are available! 