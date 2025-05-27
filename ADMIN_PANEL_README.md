# 0mninet Lottery - Admin Panel Documentation

## Overview

The admin panel has been completely revamped with comprehensive features for managing the 0mninet lottery platform. This document outlines all the improvements, features, and fixes implemented.

## 🎯 Key Improvements

### 1. **Fixed Referral Code API Error**
- **Issue**: `Record to update not found` error when generating referral codes
- **Fix**: Added proper user existence validation and used `upsert` instead of `update`
- **Location**: `app/api/referrals/code/route.ts`

### 2. **Enhanced Admin Dashboard** 
- Professional 0mninet branding with logo and company information
- Comprehensive metrics and statistics
- Real-time data fetching with error handling
- **Location**: `app/admin/page.tsx`

### 3. **Updated Sidebar Navigation**
- Replaced "Active Tickets" with "Newsletter" management
- Organized into logical sections (Main, Communication, Lottery, System)
- Dynamic badge counts from database
- **Location**: `components/admin/sidebar.tsx`

### 4. **Newsletter Management System**
- Complete newsletter subscriber management
- Search and filter functionality
- Performance metrics and engagement tracking
- **Location**: `app/admin/newsletter/page.tsx`

### 5. **Enhanced Users Management**
- Advanced search by name/email
- Sortable columns including date joined
- User statistics summary
- **Location**: `components/admin/users-table.tsx`

### 6. **Dynamic Prize Management**
- Database-driven prize amount configuration
- Settings table for platform configuration
- Admin interface for updating prize amounts
- **Location**: `app/admin/settings/page.tsx`, `lib/settings.ts`

### 7. **Global "Applied Tickets" Terminology**
- Updated all references from "active tickets" to "applied tickets"
- Consistent terminology throughout the admin panel

## 🚀 New Features

### Admin Dashboard Features
- **0mninet Branding**: Professional header with logo and company mission
- **Real-time Metrics**: Live user counts, ticket statistics, prize information
- **Next Draw Information**: Current prize pool and participant details
- **Recent Winners**: Display of latest lottery winners
- **Platform Health**: Activity rates and engagement metrics

### Newsletter Management
- **Subscriber List**: Complete list with search and sorting
- **Statistics**: Subscription rates, engagement metrics
- **Performance Tracking**: Recent subscribers, participation rates

### Prize Management
- **Dynamic Configuration**: Change prize amounts without code deployment
- **Settings API**: RESTful API for configuration management
- **Validation**: Min/max limits and proper error handling

### Enhanced User Management
- **Advanced Search**: Filter by name or email
- **Sorting Options**: Sort by name, email, join date, ticket count
- **User Statistics**: Total users, admins, blocked users, applied tickets

## 🛠 Technical Implementation

### Database Schema Updates
- **Settings Table**: New table for platform configuration
- **Migration**: Automatic database migration for Settings table
- **Default Values**: Automatic initialization of default settings

### API Endpoints
- `/api/admin/counts` - Admin sidebar badge counts
- `/api/admin/settings` - Settings CRUD operations
- `/api/referrals/code` - Fixed referral code generation

### Error Handling
- **Robust Database Queries**: Promise.allSettled for parallel operations
- **Fallback Values**: Graceful degradation when data is unavailable
- **User Feedback**: Toast notifications for user actions

## 📁 File Structure

```
app/
├── admin/
│   ├── page.tsx                    # Enhanced admin dashboard
│   ├── newsletter/
│   │   └── page.tsx               # Newsletter management
│   └── settings/
│       └── page.tsx               # Admin settings with prize management
├── api/
│   ├── admin/
│   │   ├── counts/route.ts        # Updated counts API
│   │   └── settings/route.ts      # Settings CRUD API
│   └── referrals/
│       └── code/route.ts          # Fixed referral code API
components/
├── admin/
│   ├── sidebar.tsx                # Updated navigation
│   ├── newsletter-table.tsx       # Newsletter management component
│   ├── users-table.tsx           # Enhanced user management
│   └── prize-amount-manager.tsx   # Prize management component
lib/
├── settings.ts                    # Settings utility functions
└── db-init.ts                    # Database initialization utility
prisma/
└── schema.prisma                  # Updated with Settings model
scripts/
└── init-db.ts                    # Database initialization script
```

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database
```bash
npm run db:push
npm run db:init
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Access Admin Panel
Navigate to `/admin` (requires admin role)

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push database schema changes
- `npm run db:init` - Initialize database with defaults
- `npm run db:reset` - Reset database (caution: destructive)

## 🎯 Admin Panel Features

### Dashboard
- **Company Branding**: 0mninet logo and mission statement
- **Key Metrics**: Users, tickets, winners, newsletter subscribers
- **Active Draw Info**: Current prize pool and participants
- **Recent Winners**: Latest lottery results
- **Platform Analytics**: Activity rates and engagement metrics

### User Management
- **Search & Filter**: Find users by name or email
- **Sorting**: Sort by various criteria
- **User Actions**: Block/unblock, delete users
- **Statistics**: Overview of user base

### Newsletter Management
- **Subscriber Overview**: All newsletter subscribers
- **Search Functionality**: Find specific subscribers
- **Engagement Metrics**: Participation rates and statistics
- **Export Options**: (Coming soon)

### Settings
- **Prize Management**: Set default prize amounts for new draws
- **System Settings**: Platform configuration options
- **Maintenance Mode**: (Coming soon)

## 🔐 Security & Access Control

- **Admin Role Required**: All admin features require ADMIN role
- **API Protection**: All admin APIs validate admin permissions
- **Input Validation**: Proper validation for all form inputs
- **Error Handling**: Graceful error handling throughout

## 📊 Database Configuration

### Settings Table
The new Settings table stores platform configuration:

```sql
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL UNIQUE,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);
```

### Default Settings
- `default_prize_amount`: "50" - Default prize amount for new draws

## 🐛 Bug Fixes

1. **Referral Code Generation Error**
   - Fixed "Record to update not found" error
   - Added proper user validation
   - Implemented upsert for race condition handling

2. **Admin Counts API**
   - Added newsletter subscribers count
   - Updated terminology to "applied tickets"
   - Improved error handling

3. **Dashboard Data Loading**
   - Implemented Promise.allSettled for parallel queries
   - Added fallback values for failed queries
   - Improved error boundaries

## 🔄 Future Enhancements

- **Email Campaign Management**: Send newsletters to subscribers
- **Advanced Analytics**: Detailed reporting and insights
- **Maintenance Mode**: System-wide maintenance capability
- **Database Backup**: Automated backup functionality
- **Audit Logging**: Track admin actions and changes

## 📞 Support

For issues or questions about the admin panel, please refer to the application logs or contact the development team.

---

**Built for 0mninet - Connecting the World Through Technology** 🌐 