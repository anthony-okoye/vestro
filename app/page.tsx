import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">
            ResurrectionStockPicker
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            A research workflow system for long-term investors using classic value investing methodologies enhanced with modern AI orchestration.
          </p>
          
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              Get Started
            </h2>
            <p className="text-gray-600 mb-4">
              Begin your investment research journey with our comprehensive 12-step workflow:
            </p>
            
            <Link 
              href="/workflow/new"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Start New Workflow
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">
            12-Step Research Process
          </h2>
          <ol className="space-y-2 text-gray-700">
            <li><span className="font-semibold">1. Profile Definition:</span> Define your investment profile and risk tolerance</li>
            <li><span className="font-semibold">2. Market Conditions:</span> Review current macroeconomic environment</li>
            <li><span className="font-semibold">3. Sector Identification:</span> Identify growth sectors</li>
            <li><span className="font-semibold">4. Stock Screening:</span> Screen stocks within top sectors</li>
            <li><span className="font-semibold">5. Fundamental Analysis:</span> Analyze financial metrics</li>
            <li><span className="font-semibold">6. Competitive Position:</span> Assess competitive advantages</li>
            <li><span className="font-semibold">7. Valuation Evaluation:</span> Evaluate stock valuation</li>
            <li><span className="font-semibold">8. Technical Trends:</span> Review technical indicators (optional)</li>
            <li><span className="font-semibold">9. Analyst Sentiment:</span> Gather analyst opinions</li>
            <li><span className="font-semibold">10. Position Sizing:</span> Calculate appropriate position sizes</li>
            <li><span className="font-semibold">11. Mock Trade:</span> Execute simulated trade</li>
            <li><span className="font-semibold">12. Monitoring Setup:</span> Set up alerts and review schedule</li>
          </ol>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">
            Additional Resources
          </h2>
          <div className="space-y-2">
            <Link 
              href="/glossary"
              className="block text-blue-600 hover:text-blue-800 hover:underline"
            >
              Investment Terms Glossary
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
