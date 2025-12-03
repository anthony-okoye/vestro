'use client';

import { useState } from 'react';

interface AlertThresholds {
  priceDropPercent?: number;
  priceGainPercent?: number;
}

interface AlertConfigProps {
  ticker: string;
  currentPrice: number;
  onSave?: (thresholds: AlertThresholds) => void;
}

export default function AlertConfig({ ticker, currentPrice, onSave }: AlertConfigProps) {
  const [priceDropPercent, setPriceDropPercent] = useState<number>(10);
  const [priceGainPercent, setPriceGainPercent] = useState<number>(20);
  const [alertApp, setAlertApp] = useState<string>('');

  const calculateAlertPrices = () => {
    const dropPrice = currentPrice * (1 - priceDropPercent / 100);
    const gainPrice = currentPrice * (1 + priceGainPercent / 100);
    return { dropPrice, gainPrice };
  };

  const { dropPrice, gainPrice } = calculateAlertPrices();

  const handleSave = () => {
    if (onSave) {
      onSave({ priceDropPercent, priceGainPercent });
    }
  };

  return (
    <div className="bg-white border-2 border-gray-800 p-6">
      <h4 className="text-lg font-bold text-gray-900 mb-4">
        Configure Price Alerts: {ticker}
      </h4>

      <div className="space-y-4 mb-6">
        {/* Current Price Display */}
        <div className="p-4 bg-blue-50 border-2 border-blue-600">
          <div className="text-xs text-gray-600 uppercase mb-1">Current Price</div>
          <div className="text-3xl font-bold text-blue-900 font-mono">
            ${currentPrice.toFixed(2)}
          </div>
        </div>

        {/* Alert App Selection */}
        <div>
          <label className="form-label">Alert Application</label>
          <select
            className="form-input"
            value={alertApp}
            onChange={(e) => setAlertApp(e.target.value)}
          >
            <option value="">Select alert method...</option>
            <option value="email">Email Notifications</option>
            <option value="sms">SMS Text Messages</option>
            <option value="app">Mobile App Push</option>
            <option value="broker">Broker Platform Alerts</option>
          </select>
          <p className="text-xs text-gray-600 mt-1">
            Choose how you want to receive price alerts
          </p>
        </div>

        {/* Price Drop Alert */}
        <div>
          <label className="form-label">
            Alert on Price Drop (%)
          </label>
          <input
            type="number"
            className="form-input"
            min="1"
            max="50"
            step="1"
            value={priceDropPercent}
            onChange={(e) => setPriceDropPercent(parseFloat(e.target.value) || 0)}
          />
          <p className="text-xs text-gray-600 mt-1">
            Alert when price drops to: <span className="font-bold font-mono">${dropPrice.toFixed(2)}</span>
          </p>
        </div>

        {/* Price Gain Alert */}
        <div>
          <label className="form-label">
            Alert on Price Gain (%)
          </label>
          <input
            type="number"
            className="form-input"
            min="1"
            max="100"
            step="1"
            value={priceGainPercent}
            onChange={(e) => setPriceGainPercent(parseFloat(e.target.value) || 0)}
          />
          <p className="text-xs text-gray-600 mt-1">
            Alert when price rises to: <span className="font-bold font-mono">${gainPrice.toFixed(2)}</span>
          </p>
        </div>
      </div>

      {/* Alert Preview */}
      <div className="mb-6 p-4 bg-gray-50 border-2 border-gray-300">
        <h5 className="text-sm font-bold text-gray-900 mb-3">Alert Preview</h5>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-red-600">🔻</span>
            <span className="text-gray-800">
              Alert if {ticker} drops {priceDropPercent}% to ${dropPrice.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600">🔺</span>
            <span className="text-gray-800">
              Alert if {ticker} rises {priceGainPercent}% to ${gainPrice.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="btn-primary w-full"
      >
        Save Alert Configuration
      </button>

      <p className="text-xs text-gray-600 mt-3 text-center">
        Note: This is a mock configuration. Real alerts require integration with your broker or alert service.
      </p>
    </div>
  );
}
