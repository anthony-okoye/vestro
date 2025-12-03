-- Migration: Add performance indexes and stock analysis cache
-- This migration adds indexes to optimize common query patterns

-- Add composite index for workflow history queries (userId + createdAt)
CREATE INDEX IF NOT EXISTS "workflow_sessions_userId_createdAt_idx" ON "workflow_sessions"("userId", "createdAt");

-- Add index for recently updated sessions
CREATE INDEX IF NOT EXISTS "workflow_sessions_updatedAt_idx" ON "workflow_sessions"("updatedAt");

-- Add index for querying specific step types across sessions
CREATE INDEX IF NOT EXISTS "step_data_stepId_idx" ON "step_data"("stepId");

-- Add index for filtering by success status
CREATE INDEX IF NOT EXISTS "step_data_success_idx" ON "step_data"("success");

-- Create stock analysis cache table
CREATE TABLE IF NOT EXISTS "stock_analysis_cache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticker" TEXT NOT NULL UNIQUE,
    "companyName" TEXT,
    "sector" TEXT,
    "lastFetched" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cacheData" TEXT NOT NULL,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Add indexes for stock analysis cache
CREATE INDEX IF NOT EXISTS "stock_analysis_cache_ticker_idx" ON "stock_analysis_cache"("ticker");
CREATE INDEX IF NOT EXISTS "stock_analysis_cache_sector_idx" ON "stock_analysis_cache"("sector");
CREATE INDEX IF NOT EXISTS "stock_analysis_cache_lastFetched_idx" ON "stock_analysis_cache"("lastFetched");
CREATE INDEX IF NOT EXISTS "stock_analysis_cache_hitCount_idx" ON "stock_analysis_cache"("hitCount");
