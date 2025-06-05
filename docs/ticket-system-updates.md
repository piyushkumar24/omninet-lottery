# Ticket System Updates

## Overview
The ticket system has been updated to better track and manage lottery tickets throughout the application. The main goals were:

1. Separate tracking of available tickets (reset after each draw) from total tickets earned (lifetime count)
2. Implement a non-winner bonus system that awards 2 tickets to users clicking links in "unfortunate" emails
3. Fix the referral system to properly award tickets when friends complete surveys

## User Model Changes
The User model now includes two new fields:

- `availableTickets`: Number of tickets available for the current lottery draw (resets to 0 after each draw)
- `totalTicketsEarned`: Total number of tickets earned over the user's lifetime (never resets)

## Ticket Flow

### Earning Tickets
Users can earn tickets through several methods:

1. **Survey Completion**: 1 ticket per survey completed
2. **Non-Winner Bonus**: 2 tickets when completing a survey via a non-winner email link
3. **Social Media Follow**: 1 ticket for following social media
4. **Referrals**: 1 ticket when a referred friend completes their first survey

### Ticket Lifecycle

1. **Earning**: When a user earns a ticket, both their `availableTickets` and `totalTicketsEarned` counts increment
2. **Participation**: Tickets are automatically applied to the current lottery draw
3. **Draw**: After the lottery draw, all users' `availableTickets` reset to 0, but `totalTicketsEarned` remains unchanged

## Referral System

The referral system now properly awards tickets to users who refer friends:

1. When a user signs up with a referral code, they're linked to the referrer via the `referredBy` field
2. When the referred user completes their first survey, the referrer automatically receives a referral ticket
3. This ticket is applied to the current lottery draw and shown in the referrer's dashboard

## Admin Panel Updates

The admin panel has been updated to better display ticket information:

1. **User Management**: Shows both available tickets and total tickets earned for each user
2. **Draw Management**: Provides accurate statistics about tickets in the current draw, available tickets, and total tickets earned

## API Endpoints

The following API endpoints have been updated or created:

- `/api/survey/complete`: Awards survey completion tickets and referral tickets
- `/api/tickets/non-winner-bonus`: Handles non-winner bonus ticket claims
- `/api/user/status`: Returns user stats including referral data and ticket counts

## Testing

A test script has been created to verify the ticket system functionality:

```bash
node scripts/test-ticket-system.js
```

This script tests:
- Creating referral relationships
- Awarding survey completion tickets
- Awarding referral tickets
- Applying tickets to lottery draws
- Resetting available tickets after draws 