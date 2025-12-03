// Core workflow types

export interface StepInputs {
  [key: string]: any;
}

export interface StepOutputs {
  [key: string]: any;
  success: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface InputSchema {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface OutputSchema {
  [key: string]: {
    type: string;
    description?: string;
  };
}

export interface WorkflowContext {
  sessionId: string;
  userId: string;
  previousStepData: Map<number, StepOutputs>;
  userProfile?: InvestmentProfile;
}

// StepProcessor Interface
export interface StepProcessor {
  stepId: number;
  stepName: string;
  isOptional: boolean;

  validateInputs(inputs: StepInputs): ValidationResult;
  execute(inputs: StepInputs, context: WorkflowContext): Promise<StepOutputs>;
  getRequiredInputs(): InputSchema[];
  getOutputSchema(): OutputSchema;
}

// WorkflowOrchestrator Interface
export interface WorkflowOrchestrator {
  startWorkflow(userId: string): Promise<WorkflowSession>;
  executeStep(
    sessionId: string,
    stepId: number,
    inputs: StepInputs
  ): Promise<StepOutputs>;
  getWorkflowStatus(sessionId: string): Promise<WorkflowStatus>;
  skipOptionalStep(sessionId: string, stepId: number): Promise<void>;
  resetWorkflow(sessionId: string): Promise<void>;
}

export interface WorkflowSession {
  sessionId: string;
  userId: string;
  currentStep: number;
  completedSteps: number[];
  stepData: Map<number, StepOutputs>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStatus {
  sessionId: string;
  currentStep: number;
  completedSteps: number[];
  totalSteps: number;
  progress: number; // 0-100
  canProceed: boolean;
  nextStepRequirements: string[];
}

// DataSourceAdapter Interface
export interface DataSourceAdapter {
  sourceName: string;

  fetch(request: DataRequest): Promise<DataResponse>;
  isAvailable(): Promise<boolean>;
  getRateLimit(): RateLimitInfo;
}

export interface DataRequest {
  endpoint: string;
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

export interface DataResponse {
  data: any;
  status: number;
  timestamp: Date;
  source: string;
}

export interface RateLimitInfo {
  requestsPerMinute: number;
  requestsRemaining: number;
  resetTime: Date;
}

// Domain Models (from design document)

export interface InvestmentProfile {
  userId: string;
  riskTolerance: "low" | "medium" | "high";
  investmentHorizonYears: number;
  capitalAvailable: number;
  longTermGoals: "steady growth" | "dividend income" | "capital preservation";
  createdAt: Date;
}

export interface MacroSnapshot {
  interestRate: number;
  inflationRate: number;
  unemploymentRate: number;
  marketTrend: "bullish" | "bearish" | "neutral";
  summary: string;
  fetchedAt: Date;
}

export interface SectorRanking {
  sectorName: string;
  score: number;
  rationale: string;
  dataPoints: {
    growthRate?: number;
    marketCap?: number;
    momentum?: number;
  };
}

export interface StockCandidate {
  ticker: string;
  companyName: string;
  sector: string;
  dividendYield: number;
  peRatio: number;
  marketCap: "large" | "mid" | "small";
}

export interface Fundamentals {
  ticker: string;
  revenueGrowth5y: number;
  earningsGrowth5y: number;
  profitMargin: number;
  debtToEquity: number;
  freeCashFlow: number;
  analyzedAt: Date;
}

export interface MoatAnalysis {
  ticker: string;
  patents: string;
  brandStrength: string;
  customerBase: string;
  costLeadership: string;
  overallMoatScore?: number;
}

export interface ValuationMetrics {
  ticker: string;
  peRatio: number;
  pbRatio: number;
  vsPeers: string;
  fairValueEstimate?: number;
}

export interface TechnicalSignals {
  ticker: string;
  trend: "upward" | "downward" | "sideways";
  maCross: boolean;
  rsi?: number;
  analyzedAt: Date;
}

export interface AnalystSummary {
  ticker: string;
  buyCount: number;
  holdCount: number;
  sellCount: number;
  averageTarget: number;
  consensus: "strong buy" | "buy" | "hold" | "sell" | "strong sell";
}

export interface BuyRecommendation {
  ticker: string;
  sharesToBuy: number;
  entryPrice: number;
  orderType: "market" | "limit";
  totalInvestment: number;
  portfolioPercentage: number;
}

export interface TradeConfirmation {
  ticker: string;
  quantity: number;
  price: number;
  confirmationId: string;
  executedAt: Date;
  isMock: boolean;
}

export interface MonitoringPlan {
  ticker: string;
  priceAlertsSet: boolean;
  earningsReviewPlanned: boolean;
  reviewFrequency: "quarterly" | "yearly";
  nextReviewDate: Date;
  alertThresholds?: {
    priceDropPercent?: number;
    priceGainPercent?: number;
  };
}

export interface ScreeningFilters {
  marketCap?: "large" | "mid" | "small";
  dividendYieldMin?: number;
  peRatioMax?: number;
  sector?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface RiskModel {
  type: "conservative" | "balanced" | "aggressive";
  maxPositionSize: number; // percentage of portfolio
  diversificationMin: number; // minimum number of positions
}
