# CPX Research Integration Guide

## Overview

This guide explains how the CPX Research survey integration works in the NextJS lottery application. Users can now earn lottery tickets by completing real surveys through CPX Research instead of just clicking a button.

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
- Check for recent survey tickets within 1 minute
- Prevent multiple awards for same transaction
- Transaction logging for audit trail

### Data Protection
- No sensitive data passed to CPX Research
- Secure iframe with proper sandbox attributes
- Hash-based authentication only

## API Endpoints

### `/api/cpx-postback` (GET/POST)
Handles survey completion notifications from CPX Research.

**Parameters:**
- `status`: 1 (completed) or 0 (not completed)
- `trans_id`: Unique transaction ID
- `user_id`: Our user ID
- `amount_usd`: Amount earned
- `hash`: Secure hash for validation

### `/api/survey/complete` (GET/POST)
Verification endpoint for survey completion status.

## Testing

### 1. Local Development
1. Use ngrok to expose local server
2. Update CPX postback URL in their dashboard
3. Test survey completion flow

### 2. Production Deployment
1. Update postback URL to production domain
2. Verify SSL certificate is valid
3. Test end-to-end flow

## Troubleshooting

### Common Issues

**Survey not loading:**
- Check iframe sandbox permissions
- Verify user data is properly encoded
- Ensure secure hash is generated correctly

**Tickets not awarded:**
- Check console logs for postback errors
- Verify hash validation is working
- Ensure CPX postback URL is correct

**Duplicate tickets:**
- Check duplicate prevention logic
- Verify transaction ID tracking
- Review timing windows for recent tickets

### Debug Mode

Enable debug mode in CPX script configuration:
```typescript
debug: true  // Set to false in production
```

## Support

For issues with:
- **CPX Research**: Contact their support team
- **Integration Code**: Check console logs and API responses
- **Postback Issues**: Verify URLs and hash validation

## Production Checklist

- [ ] Update all URLs from ngrok to production domain
- [ ] Set `debug: false` in CPX configuration
- [ ] Test postback endpoint accessibility
- [ ] Verify SSL certificate is valid
- [ ] Monitor postback logs for errors
- [ ] Test complete user flow end-to-end

## Next Steps

1. **Enhanced Analytics**: Track survey completion rates
2. **Multiple Providers**: Add other survey providers
3. **Survey Categories**: Different ticket values for different surveys
4. **User Preferences**: Let users choose survey types 