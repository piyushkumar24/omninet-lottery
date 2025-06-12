# Cron Job Consolidation

To meet Vercel's deployment requirements (limited to 1 cron job on the free plan), we've consolidated multiple cron jobs into a single endpoint.

## Changes Made

1. **Created a consolidated cron job endpoint**:
   - New endpoint: `/api/cron/all-tasks` 
   - This endpoint handles multiple tasks within a single invocation
   - The consolidated endpoint runs every 15 minutes

2. **Smart scheduling logic**:
   - Database health checks run on every cron invocation (every 15 minutes)
   - Weekly lottery draw checks only execute on Sundays (when day === 0)
   - This ensures the weekly draw happens only once per week while database health checks happen frequently

3. **Updated vercel.json**:
   - Reduced from multiple cron jobs to a single cron job entry
   - Set to run every 15 minutes to maintain the frequency of database health checks
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
   
   // Weekly lottery draw - run if explicitly requested or if it's Sunday and task=all
   if (task === "draw" || (task === "all" && isWeeklyDrawDay)) {
     // Run weekly draw code
   }
   ```

3. Each task runs in its own try/catch block to ensure one failure doesn't affect others

## Security

The endpoint continues to use the same security mechanism as the original cron jobs:
- Verifies the `CRON_SECRET` token via query parameter
- Returns a 401 Unauthorized response if the secret is invalid

## Benefits

1. **Deployment compatibility**: Works with Vercel's free plan limitation of 1 cron job
2. **Maintained functionality**: No loss of features or frequency of critical operations
3. **Simplified management**: Single cron job entry is easier to maintain
4. **Efficient execution**: Database health checks and weekly draws happen at appropriate frequencies

## Deployment

With these changes, the application can now be deployed to Vercel's free plan while maintaining all the original functionality. 