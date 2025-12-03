# Local Development Setup Guide

Complete guide for setting up the ResurrectionStockPicker application on your local machine.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Database Configuration](#database-configuration)
4. [Environment Variables](#environment-variables)
5. [Running the Application](#running-the-application)
6. [Development Workflow](#development-workflow)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js** 18.0 or higher ([Download](https://nodejs.org/))
- **npm** 9.0 or higher (comes with Node.js)
- **PostgreSQL** 14 or higher ([Download](https://www.postgresql.org/download/))
  - Alternative: Use SQLite for quick local testing (see Database Configuration)
- **Git** ([Download](https://git-scm.com/downloads))

### Verify Installation

```bash
# Check Node.js version
node --version
# Should output: v18.x.x or higher

# Check npm version
npm --version
# Should output: 9.x.x or higher

# Check PostgreSQL (if installed)
psql --version
# Should output: psql (PostgreSQL) 14.x or higher

# Check Git
git --version
# Should output: git version 2.x.x or higher
```

## Initial Setup

### 1. Clone the Repository

```bash
# Clone the repository
git clone <repository-url>
cd resurrection-stock-picker

# Or if you already have the code
cd resurrection-stock-picker
```

### 2. Install Dependencies

```bash
# Install all npm packages
npm install

# This will also run 'prisma generate' automatically via postinstall script
```

**Expected Output:**
```
added XXX packages in XXs
✔ Generated Prisma Client
```

### 3. Verify Installation

```bash
# Check if all dependencies are installed
npm list --depth=0

# Should show all packages from package.json
```

## Database Configuration

You have three options for local development:

### Option A: PostgreSQL (Recommended for Production-Like Environment)

#### Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Windows:**
Download and install from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE resurrection_stock_picker;

# Create user (optional, for better security)
CREATE USER stockpicker_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE resurrection_stock_picker TO stockpicker_user;

# Exit psql
\q
```

#### Configure Environment

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env` and set:
```bash
DATABASE_URL="postgresql://stockpicker_user:your_secure_password@localhost:5432/resurrection_stock_picker"
DIRECT_URL="postgresql://stockpicker_user:your_secure_password@localhost:5432/resurrection_stock_picker"
```

### Option B: SQLite (Quick Start for Testing)

SQLite requires no installation and is perfect for quick local testing.

#### Configure Environment

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env` and set:
```bash
DATABASE_URL="file:./dev.db"
# DIRECT_URL not needed for SQLite
```

Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

**⚠️ Important:** Remember to switch back to PostgreSQL before deploying to production!

### Option C: Supabase (Cloud PostgreSQL)

#### Create Supabase Project

1. Go to [Supabase](https://supabase.com) and create account
2. Create new project
3. Wait for database to provision (~2 minutes)

#### Get Connection Strings

1. Go to Project Settings → Database
2. Copy connection strings:
   - **Connection pooling** (Transaction mode) → Use for `DATABASE_URL`
   - **Direct connection** → Use for `DIRECT_URL`

#### Configure Environment

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env` and paste your Supabase connection strings:
```bash
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

### Run Database Migrations

After configuring your database, run migrations:

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Verify migration success
npx prisma studio
# This opens a browser-based database viewer
```

**Expected Output:**
```
✔ Generated Prisma Client
✔ Applied migration: init
```

## Environment Variables

### Required Variables

Create `.env` file from template:
```bash
cp .env.example .env
```

### Core Configuration

Edit `.env` and configure these required variables:

```bash
# Database (already configured in previous step)
DATABASE_URL="your-database-connection-string"
DIRECT_URL="your-direct-connection-string"

# Application
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Optional API Keys

Most data sources work without API keys for development, but you can configure them for better rate limits:

#### Federal Reserve Economic Data (FRED)

**Free API Key:** [Register at FRED](https://fred.stlouisfed.org/docs/api/api_key.html)

```bash
FEDERAL_RESERVE_API_KEY="your-fred-api-key"
```

#### TipRanks (Analyst Ratings)

**Paid Service:** [TipRanks API](https://www.tipranks.com/api)

```bash
TIPRANKS_API_KEY="your-tipranks-key"
```

#### Simply Wall St (Valuations)

**Paid Service:** [Simply Wall St API](https://simplywall.st/api)

```bash
SIMPLY_WALL_ST_API_KEY="your-simplywall-key"
```

#### Morningstar (Financial Data)

**Paid Service:** [Morningstar API](https://www.morningstar.com/products/data)

```bash
MORNINGSTAR_API_KEY="your-morningstar-key"
```

### Data Source URLs

Default URLs are pre-configured in `.env.example`. Only change if you need custom endpoints:

```bash
# SEC EDGAR - Public, no key required
SEC_EDGAR_BASE_URL="https://www.sec.gov/cgi-bin/browse-edgar"
SEC_EDGAR_API_URL="https://data.sec.gov"

# Yahoo Finance - Public, no key required
YAHOO_FINANCE_BASE_URL="https://finance.yahoo.com"
YAHOO_FINANCE_QUERY_URL="https://query2.finance.yahoo.com"

# Finviz - Public, no key required
FINVIZ_BASE_URL="https://finviz.com"
FINVIZ_SCREENER_URL="https://finviz.com/screener.ashx"

# ... see .env.example for complete list
```

### Rate Limiting Configuration

Adjust rate limits (requests per minute) based on your API tier:

```bash
# Free tier defaults
RATE_LIMIT_SEC_EDGAR=10
RATE_LIMIT_YAHOO_FINANCE=60
RATE_LIMIT_FINVIZ=30
RATE_LIMIT_FEDERAL_RESERVE=120

# Adjust higher if you have paid API access
```

### Cache Configuration

Configure cache durations (in seconds):

```bash
# Macro economic data - updates infrequently
CACHE_MACRO_DATA=3600  # 1 hour

# Sector data - daily updates
CACHE_SECTOR_DATA=86400  # 24 hours

# Stock quotes - frequent updates
CACHE_QUOTES=900  # 15 minutes

# Company profiles - rarely changes
CACHE_COMPANY_PROFILES=604800  # 7 days
```

## Running the Application

### Start Development Server

```bash
# Start Next.js development server
npm run dev
```

**Expected Output:**
```
▲ Next.js 14.2.0
- Local:        http://localhost:3000
- Network:      http://192.168.1.x:3000

✓ Ready in 2.5s
```

### Access the Application

Open your browser and navigate to:
- **Local:** http://localhost:3000
- **Network:** http://192.168.1.x:3000 (accessible from other devices on your network)

### Verify Setup

1. **Home Page:** Should load without errors
2. **Create Workflow:** Click "Start New Workflow"
3. **Profile Form:** Fill out investment profile
4. **Submit:** Should create workflow session and redirect

If all steps work, your setup is complete! 🎉

## Development Workflow

### Common Commands

```bash
# Development server (with hot reload)
npm run dev

# Build for production (test build locally)
npm run build

# Start production server (after build)
npm start

# Run linter
npm run lint

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Generate Prisma Client (after schema changes)
npm run prisma:generate

# Create new migration
npm run prisma:migrate

# Reset database (⚠️ deletes all data)
npx prisma migrate reset
```

### Development Best Practices

#### 1. Database Changes

When modifying `prisma/schema.prisma`:

```bash
# 1. Make changes to schema.prisma
# 2. Generate new Prisma Client
npm run prisma:generate

# 3. Create and apply migration
npm run prisma:migrate
# Enter migration name when prompted

# 4. Verify changes in Prisma Studio
npm run prisma:studio
```

#### 2. Code Changes

- **Hot Reload:** Next.js automatically reloads on file changes
- **Type Checking:** TypeScript checks types on save
- **Linting:** Run `npm run lint` before committing

#### 3. Testing Changes

```bash
# Run all tests
npm test

# Run specific test file
npm test -- lib/__tests__/validation.test.ts

# Run tests in watch mode (re-runs on changes)
npm run test:watch
```

#### 4. Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Description of changes"

# Push to remote
git push origin feature/your-feature-name

# Create pull request on GitHub
```

### Project Structure

```
resurrection-stock-picker/
├── app/                          # Next.js App Router
│   ├── api/                     # API routes
│   │   ├── workflows/           # Workflow management
│   │   ├── profiles/            # User profiles
│   │   └── cron/                # Scheduled jobs
│   ├── workflow/                # Workflow pages
│   │   ├── new/                 # Create workflow
│   │   └── [sessionId]/         # Workflow session
│   ├── glossary/                # Glossary page
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   └── globals.css              # Global styles
├── components/                   # React components
│   ├── ProfileForm.tsx          # Investment profile form
│   ├── WorkflowProgress.tsx     # Progress indicator
│   ├── MarketOverview.tsx       # Market data display
│   └── ...                      # Other components
├── lib/                          # Core business logic
│   ├── types/                   # TypeScript interfaces
│   ├── step-processors/         # Workflow step logic
│   ├── data-adapters/           # External API adapters
│   ├── workflow-orchestrator.ts # Workflow management
│   ├── analysis-engine.ts       # Analysis calculations
│   ├── state-manager.ts         # State persistence
│   ├── cache-config.ts          # Caching utilities
│   └── ...                      # Other utilities
├── prisma/                       # Database
│   ├── schema.prisma            # Database schema
│   ├── migrations/              # Migration history
│   └── dev.db                   # SQLite database (if using)
├── .env                          # Environment variables (not in git)
├── .env.example                  # Environment template
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── tailwind.config.ts            # Tailwind CSS config
└── next.config.js                # Next.js config
```

## Testing

### Run Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- lib/__tests__/validation.test.ts

# Run tests with coverage
npm test -- --coverage
```

### Test Structure

```
__tests__/
├── lib/
│   ├── validation.test.ts           # Input validation tests
│   ├── analysis-engine.test.ts      # Analysis calculations
│   ├── workflow-orchestrator.test.ts # Workflow logic
│   └── state-manager.integration.test.ts # Database tests
├── lib/step-processors/
│   └── technical-trends-processor.test.ts # Step processor tests
└── app/api/
    └── api-integration.test.ts      # API endpoint tests
```

### Writing Tests

Example test file:

```typescript
import { describe, it, expect } from 'vitest';
import { validateInvestmentProfile } from '@/lib/validation';

describe('Investment Profile Validation', () => {
  it('should accept valid profile', () => {
    const profile = {
      riskTolerance: 'medium',
      investmentHorizonYears: 10,
      capitalAvailable: 50000,
      longTermGoals: 'steady growth'
    };
    
    const result = validateInvestmentProfile(profile);
    expect(result.success).toBe(true);
  });

  it('should reject negative capital', () => {
    const profile = {
      riskTolerance: 'medium',
      investmentHorizonYears: 10,
      capitalAvailable: -1000,
      longTermGoals: 'steady growth'
    };
    
    const result = validateInvestmentProfile(profile);
    expect(result.success).toBe(false);
  });
});
```

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for comprehensive troubleshooting guide.

### Quick Fixes

#### Port Already in Use

```bash
# Error: Port 3000 is already in use

# Solution 1: Use different port
PORT=3001 npm run dev

# Solution 2: Kill process on port 3000
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

#### Database Connection Failed

```bash
# Error: Can't reach database server

# Solution 1: Verify database is running
# PostgreSQL:
pg_isready

# Solution 2: Check connection string
# Verify DATABASE_URL in .env is correct

# Solution 3: Test connection
psql "your-connection-string"
```

#### Prisma Client Not Generated

```bash
# Error: Cannot find module '@prisma/client'

# Solution: Generate Prisma Client
npx prisma generate
```

#### Module Not Found

```bash
# Error: Cannot find module 'xyz'

# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

After completing local setup:

1. ✅ **Explore the Application**
   - Create a workflow session
   - Complete Step 1 (Profile Definition)
   - View the workflow progress

2. ✅ **Review Documentation**
   - [README.md](./README.md) - Project overview
   - [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API reference
   - [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues

3. ✅ **Start Development**
   - Make code changes
   - Run tests
   - Submit pull requests

4. ✅ **Deploy to Production**
   - [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
   - [VERCEL_DEPLOYMENT_CHECKLIST.md](./VERCEL_DEPLOYMENT_CHECKLIST.md) - Deployment checklist

## Support

- **Documentation:** See docs in project root
- **Issues:** Create GitHub issue
- **Questions:** Contact development team

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vitest Documentation](https://vitest.dev)
