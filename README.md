# Auth V5 - Social Lottery

> Next Auth V5 Advanced guide with Social Lottery implementation

## Built With

- Major languages: TypeScript
- Framework: Next.js
- Libraries: Prisma, Auth.js, React, Framer Motion

## Environment Variables

You will need to create a `.env` file in the root of the project and add the following environment variables:

DATABASE_URL=""

DIRECT_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL="http://localhost:3000"
RESEND_API_KEY=""

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

