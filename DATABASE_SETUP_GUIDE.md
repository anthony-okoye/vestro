# Database Setup Guide

## Current Database Connection Issue

If you're experiencing connection errors with Supabase, here are the steps to resolve them:

### 1. Verify Database Credentials

Check your Supabase dashboard for the correct connection strings:

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Look for the connection strings section

You'll need two connection strings:

- **Connection pooling** (Transaction mode) - Use for `DATABASE_URL`
  - Format: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true`
  
- **Direct connection** - Use for `DIRECT_URL`
  - Format: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres`

### 2. Update .env File

Replace the connection strings in your `.env` file with the correct ones from Supabase:

```bash
DATABASE_URL="your-pooled-connection-string-here"
DIRECT_URL="your-direct-connection-string-here"
```

### 3. Test Database Connection

Try connecting to verify the credentials work:

```bash
# Test with psql (if installed)
psql "your-direct-connection-string-here"

# Or test with Prisma
npx prisma db pull
```

### 4. Run Migrations

Once the connection is working:

```bash
# Create initial migration
npx prisma migrate dev --name init

# Or if tables already exist, pull the schema
npx prisma db pull
npx prisma generate
```

### 5. Alternative: Use Local PostgreSQL

If you prefer to develop locally first:

```bash
# Install PostgreSQL locally
# Then update .env:
DATABASE_URL="postgresql://user:password@localhost:5432/resurrection_stock_picker"
DIRECT_URL="postgresql://user:password@localhost:5432/resurrection_stock_picker"

# Create the database
createdb resurrection_stock_picker

# Run migrations
npx prisma migrate dev --name init
```

### 6. Alternative: Use SQLite for Local Development

For quick local testing without PostgreSQL:

1. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

2. Update `.env`:
```bash
DATABASE_URL="file:./dev.db"
# DIRECT_URL not needed for SQLite
```

3. Run migrations:
```bash
npx prisma migrate dev --name init
```

**Note**: Remember to switch back to PostgreSQL before deploying to production.

## Common Issues

### Issue: "Can't reach database server"

**Causes:**
- Incorrect connection string
- Database paused (Supabase free tier pauses after inactivity)
- Network/firewall blocking connection
- Wrong port number

**Solutions:**
1. Verify connection string is correct
2. Check if database is paused in Supabase dashboard
3. Try from a different network
4. Ensure ports 5432 and 6543 are not blocked

### Issue: "Environment variable not found: DIRECT_URL"

**Solution:**
Add `DIRECT_URL` to your `.env` file (already fixed in this project).

### Issue: "SSL connection required"

**Solution:**
Add `?sslmode=require` to your connection string:
```bash
DATABASE_URL="postgresql://...?pgbouncer=true&sslmode=require"
```

## Verifying Setup

Once migrations are successful, verify everything works:

```bash
# Generate Prisma Client
npx prisma generate

# Open Prisma Studio to view database
npx prisma studio

# Run the application
npm run dev
```

## Next Steps

After database setup is complete:

1. ✅ Environment variables configured
2. ✅ Database migrations run
3. ✅ Prisma Client generated
4. ✅ Application can connect to database
5. → Test creating a workflow session
6. → Deploy to Vercel (see DEPLOYMENT.md)

## Support Resources

- [Supabase Database Documentation](https://supabase.com/docs/guides/database)
- [Prisma with Supabase Guide](https://www.prisma.io/docs/guides/database/supabase)
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment guide
- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
