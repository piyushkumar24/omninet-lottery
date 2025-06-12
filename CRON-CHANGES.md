# Cron Job Consolidation

To meet Vercel's Hobby plan requirements (limited to 1 cron job that runs once per day), we've consolidated multiple cron jobs into a single daily endpoint.

## Changes Made

1. **Created a consolidated cron job endpoint**:
   - New endpoint: `/api/cron/all-tasks` 
   - This endpoint handles multiple tasks within a single invocation
   - The consolidated endpoint runs once daily at midnight (0 0 * * *)

2. **Smart scheduling logic**:
   - Database health checks run on every cron invocation (once daily)
   - Weekly lottery draw checks only execute on Sundays (when day === 0)
   - This ensures the weekly draw happens only once per week while database health checks happen daily

3. **Updated vercel.json**:
   - Reduced from multiple cron jobs to a single cron job entry
   - Set to run once daily to comply with Vercel Hobby plan limitations
   - Added day-of-week detection in the code to limit when the weekly draw runs

## Detailed Implementation

The consolidated endpoint at `/api/cron/all-tasks` works as follows:

1. It accepts an optional `task` parameter to run specific tasks:
   - `?task=database` - Only runs database health checks
   - `?task=draw` - Only processes the weekly lottery draw (if applicable)
   - No parameter - Runs all appropriate tasks based on the current day

2. Day-of-week detection:
   ```javascript
   const now = new Date();
   const isWeeklyDrawDay = now.getDay() === 0; // Sunday
   
   // Weekly lottery draw - run if explicitly requested or if it's Sunday
   if (task === "draw" || (isWeeklyDrawDay && (task === "all" || task === null))) {
     // Run weekly draw code
   }
   ```

3. Each task runs in its own try/catch block to ensure one failure doesn't affect others

## Vercel Hobby Plan Compliance

The original implementation used multiple cron jobs with one running every 15 minutes. However, Vercel's Hobby plan has two key limitations:

1. Only one cron job is allowed
2. The cron job can only run once per day (not more frequently)

Our solution addresses both limitations by:
- Consolidating all cron jobs into a single endpoint
- Scheduling it to run once daily at midnight (0 0 * * *)
- Using logic within the endpoint to handle both database health checks and weekly draws

## Security

The endpoint continues to use the same security mechanism as the original cron jobs:
- Verifies the `CRON_SECRET` token via query parameter
- Returns a 401 Unauthorized response if the secret is invalid

## Benefits

1. **Deployment compatibility**: Works with Vercel's Hobby plan limitations
2. **Maintained functionality**: No loss of critical features
3. **Simplified management**: Single cron job entry is easier to maintain
4. **Efficient execution**: Database health checks run daily, and weekly draws happen only on Sundays

## Deployment

With these changes, the application can now be deployed to Vercel's Hobby plan while maintaining the core functionality. 