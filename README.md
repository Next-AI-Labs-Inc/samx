# SamX - Federal Contract Discovery Platform

A **production-ready, feature-rich** federal contract discovery platform that transforms how government contractors find opportunities. Built with React 19, Next.js 15, and modern web technologies.

> **🎯 Current Status:** Fully functional platform with advanced search, filtering, sync, and modern UI - ready for immediate use!

## ✅ **Live Features** (Ready to Use)

### 🔍 **Advanced Search & Discovery**
- **Live SAM.gov Sync** - Real-time contract data with intelligent background updates
- **Intelligent Full-Text Search** - Search across titles, descriptions, and all contract fields  
- **Smart Keyword Highlighting** - Visual emphasis on matched search terms
- **Search Suggestions** - Dynamic suggestions based on contract data
- **OR Query Support** - Advanced search with multiple terms and phrases

### 🎯 **Powerful Filtering System**  
- **Multi-Agency Filtering** - Filter by multiple government agencies (OR logic)
- **NAICS Code Filtering** - Industry-specific contract discovery
- **Date Range Filtering** - Posted dates and response due dates
- **Award Amount Filtering** - Filter by contract value ranges
- **Status Filtering** - Active, awarded, archived contracts
- **Flexible Matching** - Handles malformed agency names and partial matches

### 💾 **Data Management**
- **Offline-First Architecture** - SQLite caching for offline access
- **Smart Contract Sync** - Incremental updates with conflict resolution
- **CSV Import/Export** - Bulk data operations
- **Real-Time Status** - Live sync indicators and progress tracking
- **Data Persistence** - Redux store with local persistence

### 🎨 **Modern User Experience**
- **Responsive Design** - Works flawlessly on desktop, tablet, and mobile
- **Accessibility Compliant** - WCAG guidelines with screen reader support  
- **Dark/Light Themes** - Modern UI built with Shadcn/UI components
- **Progressive Loading** - Smooth animations and loading states
- **Keyboard Navigation** - Full keyboard accessibility

### 📊 **Analytics & Insights**
- **Contract Feed Dashboard** - Visual overview of recent opportunities
- **Search Analytics** - Track search performance and results
- **Filter Statistics** - Agency and NAICS distribution insights
- **Sync Monitoring** - Database status and sync health metrics

## 🤔 **Why SamX?**

### **The Problem with SAM.gov**
- ❌ Clunky, outdated interface from the early 2000s
- ❌ Limited search capabilities and poor filtering
- ❌ No offline access or data persistence
- ❌ Difficult navigation and poor user experience
- ❌ No advanced analytics or insights

### **The SamX Solution**
- ✅ **Modern, intuitive interface** built with today's web standards
- ✅ **Lightning-fast search** with intelligent highlighting and suggestions
- ✅ **Advanced filtering** that actually works (handles malformed data gracefully)
- ✅ **Offline-first design** - works even when SAM.gov is down
- ✅ **Mobile-responsive** - search contracts on any device
- ✅ **Open source** - customize and extend for your needs

### **Perfect For**
🏢 **Government Contractors** - Find opportunities faster with better search  
💼 **Small Businesses** - Level the playing field with enterprise-grade tools  
💻 **Developers** - Build on our open API and extend functionality  
📈 **Researchers** - Analyze federal spending patterns and trends  
🚀 **Startups** - Enter the gov-tech market with proven technology

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

## 🗺️ **Development Roadmap**

### ✅ **Phase 1: Core Platform** (COMPLETED)
- [x] **Next.js 15 + React 19** with TypeScript foundation
- [x] **Shadcn/UI component system** with accessibility
- [x] **Redux Toolkit** state management with persistence
- [x] **SQLite database** with repository pattern
- [x] **SAM.gov API integration** with real-time sync
- [x] **Advanced search** with highlighting and suggestions
- [x] **Multi-criteria filtering** with flexible matching
- [x] **Responsive UI** with modern design system
- [x] **Offline support** with intelligent caching
- [x] **CSV import/export** for bulk operations

### 🤖 **Phase 2: AI-Powered Proposal Engine** (Next)
- [ ] **Automated Proposal Generation** - AI writes initial proposals from contract requirements
- [ ] **Company Document Sync** - Connect your capabilities, past performance, and team docs
- [ ] **Semantic Contract Analysis** - AI extracts key requirements, evaluation criteria, and compliance needs
- [ ] **Intelligent Matching** - Score opportunities based on your company profile and win probability
- [ ] **Proposal Template Engine** - Generate section-specific content using your company knowledge base

