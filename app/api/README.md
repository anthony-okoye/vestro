# API Routes

This directory contains Next.js API routes for the ResurrectionStockPicker workflow.

## Planned Routes

### Workflow Management
- `POST /api/workflows` - Start new workflow
- `GET /api/workflows/[sessionId]` - Get workflow status
- `DELETE /api/workflows/[sessionId]` - Reset workflow
- `POST /api/workflows/[sessionId]/steps/[stepId]` - Execute step
- `POST /api/workflows/[sessionId]/skip/[stepId]` - Skip optional step

### User Profile
- `POST /api/profiles` - Create/update profile
- `GET /api/profiles/[userId]` - Get profile

### Workflow History
- `GET /api/workflows/history/[userId]` - Get user's workflow sessions
- `GET /api/workflows/[sessionId]/data` - Get all step data for session

API routes will be implemented in subsequent tasks.
