# API Documentation

Complete reference for the ResurrectionStockPicker API endpoints.

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Examples](#examples)

## Overview

The ResurrectionStockPicker API is built with Next.js API Routes and provides RESTful endpoints for managing investment research workflows.

### Base URL

- **Development:** `http://localhost:3000/api`
- **Production:** `https://your-app.vercel.app/api`

### Content Type

All requests and responses use JSON:

```
Content-Type: application/json
```

## Authentication

Currently, the API does not require authentication for development. In production, you should implement authentication using NextAuth or similar.

## API Endpoints

### Workflows

#### Create New Workflow

Start a new investment research workflow session.

**Endpoint:** `POST /api/workflows`

**Request Body:**
```json
{
  "userId": "user123"
}
```

**Response:** `201 Created`
```json
{
  "sessionId": "session_abc123",
  "userId": "user123",
  "currentStep": 1,
  "completedSteps": [],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Missing or invalid userId
- `500 Internal Server Error` - Database error

---

#### Get Workflow Status

Retrieve the current status of a workflow session.

**Endpoint:** `GET /api/workflows/[sessionId]`

**Response:** `200 OK`
```json
{
  "sessionId": "session_abc123",
  "userId": "user123",
  "currentStep": 3,
  "completedSteps": [1, 2],
  "progress": 16.67,
  "canProceed": true,
  "nextStepRequirements": ["Select top sectors"],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T11:45:00Z"
}
```

**Error Responses:**
- `404 Not Found` - Session not found
- `500 Internal Server Error` - Database error

---

#### Delete Workflow

Reset/delete a workflow session.

**Endpoint:** `DELETE /api/workflows/[sessionId]`

**Response:** `200 OK`
```json
{
  "message": "Workflow session deleted successfully",
  "sessionId": "session_abc123"
}
```

**Error Responses:**
- `404 Not Found` - Session not found
- `500 Internal Server Error` - Database error

---

#### Execute Workflow Step

Execute a specific step in the workflow.

**Endpoint:** `POST /api/workflows/[sessionId]/steps/[stepId]`

**Request Body (varies by step):**

**Step 1 - Profile Definition:**
```json
{
  "riskTolerance": "medium",
  "investmentHorizonYears": 10,
  "capitalAvailable": 50000,
  "longTermGoals": "steady growth"
}
```

**Step 4 - Stock Screening:**
```json
{
  "marketCap": "large",
  "dividendYieldMin": 2.0,
  "peRatioMax": 25,
  "sector": "Technology"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "stepId": 1,
  "data": {
    // Step-specific output data
  },
  "warnings": [],
  "errors": []
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input data
- `404 Not Found` - Session not found
- `409 Conflict` - Step prerequisites not met
- `500 Internal Server Error` - Processing error

---

#### Skip Optional Step

Skip an optional workflow step (currently only Step 8 - Technical Trends).

**Endpoint:** `POST /api/workflows/[sessionId]/skip/[stepId]`

**Request Body:**
```json
{
  "reason": "User chose to skip technical analysis"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Step 8 skipped successfully",
  "sessionId": "session_abc123",
  "skippedStepId": 8
}
```

**Error Responses:**
- `400 Bad Request` - Step is not optional
- `404 Not Found` - Session not found
- `500 Internal Server Error` - Database error

---

#### Get Workflow Data

Retrieve all step data for a workflow session.

**Endpoint:** `GET /api/workflows/[sessionId]/data`

**Response:** `200 OK`
```json
{
  "sessionId": "session_abc123",
  "steps": {
    "1": {
      "stepId": 1,
      "success": true,
      "data": {
        "riskTolerance": "medium",
        "investmentHorizonYears": 10,
        "capitalAvailable": 50000,
        "longTermGoals": "steady growth"
      },
      "executedAt": "2024-01-15T10:35:00Z"
    },
    "2": {
      "stepId": 2,
      "success": true,
      "data": {
        "interestRate": 5.25,
        "inflationRate": 3.2,
        "unemploymentRate": 3.8,
        "marketTrend": "bullish",
        "summary": "Strong economic indicators..."
      },
      "executedAt": "2024-01-15T10:40:00Z"
    }
    // ... other steps
  }
}
```

**Error Responses:**
- `404 Not Found` - Session not found
- `500 Internal Server Error` - Database error

---

### User Profiles

#### Create/Update Profile

Create or update a user's investment profile.

**Endpoint:** `POST /api/profiles`

**Request Body:**
```json
{
  "userId": "user123",
  "riskTolerance": "medium",
  "investmentHorizonYears": 10,
  "capitalAvailable": 50000,
  "longTermGoals": "steady growth"
}
```

**Response:** `200 OK`
```json
{
  "userId": "user123",
  "riskTolerance": "medium",
  "investmentHorizonYears": 10,
  "capitalAvailable": 50000,
  "longTermGoals": "steady growth",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid profile data
- `500 Internal Server Error` - Database error

---

#### Get User Profile

Retrieve a user's investment profile.

**Endpoint:** `GET /api/profiles/[userId]`

**Response:** `200 OK`
```json
{
  "userId": "user123",
  "riskTolerance": "medium",
  "investmentHorizonYears": 10,
  "capitalAvailable": 50000,
  "longTermGoals": "steady growth",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `404 Not Found` - Profile not found
- `500 Internal Server Error` - Database error

---

### Workflow History

#### Get User's Workflow History

Retrieve all workflow sessions for a user.

**Endpoint:** `GET /api/workflows/history/[userId]`

**Query Parameters:**
- `limit` (optional) - Number of sessions to return (default: 10)
- `offset` (optional) - Pagination offset (default: 0)

**Response:** `200 OK`
```json
{
  "userId": "user123",
  "sessions": [
    {
      "sessionId": "session_abc123",
      "currentStep": 12,
      "completedSteps": [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12],
      "progress": 100,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T14:20:00Z"
    },
    {
      "sessionId": "session_def456",
      "currentStep": 5,
      "completedSteps": [1, 2, 3, 4],
      "progress": 33.33,
      "createdAt": "2024-01-14T09:15:00Z",
      "updatedAt": "2024-01-14T10:30:00Z"
    }
  ],
  "total": 2,
  "limit": 10,
  "offset": 0
}
```

**Error Responses:**
- `404 Not Found` - User not found
- `500 Internal Server Error` - Database error

---

### Cron Jobs

#### Monitoring Alerts

Scheduled job for sending monitoring alerts (requires Vercel Pro/Enterprise).

**Endpoint:** `POST /api/cron/monitoring-alerts`

**Headers:**
```
Authorization: Bearer YOUR_CRON_SECRET
```

**Response:** `200 OK`
```json
{
  "success": true,
  "alertsSent": 15,
  "timestamp": "2024-01-15T09:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing CRON_SECRET
- `500 Internal Server Error` - Processing error

---

## Data Models

### InvestmentProfile

```typescript
interface InvestmentProfile {
  userId: string;
  riskTolerance: 'low' | 'medium' | 'high';
  investmentHorizonYears: number;
  capitalAvailable: number;
  longTermGoals: 'steady growth' | 'dividend income' | 'capital preservation';
  createdAt: Date;
  updatedAt: Date;
}
```

### WorkflowSession

```typescript
interface WorkflowSession {
  sessionId: string;
  userId: string;
  currentStep: number;
  completedSteps: number[];
  createdAt: Date;
  updatedAt: Date;
}
```

### StepData

```typescript
interface StepData {
  id: string;
  sessionId: string;
  stepId: number;
  success: boolean;
  data: Record<string, any>;
  errors: string[];
  warnings: string[];
  executedAt: Date;
}
```

### Step-Specific Data Models

See [design.md](./.kiro/specs/resurrection-stock-picker/design.md) for detailed data models for each workflow step.

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional error context
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `SESSION_NOT_FOUND` | 404 | Workflow session not found |
| `PROFILE_NOT_FOUND` | 404 | User profile not found |
| `STEP_PREREQUISITES_NOT_MET` | 409 | Previous steps not completed |
| `DATA_SOURCE_ERROR` | 502 | External API failure |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Error Handling Best Practices

1. **Always check response status** before parsing JSON
2. **Handle network errors** with try-catch
3. **Display user-friendly messages** from error.message
4. **Log technical details** for debugging
5. **Implement retry logic** for transient errors

## Rate Limiting

### Current Limits

- **No rate limiting** in development
- **Production:** Consider implementing rate limiting per user/IP

### Recommended Implementation

```typescript
// Example rate limiting middleware
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later'
});

// Apply to API routes
app.use('/api/', limiter);
```

## Examples

### Complete Workflow Example

```typescript
// 1. Create workflow session
const createResponse = await fetch('/api/workflows', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: 'user123' })
});
const { sessionId } = await createResponse.json();

