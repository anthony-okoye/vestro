import { WorkflowSession, StepOutputs, InvestmentProfile } from "./types";
import { prisma } from "./prisma";

/**
 * StateManager handles persistence of workflow sessions and user data using Prisma
 */
export class StateManager {
  /**
   * Create a new workflow session for a user
   */
  async createSession(userId: string): Promise<WorkflowSession> {
    // Ensure user exists
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId },
    });

    const session = await prisma.workflowSession.create({
      data: {
        userId,
        currentStep: 1,
        completedSteps: [],
      },
      include: {
        stepData: true,
      },
    });

    return this.mapPrismaSessionToWorkflowSession(session);
  }

  /**
   * Update an existing workflow session
   */
  async updateSession(
    sessionId: string,
    updates: Partial<WorkflowSession>
  ): Promise<void> {
    const updateData: any = {};

    if (updates.currentStep !== undefined) {
      updateData.currentStep = updates.currentStep;
    }

    if (updates.completedSteps !== undefined) {
      updateData.completedSteps = updates.completedSteps;
    }

    await prisma.workflowSession.update({
      where: { id: sessionId },
      data: updateData,
    });
  }

  /**
   * Get a workflow session by ID
   */
  async getSession(sessionId: string): Promise<WorkflowSession> {
    const session = await prisma.workflowSession.findUnique({
      where: { id: sessionId },
      include: {
        stepData: true,
      },
    });

    if (!session) {
      throw new Error(`Workflow session not found: ${sessionId}`);
    }

    return this.mapPrismaSessionToWorkflowSession(session);
  }

  /**
   * Save step output data for a workflow session
   */
  async saveStepData(
    sessionId: string,
    stepId: number,
    data: StepOutputs
  ): Promise<void> {
    const { success, errors = [], warnings = [], ...restData } = data;

    await prisma.stepData.upsert({
      where: {
        sessionId_stepId: {
          sessionId,
          stepId,
        },
      },
      update: {
        data: restData,
        success,
        errors,
        warnings,
      },
      create: {
        sessionId,
        stepId,
        data: restData,
        success,
        errors,
        warnings,
      },
    });
  }

  /**
   * Get step output data for a specific step in a workflow session
   */
  async getStepData(sessionId: string, stepId: number): Promise<StepOutputs> {
    const stepData = await prisma.stepData.findUnique({
      where: {
        sessionId_stepId: {
          sessionId,
          stepId,
        },
      },
    });

    if (!stepData) {
      throw new Error(
        `Step data not found for session ${sessionId}, step ${stepId}`
      );
    }

    return {
      ...(stepData.data as Record<string, any>),
      success: stepData.success,
      errors: stepData.errors,
      warnings: stepData.warnings,
    };
  }

  /**
   * Save or update a user's investment profile
   */
  async saveUserProfile(
    userId: string,
    profile: InvestmentProfile
  ): Promise<void> {
    // Ensure user exists
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId },
    });

    // Find existing profile or create new one
    const existingProfile = await prisma.investmentProfile.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (existingProfile) {
      await prisma.investmentProfile.update({
        where: { id: existingProfile.id },
        data: {
          riskTolerance: profile.riskTolerance,
          investmentHorizonYears: profile.investmentHorizonYears,
          capitalAvailable: profile.capitalAvailable,
          longTermGoals: profile.longTermGoals,
        },
      });
    } else {
      await prisma.investmentProfile.create({
        data: {
          userId,
          riskTolerance: profile.riskTolerance,
          investmentHorizonYears: profile.investmentHorizonYears,
          capitalAvailable: profile.capitalAvailable,
          longTermGoals: profile.longTermGoals,
        },
      });
    }
  }

  /**
   * Get a user's investment profile
   */
  async getUserProfile(userId: string): Promise<InvestmentProfile> {
    const profile = await prisma.investmentProfile.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (!profile) {
      throw new Error(`Investment profile not found for user: ${userId}`);
    }

    return {
      userId: profile.userId,
      riskTolerance: profile.riskTolerance as "low" | "medium" | "high",
      investmentHorizonYears: profile.investmentHorizonYears,
      capitalAvailable: profile.capitalAvailable,
      longTermGoals: profile.longTermGoals as
        | "steady growth"
        | "dividend income"
        | "capital preservation",
      createdAt: profile.createdAt,
    };
  }

  /**
   * Get all workflow sessions for a user
   */
  async getSessionHistory(userId: string): Promise<WorkflowSession[]> {
    const sessions = await prisma.workflowSession.findMany({
      where: { userId },
      include: {
        stepData: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return sessions.map((session) =>
      this.mapPrismaSessionToWorkflowSession(session)
    );
  }

  /**
   * Helper method to map Prisma session to WorkflowSession type
   */
  private mapPrismaSessionToWorkflowSession(session: any): WorkflowSession {
    const stepDataMap = new Map<number, StepOutputs>();

    if (session.stepData) {
      for (const step of session.stepData) {
        stepDataMap.set(step.stepId, {
          ...(step.data as Record<string, any>),
          success: step.success,
          errors: step.errors,
          warnings: step.warnings,
        });
      }
    }

    return {
      sessionId: session.id,
      userId: session.userId,
      currentStep: session.currentStep,
      completedSteps: session.completedSteps,
      stepData: stepDataMap,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }
}
