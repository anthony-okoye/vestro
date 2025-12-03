# Troubleshooting Guide

Comprehensive guide for resolving common issues with the ResurrectionStockPicker application.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Database Issues](#database-issues)
3. [Development Server Issues](#development-server-issues)
4. [Data Source Issues](#data-source-issues)
5. [Workflow Execution Issues](#workflow-execution-issues)
6. [Build and Deployment Issues](#build-and-deployment-issues)
7. [Performance Issues](#performance-issues)
8. [Testing Issues](#testing-issues)
9. [Environment Variable Issues](#environment-variable-issues)
10. [Common Error Messages](#common-error-messages)

---

## Installation Issues

### Issue: `npm install` fails with dependency conflicts

**Symptoms:**
```
npm ERR! ERESOLVE unable to resolve dependency tree
npm ERR! Could not resolve dependency
```

**Solutions:**

1. **Clear npm cache and reinstall:**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

2. **Use legacy peer deps (if needed):**
```bash
npm install --legacy-peer-deps
```

3. **Update npm to latest version:**
```bash
npm install -g npm@latest
```

4. **Check Node.js version:**
```bash
node --version
# Should be 18.0 or higher
```

### Issue: Prisma Client generation fails

**Symptoms:**
```
Error: @prisma/client did not initialize yet
Cannot find module '@prisma/client'
```

**Solutions:**

1. **Generate Prisma Client manually:**
```bash
npx prisma generate
```

2. **Verify schema is valid:**
```bash
npx prisma validate
```

3. **Reinstall Prisma:**
```bash
npm uninstall @prisma/client prisma
npm install @prisma/client prisma
npx prisma generate
```

### Issue: TypeScript errors during installation

**Symptoms:**
```
error TS2307: Cannot find module 'xyz'
```

**Solutions:**

1. **Ensure TypeScript is installed:**
```bash
npm install --save-dev typescript @types/node @types/react
```

2. **Regenerate TypeScript config:**
```bash
npx tsc --init
```

3. **Clear TypeScript cache:**
```bash
rm -rf .next tsconfig.tsbuildinfo
npm run dev
```

---

## Database Issues

### Issue: "Can't reach database server"

**Symptoms:**
```
Error: P1001: Can't reach database server at `localhost:5432`
```

**Solutions:**

1. **Verify PostgreSQL is running:**
```bash
# macOS/Linux
pg_isready

# Check status
brew services list | grep postgresql  # macOS
sudo systemctl status postgresql      # Linux
```

2. **Start PostgreSQL:**
```bash
# macOS
brew services start postgresql@14

# Linux
sudo systemctl start postgresql

# Windows
# Start from Services app or pgAdmin
```

3. **Check connection string in `.env`:**
```bash
# Verify format
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

4. **Test connection manually:**
```bash
psql "postgresql://user:password@localhost:5432/dbname"
```

### Issue: "Environment variable not found: DATABASE_URL"

**Symptoms:**
```
Error: Environment variable not found: DATABASE_URL
```

**Solutions:**

1. **Create `.env` file:**
```bash
cp .env.example .env
```

2. **Verify `.env` is in project root:**
```bash
ls -la .env
```

3. **Check `.env` is not in `.gitignore` for local development:**
```bash
# .env should be in .gitignore for security
# but must exist locally
```

4. **Restart development server after adding `.env`:**
```bash
npm run dev
```

### Issue: Migration fails with "relation already exists"

**Symptoms:**
```
Error: P3005: The database schema is not empty
```

**Solutions:**

1. **Reset database (⚠️ deletes all data):**
```bash
npx prisma migrate reset
```

2. **Or pull existing schema:**
```bash
npx prisma db pull
npx prisma generate
```

3. **Or create new migration:**
```bash
npx prisma migrate dev --name fix_schema
```

### Issue: Supabase connection timeout

**Symptoms:**
```
Error: Connection timeout
Error: P1001: Can't reach database server
```

**Solutions:**

1. **Check if database is paused (free tier):**
   - Go to Supabase dashboard
   - Database may pause after inactivity
   - Click to resume

2. **Verify connection strings:**
   - Use **Transaction mode** pooling for `DATABASE_URL`
   - Use **Direct connection** for `DIRECT_URL`

3. **Add SSL mode:**
```bash
DATABASE_URL="postgresql://...?pgbouncer=true&sslmode=require"
```

4. **Check network/firewall:**
   - Ensure ports 5432 and 6543 are not blocked
   - Try from different network

### Issue: "Too many connections"

**Symptoms:**
```
Error: P1001: Too many connections
```

**Solutions:**

1. **Use connection pooling:**
```bash
# Ensure DATABASE_URL uses pooling
DATABASE_URL="postgresql://...?pgbouncer=true"
```

2. **Close unused connections:**
```bash
# In PostgreSQL
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'your_database';
```

3. **Increase connection limit (if self-hosted):**
```sql
ALTER SYSTEM SET max_connections = 200;
-- Restart PostgreSQL
```

---

## Development Server Issues

### Issue: Port 3000 already in use

**Symptoms:**
```
Error: Port 3000 is already in use
```

**Solutions:**

1. **Use different port:**
```bash
PORT=3001 npm run dev
```

2. **Kill process on port 3000:**
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Windows (CMD)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Issue: Hot reload not working

**Symptoms:**
- Changes to files don't trigger reload
- Browser doesn't update automatically

**Solutions:**

1. **Restart development server:**
```bash
# Stop with Ctrl+C
npm run dev
```

2. **Clear Next.js cache:**
```bash
rm -rf .next
npm run dev
```

3. **Check file watcher limits (Linux):**
```bash
# Increase limit
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

4. **Disable browser cache:**
   - Open DevTools (F12)
   - Network tab → Disable cache checkbox

### Issue: Module not found errors

**Symptoms:**
```
Module not found: Can't resolve '@/lib/xyz'
```

**Solutions:**

1. **Verify file exists:**
```bash
ls -la lib/xyz.ts
```

2. **Check import path:**
```typescript
// Correct
import { xyz } from '@/lib/xyz'

// Incorrect
import { xyz } from 'lib/xyz'
```

3. **Verify tsconfig.json paths:**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

4. **Restart TypeScript server:**
   - VS Code: Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"

### Issue: "Cannot find module" after adding new dependency

**Symptoms:**
```
Error: Cannot find module 'new-package'
```

**Solutions:**

1. **Restart development server:**
```bash
# Stop with Ctrl+C
npm run dev
```

2. **Verify package is installed:**
```bash
npm list new-package
```

3. **Reinstall if missing:**
```bash
npm install new-package
```

---

## Data Source Issues

### Issue: SEC EDGAR requests failing

**Symptoms:**
```
Error: 403 Forbidden
Error: Rate limit exceeded
```

**Solutions:**

1. **Add User-Agent header (required by SEC):**
   - Already implemented in `sec-edgar-adapter.ts`
   - Verify User-Agent includes contact email

2. **Reduce request rate:**
```bash
# In .env
RATE_LIMIT_SEC_EDGAR=5  # Reduce from 10
```

3. **Check SEC EDGAR status:**
   - Visit https://www.sec.gov/edgar/searchedgar/companysearch.html
   - Verify site is accessible

4. **Use alternative data source:**
   - Fallback to cached data
   - Use Morningstar adapter instead

### Issue: Yahoo Finance data not loading

**Symptoms:**
```
Error: Failed to fetch quote
Error: Invalid ticker symbol
```

**Solutions:**

1. **Verify ticker symbol is valid:**
```bash
# Test manually
curl "https://query2.finance.yahoo.com/v8/finance/chart/AAPL"
```

2. **Check rate limiting:**
```bash
# In .env
RATE_LIMIT_YAHOO_FINANCE=30  # Reduce from 60
```

3. **Clear cache:**
```bash
# Restart server to clear in-memory cache
npm run dev
```

4. **Use alternative data source:**
   - Finviz for screening
   - SEC EDGAR for fundamentals

### Issue: API key authentication failing

**Symptoms:**
```
Error: 401 Unauthorized
Error: Invalid API key
```

**Solutions:**

1. **Verify API key is set:**
```bash
# Check .env file
cat .env | grep API_KEY
```

2. **Regenerate API key:**
   - Go to provider dashboard
   - Generate new key
   - Update `.env`

3. **Check key format:**
```bash
# No quotes needed in .env
FEDERAL_RESERVE_API_KEY=abc123xyz

# Not:
FEDERAL_RESERVE_API_KEY="abc123xyz"
```

4. **Restart server after updating `.env`:**
```bash
npm run dev
```

### Issue: Rate limit exceeded

**Symptoms:**
```
Error: 429 Too Many Requests
Error: Rate limit exceeded
```

**Solutions:**

1. **Reduce rate limits in `.env`:**
```bash
RATE_LIMIT_YAHOO_FINANCE=30
RATE_LIMIT_FINVIZ=15
```

2. **Implement request queuing:**
   - Already implemented in `batch-fetcher.ts`
   - Verify it's being used

3. **Increase cache duration:**
```bash
# In .env (seconds)
CACHE_QUOTES=1800  # 30 minutes instead of 15
```

4. **Upgrade to paid API tier:**
   - Consider paid plans for higher limits

### Issue: Data source timeout

**Symptoms:**
```
Error: Request timeout
Error: ETIMEDOUT
```

**Solutions:**

1. **Increase timeout:**
```bash
# In .env (milliseconds)
REQUEST_TIMEOUT=60000  # 60 seconds
```

2. **Check network connection:**
```bash
# Test connectivity
ping www.sec.gov
curl -I https://finance.yahoo.com
```

3. **Use fallback data:**
   - Application should use cached data
   - Check `fallback-strategies.ts`

4. **Retry failed requests:**
```bash
# In .env
REQUEST_RETRY_ATTEMPTS=5  # Increase from 3
```

---

## Workflow Execution Issues

### Issue: Workflow session not found

**Symptoms:**
```
Error: Session not found
404 error when accessing workflow
```

**Solutions:**

1. **Verify session ID is correct:**
```bash
# Check URL format
http://localhost:3000/workflow/[sessionId]
```

2. **Check database for session:**
```bash
npx prisma studio
# Navigate to WorkflowSession table
```

3. **Create new workflow:**
   - Go to http://localhost:3000/workflow/new
   - Complete profile form

4. **Check session expiration:**
   - Sessions may be cleaned up after inactivity
   - Create new session if expired

### Issue: Step execution fails

**Symptoms:**
```
Error: Step execution failed
Error: Invalid step data
```

**Solutions:**

1. **Check step inputs:**
   - Verify all required fields are provided
   - Check validation errors in response

2. **Review step processor logs:**
```bash
# Check console output
npm run dev
# Look for error messages
```

3. **Verify previous steps completed:**
   - Some steps depend on previous step data
   - Complete workflow in order

4. **Check data source availability:**
   - Step may fail if data source is down
   - Check `error-handler.ts` logs

### Issue: Optional step (Step 8) cannot be skipped

**Symptoms:**
```
Error: Cannot skip required step
```

**Solutions:**

1. **Verify step is marked optional:**
```typescript
// In technical-trends-processor.ts
isOptional: true
```

2. **Use skip endpoint:**
```bash
POST /api/workflows/[sessionId]/skip/8
```

3. **Check workflow state:**
```bash
GET /api/workflows/[sessionId]
# Verify currentStep and completedSteps
```

### Issue: Data not persisting between steps

**Symptoms:**
- Step data disappears
- Previous step results not available

**Solutions:**

1. **Check state manager:**
```typescript
// Verify saveStepData is called
await stateManager.saveStepData(sessionId, stepId, data);
```

2. **Verify database writes:**
```bash
npx prisma studio
# Check StepData table
```

3. **Check for errors in API logs:**
```bash
# Look for database errors
npm run dev
```

4. **Test state persistence:**
```bash
# Run integration tests
npm test -- state-manager.integration.test.ts
```

---

## Build and Deployment Issues

### Issue: Build fails with TypeScript errors

**Symptoms:**
```
Type error: Property 'xyz' does not exist
```

**Solutions:**

1. **Fix TypeScript errors:**
```bash
# Check all errors
npx tsc --noEmit
```

2. **Update type definitions:**
```bash
npm install --save-dev @types/node @types/react
```

3. **Regenerate Prisma types:**
```bash
npx prisma generate
```

4. **Clear build cache:**
```bash
rm -rf .next tsconfig.tsbuildinfo
npm run build
```

### Issue: Prisma migrations fail during build

**Symptoms:**
```
Error: Migration failed
Error: Cannot run migrations during build
```

**Solutions:**

1. **Run migrations separately:**
```bash
# Don't run migrations during build
# Run them after deployment
npx prisma migrate deploy
```

2. **Update build command:**
```json
// package.json
{
  "scripts": {
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

3. **Check database connection:**
   - Verify `DIRECT_URL` is set
   - Ensure database is accessible during build

### Issue: Vercel deployment fails

**Symptoms:**
```
Error: Build failed
Error: Function size exceeded
```

**Solutions:**

1. **Check build logs:**
   - Review Vercel dashboard logs
   - Look for specific error messages

2. **Reduce bundle size:**
```bash
# Analyze bundle
npm run build
# Check .next/analyze output
```

3. **Optimize dependencies:**
```bash
# Remove unused dependencies
npm prune
```

4. **Split large functions:**
   - Break down large API routes
   - Use dynamic imports

### Issue: Environment variables not working in production

**Symptoms:**
```
Error: Environment variable not found
Undefined values in production
```

**Solutions:**

1. **Verify variables in Vercel dashboard:**
   - Settings → Environment Variables
   - Check all required variables are set

2. **Use correct variable prefix:**
```bash
# Server-side (no prefix needed)
DATABASE_URL=...

# Client-side (requires NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_APP_URL=...
```

3. **Redeploy after adding variables:**
   - Environment changes require redeployment
   - Trigger new deployment

4. **Pull variables locally to test:**
```bash
vercel env pull .env.production
```

---

## Performance Issues

### Issue: Slow page load times

**Symptoms:**
- Pages take >5 seconds to load
- Workflow steps timeout

**Solutions:**

1. **Enable caching:**
```bash
# Verify cache settings in .env
CACHE_MACRO_DATA=3600
CACHE_SECTOR_DATA=86400
```

2. **Add database indexes:**
```bash
# Apply performance indexes
psql $DATABASE_URL < prisma/migrations/add_performance_indexes.sql
```

3. **Use parallel data fetching:**
```typescript
// Use Promise.all for concurrent requests
const [data1, data2] = await Promise.all([
  fetchData1(),
  fetchData2()
]);
```

4. **Optimize database queries:**
```bash
# Check slow queries
npx prisma studio
# Review query performance
```

### Issue: High memory usage

**Symptoms:**
```
Error: JavaScript heap out of memory
```

**Solutions:**

1. **Increase Node.js memory:**
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run dev
```

2. **Optimize data processing:**
   - Process data in chunks
   - Use streams for large datasets

3. **Clear caches periodically:**
```typescript
// Implement cache eviction
// See cache-config.ts
```

4. **Monitor memory usage:**
```bash
# Check memory
node --inspect npm run dev
# Open chrome://inspect
```

### Issue: Database connection pool exhausted

**Symptoms:**
```
Error: Too many connections
Error: Connection pool timeout
```

**Solutions:**

1. **Use connection pooling:**
```bash
DATABASE_URL="postgresql://...?pgbouncer=true&connection_limit=10"
```

2. **Reduce concurrent requests:**
```typescript
// Limit parallel database operations
const limit = pLimit(5);
```

3. **Close connections properly:**
```typescript
// Use Prisma's connection management
await prisma.$disconnect();
```

4. **Increase pool size (if self-hosted):**
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connection_limit = 20
}
```

---

## Testing Issues

### Issue: Tests fail with database errors

**Symptoms:**
```
Error: Cannot connect to test database
```

**Solutions:**

1. **Use separate test database:**
```bash
# Create .env.test
DATABASE_URL="postgresql://localhost:5432/test_db"
```

2. **Reset test database before tests:**
```bash
# In test setup
beforeAll(async () => {
  await prisma.$executeRaw`TRUNCATE TABLE ...`;
});
```

3. **Use in-memory database:**
```bash
# SQLite for tests
DATABASE_URL="file::memory:?cache=shared"
```

### Issue: Tests timeout

**Symptoms:**
```
Error: Test exceeded timeout of 5000ms
```

**Solutions:**

1. **Increase timeout:**
```typescript
// In test file
it('test name', async () => {
  // test code
}, 10000); // 10 second timeout
```

2. **Mock slow operations:**
```typescript
vi.mock('@/lib/data-adapters/yahoo-finance-adapter');
```

3. **Use test fixtures:**
   - Pre-generate test data
   - Avoid real API calls in tests

### Issue: Mock data not working

**Symptoms:**
```
Error: Real API called during test
```

**Solutions:**

1. **Verify mocks are set up:**
```typescript
import { vi } from 'vitest';

vi.mock('@/lib/data-adapters/yahoo-finance-adapter', () => ({
  YahooFinanceAdapter: vi.fn()
}));
```

2. **Clear mocks between tests:**
```typescript
afterEach(() => {
  vi.clearAllMocks();
});
```

3. **Check mock implementation:**
```typescript
const mockFetch = vi.fn().mockResolvedValue({ data: 'test' });
```

---

## Environment Variable Issues

### Issue: `.env` file not being read

**Symptoms:**
- Environment variables are undefined
- Application uses default values

**Solutions:**

1. **Verify `.env` location:**
```bash
# Must be in project root
ls -la .env
```

2. **Check file name:**
```bash
# Should be .env, not .env.txt or env
```

3. **Restart development server:**
```bash
# .env is read on startup
npm run dev
```

4. **Check for syntax errors:**
```bash
# No spaces around =
DATABASE_URL=value  # Correct
DATABASE_URL = value  # Incorrect
```

### Issue: Variables work locally but not in production

**Symptoms:**
- Works in development
- Fails in Vercel deployment

**Solutions:**

1. **Add variables to Vercel:**
   - Vercel Dashboard → Settings → Environment Variables
   - Add all required variables

2. **Use correct variable scope:**
   - Production, Preview, Development
   - Set for appropriate environments

3. **Check variable names:**
   - Must match exactly (case-sensitive)
   - No typos

4. **Redeploy after adding:**
   - Changes require new deployment

### Issue: Client-side variables undefined

**Symptoms:**
```
Error: NEXT_PUBLIC_APP_URL is undefined
```

**Solutions:**

1. **Add NEXT_PUBLIC_ prefix:**
```bash
# Client-side variables need prefix
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

2. **Rebuild application:**
```bash
# Client variables are embedded at build time
npm run build
```

3. **Don't use server-only variables client-side:**
```typescript
// ❌ Won't work in client components
const dbUrl = process.env.DATABASE_URL;

// ✅ Works in client components
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
```

---

## Common Error Messages

### "Prisma Client is unable to run in the browser"

**Cause:** Trying to use Prisma Client in client-side code

**Solution:**
- Only use Prisma in API routes or Server Components
- Never import Prisma in client components

```typescript
// ❌ Don't do this in client components
import { prisma } from '@/lib/prisma';

// ✅ Do this in API routes
// app/api/route.ts
import { prisma } from '@/lib/prisma';
```

### "Cannot find module '@/lib/xyz'"

**Cause:** TypeScript path alias not configured or file doesn't exist

**Solution:**
1. Verify file exists: `ls lib/xyz.ts`
2. Check `tsconfig.json` has path aliases
3. Restart TypeScript server

### "Error: P1001: Can't reach database server"

**Cause:** Database connection failed

**Solution:**
1. Check database is running
2. Verify `DATABASE_URL` is correct
3. Test connection: `psql $DATABASE_URL`
4. Check firewall/network settings

### "Error: EADDRINUSE: address already in use"

**Cause:** Port 3000 is already in use

**Solution:**
1. Use different port: `PORT=3001 npm run dev`
2. Kill process on port 3000 (see Development Server Issues)

### "Error: Invalid `prisma.xyz.findMany()` invocation"

**Cause:** Prisma query syntax error or schema mismatch

**Solution:**
1. Regenerate Prisma Client: `npx prisma generate`
2. Check query syntax matches schema
3. Verify database schema is up to date

### "Error: 429 Too Many Requests"

**Cause:** API rate limit exceeded

**Solution:**
1. Reduce request rate in `.env`
2. Implement caching
3. Use request queuing
4. Upgrade to paid API tier

### "Error: CORS policy blocked"

**Cause:** Cross-origin request blocked

**Solution:**
1. Configure CORS in API routes
2. Use proxy for external APIs
3. Check API route configuration

```typescript
// app/api/route.ts
export async function GET(request: Request) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
  });
}
```

---

## Getting Additional Help

If you're still experiencing issues after trying these solutions:

1. **Check Documentation:**
   - [README.md](./README.md) - Project overview
   - [LOCAL_DEVELOPMENT_SETUP.md](./LOCAL_DEVELOPMENT_SETUP.md) - Setup guide
   - [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
   - [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API reference

2. **Review Logs:**
   - Development: Check console output
   - Production: Check Vercel function logs
   - Database: Check PostgreSQL logs

3. **Test Components Individually:**
   - Test database connection
   - Test API endpoints with curl/Postman
   - Test data adapters in isolation

4. **Create Minimal Reproduction:**
   - Isolate the issue
   - Create simple test case
   - Document steps to reproduce

5. **Check External Services:**
   - Verify data sources are accessible
   - Check API status pages
   - Test with alternative data sources

6. **Community Resources:**
   - Next.js Documentation: https://nextjs.org/docs
   - Prisma Documentation: https://www.prisma.io/docs
   - Vercel Documentation: https://vercel.com/docs

---

## Preventive Measures

To avoid common issues:

1. **Keep Dependencies Updated:**
```bash
npm outdated
npm update
```

2. **Run Tests Regularly:**
```bash
npm test
```

3. **Monitor Performance:**
   - Check Vercel Analytics
   - Review database query performance
   - Monitor API rate limits

4. **Backup Database:**
```bash
pg_dump $DATABASE_URL > backup.sql
```

5. **Use Version Control:**
```bash
git commit -m "Working state before changes"
```

6. **Document Changes:**
   - Keep changelog updated
   - Document configuration changes
   - Note API version updates

