import Glossary from '@/components/Glossary';
import Link from 'next/link';

export const metadata = {
  title: 'Investment Glossary | ResurrectionStockPicker',
  description: 'Essential investment terms and definitions for stock research and analysis'
};

export default function GlossaryPage() {
  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white border-4 border-gray-900 shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                ResurrectionStockPicker
              </h1>
              <p className="text-sm text-gray-600">
                Investment Terms Glossary
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-white border-2 border-gray-800 text-gray-900 font-bold hover:bg-gray-100 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* Educational Disclaimer */}
        <div className="bg-yellow-50 border-2 border-yellow-600 p-4 mb-6">
          <p className="text-sm text-yellow-900 font-bold mb-1">
            ⚠️ EDUCATIONAL PURPOSES ONLY
          </p>
          <p className="text-xs text-yellow-800">
            This glossary provides basic definitions for educational purposes. For investment advice, 
            consult a qualified financial advisor.
          </p>
        </div>

        {/* Glossary Component */}
        <Glossary />
      </div>
    </main>
  );
}
