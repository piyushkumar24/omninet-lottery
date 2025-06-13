# Survey Ticket System Guide

This document explains how the proper survey ticket system works and ensures tickets are only awarded for legitimate survey completions.

## Overview

The lottery application awards tickets to users who **successfully complete** surveys through CPX Research. The system has been designed to ensure that tickets are **ONLY** awarded when:

- A survey is fully completed (CPX status = 1)
- CPX Research confirms the completion via postback
- The user was not disqualified during the survey

**CRITICAL**: Tickets are NOT awarded for:
- Incomplete surveys (status ≠ 1)
- Disqualified users (DQ)
- Simply opening or closing survey modals
- "No surveys available" scenarios
- Participation without completion

## How It Works

The ticket award process involves a single, secure component:

1. **CPX Postback Endpoint**: The ONLY legitimate way to receive tickets - when CPX Research sends a postback notification with status=1 (completed survey)

### Strict Completion Logic

The system uses a single, secure mechanism to ensure tickets are only awarded for legitimate completions:

- **Survey Completed (status=1)**: CPX postback awards exactly 1 ticket and applies it to the current lottery
- **Survey Incomplete (status≠1)**: No ticket awarded, transaction logged for tracking
- **Survey Disqualified**: No ticket awarded
- **No surveys available**: No ticket awarded
- **Modal closed without completion**: No ticket awarded

### Survey Completion Flow

1. User clicks "Go to Survey" button
2. CPX Research survey loads in iframe
3. User completes survey successfully
4. CPX Research sends postback to `/api/cpx-postback` with status=1
5. System validates completion status
6. If status=1: Awards 1 ticket, applies to lottery, sends confirmation email
7. If status≠1: Logs attempt, no ticket awarded

## Security Features

### Disabled Endpoints

The following endpoints have been disabled to prevent improper ticket awarding:

- `/api/survey/force-award` - Force awarding disabled
- `/api/tickets/force-award` - Force awarding disabled  
- `/api/survey/complete` - Only accepts verified non-winner bonus tokens

### Frontend Protections

- Modal no longer awards "participation tickets"
- No automatic awarding for disqualified users
- No awarding for "no surveys available" scenarios
- Completion detection relies on CPX postback only

## Troubleshooting

If users report that they are not receiving tickets after completing surveys:

### 1. Verify Survey Completion

Check server logs for CPX postback:
- Look for successful postback with status=1
- Verify user ID matches
- Check transaction was processed

### 2. Check CPX Integration

Ensure CPX Research is properly configured:
- Postback URL is correct: `yoursite.com/api/cpx-postback`
- Secure hash validation is working
- CPX is sending postbacks for completed surveys

### 3. Review Completion Status

Only surveys with status=1 should award tickets:
- status=1: Completed successfully ✅
- status=0: Disqualified/incomplete ❌
- Other status: Error/incomplete ❌

### 4. Manual Investigation

Use admin-only endpoints for legitimate issues:
- `/api/tickets/test-award` (admin only)
- Server logs for transaction tracking
- Database verification of ticket records

## Valid Ticket Sources

Tickets can ONLY be awarded through these legitimate means:

1. **Survey Completion**: CPX postback with status=1
2. **Referral Rewards**: When referred user completes their first survey
3. **Social Media**: Following official social accounts (separate system)
4. **Non-Winner Bonus**: Verified email bonus with token
5. **Admin Manual**: Admin-only test/correction tickets

## Configuration

### CPX Research Settings

Ensure these parameters are configured:

```
Postback URL: https://yoursite.com/api/cpx-postback
Security Hash: Enabled
Status Parameter: Required
Transaction ID: Required
```

### Status Codes

Only status=1 awards tickets:
- `1`: Survey completed successfully → Award ticket
- `0`: User disqualified → No ticket  
- Other: Error/incomplete → No ticket

## Error Handling

The system logs all attempts for audit purposes:

- **Completed surveys**: Full transaction logged with ticket details
- **Incomplete surveys**: Logged with reason (disqualified/incomplete)
- **Invalid requests**: Logged with error details

## Best Practices

1. **Monitor Completion Rates**: Track status=1 vs other statuses
2. **Review Logs Regularly**: Check for unusual patterns
3. **Validate CPX Setup**: Ensure postbacks are working
4. **User Education**: Inform users tickets only come from completed surveys

This ensures a fair and secure survey reward system where tickets are only awarded for legitimate survey completions verified by CPX Research. 