### 🧠 **Phase 3: Agentic Intelligence** (Future)
- [ ] **Research Agent** - Autonomous research on contracting agencies, requirements, and competitors
- [ ] **Proposal Review Agent** - AI-powered proposal review for compliance and competitiveness  
- [ ] **Market Intelligence** - Track trends, agency spending patterns, and competitive landscape
- [ ] **Smart Notifications** - Proactive alerts for high-value opportunities matching your capabilities
- [ ] **Bid/No-Bid Decision Support** - AI recommendations based on win probability and ROI analysis

### 🏢 **Phase 4: Enterprise Scale** (Advanced)
- [ ] **Team Collaboration** - Multi-user proposal workflows with role-based access
- [ ] **Integration Ecosystem** - Connect with CRM, accounting, and project management tools
- [ ] **Custom AI Models** - Train specialized models on your company's successful proposals
- [ ] **Compliance Automation** - Automated compliance checking and document generation
- [ ] **Performance Analytics** - Track proposal success rates and optimize strategies

> **🎯 Vision:** Transform SamX from a contract discovery tool into an end-to-end AI-powered federal contracting assistant that handles everything from opportunity identification to proposal submission.

## ⚙️ **Technical Architecture**

### **Frontend Stack**
- **React 19** + **Next.js 15** with App Router and Turbopack
- **TypeScript** for type safety and developer experience
- **Shadcn/UI** components built on Radix primitives
- **Tailwind CSS** with custom design system
- **Redux Toolkit** for state management with persistence

### **Backend & Data**
- **SQLite** database with better-sqlite3 for performance
- **SAM.gov API** integration with intelligent retry logic
- **Node-cron** scheduled sync jobs
- **Better-sqlite3** for high-performance database operations
- **Axios** HTTP client with rate limiting and error handling

### **Key Features Implemented**
- ✅ **Real-time contract synchronization** from SAM.gov
- ✅ **Advanced full-text search** with FTS5 indexing
- ✅ **Smart filtering system** with multiple criteria
- ✅ **Responsive UI** with accessibility compliance
- ✅ **Offline-first architecture** with intelligent caching
- ✅ **CSV import/export** for bulk data operations
- ✅ **Progressive loading** with smooth UX transitions

## 📋 **Data Flow**

1. **SAM.gov Sync Service** - Automated background sync with intelligent retry and throttling
2. **SQLite Database** - High-performance local storage with FTS5 full-text indexing
3. **Redux Store** - Centralized state management with persistence across sessions
4. **React Components** - Modern, accessible UI components with real-time updates
5. **Search Engine** - Advanced search with highlighting, suggestions, and flexible matching
6. **Filter System** - Multi-dimensional filtering with OR logic and partial matching

## 🤝 **Contributing**

We welcome contributions from the community! SamX is built to be developer-friendly and extensible.

### **How to Contribute**
- 🐛 **Bug Reports** - Found an issue? Open a GitHub issue with reproduction steps
- ✨ **Feature Requests** - Have an idea? Discuss it in GitHub Discussions first
- 📝 **Code Contributions** - Submit PRs with clear descriptions and tests
- 📚 **Documentation** - Help improve setup guides and API docs

### **Development Guidelines**
- Use 2-space indentation and trailing commas
- Follow PascalCase for components, camelCase for utilities  
- Run `npm run lint` and `npm run verify` before submitting PRs
- Add tests for new features and bug fixes
- Update documentation for any API changes

## 📜 **License**

**Dual License Model:**
- **Free for small organizations** (under $100K annual revenue) - MIT-style permissions
- **Commercial license required** for larger organizations ($100K+ revenue)
- See [LICENSE](./LICENSE) file for complete terms

## 🎆 **What's Next?**

SamX is just getting started! We're building toward an AI-powered federal contracting assistant that will:

🤖 **Generate proposals automatically** from contract requirements  
📄 **Sync your company documents** and capabilities  
🧠 **Provide intelligent recommendations** on bid/no-bid decisions  
🔍 **Research competitors and agencies** autonomously  
📧 **Send smart notifications** for high-value opportunities  

---

🎯 **Ready to revolutionize federal contracting?** Star the repo, try the platform, and join our community of innovators building the future of gov-tech!
