# ResurrectionStockPicker

A research workflow system for long-term investors that revives classic value investing methodologies enhanced with modern AI orchestration.

## Overview

ResurrectionStockPicker guides users through a comprehensive 12-step investment research process:

1. **Profile Definition** - Define investment profile and goals
2. **Market Conditions** - Analyze macroeconomic environment
3. **Sector Identification** - Identify growth sectors
4. **Stock Screening** - Screen stocks within top sectors
5. **Fundamental Analysis** - Analyze financial metrics
6. **Competitive Position** - Assess competitive advantages
7. **Valuation Evaluation** - Evaluate stock valuations
8. **Technical Trends** - Review technical indicators (optional)
9. **Analyst Sentiment** - Gather analyst opinions
10. **Position Sizing** - Calculate position sizes
11. **Mock Trade** - Execute simulated trade
12. **Monitoring Setup** - Set up alerts and reviews

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript with strict type checking
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **HTTP Client**: Axios
- **Date Utilities**: date-fns

## Project Structure

```
├── app/                    # Next.js App Router pages
├── components/             # React UI components
├── lib/                    # Core business logic
│   ├── types/             # TypeScript interfaces
│   ├── step-processors/   # Workflow step implementations
│   ├── data-adapters/     # External data source adapters
│   ├── workflow-orchestrator.ts
│   ├── analysis-engine.ts
│   └── state-manager.ts
└── prisma/                # Database schema and migrations
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database URL and API keys

# Run Prisma migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Deployment

This application is designed to be deployed on Vercel with PostgreSQL.

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/resurrection-stock-picker)

### Manual Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions including:

- Database setup (Vercel Postgres or external PostgreSQL)
- Environment variable configuration
- Vercel Cron setup for monitoring alerts
- Troubleshooting and scaling considerations

### Environment Variables

Key environment variables required for deployment:

- `DATABASE_URL` - Pooled PostgreSQL connection string
- `DIRECT_URL` - Direct PostgreSQL connection (for migrations)
- `NODE_ENV` - Set to `production`
- `NEXT_PUBLIC_APP_URL` - Your application URL
- `CRON_SECRET` - Secret for authenticating cron jobs

See `.env.example` for the complete list of configuration options.

## Compliance Notice

This workflow is for **educational purposes only** and does not constitute investment advice. All trades are simulated (mock only). Always consult a qualified financial advisor before making investment decisions.

## License

Private - Educational Use Only
