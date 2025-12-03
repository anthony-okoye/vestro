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
 * POST /api/workflows/[sessionId]/steps/[stepId]
 * Execute a specific workflow step
 */
export async function POST(
  request: NextRequest,
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

    const body = await request.json();
    const { inputs } = body;

    if (!inputs) {
      return NextResponse.json(
        { error: "inputs are required" },
        { status: 400 }
      );
    }

    const orchestrator = createOrchestrator();
    
    console.log('=== STEP EXECUTION DEBUG ===');
    console.log('Session ID:', sessionId);
    console.log('Step ID:', stepIdNum);
    console.log('Inputs received:', JSON.stringify(inputs, null, 2));
    
    const outputs = await orchestrator.executeStep(sessionId, stepIdNum, inputs);
    
    console.log('Outputs:', JSON.stringify(outputs, null, 2));
    console.log('=== END DEBUG ===');

    if (!outputs.success) {
      console.error('Step execution failed:', outputs.errors);
      return NextResponse.json(
        {
          success: false,
          errors: outputs.errors,
          warnings: outputs.warnings,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: outputs,
      warnings: outputs.warnings,
    });
  } catch (error) {
    console.error("Error executing step:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    if (errorMessage.includes("not found")) {
      return NextResponse.json(
        { error: "Workflow session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to execute step" },
      { status: 500 }
    );
  }
}
