# Prisma Setup

This directory contains the Prisma schema and migration files for the ResurrectionStockPicker application.

## Database Models

- **User**: Represents a user of the system
- **InvestmentProfile**: Stores user investment preferences and goals
- **WorkflowSession**: Tracks workflow execution state
- **StepData**: Stores output data from each workflow step

## Setup Instructions

1. Ensure PostgreSQL is installed and running
2. Update the `DATABASE_URL` in `.env` file with your database credentials
3. Generate the Prisma client:
   ```bash
   npx prisma generate
   ```
4. Run migrations to create database tables:
   ```bash
   npx prisma migrate dev --name init
   ```

## Useful Commands

- Generate Prisma client: `npx prisma generate`
- Create migration: `npx prisma migrate dev --name <migration_name>`
- Apply migrations: `npx prisma migrate deploy`
- Open Prisma Studio: `npx prisma studio`
- Reset database: `npx prisma migrate reset`

## Notes

- The Prisma client is instantiated in `lib/prisma.ts` with singleton pattern for Next.js
- All models use `cuid()` for ID generation
- Cascade deletes are configured to maintain referential integrity
- Indexes are added on foreign keys and frequently queried fields
