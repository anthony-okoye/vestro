import { NextRequest, NextResponse } from "next/server";
import { StateManager } from "@/lib/state-manager";

/**
 * GET /api/workflows/[sessionId]/data
 * Get all step data for a workflow session
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const stateManager = new StateManager();
    const session = await stateManager.getSession(sessionId);

    // Convert Map to object for JSON serialization
    const stepDataObject: Record<number, any> = {};
    session.stepData.forEach((data, stepId) => {
      stepDataObject[stepId] = data;
    });

    return NextResponse.json({
      sessionId: session.sessionId,
      userId: session.userId,
      currentStep: session.currentStep,
      completedSteps: session.completedSteps,
      stepData: stepDataObject,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    });
  } catch (error) {
    console.error("Error getting workflow data:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    if (errorMessage.includes("not found")) {
      return NextResponse.json(
        { error: "Workflow session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to get workflow data" },
      { status: 500 }
    );
  }
}
