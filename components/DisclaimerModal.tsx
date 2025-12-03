'use client';

import { useState } from 'react';

interface DisclaimerModalProps {
  onAccept: () => void;
  show: boolean;
}

export default function DisclaimerModal({ onAccept, show }: DisclaimerModalProps) {
  const [accepted, setAccepted] = useState(false);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white max-w-3xl w-full max-h-[90vh] overflow-y-auto border-4 border-red-900 shadow-2xl">
        {/* Header */}
        <div className="bg-red-900 text-white p-6 border-b-4 border-red-950">
          <h2 className="text-3xl font-bold text-center">
            ⚠️ IMPORTANT DISCLAIMER ⚠️
          </h2>
          <p className="text-center mt-2 text-lg">
            Please read carefully before proceeding
          </p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="bg-yellow-50 border-2 border-yellow-600 p-6">
            <h3 className="text-xl font-bold text-yellow-900 mb-3">
              Educational Purpose Only
            </h3>
            <p className="text-gray-800 leading-relaxed">
              ResurrectionStockPicker is an <strong>educational tool</strong> designed to teach 
              investment research methodology. This system is <strong>NOT</strong> a licensed 
              investment advisor and does <strong>NOT</strong> provide personalized investment advice.
            </p>
          </div>

          <div className="space-y-4 text-gray-800">
            <div>
              <h4 className="font-bold text-lg mb-2">🚫 What This System Does NOT Do:</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide personalized investment advice or recommendations</li>
                <li>Execute real trades or manage actual investments</li>
                <li>Guarantee investment returns or performance</li>
                <li>Replace professional financial advisors</li>
                <li>Ensure accuracy or completeness of third-party data</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-2">✅ What This System Does:</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Demonstrates a structured investment research workflow</li>
                <li>Aggregates publicly available financial data</li>
                <li>Provides mock trade simulations for learning purposes</li>
                <li>Teaches fundamental and technical analysis concepts</li>
                <li>Helps you understand investment decision-making processes</li>
              </ul>
            </div>

            <div className="bg-red-50 border-2 border-red-600 p-4">
              <h4 className="font-bold text-lg text-red-900 mb-2">⚠️ Investment Risks:</h4>
              <ul className="list-disc list-inside space-y-2 ml-4 text-red-900">
                <li>All investments carry risk, including potential loss of principal</li>
                <li>Past performance does not guarantee future results</li>
                <li>Market conditions can change rapidly and unpredictably</li>
                <li>Data sources may contain errors or be outdated</li>
                <li>No investment strategy guarantees profit or prevents losses</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-2">📋 Your Responsibilities:</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Conduct your own due diligence before making investment decisions</li>
                <li>Consult with qualified financial advisors and tax professionals</li>
                <li>Verify all data from original sources before relying on it</li>
                <li>Understand your own risk tolerance and financial situation</li>
                <li>Only invest money you can afford to lose</li>
              </ul>
            </div>

            <div className="bg-blue-50 border-2 border-blue-600 p-4">
              <h4 className="font-bold text-lg text-blue-900 mb-2">📚 Data Sources:</h4>
              <p className="text-blue-900">
                This system aggregates data from various public sources including SEC filings, 
                financial news sites, and market data providers. We do not guarantee the accuracy, 
                completeness, or timeliness of this data. Always verify information from original sources.
              </p>
            </div>

            <div className="bg-gray-100 border-2 border-gray-600 p-4">
              <h4 className="font-bold text-lg text-gray-900 mb-2">🔒 Mock Trades Only:</h4>
              <p className="text-gray-900">
                All trade executions in this system are <strong>simulated</strong> and 
                <strong> do not involve real money</strong>. No actual securities are purchased, 
                and no funds are transferred. To execute real trades, you must use a licensed 
                brokerage platform.
              </p>
            </div>
          </div>

          {/* Acknowledgment Checkbox */}
          <div className="border-t-4 border-gray-300 pt-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-1 w-5 h-5 cursor-pointer"
              />
              <span className="text-gray-900 font-bold">
                I understand and acknowledge that:
                <ul className="list-disc list-inside mt-2 ml-4 font-normal">
                  <li>This system is for educational purposes only</li>
                  <li>This is not personalized investment advice</li>
                  <li>All trades are mock simulations only</li>
                  <li>I should consult a qualified financial advisor before investing</li>
                  <li>All investments carry risk, including loss of principal</li>
                  <li>I am responsible for my own investment decisions</li>
                </ul>
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={onAccept}
              disabled={!accepted}
              className={`flex-1 py-4 px-6 font-bold text-lg border-2 transition-colors ${
                accepted
                  ? 'bg-green-600 hover:bg-green-700 text-white border-green-800 cursor-pointer'
                  : 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed'
              }`}
            >
              {accepted ? 'I Accept - Continue to System' : 'Please Accept to Continue'}
            </button>
          </div>

          <p className="text-xs text-gray-600 text-center">
            By clicking "I Accept", you confirm that you have read and understood this disclaimer.
          </p>
        </div>
      </div>
    </div>
  );
}
