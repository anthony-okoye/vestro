'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useHorror } from './horror/HorrorProvider';
import GlitchText from './horror/GlitchText';
import HorrorButton from './horror/HorrorButton';

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
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { triggerGlitch, triggerJumpscare } = useHorror();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitError(null);

    try {
      const validatedData = profileSchema.parse(formData);
      setIsSubmitting(true);
      
      // Creepy glitch on submit
      triggerGlitch();

      const workflowRes = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!workflowRes.ok) {
        throw new Error('Failed to create workflow session');
      }

      const { sessionId } = await workflowRes.json();

      const stepRes = await fetch(`/api/workflows/${sessionId}/steps/1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: validatedData })
      });

      const stepData = await stepRes.json();

      if (!stepRes.ok) {
        // Error = jumpscare!
        triggerJumpscare();
        throw new Error(stepData.errors?.join(', ') || 'Failed to save profile');
      }

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
        triggerGlitch();
      } else {
        setSubmitError(error instanceof Error ? error.message : 'An error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-4 animate-pulse filter drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]">
          👻
        </div>
        <h2 className="text-2xl font-bold mb-2">
          <GlitchText intensity={3}>Summon Your Profile</GlitchText>
        </h2>
        <p className="text-sm text-gray-500">Configure your investment spirit guide</p>
      </div>

      {submitError && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💀</span>
            <div>
              <p className="font-semibold text-red-400">
                <GlitchText intensity={7}>Ritual Failed</GlitchText>
              </p>
              <p className="text-sm text-red-300/80">{submitError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Risk Tolerance */}
      <div className={`transition-all duration-300 ${focusedField === 'risk' ? 'scale-[1.02]' : ''}`}>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          🩸 Risk Tolerance
        </label>
        <select
          className="w-full px-4 py-3 bg-gray-900/80 border border-gray-700 rounded-lg text-gray-200 
                     focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none
                     transition-all duration-200 cursor-pointer appearance-none"
          value={formData.riskTolerance || ''}
          onChange={(e) => setFormData({ ...formData, riskTolerance: e.target.value as ProfileFormData['riskTolerance'] })}
          onFocus={() => setFocusedField('risk')}
          onBlur={() => setFocusedField(null)}
        >
          <option value="">Select your risk appetite...</option>
          <option value="low">🛡️ Low - Conservative, steady approach</option>
          <option value="medium">⚖️ Medium - Balanced risk/reward</option>
          <option value="high">🔥 High - Aggressive growth focus</option>
        </select>
        {errors.riskTolerance && (
          <p className="text-sm text-red-400 mt-2 flex items-center gap-1">
            <span>💀</span> {errors.riskTolerance}
          </p>
        )}
      </div>

      {/* Investment Horizon */}
      <div className={`transition-all duration-300 ${focusedField === 'horizon' ? 'scale-[1.02]' : ''}`}>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          ⏳ Investment Horizon (Years)
        </label>
        <input
          type="number"
          className="w-full px-4 py-3 bg-gray-900/80 border border-gray-700 rounded-lg text-gray-200 
                     focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none
                     transition-all duration-200 placeholder-gray-600"
          placeholder="How long will you haunt these investments?"
          min="1"
          value={formData.investmentHorizonYears || ''}
          onChange={(e) => setFormData({ 
            ...formData, 
            investmentHorizonYears: e.target.value ? parseInt(e.target.value) : undefined 
          })}
          onFocus={() => setFocusedField('horizon')}
          onBlur={() => setFocusedField(null)}
        />
        {errors.investmentHorizonYears && (
          <p className="text-sm text-red-400 mt-2 flex items-center gap-1">
            <span>💀</span> {errors.investmentHorizonYears}
          </p>
        )}
      </div>

      {/* Capital Available */}
      <div className={`transition-all duration-300 ${focusedField === 'capital' ? 'scale-[1.02]' : ''}`}>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          💎 Capital Available
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono">$</span>
          <input
            type="number"
            className="w-full pl-8 pr-4 py-3 bg-gray-900/80 border border-gray-700 rounded-lg text-gray-200 
                       focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none
                       transition-all duration-200 placeholder-gray-600"
            placeholder="Your treasure chest amount"
            min="0"
            step="0.01"
            value={formData.capitalAvailable || ''}
            onChange={(e) => setFormData({ 
              ...formData, 
              capitalAvailable: e.target.value ? parseFloat(e.target.value) : undefined 
            })}
            onFocus={() => setFocusedField('capital')}
            onBlur={() => setFocusedField(null)}
          />
        </div>
        {errors.capitalAvailable && (
          <p className="text-sm text-red-400 mt-2 flex items-center gap-1">
            <span>💀</span> {errors.capitalAvailable}
          </p>
        )}
      </div>

      {/* Long-term Goals */}
      <div className={`transition-all duration-300 ${focusedField === 'goals' ? 'scale-[1.02]' : ''}`}>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          🎯 Investment Goals
        </label>
        <select
          className="w-full px-4 py-3 bg-gray-900/80 border border-gray-700 rounded-lg text-gray-200 
                     focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none
                     transition-all duration-200 cursor-pointer appearance-none"
          value={formData.longTermGoals || ''}
          onChange={(e) => setFormData({ ...formData, longTermGoals: e.target.value as ProfileFormData['longTermGoals'] })}
          onFocus={() => setFocusedField('goals')}
          onBlur={() => setFocusedField(null)}
        >
          <option value="">Choose your destiny...</option>
          <option value="steady growth">📈 Steady Growth - Long-term appreciation</option>
          <option value="dividend income">💰 Dividend Income - Regular cash flow</option>
          <option value="capital preservation">🏦 Capital Preservation - Protect principal</option>
        </select>
        {errors.longTermGoals && (
          <p className="text-sm text-red-400 mt-2 flex items-center gap-1">
            <span>💀</span> {errors.longTermGoals}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-6">
        <HorrorButton
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          scareChance={0.2}
          className="w-full py-4 text-lg"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-3">
              <span className="animate-spin">🌀</span>
              <GlitchText intensity={5}>Summoning Workflow...</GlitchText>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-3">
              <span>👻</span>
              Begin the Resurrection
              <span>✨</span>
            </span>
          )}
        </HorrorButton>
      </div>

      {/* Progress indicator */}
      <div className="flex justify-center gap-2 pt-4">
        {['risk', 'horizon', 'capital', 'goals'].map((field, i) => {
          const isComplete = field === 'risk' ? !!formData.riskTolerance :
                            field === 'horizon' ? !!formData.investmentHorizonYears :
                            field === 'capital' ? !!formData.capitalAvailable :
                            !!formData.longTermGoals;
          return (
            <div
              key={field}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                isComplete 
                  ? 'bg-green-500 shadow-lg shadow-green-500/50' 
                  : 'bg-gray-700'
              }`}
            />
          );
        })}
      </div>
    </form>
  );
}
