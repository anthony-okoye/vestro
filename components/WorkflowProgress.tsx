'use client';

interface WorkflowProgressProps {
  currentStep: number;
  completedSteps: number[];
  totalSteps?: number;
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

export default function WorkflowProgress({
  currentStep,
  completedSteps,
  totalSteps = 12
}: WorkflowProgressProps) {
  const progress = (completedSteps.length / totalSteps) * 100;

  return (
    <div className="bg-white border-2 border-gray-800 shadow-lg p-6 mb-6">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-gray-900">Workflow Progress</h2>
          <span className="text-sm font-mono text-gray-600">
            {completedSteps.length} / {totalSteps} Steps Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 h-4 border-2 border-gray-800">
          <div
            className="bg-green-600 h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {STEP_NAMES.map((name, index) => {
          const stepNumber = index + 1;
          const isCompleted = completedSteps.includes(stepNumber);
          const isCurrent = currentStep === stepNumber;
          const isOptional = stepNumber === 8; // Technical Trends is optional

          return (
            <div
              key={stepNumber}
              className={`
                p-3 border-2 transition-all
                ${isCurrent ? 'border-blue-600 bg-blue-50' : 'border-gray-800'}
                ${isCompleted ? 'bg-green-50' : 'bg-white'}
              `}
            >
              <div className="flex items-start gap-2">
                <div
                  className={`
                    flex-shrink-0 w-6 h-6 border-2 flex items-center justify-center text-xs font-bold
                    ${isCompleted ? 'bg-green-600 border-green-600 text-white' : 'border-gray-800 text-gray-800'}
                    ${isCurrent ? 'border-blue-600 text-blue-600' : ''}
                  `}
                >
                  {isCompleted ? '✓' : stepNumber}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-900 leading-tight">
                    {name}
                    {isOptional && (
                      <span className="ml-1 text-xs text-gray-500 font-normal">(Optional)</span>
                    )}
                  </div>
                  {isCurrent && (
                    <div className="text-xs text-blue-600 mt-1 font-mono">IN PROGRESS</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
