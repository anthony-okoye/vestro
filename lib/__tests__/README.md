# Test Suite Documentation

## Overview

This directory contains unit and integration tests for the ResurrectionStockPicker application.

## Test Files

### Unit Tests
- **validation.test.ts**: Tests for input validation functions
- **workflow-orchestrator.test.ts**: Tests for workflow orchestration logic

### Integration Tests
- **state-manager.integration.test.ts**: Tests for state persistence with Prisma and PostgreSQL
- **data-adapters.integration.test.ts**: Tests for data source adapters with mock responses and error scenarios

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### Specific Test File
```bash
npm test lib/__tests__/validation.test.ts
npm test lib/__tests__/state-manager.integration.test.ts
npm test lib/__tests__/data-adapters.integration.test.ts
npm test lib/__tests__/workflow-orchestrator.test.ts
```

## Integration Test Setup

The integration tests require a PostgreSQL database connection. Before running integration tests:

1. **Ensure PostgreSQL is running** on your system

2. **Configure DATABASE_URL** in your `.env` file with your actual PostgreSQL credentials:
   ```
   DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/resurrection_stock_picker"
   ```
   
   Replace:
   - `YOUR_USERNAME` with your PostgreSQL username (e.g., `postgres`)
   - `YOUR_PASSWORD` with your PostgreSQL password
   - `resurrection_stock_picker` with your database name
   
   **Note**: The current `.env` file has placeholder values (`user:password`) that need to be replaced with real credentials.

3. **Create the database** (if it doesn't exist):
   ```bash
   # Connect to PostgreSQL
   psql -U YOUR_USERNAME -h localhost
   
   # Create database
   CREATE DATABASE resurrection_stock_picker;
   
   # Exit
   \q
   ```

4. **Run Prisma migrations**:
   ```bash
   npx prisma migrate dev
   ```

5. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

### Alternative: Using SQLite for Testing

If you don't have PostgreSQL set up, you can temporarily use SQLite for testing:

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = "file:./dev.db"
   }
   ```

2. Update `.env`:
   ```
   DATABASE_URL="file:./dev.db"
   ```

3. Run migrations:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

## Integration Test Coverage

### State Manager Integration Tests

The `state-manager.integration.test.ts` file covers:

### Session Lifecycle
- Creating new workflow sessions
- Updating session state (current step, completed steps)
- Retrieving sessions with all associated step data
- Getting session history for a user
- Error handling for non-existent sessions

### Step Data Persistence
- Saving and retrieving step output data
- Updating existing step data (upsert behavior)
- Handling step data with errors and warnings
- Error handling for non-existent step data

### User Profile Management
- Saving and retrieving investment profiles
- Updating existing profiles
- Error handling for non-existent profiles

### Concurrent Access
- Concurrent session creation (multiple sessions for same user)
- Concurrent step data saves to the same session (different steps)
- Concurrent updates to the same step data (race conditions)
- Concurrent session updates (multiple fields)

## Test Data Cleanup

Integration tests automatically clean up test data:
- **Before all tests**: Removes any existing test data
- **After all tests**: Removes all created test data and disconnects from database
- Test user ID: `test-user-integration`

This ensures tests are isolated and repeatable.

### Data Adapters Integration Tests

The `data-adapters.integration.test.ts` file covers:

#### Adapter Functionality
- **SECEdgarAdapter**: Company search, filings retrieval, error handling, rate limiting
- **YahooFinanceAdapter**: Quote fetching, company profiles, sector data, missing data handling
- **FinvizAdapter**: Stock screening with filters, filter conversion, HTTP error handling
- **FederalReserveAdapter**: Interest rates, inflation rates, unemployment rates, invalid data filtering
- **CNBCAdapter**: Market trend data, sentiment indicators, data structure consistency
- **BloombergAdapter**: Market indices, commodities, currencies, trend determination

#### Error Scenarios
- HTTP errors with retry logic (3 attempts with exponential backoff)
- Network errors and timeouts
- Missing or invalid data handling
- API authentication failures
- Transient error recovery

#### Rate Limiting
- Enforcement of rate limits per adapter (10-120 requests per minute)
- Rate limit information tracking
- Request queue management

#### Availability Checks
- Adapter availability verification
- Graceful handling of unavailable services

#### Mock Responses
- All tests use mocked fetch responses to avoid external API dependencies
- Tests validate data parsing and transformation logic
- Tests verify error handling without making real API calls

**Requirements Validated**: 2.1 (macro data fetching), 3.1 (sector data), 4.5 (stock screening), 5.1 (financial filings), 5.2 (financial snapshots)

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Always clean up test data to prevent pollution
3. **Real Database**: Integration tests use a real PostgreSQL database, not mocks
4. **Concurrent Testing**: Tests verify behavior under concurrent access scenarios
5. **Error Cases**: Tests include both success and error scenarios

## Troubleshooting

### Authentication Failed Error
```
Authentication failed against database server at `localhost`, 
the provided database credentials for `user` are not valid.
```

**Solution**: Update your `.env` file with actual PostgreSQL credentials:
1. Open `.env` file
2. Replace `user:password` with your real PostgreSQL username and password
3. Example: `DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/resurrection_stock_picker"`

### Database Connection Errors
- Verify PostgreSQL is running: `psql --version` or check your PostgreSQL service
- Check DATABASE_URL in `.env` file has correct credentials
- Ensure database exists: `psql -U YOUR_USERNAME -l` to list databases
- Create database if needed: `createdb -U YOUR_USERNAME resurrection_stock_picker`
- Run `npx prisma migrate dev` to create tables

### Prisma Client Errors
- Run `npx prisma generate` to regenerate the client
- Check that `@prisma/client` is installed: `npm list @prisma/client`
- Delete `node_modules/.prisma` and regenerate: `rm -rf node_modules/.prisma && npx prisma generate`

### Test Timeouts
- Integration tests may take longer than unit tests
- Ensure database is responsive
- Check network connectivity if using remote database

### Common PostgreSQL Setup Issues

**PostgreSQL not installed?**
- Ubuntu/Debian: `sudo apt-get install postgresql postgresql-contrib`
- macOS: `brew install postgresql`
- Windows: Download from https://www.postgresql.org/download/windows/

**Can't connect to PostgreSQL?**
- Check if service is running: `sudo service postgresql status` (Linux) or `brew services list` (macOS)
- Start service: `sudo service postgresql start` (Linux) or `brew services start postgresql` (macOS)

**Don't know your PostgreSQL password?**
- Default user is usually `postgres`
- You may need to set/reset the password for the postgres user
