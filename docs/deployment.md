# Deployment Guide

This guide provides comprehensive instructions for deploying the lottery application to production environments.

## Prerequisites

Before deployment, ensure you have:

1. A database provider (PostgreSQL recommended)
2. Cloudflare R2 account configured
3. Node.js 18+ installed
4. Access to your hosting platform

## Environment Variables

The following environment variables must be configured in your production environment:

```
# Database
DATABASE_URL="postgresql://username:password@hostname:port/database"

# Application
NEXT_PUBLIC_APP_URL="https://your-domain.com"
DIRECT_URL="https://your-domain.com"

# Cloudflare R2 Storage
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
R2_BUCKET_NAME="profile-pictures"
R2_PUBLIC_URL="https://pub-your-account-id.r2.dev"

# Email (Resend.com)
RESEND_API_KEY="your-resend-api-key"

# Authentication
AUTH_SECRET="your-auth-secret-key"
```

## Deployment Steps

### 1. Prepare for Deployment

Run the deployment preparation script:

```bash
npm install
chmod +x scripts/prepare-deploy.js
node scripts/prepare-deploy.js
```

This script will:
- Clean build caches
- Verify R2 configuration
- Check database connectivity
- Run dependency checks
- Create a production build

### 2. Vercel Deployment (Recommended)

The easiest way to deploy is using Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in the Vercel dashboard
4. Deploy

### 3. Manual Deployment

For manual deployments:

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

3. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start npm --name "lottery-app" -- start
   ```

### 4. Docker Deployment

A Dockerfile is provided for containerized deployments:

1. Build the Docker image:
   ```bash
   docker build -t lottery-app .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:3000 --env-file .env.production lottery-app
   ```

## Cloudflare R2 Configuration

Ensure your R2 bucket is properly configured:

1. Create the "profile-pictures" bucket in your Cloudflare dashboard
2. Enable public access for the bucket
3. Configure CORS settings to allow your domain

## Database Migration

Before deploying, ensure your database schema is up to date:

```bash
npx prisma migrate deploy
```

## SSL Configuration

Always use HTTPS in production environments:

1. If using Vercel, SSL is configured automatically
2. For custom deployments, set up SSL using Let's Encrypt or similar

## Monitoring and Logging

Set up monitoring and logging for your production environment:

1. Use the built-in Next.js telemetry or custom logging solutions
2. Configure error monitoring with services like Sentry
3. Set up database monitoring

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify your DATABASE_URL is correct
   - Ensure the database server allows connections from your hosting environment

2. **R2 Storage Issues**
   - Check R2 credentials and permissions
   - Verify the bucket exists and is accessible
   - Ensure CORS settings are properly configured

3. **Build Errors**
   - Clear cache and node_modules: `rm -rf .next node_modules && npm install`
   - Check for TypeScript errors: `npx tsc --noEmit`

## Performance Optimization

1. Enable caching for static assets
2. Configure a CDN for global distribution
3. Use the built-in Next.js image optimization

## Security Considerations

1. Keep all environment variables secure
2. Regularly update dependencies: `npm audit fix`
3. Configure Content Security Policy headers
4. Use HTTPS for all connections

## Maintenance

Regular maintenance ensures optimal performance:

1. Update dependencies monthly
2. Monitor error logs
3. Perform database maintenance
4. Run regular backups

---

For additional support, contact the development team. 