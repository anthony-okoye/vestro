'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProfileForm from '@/components/ProfileForm';
import DisclaimerModal from '@/components/DisclaimerModal';
import Link from 'next/link';

export default function NewWorkflowPage() {
  const router = useRouter();
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  // For MVP, we'll use a simple user ID. In production, this would come from auth
  const userId = 'demo-user';

  // Check if user has already accepted disclaimer in this session
  useEffect(() => {
    const accepted = sessionStorage.getItem('disclaimerAccepted');
    if (accepted === 'true') {
      setDisclaimerAccepted(true);
    } else {
      setShowDisclaimer(true);
    }
  }, []);

  const handleAcceptDisclaimer = () => {
    sessionStorage.setItem('disclaimerAccepted', 'true');
    setDisclaimerAccepted(true);
    setShowDisclaimer(false);
  };

  const handleSuccess = (sessionId: string) => {
    router.push(`/workflow/${sessionId}`);
  };

  return (
    <>
      <DisclaimerModal show={showDisclaimer} onAccept={handleAcceptDisclaimer} />
      
      <main className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white border-4 border-gray-900 shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                ResurrectionStockPicker
              </h1>
              <p className="text-sm text-gray-600">
                Start Your Investment Research Workflow
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-white border-2 border-gray-800 text-gray-900 font-bold hover:bg-gray-100 transition-colors"
            >
              Home
            </Link>
          </div>
        </div>

        {/* Educational Disclaimer */}
        <div className="bg-yellow-50 border-2 border-yellow-600 p-4 mb-6">
          <p className="text-sm text-yellow-900 font-bold mb-2">
            ⚠️ EDUCATIONAL PURPOSES ONLY
          </p>
          <p className="text-xs text-yellow-800 mb-2">
            This workflow is for educational purposes only and does not constitute investment advice. 
            Always consult a qualified financial advisor before making investment decisions.
          </p>
          <p className="text-xs text-yellow-800">
            All trades executed through this system are MOCK TRADES for learning purposes only.
          </p>
        </div>

        {/* Profile Setup Form */}
        <div className="bg-white border-2 border-gray-800 shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Step 1: Define Your Investment Profile
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Tell us about your investment preferences so we can tailor the research workflow to your needs.
          </p>

          {disclaimerAccepted ? (
            <ProfileForm userId={userId} onSuccess={handleSuccess} />
          ) : (
            <div className="bg-gray-100 border-2 border-gray-400 p-8 text-center">
              <p className="text-gray-600 font-bold">
                Please accept the disclaimer to continue
              </p>
              <button
                onClick={() => setShowDisclaimer(true)}
                className="mt-4 px-6 py-3 bg-blue-600 text-white font-bold border-2 border-blue-800 hover:bg-blue-700 transition-colors"
              >
                View Disclaimer
              </button>
            </div>
          )}
        </div>

        {/* Information Panel */}
        <div className="bg-blue-50 border-2 border-blue-600 p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-3">
            What happens next?
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              <strong>Step 2-3:</strong> We'll analyze current market conditions and identify promising sectors
            </p>
            <p>
              <strong>Step 4-7:</strong> Screen stocks, analyze fundamentals, competitive position, and valuations
            </p>
            <p>
              <strong>Step 8:</strong> Optional technical analysis for timing considerations
            </p>
            <p>
              <strong>Step 9-10:</strong> Review analyst sentiment and calculate position sizing
            </p>
            <p>
              <strong>Step 11-12:</strong> Execute mock trades and set up monitoring
            </p>
          </div>
        </div>
        </div>
      </main>
    </>
  );
}
