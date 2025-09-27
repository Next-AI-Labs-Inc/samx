# SamX Landing Page & Setup System

## Overview
This implementation adds a comprehensive landing page system with API key setup, CSV upload guides, and integrated feedback functionality to the SamX application.

## Features Added

### 1. Landing Page (`/`)
**File:** `src/components/landing/landing-page.tsx`
- Modern gradient design with hero section
- Dynamic "Enter App" or "Get Started" buttons based on setup status
- Features showcase with Smart Search, Mass Upload, and Real-time Sync
- Integration with setup and guide pages
- Built-in feedback trigger functionality

### 2. API Key Setup Page (`/setup`)  
**File:** `src/app/setup/page.tsx`
- Step-by-step instructions for obtaining SAM.gov API key
- Direct links to SAM.gov API documentation
- User information form (name, email, phone)
- API key validation and secure storage
- Success state with automatic redirect to dashboard

### 3. CSV Upload Guide (`/guide`)
**File:** `src/app/guide/page.tsx`  
- Comprehensive guide for mass CSV uploads
- Instructions on where to get contract data:
  - SAM.gov API exports
  - SAM.gov daily data extracts  
  - Third-party providers
- CSV format specifications with downloadable sample
- Field requirements and validation rules
- Step-by-step upload process

### 4. Feedback System
**Files:** 
- `src/components/feedback/feedback-form.tsx`
- `src/app/api/feedback/route.ts`

**Features:**
- Floating feedback button on all pages
- Modal form collecting name, phone, email, and feedback
- Automatic page context capture (URL, title)
- Email integration sending feedback to founder@ixcoach.com
- SQLite storage of feedback submissions
- Status tracking (pending, sent, failed)

### 5. Database Schema Extensions
**File:** `src/lib/db/schema.sql`
- Added `user_settings` table for API keys and user info
- Added `feedback` table for user feedback submissions  
- Proper indexing and relationships

### 6. API Endpoints

#### Settings API (`/api/settings`)
- `GET` - Retrieve user settings (API key masked)
- `POST` - Save/update API key and user information  
- `PUT` - Update specific settings fields

#### Feedback API (`/api/feedback`)
- `POST` - Submit feedback with email sending
- `GET` - Retrieve feedback submissions (admin)

## File Structure

```
src/
├── app/
│   ├── setup/page.tsx           # API key setup page
│   ├── guide/page.tsx           # CSV upload guide  
│   ├── dashboard/page.tsx       # Updated dashboard with feedback
│   └── api/
│       ├── settings/route.ts    # User settings API
│       └── feedback/route.ts    # Feedback submission API
├── components/
│   ├── landing/
│   │   └── landing-page.tsx     # Main landing page component
│   ├── feedback/
│   │   └── feedback-form.tsx    # Feedback form and floating button
│   └── ui/
│       ├── label.tsx            # Form label component
│       ├── textarea.tsx         # Textarea component  
│       └── alert.tsx            # Alert notification component
└── lib/
    └── db/
        └── schema.sql           # Extended database schema
```

## Environment Configuration

Added to `.env.example`:
```bash
# Email Configuration (Required for feedback form)
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  
SMTP_FROM=your-email@gmail.com
```

## Key User Experience Flows

### 1. First-Time User
1. Lands on beautiful homepage (`/`)
2. Sees "Get Started" call-to-action
3. Clicks to go to setup page (`/setup`)
4. Follows SAM.gov API key instructions
5. Enters API key and personal info
6. Gets redirected to dashboard (`/dashboard`)
7. Can provide feedback via floating button

### 2. Returning User  
1. Lands on homepage (`/`)
2. Sees "Enter App" button (setup detected)
3. Goes directly to dashboard
4. Can access guide and feedback anytime

### 3. CSV Upload Process
1. User clicks "View Upload Guide" 
2. Learns where to get contract data
3. Downloads sample CSV format
4. Prepares their data file
5. Uses dashboard import feature

## Technical Implementation

**Full path of concerning items and UX flow impacts:**

- **Landing Page** (`/Users/jedi/react_projects/ix/samx/src/app/page.tsx`): Main entry point that determines user journey based on setup status, affecting initial user experience and onboarding flow.

- **API Setup** (`/Users/jedi/react_projects/ix/samx/src/app/setup/page.tsx`): Critical setup flow that validates and stores SAM.gov credentials, enabling core application functionality for contract data access.

- **Database Schema** (`/Users/jedi/react_projects/ix/samx/src/lib/db/schema.sql`): Extended schema supports user management and feedback collection, enabling persistent user state and communication channels.

- **Feedback System** (`/Users/jedi/react_projects/ix/samx/src/components/feedback/feedback-form.tsx`): Floating feedback button provides continuous feedback collection across all pages, improving product development and user satisfaction.

The implementation creates a seamless onboarding experience that guides users from initial landing through API setup to productive use of the contract management system, while maintaining open feedback channels for continuous improvement.

## Dependencies Added
- `nodemailer` - Email sending functionality  
- `@types/nodemailer` - TypeScript support
- `@radix-ui/react-label` - Form labels
- UI components (Alert, Textarea, Label) for forms

## Next Steps
1. Configure SMTP settings in `.env` file
2. Test email functionality with feedback form
3. Customize email templates as needed
4. Consider adding email verification for user setup
5. Implement feedback dashboard for admin review