# Auth V5 - Social Lottery

> Next Auth V5 Advanced guide with Social Lottery implementation

## Built With

- Major languages: TypeScript
- Framework: Next.js
- Libraries: Prisma, Auth.js, React, Framer Motion
- Storage: Cloudflare R2 for profile images

## Environment Variables

You will need to create a `.env` file in the root of the project and add the following environment variables:

DATABASE_URL=""

DIRECT_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL="http://localhost:3000"
RESEND_API_KEY=""

# Cloudflare R2 Storage (added automatically by setup script)
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_ENDPOINT=""
R2_BUCKET_NAME="profile-pictures"
R2_PUBLIC_URL=""

## Cloudflare R2 Setup

The application uses Cloudflare R2 for storing profile images. To set up:

1. Run the R2 setup script:
   ```
   npm run setup:r2
   ```

2. This will automatically:
   - Add R2 credentials to your `.env.local` file
   - Create the bucket if it doesn't exist on first upload
   - Configure CORS for the bucket

3. To migrate from local uploads to R2:
   ```
   npm run cleanup:uploads
   ```

4. For more details, see the [Cloudflare R2 Setup Guide](docs/cloudflare-r2-setup.md)

## Homepage Implementation

The homepage has been redesigned with a modern, professional look focused on the "Free Internet Revolution" theme. Key features include:

- Video background (place a `network.mp4` file in `public/videos/` directory)
- Countdown timer for the weekly lottery draws (every Thursday at 18:30 IST)
- Interactive elements highlighting the mission
- Comprehensive lottery statistics and information
- Clear call-to-action buttons for new and returning users

### Background Video

For optimal user experience, add a video file:
1. Create a video file named `network.mp4`
2. Place it in the `public/videos/` directory
3. The video should be compressed and optimized for web
4. If no video is present, a fallback image will be used

### Customization

- The countdown timer automatically calculates the next Thursday draw date
- User statistics are fetched from the database
- Visual elements can be customized in the respective components

### Implemented Features

- Account access button for returning users
- Interactive visual elements illustrating the mission
- Motivational section explaining why users should join
- Clear CTA buttons throughout the page
- Responsive design for all device sizes

