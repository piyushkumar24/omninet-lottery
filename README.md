# 0mninet Lottery Platform

<div align="center">
  <img src="public/main-logo.png" alt="0mninet Lottery Logo" width="250" />
  <br />
  <p><em>A modern web platform connecting digital inclusion with lottery rewards</em></p>
</div>

## 📋 Project Overview

The 0mninet Lottery platform is a next-generation web application designed to encourage participation in digital inclusion initiatives through a reward-based lottery system. Users can earn lottery tickets by completing surveys, referring friends, and engaging with social media content. The platform features a transparent draw mechanism with Amazon gift cards as prizes, creating a sustainable ecosystem that benefits users while promoting digital inclusion goals.

The core value proposition centers around a seamless experience where users complete activities (primarily surveys) and instantly receive lottery tickets in their dashboard, along with email confirmations. This creates an engaging reward loop that drives continued participation.

## ✨ Features

### User-Facing Features
- **Authentication System**: Secure login/registration with email verification
- **Ticket Earning System**: Multiple ways to earn tickets
  - Survey completion via CPX integration
  - Social media engagement
  - Referral program
- **Dashboard**: Real-time ticket tracking and lottery participation status
- **Instant Notifications**: Real-time feedback when tickets are earned
- **Email Confirmations**: Automated email confirmations for all ticket awards
- **Weekly Lottery Draws**: Automated and manual draw options with fair winner selection
- **Referral System**: Generate and share unique referral codes to earn additional tickets

### Administrative Features
- **Admin Dashboard**: Comprehensive management interface
- **User Management**: View, block, and manage user accounts
- **Draw Management**: Schedule, monitor, and execute lottery draws
- **Statistics & Analytics**: Track platform usage and engagement metrics
- **Prize Management**: Configure prize amounts and types
- **Newsletter System**: Manage subscriber communications
- **Ticket Verification**: Tools to verify ticket allocation accuracy

## 🛠️ Technology Stack

The platform leverages modern web technologies for performance, security, and scalability:

- **Frontend**:
  - Next.js 14 (App Router)
  - React with TypeScript
  - Tailwind CSS
  - shadcn/ui Component Library
  - Framer Motion for animations

- **Backend**:
  - Next.js API Routes
  - Prisma ORM
  - MySQL / PostgreSQL Database
  - NextAuth.js for authentication
  - Edge Runtime support

- **Infrastructure**:
  - Vercel for hosting and deployment
  - Cloudflare R2 for file storage
  - Resend for email delivery
  - Cron jobs for automated tasks

- **Integrations**:
  - CPX Research for survey monetization
  - Social media APIs

## 📁 Project Structure

```
/
├── actions/             # Server actions for data mutations
├── app/                 # Next.js 14 app directory
│   ├── (protected)/     # Routes requiring authentication
│   ├── admin/           # Admin dashboard routes
│   ├── api/             # API endpoints
│   ├── auth/            # Authentication pages
│   ├── dashboard/       # User dashboard
├── components/          # Reusable UI components
│   ├── admin/           # Admin-specific components
│   ├── auth/            # Authentication components
│   ├── dashboard/       # Dashboard components
│   ├── ui/              # Base UI components
├── data/                # Database models and operations
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions and shared logic
│   ├── auth.ts          # Authentication utilities
│   ├── mail.ts          # Email sending functions
│   ├── ticket-utils.ts  # Ticket management utilities
├── prisma/              # Prisma schema and migrations
├── public/              # Static assets
└── scripts/             # Utility and maintenance scripts
```

## 🔐 Environment Variables

To run this project, you'll need to set up the following environment variables:

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/lottery"

# Authentication
AUTH_SECRET="your-auth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Email (Resend)
RESEND_API_KEY="re_123456789"
EMAIL_FROM="noreply@0mninetlottery.com"

# Application
APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# CPX Research Integration
CPX_APP_ID="12345"
CPX_SECRET_KEY="your-cpx-secret-key"

# Storage (Cloudflare R2)
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY="your-access-key"
R2_SECRET_KEY="your-secret-key"
R2_BUCKET_NAME="your-bucket-name"
```

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Set up environment variables in `.env`
4. Run database migrations with `npx prisma migrate dev`
5. Start the development server with `npm run dev`

## 📝 License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

---

<div align="center">
  <p>Built with ❤️ by the 0mninet team</p>
  <p>Helping bring internet access to everyone</p>
</div>
