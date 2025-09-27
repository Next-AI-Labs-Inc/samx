# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

SamX is a federal contract discovery platform that modernizes access to SAM.gov opportunities. Built with Next.js 15, it provides intelligent search, filtering, and synchronization capabilities for government contracting data.

**Key Technologies:**
- Next.js 15 (App Router, React 19) with Turbopack
- Redux Toolkit with persistence
- SQLite database (better-sqlite3) with planned MongoDB migration
- Shadcn/UI components (Radix primitives + Tailwind CSS)
- TypeScript with strict configuration

## Common Development Commands

### Development Environment
```bash
# Start development server (custom port 6233)
npm run dev

# Production build with Turbopack
npm run build

# Start production server
npm run start

# Type checking without compilation
npm run verify

# ESLint validation
npm run lint
```

### Database Operations
```bash
# Test database connection and schema
node test-db.js

# Test SAM.gov API key
node scripts/test-api-key.js
```

### Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Required: Add your SAM.gov API key to .env.local
# SAM_API_KEY=your_actual_api_key_here
```

## Architecture Overview

### Repository Pattern with Database Abstraction
The codebase uses a repository pattern to abstract database operations, making it easy to switch between SQLite (development) and MongoDB (production).

- **Repository Interface**: `src/lib/repositories/contract-repository.ts` defines the contract
- **SQLite Implementation**: `src/lib/repositories/sqlite-contract-repository.ts` 
- **Factory Pattern**: `src/lib/repositories/index.ts` creates appropriate repository instances
- **Database Connection**: `src/lib/db/connection.ts` handles SQLite setup with performance optimizations

### Redux Store Architecture
Sophisticated state management with selective persistence:

**Store Structure** (`src/lib/store/index.ts`):
- `contracts`: Contract data (not persisted - fetched fresh)
- `search`: Search state with selective persistence (history, saved searches)
- `sync`: Sync status (not persisted)
- `settings`: User preferences (persisted)

**Key Slices:**
- `contracts-slice.ts`: Contract CRUD operations, async thunks for API calls
- `search-slice.ts`: Search functionality, filters, saved searches
- `sync-slice.ts`: SAM.gov synchronization status
- `settings-slice.ts`: User preferences and configuration

### SAM.gov Integration Service
**Core Service** (`src/lib/services/sam-api.ts`):
- Handles SAM.gov API authentication and rate limiting
- Automatic date formatting (MM/dd/yyyy requirement)
- Intelligent throttling detection and retry logic
- Detailed error handling for quota limits and API issues

**Sync Service** (`src/lib/services/sync-service.ts`):
- Incremental sync strategy to avoid duplicate API calls
- Defensive duplicate detection using multiple identifiers
- Adaptive scheduling based on data change frequency
- Progress reporting and error resilience

### Data Flow Architecture

1. **API Layer**: Next.js API routes in `/api/contracts/`
2. **Service Layer**: SAM.gov API integration and sync logic
3. **Repository Layer**: Database abstraction (SQLite ↔ MongoDB)
4. **State Layer**: Redux slices with selective persistence
5. **UI Layer**: React components with Shadcn/UI

### Component Organization

**Layout Structure:**
- `src/app/layout.tsx`: Root layout with Redux provider
- `src/components/layout/main-layout.tsx`: Main app shell with sidebar navigation

**Feature Components:**
- `src/components/contracts/`: Contract display components
- `src/components/filters/`: Search and filter UI
- `src/components/dashboard/`: Main dashboard interface
- `src/components/sync/`: Sync status and controls

**UI Components:**
- `src/components/ui/`: Shadcn/UI component library
- All components follow Radix accessibility patterns

### Type System

**Core Types** (`src/lib/types/contract.ts`):
- `Contract`: Main contract interface matching SAM.gov structure
- `ContractFilters`: Search and filter parameters
- `ContractSearchResult`: Paginated search results
- `SavedSearch`: Persistent search configurations
- `SyncStatus`: Background sync tracking

**Database Mapping:**
- Separate `*Row` interfaces for SQLite snake_case columns
- Transformation methods in repositories handle camelCase ↔ snake_case

## Development Patterns

### Path Aliases
- Use `@/*` for all imports from `src/`
- Example: `import { Button } from '@/components/ui/button'`

### Error Handling
- SAM.gov API errors are categorized (throttling, date format, quota)
- Repository operations include detailed error logging
- Redux async thunks handle loading/error states consistently

### Data Synchronization
- Default sync interval: 4 hours (adaptive based on data activity)
- Incremental sync strategy prevents duplicate processing
- Progress reporting through callback functions

### Database Schema
- Schema managed in `src/lib/db/schema.sql`
- Foreign key constraints enabled
- Optimized for search performance with proper indexing

### Component Patterns
- Functional components with TypeScript
- Shadcn/UI for consistent design system
- Redux hooks for state management (`useSelector`, `useDispatch`)

### Testing Strategy
- Type checking with `npm run verify`
- Database operations tested via repository pattern
- API integration tested through service layer

## Important File Locations

**Configuration:**
- `/Users/jedi/react_projects/ix/samx/package.json` - Dependencies and scripts
- `/Users/jedi/react_projects/ix/samx/tsconfig.json` - TypeScript configuration
- `/Users/jedi/react_projects/ix/samx/tailwind.config.ts` - Styling configuration

**Core Architecture:**
- `/Users/jedi/react_projects/ix/samx/src/lib/store/index.ts` - Redux store setup
- `/Users/jedi/react_projects/ix/samx/src/lib/repositories/index.ts` - Repository factory
- `/Users/jedi/react_projects/ix/samx/src/lib/services/sam-api.ts` - SAM.gov integration
- `/Users/jedi/react_projects/ix/samx/src/lib/types/contract.ts` - Type definitions

**Key Components:**
- `/Users/jedi/react_projects/ix/samx/src/app/layout.tsx` - Root layout
- `/Users/jedi/react_projects/ix/samx/src/components/layout/main-layout.tsx` - App shell
- `/Users/jedi/react_projects/ix/samx/src/lib/db/connection.ts` - Database setup