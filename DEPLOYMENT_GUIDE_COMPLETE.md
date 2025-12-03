# Complete Deployment Guide - ResurrectionStockPicker

This is the master deployment guide that references all other documentation. Use this as your starting point for deploying the ResurrectionStockPicker application.

## 📚 Documentation Index

This project has comprehensive documentation split across multiple files:

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [LOCAL_DEVELOPMENT_SETUP.md](./LOCAL_DEVELOPMENT_SETUP.md) | Complete local setup guide | Setting up development environment |
| [DATABASE_SETUP_GUIDE.md](./DATABASE_SETUP_GUIDE.md) | Database configuration | Database connection issues |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Production deployment | Deploying to Vercel |
| [VERCEL_DEPLOYMENT_CHECKLIST.md](./VERCEL_DEPLOYMENT_CHECKLIST.md) | Pre-deployment checklist | Before deploying |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Common issues and solutions | When things go wrong |
| [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | API reference | Building integrations |
| [PERFORMANCE_OPTIMIZATION_QUICK_START.md](./PERFORMANCE_OPTIMIZATION_QUICK_START.md) | Performance tips | Optimizing performance |
| [README.md](./README.md) | Project overview | Understanding the project |

---

## 🚀 Quick Start Paths

Choose your path based on what you want to do:

### Path 1: Local Development (First Time)

**Goal:** Get the application running on your local machine

**Steps:**
1. ✅ Read [LOCAL_DEVELOPMENT_SETUP.md](./LOCAL_DEVELOPMENT_SETUP.md)
2. ✅ Follow Prerequisites section
3. ✅ Complete Initial Setup
4. ✅ Configure Database (choose PostgreSQL, SQLite, or Supabase)
5. ✅ Set up Environment Variables
6. ✅ Run the application

**Time Required:** 30-60 minutes

**Common Issues:** See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) sections:
- Installation Issues
- Database Issues
- Development Server Issues

### Path 2: Production Deployment (Vercel)

**Goal:** Deploy the application to production on Vercel

**Prerequisites:**
- Application working locally
- Vercel account created
- Database provisioned (Vercel Postgres or external)

**Steps:**
1. ✅ Review [VERCEL_DEPLOYMENT_CHECKLIST.md](./VERCEL_DEPLOYMENT_CHECKLIST.md)
2. ✅ Complete all checklist items
3. ✅ Follow [DEPLOYMENT.md](./DEPLOYMENT.md) guide
4. ✅ Configure environment variables in Vercel
5. ✅ Deploy and verify

**Time Required:** 20-40 minutes

**Common Issues:** See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) sections:
- Build and Deployment Issues
- Environment Variable Issues

### Path 3: Troubleshooting

**Goal:** Fix issues with existing setup

