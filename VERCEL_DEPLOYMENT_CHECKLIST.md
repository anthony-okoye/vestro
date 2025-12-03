# Vercel Deployment Checklist

Use this checklist to ensure your ResurrectionStockPicker deployment is configured correctly.

## Pre-Deployment

- [ ] All code committed to Git repository
- [ ] `.env` file is in `.gitignore` (never commit secrets!)
- [ ] Database migrations tested locally
- [ ] Application builds successfully (`npm run build`)
- [ ] Tests pass (`npm test`)

## Vercel Project Setup

- [ ] Project created in Vercel dashboard
- [ ] GitHub repository connected (or deployed via CLI)
- [ ] Build settings configured:
  - Framework Preset: Next.js
  - Build Command: `npm run vercel-build` (or leave default)
  - Output Directory: `.next` (default)
  - Install Command: `npm install` (default)

## Database Configuration

### Option A: Vercel Postgres
- [ ] Vercel Postgres database created
- [ ] Database linked to project
- [ ] `DATABASE_URL` automatically set by Vercel
- [ ] `DIRECT_URL` automatically set by Vercel

### Option B: External PostgreSQL
- [ ] PostgreSQL database provisioned
- [ ] Connection pooling configured (e.g., PgBouncer)
- [ ] `DATABASE_URL` set to pooled connection string
- [ ] `DIRECT_URL` set to direct connection string
- [ ] Database accessible from Vercel's IP ranges

## Environment Variables

### Required Variables
- [ ] `DATABASE_URL` - Pooled PostgreSQL connection
- [ ] `DIRECT_URL` - Direct PostgreSQL connection
- [ ] `NODE_ENV` - Set to `production`
- [ ] `NEXT_PUBLIC_APP_URL` - Your Vercel app URL

### Optional Variables (for Cron)
- [ ] `CRON_SECRET` - Random secure string for cron authentication

### Data Source API Keys (as needed)
- [ ] `FEDERAL_RESERVE_API_KEY`
- [ ] `MORNINGSTAR_API_KEY`
- [ ] `SIMPLY_WALL_ST_API_KEY`
- [ ] `TIPRANKS_API_KEY`

### Configuration Variables (optional)
- [ ] Rate limiting settings (see `.env.example`)
- [ ] Cache duration settings (see `.env.example`)
- [ ] Data source URLs (defaults usually work)

## First Deployment

- [ ] Deploy to Vercel (via CLI or GitHub integration)
- [ ] Verify build completes successfully
- [ ] Check deployment logs for errors
- [ ] Verify Prisma migrations ran (`vercel-build` script)

## Post-Deployment Verification

- [ ] Visit deployed URL - application loads
- [ ] Create a test workflow session
- [ ] Complete at least Step 1 (Profile Definition)
- [ ] Verify data persists in database
- [ ] Check for console errors in browser
- [ ] Review Vercel function logs for backend errors

## Vercel Cron Setup (Optional)

**Note**: Requires Vercel Pro or Enterprise plan

- [ ] Vercel Pro/Enterprise plan active
- [ ] `CRON_SECRET` environment variable set
- [ ] `vercel.json` cron configuration present
- [ ] Cron job appears in Vercel dashboard after deployment
- [ ] Test cron endpoint manually: `curl https://your-app.vercel.app/api/cron/monitoring-alerts -H "Authorization: Bearer YOUR_CRON_SECRET"`

## Monitoring Setup

- [ ] Enable Vercel Analytics (optional)
- [ ] Set up error tracking (Sentry, etc.) - optional
- [ ] Configure database monitoring in provider dashboard
- [ ] Set up uptime monitoring (optional)

## Security Checklist

- [ ] All API keys stored as environment variables (not in code)
- [ ] `.env` file not committed to repository
- [ ] `CRON_SECRET` is cryptographically secure random string
- [ ] Database uses SSL connections
- [ ] No sensitive data in client-side code
- [ ] CORS policies configured appropriately

## Performance Optimization

- [ ] Database indexes applied (from `add_performance_indexes.sql`)
- [ ] Vercel Edge Network enabled (automatic)
- [ ] Next.js caching configured (already in code)
- [ ] Monitor function execution times in Vercel dashboard

## Troubleshooting

If deployment fails, check:

1. **Build Errors**
   - Review build logs in Vercel dashboard
   - Ensure all dependencies in `package.json`
   - Verify TypeScript compiles locally

2. **Database Connection Errors**
   - Verify `DATABASE_URL` and `DIRECT_URL` are correct
   - Check database is accessible from Vercel
   - Ensure SSL mode is configured correctly

3. **Runtime Errors**
   - Check Vercel function logs
   - Verify environment variables are set
   - Test API endpoints individually

4. **Cron Job Not Running**
   - Verify Pro/Enterprise plan
   - Check `CRON_SECRET` is set
   - Review cron logs in Vercel dashboard

## Useful Commands

```bash
# Deploy to production
vercel --prod

# View logs
vercel logs --follow

# Pull environment variables locally
vercel env pull .env.production

# Run migrations on production database
# (Set DATABASE_URL and DIRECT_URL from production first)
npx prisma migrate deploy

# Open Vercel dashboard
vercel dashboard
```

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Postgres Guide](https://vercel.com/docs/storage/vercel-postgres)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

## Support

For issues specific to this application, see:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed deployment guide
- [README.md](./README.md) - Project overview
- [PERFORMANCE_OPTIMIZATION_QUICK_START.md](./PERFORMANCE_OPTIMIZATION_QUICK_START.md) - Performance tips
