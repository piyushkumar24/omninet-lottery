# Survey Ticket System Guide

This document explains how the guaranteed ticket system works and how to troubleshoot issues with ticket awards.

## Overview

The lottery application awards tickets to users who complete surveys through CPX Research. The system has been enhanced to ensure that **every user always receives a ticket** when they attempt to complete a survey, regardless of:

- Whether surveys are available
- Whether the user qualifies for a survey
- Whether the survey is completed successfully
- Whether there are technical issues

## How It Works

The ticket award process involves several components:

1. **CPX Survey Modal**: The frontend component that loads the survey iframe and handles user interactions
2. **CPX Postback Endpoint**: The backend API that receives notifications when surveys are completed
3. **Fallback API**: A secondary system that awards tickets if the postback fails
4. **Force Award API**: A special system that guarantees tickets when no surveys are available
5. **Verification System**: Tools to verify that tickets are properly awarded

### Guaranteed Ticket Logic

The system uses multiple fallback mechanisms to ensure tickets are always awarded:

- When a survey is completed successfully, the CPX postback awards a ticket
- When a survey is incomplete (user disqualified), the CPX postback still awards a ticket
- When no surveys are available, the force-award API directly awards a ticket
- When the survey iframe fails to load, the fallback API awards a ticket
- When the user closes the survey modal, a participation ticket is awarded

### Special "No Surveys Available" Handling

The system has enhanced detection for "no surveys available" scenarios:

1. **Continuous Message Monitoring**: The system continuously scans the survey iframe for messages like "Unfortunately we could not find a survey for your profile" and automatically awards a ticket when detected
2. **Direct Claim Button**: Users can click "No Surveys Found? Claim Ticket" to immediately get a ticket
3. **Force Award Endpoint**: A specialized API endpoint `/api/survey/force-award` that specifically handles the no-surveys scenario
4. **Automatic Award**: When "no surveys available" is detected, a ticket is automatically awarded without requiring user action

## Troubleshooting

If users report that they are not receiving tickets after completing surveys, follow these steps:

### 1. Check Recent Tickets

Use the ticket verification API to check if the user has received any recent tickets:

```
GET /api/tickets/verify
```

This endpoint returns:
- Total ticket count
- Recent tickets (last 30 minutes)
- Active draw information
- User's participation in the active draw

### 2. Test Ticket Award Process

Use the verification script to test the ticket award process:

```bash
# Make the script executable
chmod +x scripts/verify-tickets.js

# Run the script with the user's ID
node scripts/verify-tickets.js <userId>
```

This script allows you to:
- Test the CPX postback endpoint
- Test the fallback API
- Verify recent tickets

### 3. Check Server Logs

Examine the server logs for any errors related to ticket awards. The logs include comprehensive information about:
- CPX postback requests
- Transaction processing
- Error handling

### 4. Manual Ticket Award

If needed, you can manually award a ticket to a user:

```
POST /api/tickets/test-award
{
  "userId": "<userId>",
  "source": "SURVEY",
  "note": "Manual award due to technical issue"
}
```

This endpoint is admin-only and creates a ticket with proper logging.

## Common Issues and Solutions

### "Ticket Shown as Credited but Not Actually Awarded"

This issue typically occurs when:
1. The CPX postback fails to process the transaction
2. The user closes the modal before the ticket is fully processed
3. Database transaction errors occur

**Solution**: The enhanced system now:
- Verifies ticket award 5 seconds after showing success
- Automatically tries the fallback API if verification fails
- Forces page refresh to show updated ticket count

### "No Surveys Available" Error

When no surveys are available, users should still receive a ticket for their participation.

**Solution**: The modal now:
- Detects "no surveys available" messages
- Shows a clear message that the user will still get a ticket
- Provides a "Claim Your Ticket" button that triggers the fallback API

### Duplicate Tickets

To prevent duplicate tickets, the system:
- Checks for recent tickets (within last 3-5 minutes)
- Uses transaction IDs for tracking
- Logs comprehensive information about each award

## System Components

### Frontend Components

- **CPXSurveyModal**: The main survey interface with error handling
- **EarnTickets**: Dashboard component for survey access

### Backend Endpoints

- **/api/cpx-postback**: Processes CPX Research postbacks
- **/api/survey/complete**: Fallback API for manual ticket awards
- **/api/tickets/verify**: Verifies ticket awards
- **/api/tickets/test-award**: Admin endpoint for testing

## Testing

To test the entire ticket system:

1. Start the development server
2. Open the dashboard and click "Go to Survey"
3. Complete a survey or simulate different error states
4. Verify that a ticket is awarded in all scenarios
5. Check that the ticket count increases on the dashboard

You can also use the verification script for automated testing.

## Technical Details

The enhanced system uses:

- Database transactions with retry logic
- Real-time ticket verification
- Multiple fallback mechanisms
- Comprehensive error handling and logging
- Automatic page refreshing
- Visual feedback for users

This ensures a robust ticket award system that fulfills the requirement of awarding exactly 1 ticket for every survey attempt. 