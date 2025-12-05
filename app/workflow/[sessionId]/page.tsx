'use client';

import { useEffect, useState, useCallback } from 'react';
import WorkflowProgress from '@/components/WorkflowProgress';
import Link from 'next/link';

interface WorkflowPageProps {
  params: {
    sessionId: string;
  };
}

const STEP_NAMES = [
  'Profile Definition',
  'Market Conditions',
  'Sector Identification',
  'Stock Screening',
  'Fundamental Analysis',
  'Competitive Position',
  'Valuation Evaluation',
  'Technical Trends',
  'Analyst Sentiment',
  'Position Sizing',
  'Mock Trade',
  'Monitoring Setup'
];

export default function WorkflowPage({ params }: WorkflowPageProps) {
  const { sessionId } = params;
  const [status, setStatus] = useState<any>(null);
  const [stepData, setStepData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);

  const fetchWorkflowData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/workflows/${sessionId}`);
      
      if (!res.ok) {
        throw new Error('Workflow not found');
      }

      const statusData = await res.json();
      setStatus(statusData);

      // Fetch step data
      const dataRes = await fetch(`/api/workflows/${sessionId}/data`);
      if (dataRes.ok) {
        const data = await dataRes.json();
        setStepData(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflow');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchWorkflowData();
  }, [fetchWorkflowData]);

  async function executeNextStep() {
    if (!status) return;

    setExecuting(true);
    setError(null);

    try {
      const nextStep = status.currentStep;
      let inputs: any = {};

      // Build inputs based on step requirements
      if (nextStep === 4) {
        // Stock Screening - use default filters for demo
        inputs = {
          marketCap: 'large',
          dividendYieldMin: 2,
          peRatioMax: 25,
        };
      } else if (nextStep >= 5 && nextStep <= 9) {
        // Steps 5-9 need a ticker - use AAPL as demo
        inputs = { ticker: 'AAPL' };
      } else if (nextStep === 10) {
        // Position Sizing
        inputs = {
          portfolioSize: 100000,
          riskModel: 'balanced',
          ticker: 'AAPL',
          entryPrice: 150,
        };
      } else if (nextStep === 11) {
        // Mock Trade
        inputs = {
          brokerPlatform: 'Demo Broker',
          ticker: 'AAPL',
          quantity: 10,
          price: 150,
        };
      } else if (nextStep === 12) {
        // Monitoring Setup
        inputs = {
          alertApp: 'Yahoo Finance',
          reviewFrequency: 'quarterly',
          ticker: 'AAPL',
          priceDropPercent: 10,
          priceGainPercent: 20,
        };
      }
      
      const res = await fetch(`/api/workflows/${sessionId}/steps/${nextStep}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs })
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.errors?.join(', ') || 'Failed to execute step');
      }

      // Refresh workflow data
      await fetchWorkflowData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute step');
    } finally {
      setExecuting(false);
    }
  }

  async function skipStep() {
    if (!status) return;

    setExecuting(true);
    setError(null);

    try {
      const res = await fetch(`/api/workflows/${sessionId}/skip/${status.currentStep}`, {
        method: 'POST'
      });

      if (!res.ok) {
        throw new Error('Failed to skip step');
      }

      // Refresh workflow data
      await fetchWorkflowData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to skip step');
    } finally {
      setExecuting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workflow...</p>
        </div>
      </main>
    );
  }

  if (error && !status) {
    return (
      <main className="min-h-screen bg-gray-100 p-4 md:p-8 flex items-center justify-center">
        <div className="bg-white border-2 border-red-600 p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-900 mb-2">Error</h2>
          <p className="text-red-800 mb-4">{error}</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Return to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white border-4 border-gray-900 shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                ResurrectionStockPicker
              </h1>
              <p className="text-sm text-gray-600 font-mono">
                Session: {sessionId}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/"
                className="px-4 py-2 bg-white border-2 border-gray-800 text-gray-900 font-bold hover:bg-gray-100 transition-colors"
              >
                Home
              </Link>
            </div>
          </div>
        </div>

        {/* Educational Disclaimer */}
        <div className="bg-yellow-50 border-2 border-yellow-600 p-4 mb-6">
          <p className="text-sm text-yellow-900 font-bold mb-1">
            ⚠️ EDUCATIONAL PURPOSES ONLY
          </p>
          <p className="text-xs text-yellow-800">
            This workflow is for educational purposes only and does not constitute investment advice. 
            Always consult a qualified financial advisor before making investment decisions.
          </p>
        </div>

        {/* Progress Indicator */}
        {status && (
          <WorkflowProgress
            currentStep={status.currentStep}
            completedSteps={status.completedSteps || []}
            totalSteps={status.totalSteps || 12}
          />
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-2 border-red-600 p-4 mb-6">
            <p className="text-sm text-red-900 font-bold mb-1">Error</p>
            <p className="text-xs text-red-800">{error}</p>
          </div>
        )}

        {/* Current Step Display */}
        {status && (
          <div className="bg-white border-2 border-gray-800 shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Step {status.currentStep}: {STEP_NAMES[status.currentStep - 1]}
            </h2>

            {status.currentStep === 8 && (
              <div className="bg-blue-50 border-2 border-blue-600 p-4 mb-4">
                <p className="text-sm text-blue-900 font-bold mb-1">
                  Optional Step
                </p>
                <p className="text-xs text-blue-800">
                  Technical analysis is optional. You can skip this step if you prefer to focus on fundamentals.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {/* Step-specific content */}
              <div className="text-gray-600">
                <p className="mb-4">
                  {status.currentStep === 2 && 'Analyzing current market conditions...'}
                  {status.currentStep === 3 && 'Identifying growth sectors...'}
                  {status.currentStep > 3 && 'Ready to proceed with the next step.'}
                </p>
              </div>

              {/* Display step data if available */}
              {stepData[status.currentStep - 1] && (
                <div className="bg-gray-50 border-2 border-gray-300 p-4">
                  <h3 className="font-bold text-gray-900 mb-2">Step Results:</h3>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(stepData[status.currentStep - 1], null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={executeNextStep}
                  disabled={executing}
                  className="px-6 py-3 bg-green-600 border-2 border-green-800 text-white font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {executing ? 'Processing...' : 'Continue to Next Step'}
                </button>
                {status.currentStep === 8 && (
                  <button
                    onClick={skipStep}
                    disabled={executing}
                    className="px-6 py-3 bg-gray-600 border-2 border-gray-800 text-white font-bold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Skip Optional Step
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Completed Steps Summary */}
        {status && status.completedSteps && status.completedSteps.length > 0 && (
          <div className="bg-white border-2 border-gray-800 shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Completed Steps
            </h3>
            <div className="space-y-2">
              {status.completedSteps.map((stepNum: number) => (
                <div
                  key={stepNum}
                  className="p-3 bg-green-50 border-2 border-green-600"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">
                      Step {stepNum}: {STEP_NAMES[stepNum - 1]}
                    </span>
                    <span className="text-sm text-green-700 font-mono">✓ Complete</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
