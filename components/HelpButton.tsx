'use client';

import { useState } from 'react';
import Link from 'next/link';

interface HelpButtonProps {
  stepId?: number;
}

export default function HelpButton({ stepId }: HelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 bg-blue-600 border-2 border-blue-800 text-white font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
        aria-label="Help"
      >
        <span>❓</span>
        <span>Help</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Help Menu */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white border-2 border-gray-800 shadow-lg z-50">
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between border-b-2 border-gray-300 pb-2">
                <h3 className="font-bold text-gray-900">Help & Resources</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ✕
                </button>
              </div>

              {stepId && (
                <div className="bg-blue-50 border border-blue-600 p-3">
                  <p className="text-xs text-blue-900 font-bold mb-1">
                    Current Step: {stepId}
                  </p>
                  <p className="text-xs text-blue-800">
                    Scroll down to see detailed guidance for this step
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Link
                  href="/glossary"
                  className="block p-3 bg-gray-50 border border-gray-300 hover:bg-gray-100 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span>📚</span>
                    <span className="font-bold text-sm text-gray-900">Glossary</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Investment terms and definitions
                  </p>
                </Link>

                <div className="p-3 bg-gray-50 border border-gray-300">
                  <div className="flex items-center gap-2 mb-1">
                    <span>💡</span>
                    <span className="font-bold text-sm text-gray-900">Quick Tips</span>
                  </div>
                  <ul className="text-xs text-gray-700 space-y-1">
                    <li>• Focus on long-term fundamentals</li>
                    <li>• Diversify across sectors</li>
                    <li>• Review investments quarterly</li>
                    <li>• Don't chase short-term trends</li>
                  </ul>
                </div>

                <div className="p-3 bg-yellow-50 border border-yellow-600">
                  <div className="flex items-center gap-2 mb-1">
                    <span>⚠️</span>
                    <span className="font-bold text-xs text-yellow-900">Important</span>
                  </div>
                  <p className="text-xs text-yellow-800">
                    This tool is for educational purposes only. Always consult a qualified 
                    financial advisor before making investment decisions.
                  </p>
                </div>

                <div className="p-3 bg-gray-50 border border-gray-300">
                  <div className="flex items-center gap-2 mb-2">
                    <span>📖</span>
                    <span className="font-bold text-sm text-gray-900">Learning Resources</span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-700">
                    <a
                      href="https://www.investor.gov/introduction-investing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-blue-600 hover:underline"
                    >
                      → SEC Investor Education
                    </a>
                    <a
                      href="https://www.investopedia.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-blue-600 hover:underline"
                    >
                      → Investopedia
                    </a>
                    <a
                      href="https://www.morningstar.com/investing-classroom"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-blue-600 hover:underline"
                    >
                      → Morningstar Classroom
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
