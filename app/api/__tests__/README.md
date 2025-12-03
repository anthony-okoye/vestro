# API Integration Tests

## Overview

This directory contains integration tests for the ResurrectionStockPicker API routes. These tests verify complete workflow execution through the API layer, testing Requirements 1.5 and 2.6.

## Test Coverage

The `api-integration.test.ts` file includes comprehensive tests for:

### Complete Workflow Execution
- **Full workflow from start to finish**: Tests all 12 steps of the investment workflow, including profile definition, market analysis, stock screening, fundamental analysis, competitive position, valuation, analyst sentiment, position sizing, mock trade execution, and monitoring setup.
- **Workflow with technical analysis**: Tests the complete workflow including the optional Step 8 (Technical Trends).

### Workflow State Management
- **State persistence across sessions**: Verifies that workflow state is correctly saved and can be retrieved across different orchestrator instances.
- **Workflow reset functionality**: Tests the ability to reset a workflow back to the beginning.

### Error Handling and Edge Cases
- **Invalid step execution**: Tests graceful handling of invalid inputs.
- **Skipping non-optional steps**: Verifies that only optional steps (Step 8) can be skipped.
- **Non-existent session handling**: Tests error handling for invalid session IDs.
- **Data source failures with fallbacks**: Verifies that the system handles data source failures gracefully.

### Multiple User Workflows
- **Concurrent workflows**: Tests that multiple users can run independent workflows simultaneously without interference.

## Prerequisites

Before running these tests, you need:

1. **PostgreSQL Database**: Install and run PostgreSQL
2. **Database Configuration**: Set up your `.env` file with a valid `DATABASE_URL`
3. **Prisma Setup**: Generate Prisma client and run migrations

### Setup Steps

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the `DATABASE_URL` in `.env`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/resurrection_stock_picker_test"
   ```

3. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

4. Run database migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

## Running the Tests

### Run all API integration tests:
```bash
npm test -- app/api/__tests__/api-integration.test.ts
```

### Run with coverage:
```bash
npm test -- app/api/__tests__/api-integration.test.ts --coverage
```

### Run in watch mode (for development):
```bash
npm test -- app/api/__tests__/api-integration.test.ts --watch
```

## Test Behavior

### Database Availability
The tests automatically detect if the database is available:
- **Database available**: All tests run normally
- **Database unavailable**: Tests are gracefully skipped with a warning message

This ensures that tests don't fail in environments where the database isn't configured (e.g., CI/CD pipelines without database access).

### Test Data Cleanup
- Tests use a dedicated test user ID: `api-test-user`
- All test data is cleaned up before and after test execution
- Tests are isolated and don't interfere with each other

## Test Structure

Each test follows this pattern:

1. **Setup**: Create necessary data (profiles, sessions)
2. **Execute**: Run workflow steps through the orchestrator
3. **Verify**: Assert expected outcomes and state changes
4. **Cleanup**: Remove test data (handled automatically)

## Requirements Coverage

These tests satisfy the following requirements:

- **Requirement 1.5**: Tests complete workflow session management and step data persistence
- **Requirement 2.6**: Tests macro snapshot generation and workflow progression through market conditions analysis

## Troubleshooting

### Tests are being skipped
**Cause**: Database is not available or `DATABASE_URL` is not set.

**Solution**: 
1. Ensure PostgreSQL is running
2. Verify `DATABASE_URL` in `.env` is correct
3. Run `npx prisma migrate dev` to create the database schema

### Connection errors
**Cause**: Database credentials are incorrect or PostgreSQL is not running.

**Solution**:
1. Check PostgreSQL is running: `pg_isready` (Linux/Mac) or check Windows Services
2. Verify database credentials in `.env`
3. Test connection: `npx prisma db pull`

### Migration errors
**Cause**: Database schema is out of sync.

**Solution**:
1. Reset database: `npx prisma migrate reset`
2. Run migrations: `npx prisma migrate dev`

## Future Enhancements

Potential improvements for these tests:

1. **HTTP API Testing**: Add tests that make actual HTTP requests to Next.js API routes
2. **Performance Testing**: Add tests to measure workflow execution time
3. **Concurrent Load Testing**: Test system behavior under high concurrent load
4. **Data Source Mocking**: Add comprehensive mocking for external data sources
5. **Error Recovery Testing**: Test workflow recovery after failures

## Related Files

- `app/api/workflows/route.ts`: Workflow creation endpoint
- `app/api/workflows/[sessionId]/route.ts`: Workflow status and reset endpoints
- `app/api/workflows/[sessionId]/steps/[stepId]/route.ts`: Step execution endpoint
- `app/api/workflows/[sessionId]/skip/[stepId]/route.ts`: Optional step skipping endpoint
- `app/api/workflows/[sessionId]/data/route.ts`: Workflow data retrieval endpoint
- `lib/workflow-orchestrator.ts`: Core workflow orchestration logic
- `lib/state-manager.ts`: State persistence layer
