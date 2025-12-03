import { NextRequest, NextResponse } from "next/server";
import { WorkflowOrchestrator } from "@/lib/workflow-orchestrator";
import { StateManager } from "@/lib/state-manager";
import * as stepProcessors from "@/lib/step-processors";

/**
 * POST /api/workflows
 * Start a new workflow session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Initialize state manager and orchestrator
    const stateManager = new StateManager();
    const orchestrator = new WorkflowOrchestrator(stateManager);

    // Register all step processors
    orchestrator.registerStepProcessor(new stepProcessors.ProfileDefinitionProcessor(stateManager));
    orchestrator.registerStepProcessor(new stepProcessors.MarketConditionsProcessor());
    orchestrator.registerStepProcessor(new stepProcessors.SectorIdentificationProcessor());
    orchestrator.registerStepProcessor(new stepProcessors.StockScreeningProcessor());
    orchestrator.registerStepProcessor(new stepProcessors.FundamentalAnalysisProcessor());
    orchestrator.registerStepProcessor(new stepProcessors.CompetitivePositionProcessor());
    orchestrator.registerStepProcessor(new stepProcessors.ValuationEvaluationProcessor());
    orchestrator.registerStepProcessor(new stepProcessors.TechnicalTrendsProcessor());
    orchestrator.registerStepProcessor(new stepProcessors.AnalystSentimentProcessor());
    orchestrator.registerStepProcessor(new stepProcessors.PositionSizingProcessor());
    orchestrator.registerStepProcessor(new stepProcessors.MockTradeProcessor());
    orchestrator.registerStepProcessor(new stepProcessors.MonitoringSetupProcessor());

    // Start workflow
    const session = await orchestrator.startWorkflow(userId);

    return NextResponse.json({
      sessionId: session.sessionId,
      userId: session.userId,
      currentStep: session.currentStep,
      createdAt: session.createdAt,
    });
  } catch (error) {
    console.error("Error starting workflow:", error);
    return NextResponse.json(
      { error: "Failed to start workflow" },
      { status: 500 }
    );
  }
}
