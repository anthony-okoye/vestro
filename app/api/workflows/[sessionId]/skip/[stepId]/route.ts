import { NextRequest, NextResponse } from "next/server";
import { WorkflowOrchestrator } from "@/lib/workflow-orchestrator";
import { StateManager } from "@/lib/state-manager";
import * as stepProcessors from "@/lib/step-processors";

/**
 * Helper function to create orchestrator with all processors registered
 */
function createOrchestrator(): WorkflowOrchestrator {
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

  return orchestrator;
}

/**
 * POST /api/workflows/[sessionId]/skip/[stepId]
 * Skip an optional workflow step
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { sessionId: string; stepId: string } }
) {
  try {
    const { sessionId, stepId } = params;
    const stepIdNum = parseInt(stepId, 10);

    if (isNaN(stepIdNum)) {
      return NextResponse.json(
        { error: "Invalid step ID" },
        { status: 400 }
      );
    }

    const orchestrator = createOrchestrator();
    await orchestrator.skipOptionalStep(sessionId, stepIdNum);

    return NextResponse.json({
      message: "Step skipped successfully",
      sessionId,
      stepId: stepIdNum,
    });
  } catch (error) {
    console.error("Error skipping step:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    if (errorMessage.includes("not found")) {
      return NextResponse.json(
        { error: "Workflow session not found" },
        { status: 404 }
      );
    }

    if (errorMessage.includes("not optional")) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to skip step" },
      { status: 500 }
    );
  }
}
