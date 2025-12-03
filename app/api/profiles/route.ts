import { NextRequest, NextResponse } from "next/server";
import { StateManager } from "@/lib/state-manager";
import { InvestmentProfile } from "@/lib/types";

/**
 * POST /api/profiles
 * Create or update a user's investment profile
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      riskTolerance,
      investmentHorizonYears,
      capitalAvailable,
      longTermGoals,
    } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    if (!riskTolerance || !["low", "medium", "high"].includes(riskTolerance)) {
      return NextResponse.json(
        { error: "riskTolerance must be 'low', 'medium', or 'high'" },
        { status: 400 }
      );
    }

    if (
      typeof investmentHorizonYears !== "number" ||
      investmentHorizonYears <= 0
    ) {
      return NextResponse.json(
        { error: "investmentHorizonYears must be a positive number" },
        { status: 400 }
      );
    }

    if (typeof capitalAvailable !== "number" || capitalAvailable <= 0) {
      return NextResponse.json(
        { error: "capitalAvailable must be a positive number" },
        { status: 400 }
      );
    }

    if (
      !longTermGoals ||
      !["steady growth", "dividend income", "capital preservation"].includes(
        longTermGoals
      )
    ) {
      return NextResponse.json(
        {
          error:
            "longTermGoals must be 'steady growth', 'dividend income', or 'capital preservation'",
        },
        { status: 400 }
      );
    }

    const profile: InvestmentProfile = {
      userId,
      riskTolerance,
      investmentHorizonYears,
      capitalAvailable,
      longTermGoals,
      createdAt: new Date(),
    };

    const stateManager = new StateManager();
    await stateManager.saveUserProfile(userId, profile);

    return NextResponse.json({
      message: "Profile saved successfully",
      profile: {
        userId: profile.userId,
        riskTolerance: profile.riskTolerance,
        investmentHorizonYears: profile.investmentHorizonYears,
        capitalAvailable: profile.capitalAvailable,
        longTermGoals: profile.longTermGoals,
      },
    });
  } catch (error) {
    console.error("Error saving profile:", error);
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 }
    );
  }
}