**Steps:**
1. ✅ Identify the issue category
2. ✅ Go to [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
3. ✅ Find your issue in the Table of Contents
4. ✅ Follow the solutions provided

**Categories:**
- Installation Issues
- Database Issues
- Development Server Issues
- Data Source Issues
- Workflow Execution Issues
- Build and Deployment Issues
- Performance Issues
- Testing Issues
- Environment Variable Issues

---

## 📋 Complete Setup Checklist

Use this master checklist to track your progress:

### Local Development Setup

- [ ] **Prerequisites Installed**
  - [ ] Node.js 18+ installed
  - [ ] npm 9+ installed
  - [ ] PostgreSQL 14+ installed (or using SQLite/Supabase)
  - [ ] Git installed

- [ ] **Repository Setup**
  - [ ] Code cloned/downloaded
  - [ ] Dependencies installed (`npm install`)
  - [ ] Prisma Client generated

- [ ] **Database Configuration**
  - [ ] Database created (PostgreSQL/SQLite/Supabase)
  - [ ] `.env` file created from `.env.example`
  - [ ] `DATABASE_URL` configured
  - [ ] `DIRECT_URL` configured (if using PostgreSQL)
  - [ ] Migrations run successfully
  - [ ] Prisma Studio accessible

- [ ] **Environment Variables**
  - [ ] Core variables set (DATABASE_URL, NODE_ENV)
  - [ ] Optional API keys configured (as needed)
  - [ ] Rate limiting configured
  - [ ] Cache settings configured

- [ ] **Application Running**
  - [ ] Development server starts (`npm run dev`)
  - [ ] Application loads at http://localhost:3000
  - [ ] Can create workflow session
  - [ ] Can complete Step 1 (Profile Definition)

- [ ] **Testing**
  - [ ] Tests run successfully (`npm test`)
  - [ ] No TypeScript errors (`npx tsc --noEmit`)
  - [ ] Linter passes (`npm run lint`)

### Production Deployment Setup

- [ ] **Pre-Deployment**
  - [ ] All local tests passing
  - [ ] Application builds successfully (`npm run build`)
  - [ ] Code committed to Git
  - [ ] `.env` in `.gitignore`

- [ ] **Vercel Project**
  - [ ] Vercel account created
  - [ ] Project created in Vercel
  - [ ] GitHub repository connected (or using CLI)

- [ ] **Database (Production)**
  - [ ] Production database provisioned
  - [ ] Connection strings obtained
  - [ ] Database accessible from Vercel

- [ ] **Environment Variables (Vercel)**
  - [ ] `DATABASE_URL` set
  - [ ] `DIRECT_URL` set
  - [ ] `NODE_ENV=production` set
  - [ ] `NEXT_PUBLIC_APP_URL` set
  - [ ] `CRON_SECRET` set (if using cron)
  - [ ] API keys set (as needed)

- [ ] **Deployment**
  - [ ] First deployment successful
  - [ ] Migrations ran during build
  - [ ] Application accessible at Vercel URL
  - [ ] No build errors in logs

- [ ] **Post-Deployment Verification**
  - [ ] Application loads without errors
  - [ ] Can create workflow session
  - [ ] Can complete workflow steps
  - [ ] Data persists correctly
  - [ ] No errors in Vercel logs

- [ ] **Optional: Cron Jobs**
  - [ ] Vercel Pro/Enterprise plan (required for cron)
  - [ ] Cron job configured in `vercel.json`
  - [ ] Cron job appears in Vercel dashboard
  - [ ] Test cron endpoint manually

---

## 🔑 Required Environment Variables

### Minimum Required (Development & Production)

```bash
# Database - REQUIRED
DATABASE_URL="postgresql://user:password@host:5432/dbname"
DIRECT_URL="postgresql://user:password@host:5432/dbname"

# Application - REQUIRED
NODE_ENV="development"  # or "production"
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # or your Vercel URL
```

### Optional API Keys

Most data sources work without API keys, but you can configure them for better rate limits:

```bash
# Federal Reserve Economic Data (Free)
FEDERAL_RESERVE_API_KEY="your-key"

# Paid Services (Optional)
MORNINGSTAR_API_KEY="your-key"
SIMPLY_WALL_ST_API_KEY="your-key"
TIPRANKS_API_KEY="your-key"
```

### Optional Configuration

```bash
# Cron Job Authentication (Production only)
CRON_SECRET="your-secure-random-string"

# Rate Limiting (requests per minute)
RATE_LIMIT_SEC_EDGAR=10
RATE_LIMIT_YAHOO_FINANCE=60
RATE_LIMIT_FINVIZ=30

# Cache Duration (seconds)
CACHE_MACRO_DATA=3600
CACHE_SECTOR_DATA=86400
CACHE_QUOTES=900
```

See [.env.example](./.env.example) for complete list.

---

## 🗄️ Database Options

### Option 1: PostgreSQL (Local)

**Best for:** Production-like local development

**Setup Time:** 15-20 minutes

**Pros:**
- Production parity
- Full PostgreSQL features
- No external dependencies

**Cons:**
- Requires PostgreSQL installation
- More complex setup

**Guide:** [LOCAL_DEVELOPMENT_SETUP.md](./LOCAL_DEVELOPMENT_SETUP.md#option-a-postgresql-recommended-for-production-like-environment)

### Option 2: SQLite (Local)

**Best for:** Quick testing and prototyping

**Setup Time:** 2-5 minutes

**Pros:**
- No installation required
- Instant setup
- Perfect for testing

**Cons:**
- Not suitable for production
- Limited features vs PostgreSQL

**Guide:** [LOCAL_DEVELOPMENT_SETUP.md](./LOCAL_DEVELOPMENT_SETUP.md#option-b-sqlite-quick-start-for-testing)

### Option 3: Supabase (Cloud)

**Best for:** Cloud-based development and production

**Setup Time:** 10-15 minutes

**Pros:**
- No local installation
- Production-ready
- Free tier available
- Built-in dashboard

**Cons:**
- Requires internet connection
- Free tier has limitations

**Guide:** [LOCAL_DEVELOPMENT_SETUP.md](./LOCAL_DEVELOPMENT_SETUP.md#option-c-supabase-cloud-postgresql)

### Option 4: Vercel Postgres (Production)

**Best for:** Production deployment on Vercel

**Setup Time:** 5-10 minutes

**Pros:**
- Integrated with Vercel
- Automatic configuration
- Optimized for Vercel

**Cons:**
- Requires Vercel account
- Paid service

**Guide:** [DEPLOYMENT.md](./DEPLOYMENT.md#option-a-vercel-postgres-recommended)

---

## 🛠️ Common Commands Reference

### Development

```bash
# Start development server
npm run dev

# Build for production (test locally)
npm run build

# Start production server (after build)
npm start

# Run linter
npm run lint

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Deploy migrations (production)
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Pull schema from existing database
npx prisma db pull
```

### Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs --follow

# Pull environment variables
vercel env pull .env.production
```

---

## 🐛 Troubleshooting Quick Reference

### Issue: Can't connect to database

**Quick Fix:**
1. Check database is running: `pg_isready` (PostgreSQL)
2. Verify `DATABASE_URL` in `.env`
3. Test connection: `psql $DATABASE_URL`

**Full Guide:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#database-issues)

### Issue: Port 3000 already in use

**Quick Fix:**
```bash
# Use different port
PORT=3001 npm run dev

# Or kill process on port 3000
lsof -ti:3000 | xargs kill -9  # macOS/Linux
```

**Full Guide:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#issue-port-3000-already-in-use)

### Issue: Module not found

**Quick Fix:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Full Guide:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#installation-issues)

### Issue: Prisma Client not generated

**Quick Fix:**
```bash
npx prisma generate
```

**Full Guide:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#issue-prisma-client-generation-fails)

### Issue: Build fails on Vercel

**Quick Fix:**
1. Check build logs in Vercel dashboard
2. Verify environment variables are set
3. Test build locally: `npm run build`

**Full Guide:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#build-and-deployment-issues)

---

## 📊 Data Source Configuration

### Public Data Sources (No API Key Required)

These work out of the box:

- **SEC EDGAR** - Financial filings
- **Yahoo Finance** - Stock quotes and sector data
- **Finviz** - Stock screening
- **CNBC** - Economic news
- **Bloomberg** - Market data
- **Reuters** - Company profiles
- **MarketBeat** - Analyst ratings

### Optional API Keys (For Better Rate Limits)

- **Federal Reserve (FRED)** - Free API key
  - Register: https://fred.stlouisfed.org/docs/api/api_key.html
  - Add to `.env`: `FEDERAL_RESERVE_API_KEY=your-key`

- **TipRanks** - Paid service
  - Website: https://www.tipranks.com/api
  - Add to `.env`: `TIPRANKS_API_KEY=your-key`

- **Simply Wall St** - Paid service
  - Website: https://simplywall.st/api
  - Add to `.env`: `SIMPLY_WALL_ST_API_KEY=your-key`

- **Morningstar** - Paid service
  - Website: https://www.morningstar.com/products/data
  - Add to `.env`: `MORNINGSTAR_API_KEY=your-key`

### Rate Limiting

Configure rate limits in `.env` to avoid hitting API limits:

```bash
# Adjust based on your API tier
RATE_LIMIT_SEC_EDGAR=10          # Free tier
RATE_LIMIT_YAHOO_FINANCE=60      # Public scraping
RATE_LIMIT_FINVIZ=30             # Public scraping
RATE_LIMIT_FEDERAL_RESERVE=120   # Free API
```

---

## 🎯 Next Steps After Deployment

### 1. Monitor Application

- **Vercel Dashboard:** Check function logs and analytics
- **Database:** Monitor query performance
- **Error Tracking:** Set up Sentry or similar (optional)

### 2. Optimize Performance

See [PERFORMANCE_OPTIMIZATION_QUICK_START.md](./PERFORMANCE_OPTIMIZATION_QUICK_START.md) for:
- Caching strategies
- Database indexing
- Query optimization
- Bundle size reduction

### 3. Set Up Monitoring Alerts

If using Vercel Pro/Enterprise:
- Configure cron job for monitoring alerts
- Set up price alerts
- Schedule earnings reviews

### 4. Customize and Extend

- Add custom screening criteria
- Integrate additional data sources
- Customize UI components
- Add authentication (NextAuth)

---

## 📞 Support and Resources

### Documentation

- **Project Docs:** All `.md` files in project root
- **Next.js:** https://nextjs.org/docs
- **Prisma:** https://www.prisma.io/docs
- **Vercel:** https://vercel.com/docs

### Getting Help

1. **Check Documentation:** Start with relevant `.md` file
2. **Search Issues:** Look for similar problems
3. **Review Logs:** Check console and Vercel logs
4. **Isolate Problem:** Create minimal reproduction
5. **Ask for Help:** Create GitHub issue with details

### Useful Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## ✅ Success Criteria

Your deployment is successful when:

- [ ] Application loads without errors
- [ ] Can create new workflow session
- [ ] Can complete all 12 workflow steps
- [ ] Data persists between sessions
- [ ] No errors in browser console
- [ ] No errors in server logs
- [ ] Performance is acceptable (<5s per step)
- [ ] Database queries are optimized
- [ ] Caching is working (if configured)
- [ ] Monitoring is set up (if using cron)

---

## 🎉 Congratulations!

If you've completed all the steps, your ResurrectionStockPicker application is now deployed and running!

**What's Next?**

1. Test the complete workflow
2. Invite users to try it out
3. Monitor performance and errors
4. Iterate and improve based on feedback
5. Consider adding authentication
6. Explore additional data sources
7. Customize the UI to your preferences

**Remember:**

- This is an educational tool, not investment advice
- Always include appropriate disclaimers
- Keep API keys secure
- Monitor usage and costs
- Back up your database regularly

Happy investing research! 📈
