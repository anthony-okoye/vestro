'use client';

export default function DisclaimerBanner() {
  return (
    <div className="bg-red-900 text-white py-2 px-4 text-center text-sm border-b-4 border-red-950">
      <p className="font-bold">
        ⚠️ EDUCATIONAL PURPOSE ONLY - NOT INVESTMENT ADVICE ⚠️
      </p>
      <p className="text-xs mt-1">
        This system is for learning investment research methodology. Always consult a qualified financial advisor before making investment decisions.
      </p>
    </div>
  );
}