// 2. Execute Step 1 - Profile Definition
const step1Response = await fetch(`/api/workflows/${sessionId}/steps/1`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    riskTolerance: 'medium',
    investmentHorizonYears: 10,
    capitalAvailable: 50000,
    longTermGoals: 'steady growth'
  })
});
const step1Data = await step1Response.json();

// 3. Execute Step 2 - Market Conditions
const step2Response = await fetch(`/api/workflows/${sessionId}/steps/2`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
});
const step2Data = await step2Response.json();

// 4. Get workflow status
const statusResponse = await fetch(`/api/workflows/${sessionId}`);
const status = await statusResponse.json();
console.log(`Progress: ${status.progress}%`);

// 5. Get all workflow data
const dataResponse = await fetch(`/api/workflows/${sessionId}/data`);
const allData = await dataResponse.json();
```

### Error Handling Example

```typescript
async function executeStep(sessionId: string, stepId: number, inputs: any) {
  try {
    const response = await fetch(
      `/api/workflows/${sessionId}/steps/${stepId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      
      if (error.error.code === 'VALIDATION_ERROR') {
        // Handle validation errors
        console.error('Invalid input:', error.error.details);
        return { success: false, message: 'Please check your inputs' };
      }
      
      if (error.error.code === 'DATA_SOURCE_ERROR') {
        // Handle external API errors
        console.error('Data source unavailable:', error.error.message);
        return { success: false, message: 'Data temporarily unavailable' };
      }
      
      // Handle other errors
      throw new Error(error.error.message);
    }

    const data = await response.json();
    return { success: true, data };
    
  } catch (error) {
    console.error('Network error:', error);
    return { 
      success: false, 
      message: 'Network error. Please check your connection.' 
    };
  }
}
```

### Pagination Example

```typescript
async function getAllWorkflowHistory(userId: string) {
  const allSessions = [];
  let offset = 0;
  const limit = 10;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `/api/workflows/history/${userId}?limit=${limit}&offset=${offset}`
    );
    const data = await response.json();
    
    allSessions.push(...data.sessions);
    offset += limit;
    hasMore = data.sessions.length === limit;
  }

  return allSessions;
}
```

## Testing the API

### Using cURL

```bash
# Create workflow
curl -X POST http://localhost:3000/api/workflows \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123"}'

# Get workflow status
curl http://localhost:3000/api/workflows/session_abc123

# Execute step
curl -X POST http://localhost:3000/api/workflows/session_abc123/steps/1 \
  -H "Content-Type: application/json" \
  -d '{
    "riskTolerance":"medium",
    "investmentHorizonYears":10,
    "capitalAvailable":50000,
    "longTermGoals":"steady growth"
  }'
```

### Using Postman

1. Import the API endpoints into Postman
2. Set base URL: `http://localhost:3000/api`
3. Create requests for each endpoint
4. Save as collection for reuse

### Using API Integration Tests

```bash
# Run API integration tests
npm test -- app/api/__tests__/api-integration.test.ts
```

## Additional Resources

- [Next.js API Routes Documentation](https://nextjs.org/docs/api-routes/introduction)
- [REST API Best Practices](https://restfulapi.net/)
- [HTTP Status Codes](https://httpstatuses.com/)
- [Project README](./README.md)
