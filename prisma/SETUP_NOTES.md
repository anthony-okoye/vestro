# Prisma Setup Notes

## What Was Implemented

Task 3 "Build state management and persistence layer with Prisma" has been completed with the following:

### 3.1 Set up Prisma ORM with PostgreSQL
- Created `prisma/schema.prisma` with four models:
  - **User**: Base user model
  - **InvestmentProfile**: Stores user investment preferences
  - **WorkflowSession**: Tracks workflow execution state
  - **StepData**: Stores JSON output from each workflow step
- Created `lib/prisma.ts` with singleton Prisma client for Next.js
- Created `.env` file with DATABASE_URL configuration
- Added indexes for performance on frequently queried fields
- Configured cascade deletes for referential integrity

### 3.2 Implement StateManager using Prisma
- Fully implemented `lib/state-manager.ts` with all required methods:
  - `createSession()`: Creates new workflow session
  - `updateSession()`: Updates session state
  - `getSession()`: Retrieves session with all step data
  - `saveStepData()`: Persists step output data
  - `getStepData()`: Retrieves specific step data
  - `saveUserProfile()`: Saves/updates investment profile
  - `getUserProfile()`: Retrieves user profile
  - `getSessionHistory()`: Gets all sessions for a user

## Next Steps

Before using the StateManager, you need to:

1. **Install PostgreSQL** (if not already installed)
2. **Update DATABASE_URL** in `.env` with your actual database credentials
3. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```
4. **Run Database Migrations**:
   ```bash
   npx prisma migrate dev --name init
   ```

## Usage Example

```typescript
import { StateManager } from './lib/state-manager';

const stateManager = new StateManager();

// Create a new workflow session
const session = await stateManager.createSession('user-123');

// Save step data
await stateManager.saveStepData(session.sessionId, 1, {
  success: true,
  riskTolerance: 'medium',
  investmentHorizonYears: 10,
  capitalAvailable: 50000,
  longTermGoals: 'steady growth'
});

// Get session with all step data
const retrievedSession = await stateManager.getSession(session.sessionId);
```

## Database Schema Overview

- All IDs use `cuid()` for unique identification
- Timestamps (`createdAt`, `updatedAt`) are automatically managed
- Foreign key relationships with cascade deletes
- Unique constraint on `(sessionId, stepId)` for StepData
- Indexes on `userId`, `sessionId`, and `createdAt` for query performance
