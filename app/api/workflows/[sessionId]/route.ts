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
 * GET /api/workflows/[sessionId]
 * Get workflow status
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    const orchestrator = createOrchestrator();
    const status = await orchestrator.getWorkflowStatus(sessionId);

    return NextResponse.json(status);
  } catch (error) {
    console.error("Error getting workflow status:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    if (errorMessage.includes("not found")) {
      return NextResponse.json(
        { error: "Workflow session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to get workflow status" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workflows/[sessionId]
 * Reset workflow to start from beginning
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    const orchestrator = createOrchestrator();
    await orchestrator.resetWorkflow(sessionId);

    return NextResponse.json({
      message: "Workflow reset successfully",
      sessionId,
    });
  } catch (error) {
    console.error("Error resetting workflow:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    if (errorMessage.includes("not found")) {
      return NextResponse.json(
        { error: "Workflow session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to reset workflow" },
      { status: 500 }
    );
  }
}
