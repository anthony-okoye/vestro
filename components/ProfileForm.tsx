'use client';

import { useState } from 'react';
import { z } from 'zod';

const profileSchema = z.object({
  riskTolerance: z.enum(['low', 'medium', 'high'], {
    required_error: 'Risk tolerance is required'
  }),
  investmentHorizonYears: z.number({
    required_error: 'Investment horizon is required'
  }).int().positive('Investment horizon must be positive'),
  capitalAvailable: z.number({
    required_error: 'Capital available is required'
  }).positive('Capital must be positive'),
  longTermGoals: z.enum(['steady growth', 'dividend income', 'capital preservation'], {
    required_error: 'Investment goals are required'
  })
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  userId: string;
  onSuccess?: (sessionId: string) => void;
}

export default function ProfileForm({ userId, onSuccess }: ProfileFormProps) {
  const [formData, setFormData] = useState<Partial<ProfileFormData>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitError(null);

    // Validate form data
    try {
      const validatedData = profileSchema.parse(formData);

      setIsSubmitting(true);

      // Create workflow session
      const workflowRes = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!workflowRes.ok) {
        throw new Error('Failed to create workflow session');
      }

      const { sessionId } = await workflowRes.json();

      // Execute Step 1 with profile data
      console.log('Sending profile data:', validatedData);
      const stepRes = await fetch(`/api/workflows/${sessionId}/steps/1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: validatedData })
      });

      console.log('Step response status:', stepRes.status);
      const stepData = await stepRes.json();
      console.log('Step response data:', stepData);

      if (!stepRes.ok) {
        throw new Error(stepData.errors?.join(', ') || 'Failed to save profile');
      }

      // Call success callback
      if (onSuccess) {
        onSuccess(sessionId);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setSubmitError(error instanceof Error ? error.message : 'An error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitError && (
        <div className="bg-red-50 border-2 border-red-600 p-4">
          <p className="text-sm text-red-900 font-bold">Error</p>
          <p className="text-xs text-red-800">{submitError}</p>
        </div>
      )}

      {/* Risk Tolerance */}
      <div>
        <label className="form-label">
          Risk Tolerance
        </label>
        <select
          className="form-input"
          value={formData.riskTolerance || ''}
          onChange={(e) => setFormData({ ...formData, riskTolerance: e.target.value as any })}
        >
          <option value="">Select risk tolerance...</option>
          <option value="low">Low - Conservative approach</option>
          <option value="medium">Medium - Balanced approach</option>
          <option value="high">High - Aggressive approach</option>
        </select>
        {errors.riskTolerance && (
          <p className="text-xs text-red-600 mt-1">{errors.riskTolerance}</p>
        )}
      </div>

      {/* Investment Horizon */}
      <div>
        <label className="form-label">
          Investment Horizon (Years)
        </label>
        <input
          type="number"
          className="form-input"
          placeholder="e.g., 10"
          min="1"
          value={formData.investmentHorizonYears || ''}
          onChange={(e) => setFormData({ 
            ...formData, 
            investmentHorizonYears: e.target.value ? parseInt(e.target.value) : undefined 
          })}
        />
        {errors.investmentHorizonYears && (
          <p className="text-xs text-red-600 mt-1">{errors.investmentHorizonYears}</p>
        )}
        <p className="text-xs text-gray-600 mt-1">
          How many years do you plan to hold these investments?
        </p>
      </div>

      {/* Capital Available */}
      <div>
        <label className="form-label">
          Capital Available ($)
        </label>
        <input
          type="number"
          className="form-input"
          placeholder="e.g., 50000"
          min="0"
          step="0.01"
          value={formData.capitalAvailable || ''}
          onChange={(e) => setFormData({ 
            ...formData, 
            capitalAvailable: e.target.value ? parseFloat(e.target.value) : undefined 
          })}
        />
        {errors.capitalAvailable && (
          <p className="text-xs text-red-600 mt-1">{errors.capitalAvailable}</p>
        )}
        <p className="text-xs text-gray-600 mt-1">
          Total amount you plan to invest
        </p>
      </div>

      {/* Long-term Goals */}
      <div>
        <label className="form-label">
          Investment Goals
        </label>
        <select
          className="form-input"
          value={formData.longTermGoals || ''}
          onChange={(e) => setFormData({ ...formData, longTermGoals: e.target.value as any })}
        >
          <option value="">Select your primary goal...</option>
          <option value="steady growth">Steady Growth - Long-term appreciation</option>
          <option value="dividend income">Dividend Income - Regular cash flow</option>
          <option value="capital preservation">Capital Preservation - Protect principal</option>
        </select>
        {errors.longTermGoals && (
          <p className="text-xs text-red-600 mt-1">{errors.longTermGoals}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-success w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating Workflow...' : 'Start Investment Research'}
        </button>
      </div>
    </form>
  );
}
