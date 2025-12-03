import { NextRequest, NextResponse } from "next/server";
import { StateManager } from "@/lib/state-manager";

/**
 * GET /api/profiles/[userId]
 * Get a user's investment profile
 */
export async function GET(
  _request: NextRequest,
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
    const profile = await stateManager.getUserProfile(userId);

    return NextResponse.json({
      profile: {
        userId: profile.userId,
        riskTolerance: profile.riskTolerance,
        investmentHorizonYears: profile.investmentHorizonYears,
        capitalAvailable: profile.capitalAvailable,
        longTermGoals: profile.longTermGoals,
        createdAt: profile.createdAt,
      },
    });
  } catch (error) {
    console.error("Error getting profile:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    if (errorMessage.includes("not found")) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to get profile" },
      { status: 500 }
    );
  }
}
