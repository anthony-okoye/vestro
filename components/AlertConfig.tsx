'use client';

import { useState, useEffect } from 'react';

interface AlertThresholds {
  priceDropPercent?: number;
  priceGainPercent?: number;
  alertMethod?: string;
}

interface AlertConfigProps {
  ticker: string;
  currentPrice: number;
  onSave?: (thresholds: AlertThresholds) => void;
}

export default function AlertConfig({ ticker, currentPrice, onSave }: AlertConfigProps) {
  const [priceDropPercent, setPriceDropPercent] = useState<number>(10);
  const [priceGainPercent, setPriceGainPercent] = useState<number>(20);
  const [alertMethod, setAlertMethod] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const calculateAlertPrices = () => {
    const dropPrice = currentPrice * (1 - priceDropPercent / 100);
    const gainPrice = currentPrice * (1 + priceGainPercent / 100);
    return { dropPrice, gainPrice };
  };

  const { dropPrice, gainPrice } = calculateAlertPrices();

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate save delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (onSave) {
      onSave({ priceDropPercent, priceGainPercent, alertMethod });
    }
    
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const alertMethods = [
    { value: 'email', label: 'Email', icon: '📧', desc: 'Get notified via email' },
    { value: 'sms', label: 'SMS', icon: '📱', desc: 'Text message alerts' },
    { value: 'push', label: 'Push', icon: '🔔', desc: 'Mobile app notifications' },
    { value: 'broker', label: 'Broker', icon: '📊', desc: 'Platform alerts' }
  ];

  return (
    <div className="panel animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <span className="text-2xl ghost-float">🔔</span>
        </div>
        <div>
          <h4 className="text-lg font-bold text-haunted">
            Awaken Price Alerts
          </h4>
          <p className="text-sm text-gray-500">
            Configure haunted watchers for {ticker}
          </p>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="alert-success mb-6 flex items-center gap-2 animate-fade-in-up">
          <span>✨</span>
          <span>Alert spirits have been summoned!</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Current Price Display */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Current Price</div>
              <div className="text-3xl font-bold text-blue-400 font-mono">
                ${currentPrice.toFixed(2)}
              </div>
            </div>
            <div className="text-4xl ghost-float">👻</div>
          </div>
        </div>

        {/* Alert Method Selection */}
        <div>
          <label className="form-label flex items-center gap-2 mb-3">
            <span>📡</span>
            Alert Method
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {alertMethods.map((method) => (
              <button
                key={method.value}
                type="button"
                onClick={() => setAlertMethod(method.value)}
                className={`p-3 rounded-xl border transition-all duration-200 text-center ${
                  alertMethod === method.value
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300 scale-105'
                    : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-purple-500/50'
                }`}
              >
                <div className="text-2xl mb-1">{method.icon}</div>
                <div className="text-sm font-semibold">{method.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Price Drop Alert */}
        <div className="space-y-3">
          <label className="form-label flex items-center gap-2">
            <span className="text-red-400">🔻</span>
            Alert on Price Drop
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={priceDropPercent}
              onChange={(e) => setPriceDropPercent(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-5
                [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-red-500
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:hover:scale-110
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:shadow-red-500/50"
            />
            <div className="w-20 text-right">
              <span className="text-2xl font-bold text-red-400 font-mono">{priceDropPercent}%</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Alert when price drops to:</span>
            <span className="font-mono font-bold text-red-400 bg-red-500/10 px-3 py-1 rounded-lg">
              ${dropPrice.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Price Gain Alert */}
        <div className="space-y-3">
          <label className="form-label flex items-center gap-2">
            <span className="text-green-400">🔺</span>
            Alert on Price Gain
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={priceGainPercent}
              onChange={(e) => setPriceGainPercent(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-5
                [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-green-500
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:hover:scale-110
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:shadow-green-500/50"
            />
            <div className="w-20 text-right">
              <span className="text-2xl font-bold text-green-400 font-mono">{priceGainPercent}%</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Alert when price rises to:</span>
            <span className="font-mono font-bold text-green-400 bg-green-500/10 px-3 py-1 rounded-lg">
              ${gainPrice.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Alert Preview */}
        <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
          <h5 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <span>👁️</span>
            Alert Preview
          </h5>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
              <span className="text-xl">🔻</span>
              <div className="flex-1">
                <p className="text-sm text-gray-300">
                  Alert if <span className="font-bold text-blue-400">{ticker}</span> drops{' '}
                  <span className="font-bold text-red-400">{priceDropPercent}%</span>
                </p>
                <p className="text-xs text-gray-500">
                  Trigger at ${dropPrice.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
              <span className="text-xl">🔺</span>
              <div className="flex-1">
                <p className="text-sm text-gray-300">
                  Alert if <span className="font-bold text-blue-400">{ticker}</span> rises{' '}
                  <span className="font-bold text-green-400">{priceGainPercent}%</span>
                </p>
                <p className="text-xs text-gray-500">
                  Trigger at ${gainPrice.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving || !alertMethod}
          className={`btn-success w-full py-4 text-lg relative overflow-hidden group ${
            isSaving || !alertMethod ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        >
          <span className="flex items-center justify-center gap-3">
            {isSaving ? (
              <>
                <span className="animate-spin">🌀</span>
                Summoning Watchers...
              </>
            ) : (
              <>
                <span className="ghost-float">👻</span>
                Awaken Alert Spirits
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </>
            )}
          </span>
        </button>

        {!alertMethod && (
          <p className="text-xs text-center text-gray-500">
            Select an alert method to continue
          </p>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-gray-500 text-center pt-2">
          ⚠️ This is a mock configuration. Real alerts require broker integration.
        </p>
      </div>
    </div>
  );
}
