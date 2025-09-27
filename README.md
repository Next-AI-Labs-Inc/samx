# SamX - Federal Contract Discovery Platform

A modern, intelligent alternative to browsing SAM.gov for federal contract opportunities. Built with Next.js, Redux, and Shadcn/UI for a superior user experience.

## 🚀 Key Features

- **Live Contract Feed**: Continuously synchronized with SAM.gov, never miss new opportunities
- **Intelligent Search**: Full-text search across titles and descriptions with keyword highlighting
- **Smart Filtering**: Filter by NAICS codes, agencies, posting dates, and due dates
- **Saved Searches**: Save your search criteria and get alerts for new matching contracts
- **Offline Support**: Access cached contracts even when offline
- **Modern UI**: Built with Shadcn/UI and Radix for accessibility and polish

## 🛠️ Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd samx
npm install
```

### 2. Get Your SAM.gov API Key
1. Visit [https://api.data.gov/signup/](https://api.data.gov/signup/)
2. Fill out the form with:
   - Your email address
   - First and last name  
   - Organization (optional)
   - Intended use: "Federal contract research and business development"
3. Check your email for the API key

### 3. Configure Environment
```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local and add your API key:
SAM_API_KEY=your_actual_api_key_here
```

### 4. Run the Application
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your contract discovery platform.

## 📋 Development Roadmap

### ✅ Phase 1: Foundation (Current)
- [x] Next.js app setup with TypeScript
- [x] Shadcn/UI component system
- [x] Environment configuration
- [ ] Database schema and repository pattern
- [ ] Redux store setup
- [ ] SAM.gov API integration service

### 🔄 Phase 2: Core Features (In Progress)
- [ ] **Live Contract Sync**: Background service that pulls latest opportunities from SAM.gov hourly
- [ ] **Contract Feed Page**: Homepage displaying recent contracts with sync status
- [ ] **Search Interface**: Debounced search with title/description matching
- [ ] **Keyword Highlighting**: Visual emphasis on matched search terms in results
- [ ] **Basic Filtering**: NAICS, agency, and date range filters

### 🎯 Phase 3: Advanced Discovery
- [ ] **Saved Searches**: Persistent search queries stored in local database
- [ ] **Smart Alerts**: Browser and email notifications for new matching contracts
- [ ] **Contract Detail View**: Full contract information with SAM.gov deep links
- [ ] **Filter Combinations**: Advanced filtering with multiple criteria
- [ ] **Search History**: Track and revisit previous searches

### 🚀 Phase 4: Intelligence & Scale
- [ ] **Semantic Search**: AI-powered contract discovery using embeddings
- [ ] **Contract Analysis**: Extract key requirements and eligibility criteria
- [ ] **Opportunity Scoring**: Rank contracts by relevance to your business
- [ ] **MongoDB Migration**: Scale beyond SQLite for production deployment
- [ ] **Multi-user Support**: Team collaboration features

### 🔮 Phase 5: Enterprise Features
- [ ] **Competitive Intelligence**: Track which companies win similar contracts
- [ ] **Proposal Templates**: Generate starter documents from contract requirements  
- [ ] **Calendar Integration**: Sync due dates with Google/Outlook calendars
- [ ] **API Access**: Programmatic access to your filtered contract data
- [ ] **Custom Dashboards**: Personalized views for different team roles

## 🏗️ Technical Architecture

- **Frontend**: Next.js 15 with App Router, React 19
- **UI Framework**: Shadcn/UI (Radix primitives + Tailwind CSS)
- **State Management**: Redux Toolkit with persistence
- **Database**: SQLite (development) → MongoDB (production)
- **Styling**: Tailwind CSS with design system variables
- **API Integration**: Axios with retry logic and rate limiting
- **Background Jobs**: Node-cron for scheduled SAM.gov sync

## 📊 Data Flow

1. **Sync Service** polls SAM.gov API hourly for new/updated contracts
2. **Repository Layer** abstracts database operations (SQLite ↔ MongoDB)
3. **Redux Store** manages UI state, search queries, and filters
4. **React Components** provide responsive, accessible interface
5. **Search Engine** indexes contract text for fast keyword matching

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

- Use 2-space indentation and trailing commas
- Follow PascalCase for components, camelCase for utilities
- Co-locate tests with source files
- Run `npm run lint` before committing
- Update this roadmap when completing major features

## 📄 License

MIT License - see LICENSE file for details

---

**Why SamX?** Because finding federal contracts shouldn't feel like archaeological excavation. We're building the modern interface SAM.gov should have had from the beginning.
