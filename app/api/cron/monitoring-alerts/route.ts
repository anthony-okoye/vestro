import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Vercel Cron Job: Monitoring Alerts
 * 
 * This endpoint is called daily by Vercel Cron to check monitoring plans
 * and send alerts for stocks that need review.
 * 
 * Schedule: Daily at 9:00 AM UTC (configured in vercel.json)
 * 
 * Security: Vercel Cron jobs include a special header for authentication
 */
export async function GET(request: NextRequest) {
  // Verify this is a legitimate Vercel Cron request
  const authHeader = request.headers.get('authorization');
  
  // In production, Vercel adds a special header to cron requests
  // For local testing, we'll allow requests without the header
  if (process.env.NODE_ENV === 'production') {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all workflow sessions with monitoring setup (step 12 completed)
    const sessionsWithMonitoring = await prisma.workflowSession.findMany({
      where: {
        completedSteps: {
          has: 12, // Step 12 is monitoring setup
        },
      },
      include: {
        stepData: {
          where: {
            stepId: 12,
          },
        },
        user: true,
      },
    });

    const alertsToSend: Array<{
      userId: string;
      sessionId: string;
      ticker: string;
      alertType: string;
      nextReviewDate: Date;
    }> = [];

    // Check each monitoring plan for alerts due today
    for (const session of sessionsWithMonitoring) {
      const monitoringData = session.stepData[0];
      if (!monitoringData || !monitoringData.data) continue;

      const monitoringPlan = monitoringData.data as any;
      
      // Check if review is due today
      if (monitoringPlan.nextReviewDate) {
        const reviewDate = new Date(monitoringPlan.nextReviewDate);
        reviewDate.setHours(0, 0, 0, 0);

        if (reviewDate <= today) {
          alertsToSend.push({
            userId: session.userId,
            sessionId: session.id,
            ticker: monitoringPlan.ticker || 'Unknown',
            alertType: 'earnings_review',
            nextReviewDate: reviewDate,
          });
        }
      }
    }

    // In a real implementation, you would:
    // 1. Send emails or push notifications to users
    // 2. Update the monitoring plan with the next review date
    // 3. Log the alerts sent
    
    // For now, we'll just log the alerts that would be sent
    console.log(`[Cron] Monitoring alerts check completed at ${new Date().toISOString()}`);
    console.log(`[Cron] Found ${alertsToSend.length} alerts to send`);

    // Update next review dates for alerted sessions
    for (const alert of alertsToSend) {
      const stepData = await prisma.stepData.findUnique({
        where: {
          sessionId_stepId: {
            sessionId: alert.sessionId,
            stepId: 12,
          },
        },
      });

      if (stepData && stepData.data) {
        const monitoringPlan = stepData.data as any;
        const reviewFrequency = monitoringPlan.reviewFrequency || 'quarterly';
        
        // Calculate next review date
        const nextReview = new Date(alert.nextReviewDate);
        if (reviewFrequency === 'quarterly') {
          nextReview.setMonth(nextReview.getMonth() + 3);
        } else if (reviewFrequency === 'yearly') {
          nextReview.setFullYear(nextReview.getFullYear() + 1);
        }

        // Update the monitoring plan with new review date
        await prisma.stepData.update({
          where: {
            sessionId_stepId: {
              sessionId: alert.sessionId,
              stepId: 12,
            },
          },
          data: {
            data: {
              ...monitoringPlan,
              nextReviewDate: nextReview.toISOString(),
              lastReviewDate: today.toISOString(),
            },
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      alertsChecked: sessionsWithMonitoring.length,
      alertsSent: alertsToSend.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Error processing monitoring alerts:', error);
    return NextResponse.json(
      {
        error: 'Failed to process monitoring alerts',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
