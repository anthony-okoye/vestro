import { NextRequest, NextResponse } from "next/server";
import { StateManager } from "@/lib/state-manager";

/**
 * GET /api/workflows/history/[userId]
 * Get all workflow sessions for a user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const stateManager = new StateManager();
    const sessions = await stateManager.getSessionHistory(userId);

    // Convert sessions to JSON-serializable format
    const serializedSessions = sessions.map((session) => ({
      sessionId: session.sessionId,
      userId: session.userId,
      currentStep: session.currentStep,
      completedSteps: session.completedSteps,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      stepCount: session.stepData.size,
    }));

    return NextResponse.json({
      sessions: serializedSessions,
      count: serializedSessions.length,
    });
  } catch (error) {
    console.error("Error getting workflow history:", error);
    return NextResponse.json(
      { error: "Failed to get workflow history" },
      { status: 500 }
    );
  }
}
