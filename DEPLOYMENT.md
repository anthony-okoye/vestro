# Deployment Guide - ResurrectionStockPicker

This guide covers deploying the ResurrectionStockPicker application to Vercel with PostgreSQL database.

## Prerequisites

- [Vercel Account](https://vercel.com/signup)
- [PostgreSQL Database](https://vercel.com/docs/storage/vercel-postgres) (Vercel Postgres or external provider)
- API keys for data sources (see Environment Variables section)

## Quick Start

### 1. Database Setup

#### Option A: Vercel Postgres (Recommended)

1. Go to your Vercel dashboard
2. Navigate to Storage → Create Database → Postgres
3. Follow the setup wizard
4. Copy the connection strings provided:
   - `POSTGRES_PRISMA_URL` → Use as `DATABASE_URL`
   - `POSTGRES_URL_NON_POOLING` → Use as `DIRECT_URL`

#### Option B: External PostgreSQL

1. Set up a PostgreSQL database with your provider (AWS RDS, DigitalOcean, etc.)
2. Create two connection strings:
   - Pooled connection → Use as `DATABASE_URL`
   - Direct connection → Use as `DIRECT_URL`

### 2. Deploy to Vercel

#### Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts to link your project
```

#### Via GitHub Integration

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure environment variables (see below)
6. Click "Deploy"

### 3. Configure Environment Variables

In your Vercel project settings, add the following environment variables:

#### Required Variables

```bash
# Database
DATABASE_URL="your-pooled-postgres-connection-string"
DIRECT_URL="your-direct-postgres-connection-string"

# Application
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"

# Cron Secret (for monitoring alerts)
CRON_SECRET="your-random-secret-string"
```

#### Data Source API Keys

```bash
# Federal Reserve Economic Data
FEDERAL_RESERVE_API_KEY="your-fred-api-key"

# Morningstar (if using paid tier)
MORNINGSTAR_API_KEY="your-morningstar-key"

# Simply Wall St
SIMPLY_WALL_ST_API_KEY="your-simplywall-key"

# TipRanks
TIPRANKS_API_KEY="your-tipranks-key"
```

See `.env.example` for all available configuration options.

### 4. Run Database Migrations

After deploying, run migrations to set up your database schema:

```bash
# Using Vercel CLI
vercel env pull .env.production
npm run prisma:migrate:deploy
```

Or set up a build command in Vercel:

1. Go to Project Settings → General → Build & Development Settings
2. Set Build Command to: `npm run build && npx prisma migrate deploy`

### 5. Configure Vercel Cron (Optional)

The monitoring alerts cron job is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/monitoring-alerts",
      "schedule": "0 9 * * *"
    }
  ]
}
```

This runs daily at 9:00 AM UTC. To enable:

1. Ensure you have a Pro or Enterprise Vercel plan (Cron requires paid plan)
2. Add `CRON_SECRET` environment variable
3. Deploy - Vercel will automatically set up the cron job

## Environment Variables Reference

### Database Configuration

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | Pooled PostgreSQL connection string | Yes | `postgresql://user:pass@host:5432/db?pgbouncer=true` |
| `DIRECT_URL` | Direct PostgreSQL connection (for migrations) | Yes | `postgresql://user:pass@host:5432/db` |

### Application Configuration

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | Yes | `production` |
| `NEXT_PUBLIC_APP_URL` | Public URL of your app | Yes | - |
| `CRON_SECRET` | Secret for authenticating cron requests | No | - |

### Data Source URLs

Most data sources use public endpoints and don't require API keys. See `.env.example` for the complete list of configurable URLs.

### Rate Limiting

Configure rate limits (requests per minute) for each data source:

```bash
RATE_LIMIT_SEC_EDGAR=10
RATE_LIMIT_YAHOO_FINANCE=60
RATE_LIMIT_FINVIZ=30
# ... see .env.example for full list
```

### Cache Configuration

Configure cache durations (in seconds):

```bash
CACHE_MACRO_DATA=3600        # 1 hour
CACHE_SECTOR_DATA=86400      # 24 hours
CACHE_QUOTES=900             # 15 minutes
# ... see .env.example for full list
```

## Post-Deployment Checklist

- [ ] Database migrations completed successfully
- [ ] Environment variables configured
- [ ] Application loads without errors
- [ ] Test workflow creation and execution
- [ ] Verify data source connections
- [ ] Check monitoring alerts cron job (if enabled)
- [ ] Review application logs for errors

## Monitoring and Maintenance

### View Logs

```bash
# Real-time logs
vercel logs --follow

# Recent logs
vercel logs
```

### Database Management

```bash
# Open Prisma Studio (local)
npm run prisma:studio

# Run migrations
npm run prisma:migrate:deploy

# Generate Prisma Client
npm run prisma:generate
```

### Performance Monitoring

- Monitor response times in Vercel Analytics
- Check database query performance in your PostgreSQL provider's dashboard
- Review cache hit rates in application logs

## Troubleshooting

### Build Failures

**Issue**: Prisma Client generation fails during build

**Solution**: Ensure `postinstall` script is in package.json:
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### Database Connection Issues

**Issue**: "Can't reach database server" error

**Solution**: 
1. Verify `DATABASE_URL` and `DIRECT_URL` are correct
2. Check database is accessible from Vercel's IP ranges
3. Ensure connection pooling is properly configured

### Cron Job Not Running

**Issue**: Monitoring alerts not being sent

**Solution**:
1. Verify you have a Vercel Pro or Enterprise plan
2. Check `CRON_SECRET` environment variable is set
3. Review cron logs: `vercel logs --since 24h | grep cron`

### API Rate Limiting

**Issue**: Data source requests failing with 429 errors

**Solution**:
1. Reduce rate limits in environment variables
2. Implement request queuing
3. Consider caching more aggressively

## Scaling Considerations

### Database

- **Connection Pooling**: Use `DATABASE_URL` with connection pooling enabled
- **Indexes**: Ensure all indexes from `prisma/migrations/add_performance_indexes.sql` are applied
- **Query Optimization**: Monitor slow queries and add indexes as needed

### Caching

- **Redis**: Consider adding Redis for advanced caching (see `lib/cache-config.ts`)
- **CDN**: Use Vercel's Edge Network for static assets
- **API Caching**: Leverage Next.js built-in caching with `revalidate`

### Rate Limiting

- Implement request queuing for high-traffic scenarios
- Use batch fetching for multiple stock queries
- Consider upgrading to paid API tiers for higher limits

## Security Best Practices

1. **Environment Variables**: Never commit `.env` files to version control
2. **API Keys**: Rotate API keys regularly
3. **Database**: Use strong passwords and enable SSL connections
4. **Cron Secret**: Use a cryptographically secure random string
5. **CORS**: Configure appropriate CORS policies for API routes

## Support and Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Project README](./README.md)

## Rollback Procedure

If you need to rollback a deployment:

```bash
# List recent deployments
vercel ls

# Promote a previous deployment
vercel promote <deployment-url>
```

Or use the Vercel Dashboard:
1. Go to Deployments
2. Find the stable deployment
3. Click "Promote to Production"
