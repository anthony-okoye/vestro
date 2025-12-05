/**
 * Horror Form Configuration
 * 
 * Defines all predefined options for the horror-themed interactive forms.
 * Each option includes horror-themed descriptions and icons.
 */

// Option Card interface
export interface OptionCard {
  id: string;
  value: string | number;
  label: string;
  description: string;
  icon: string;
  horrorIcon: string;
}

// Range Option interface
export interface RangeOption {
  id: string;
  label: string;
  minValue: number;
  maxValue: number | null;
  description: string;
}

// Complete form configuration interface
export interface HorrorFormConfig {
  riskToleranceOptions: OptionCard[];
  investmentHorizonOptions: OptionCard[];
  capitalRangeOptions: RangeOption[];
  investmentGoalOptions: OptionCard[];
  marketCapOptions: OptionCard[];
  dividendYieldOptions: RangeOption[];
  peRatioOptions: RangeOption[];
  sectorOptions: OptionCard[];
  riskModelOptions: OptionCard[];
  portfolioSizeOptions: RangeOption[];
  brokerOptions: OptionCard[];
  orderTypeOptions: OptionCard[];
  alertAppOptions: OptionCard[];
  reviewFrequencyOptions: OptionCard[];
  priceAlertOptions: RangeOption[];
}

// Risk Tolerance Options (Requirements 1.1, 1.2, 1.5)
export const riskToleranceOptions: OptionCard[] = [
  {
    id: 'risk-low',
    value: 'low',
    label: 'Low Risk',
    description: 'Tread carefully through the haunted halls. Preserve your cursed gold at all costs.',
    icon: '🛡️',
    horrorIcon: '💀',
  },
  {
    id: 'risk-medium',
    value: 'medium',
    label: 'Medium Risk',
    description: 'Balance between the living and the dead. Accept moderate supernatural volatility.',
    icon: '⚖️',
    horrorIcon: '👻',
  },
  {
    id: 'risk-high',
    value: 'high',
    label: 'High Risk',
    description: 'Embrace the chaos of the underworld. High rewards await those who dare.',
    icon: '🔥',
    horrorIcon: '🔥',
  },
];


// Investment Horizon Options (Requirements 2.1, 2.2, 2.4)
// Maps to integer values: 1-3 years → 2, 3-5 years → 4, 5-10 years → 7, 10+ years → 15
export const investmentHorizonOptions: OptionCard[] = [
  {
    id: 'horizon-short',
    value: 2,
    label: '1-3 Years',
    description: 'A brief haunting. Quick spirits that come and go like whispers in the night.',
    icon: '⏳',
    horrorIcon: '⌛',
  },
  {
    id: 'horizon-medium',
    value: 4,
    label: '3-5 Years',
    description: 'A lingering presence. Enough time for the curse to take hold.',
    icon: '🕐',
    horrorIcon: '🕯️',
  },
  {
    id: 'horizon-long',
    value: 7,
    label: '5-10 Years',
    description: 'A decade of darkness. Watch your investments rise from the grave.',
    icon: '📅',
    horrorIcon: '🌙',
  },
  {
    id: 'horizon-eternal',
    value: 15,
    label: '10+ Years',
    description: 'An eternal bond. Your wealth shall outlive generations of mortals.',
    icon: '♾️',
    horrorIcon: '💀',
  },
];

// Capital Range Options (Requirements 3.1, 3.4)
export const capitalRangeOptions: RangeOption[] = [
  {
    id: 'capital-tiny',
    label: 'Under $10,000',
    minValue: 0,
    maxValue: 10000,
    description: 'A small chest of cursed coins. Every piece counts in the underworld.',
  },
  {
    id: 'capital-small',
    label: '$10,000 - $50,000',
    minValue: 10000,
    maxValue: 50000,
    description: 'A modest treasure hoard. Enough to attract minor spirits.',
  },
  {
    id: 'capital-medium',
    label: '$50,000 - $100,000',
    minValue: 50000,
    maxValue: 100000,
    description: 'A respectable vault of haunted gold. The spirits take notice.',
  },
  {
    id: 'capital-large',
    label: '$100,000 - $500,000',
    minValue: 100000,
    maxValue: 500000,
    description: 'A dragon\'s hoard of cursed wealth. Power flows through these coins.',
  },
  {
    id: 'capital-massive',
    label: 'Over $500,000',
    minValue: 500000,
    maxValue: null,
    description: 'Legendary treasure beyond mortal comprehension. The ancient ones stir.',
  },
];

// Investment Goal Options (Requirements 4.1, 4.2)
export const investmentGoalOptions: OptionCard[] = [
  {
    id: 'goal-growth',
    value: 'steady growth',
    label: 'Steady Growth',
    description: 'Watch your wealth rise slowly from the grave, gaining strength over time.',
    icon: '📈',
    horrorIcon: '🧟',
  },
  {
    id: 'goal-dividend',
    value: 'dividend income',
    label: 'Dividend Income',
    description: 'Harvest regular offerings from your investments like blood from the living.',
    icon: '💰',
    horrorIcon: '🩸',
  },
  {
    id: 'goal-preservation',
    value: 'capital preservation',
    label: 'Capital Preservation',
    description: 'Guard your treasure against the forces of decay and market demons.',
    icon: '🏰',
    horrorIcon: '⚰️',
  },
];

// Market Cap Options (Requirements 5.1)
export const marketCapOptions: OptionCard[] = [
  {
    id: 'cap-large',
    value: 'large',
    label: 'Large Cap',
    description: 'Grand haunted mansions. Established empires of the corporate undead.',
    icon: '🏰',
    horrorIcon: '🏚️',
  },
  {
    id: 'cap-mid',
    value: 'mid',
    label: 'Mid Cap',
    description: 'Modest crypts with room to grow. Rising spirits seeking power.',
    icon: '🏠',
    horrorIcon: '⛪',
  },
  {
    id: 'cap-small',
    value: 'small',
    label: 'Small Cap',
    description: 'Humble graves with hidden potential. Young spirits hungry for growth.',
    icon: '🏕️',
    horrorIcon: '⚰️',
  },
];


// Dividend Yield Options (Requirements 5.2)
export const dividendYieldOptions: RangeOption[] = [
  {
    id: 'yield-none',
    label: 'No Yield',
    minValue: 0,
    maxValue: 0,
    description: 'No blood offerings. Pure growth spirits only.',
  },
  {
    id: 'yield-low',
    label: '0-2%',
    minValue: 0,
    maxValue: 2,
    description: 'A trickle of blood. Modest but steady offerings.',
  },
  {
    id: 'yield-medium',
    label: '2-4%',
    minValue: 2,
    maxValue: 4,
    description: 'A steady flow. The spirits are pleased with these offerings.',
  },
  {
    id: 'yield-high',
    label: '4%+',
    minValue: 4,
    maxValue: null,
    description: 'Rivers of crimson. Maximum blood tribute from your investments.',
  },
];

// PE Ratio Options (Requirements 5.3)
export const peRatioOptions: RangeOption[] = [
  {
    id: 'pe-young',
    label: 'Under 15',
    minValue: 0,
    maxValue: 15,
    description: 'Young ghosts. Recently departed, potentially undervalued spirits.',
  },
  {
    id: 'pe-mature',
    label: '15-25',
    minValue: 15,
    maxValue: 25,
    description: 'Mature spirits. Established haunts with proven track records.',
  },
  {
    id: 'pe-ancient',
    label: '25-40',
    minValue: 25,
    maxValue: 40,
    description: 'Ancient entities. Premium prices for legendary growth potential.',
  },
  {
    id: 'pe-eternal',
    label: 'Over 40',
    minValue: 40,
    maxValue: null,
    description: 'Eternal beings. Sky-high valuations for the most powerful spirits.',
  },
];

// Sector Options (Requirements 5.4)
export const sectorOptions: OptionCard[] = [
  {
    id: 'sector-tech',
    value: 'Technology',
    label: 'Technology',
    description: 'The Digital Crypt. Where silicon spirits dwell and data demons roam.',
    icon: '💻',
    horrorIcon: '🤖',
  },
  {
    id: 'sector-healthcare',
    value: 'Healthcare',
    label: 'Healthcare',
    description: 'The Healing Halls. Where life and death dance in eternal balance.',
    icon: '🏥',
    horrorIcon: '💉',
  },
  {
    id: 'sector-finance',
    value: 'Financials',
    label: 'Financials',
    description: 'The Vault of Souls. Where cursed gold flows through spectral channels.',
    icon: '🏦',
    horrorIcon: '💀',
  },
  {
    id: 'sector-energy',
    value: 'Energy',
    label: 'Energy',
    description: 'The Infernal Furnace. Power drawn from the depths of the earth.',
    icon: '⚡',
    horrorIcon: '🔥',
  },
  {
    id: 'sector-consumer',
    value: 'Consumer',
    label: 'Consumer',
    description: 'The Marketplace of Shadows. Where mortal desires fuel spectral profits.',
    icon: '🛒',
    horrorIcon: '👁️',
  },
  {
    id: 'sector-industrial',
    value: 'Industrials',
    label: 'Industrials',
    description: 'The Haunted Factory. Machines possessed by the spirits of progress.',
    icon: '🏭',
    horrorIcon: '⚙️',
  },
  {
    id: 'sector-materials',
    value: 'Materials',
    label: 'Materials',
    description: 'The Cursed Mines. Raw elements extracted from the underworld.',
    icon: '⛏️',
    horrorIcon: '💎',
  },
  {
    id: 'sector-utilities',
    value: 'Utilities',
    label: 'Utilities',
    description: 'The Eternal Grid. Steady power flowing from beyond the veil.',
    icon: '💡',
    horrorIcon: '🕯️',
  },
  {
    id: 'sector-realestate',
    value: 'Real Estate',
    label: 'Real Estate',
    description: 'The Haunted Properties. Every building has its ghosts.',
    icon: '🏠',
    horrorIcon: '🏚️',
  },
  {
    id: 'sector-communication',
    value: 'Communication',
    label: 'Communication',
    description: 'The Whisper Network. Messages carried by spirits across the void.',
    icon: '📡',
    horrorIcon: '👻',
  },
];


// Risk Model Options (Requirements 7.1)
export const riskModelOptions: OptionCard[] = [
  {
    id: 'model-conservative',
    value: 'conservative',
    label: 'Conservative',
    description: 'Weak spirit guardian. Maximum 5% per position. Safety in numbers.',
    icon: '🛡️',
    horrorIcon: '👻',
  },
  {
    id: 'model-balanced',
    value: 'balanced',
    label: 'Balanced',
    description: 'Moderate spirit guardian. Maximum 10% per position. Balanced power.',
    icon: '⚖️',
    horrorIcon: '🧟',
  },
  {
    id: 'model-aggressive',
    value: 'aggressive',
    label: 'Aggressive',
    description: 'Powerful spirit guardian. Maximum 20% per position. Concentrated force.',
    icon: '⚔️',
    horrorIcon: '👹',
  },
];

// Portfolio Size Options (Requirements 7.2)
export const portfolioSizeOptions: RangeOption[] = [
  {
    id: 'portfolio-small',
    label: 'Small Vault',
    minValue: 0,
    maxValue: 25000,
    description: 'A modest treasure chest. Under $25,000 in cursed assets.',
  },
  {
    id: 'portfolio-medium',
    label: 'Medium Vault',
    minValue: 25000,
    maxValue: 100000,
    description: 'A respectable hoard. $25,000 - $100,000 in haunted holdings.',
  },
  {
    id: 'portfolio-large',
    label: 'Large Vault',
    minValue: 100000,
    maxValue: 500000,
    description: 'A dragon\'s treasury. $100,000 - $500,000 in spectral wealth.',
  },
  {
    id: 'portfolio-massive',
    label: 'Legendary Vault',
    minValue: 500000,
    maxValue: null,
    description: 'Wealth beyond mortal comprehension. Over $500,000 in eternal riches.',
  },
];

// Broker Options (Requirements 8.1)
export const brokerOptions: OptionCard[] = [
  {
    id: 'broker-fidelity',
    value: 'Fidelity',
    label: 'Fidelity',
    description: 'The Ancient Trading Post. Trusted by generations of spectral investors.',
    icon: '🏛️',
    horrorIcon: '🏚️',
  },
  {
    id: 'broker-schwab',
    value: 'Charles Schwab',
    label: 'Charles Schwab',
    description: 'The Merchant of Shadows. A venerable institution of the underworld.',
    icon: '🏦',
    horrorIcon: '⚰️',
  },
  {
    id: 'broker-robinhood',
    value: 'Robinhood',
    label: 'Robinhood',
    description: 'The Phantom Thief. Quick trades from beyond the grave.',
    icon: '🏹',
    horrorIcon: '👻',
  },
  {
    id: 'broker-etrade',
    value: 'E*TRADE',
    label: 'E*TRADE',
    description: 'The Digital Séance. Electronic communion with market spirits.',
    icon: '💻',
    horrorIcon: '🔮',
  },
  {
    id: 'broker-td',
    value: 'TD Ameritrade',
    label: 'TD Ameritrade',
    description: 'The Thinker\'s Crypt. Advanced tools for the enlightened undead.',
    icon: '📊',
    horrorIcon: '🧠',
  },
];

// Order Type Options (Requirements 8.2)
export const orderTypeOptions: OptionCard[] = [
  {
    id: 'order-market',
    value: 'market',
    label: 'Market Order',
    description: 'Instant summoning. Execute immediately at the current spectral price.',
    icon: '⚡',
    horrorIcon: '💀',
  },
  {
    id: 'order-limit',
    value: 'limit',
    label: 'Limit Order',
    description: 'Patient haunting. Wait for your desired price before striking.',
    icon: '🎯',
    horrorIcon: '🕷️',
  },
];


// Alert App Options (Requirements 9.1)
export const alertAppOptions: OptionCard[] = [
  {
    id: 'alert-email',
    value: 'Email',
    label: 'Email',
    description: 'Spectral mail. Messages delivered by ghost messengers.',
    icon: '📧',
    horrorIcon: '💀',
  },
  {
    id: 'alert-sms',
    value: 'SMS',
    label: 'SMS',
    description: 'Whispers in the void. Instant messages from beyond.',
    icon: '📱',
    horrorIcon: '👻',
  },
  {
    id: 'alert-push',
    value: 'Push Notification',
    label: 'Push Notification',
    description: 'Haunted alerts. Spirits that tap on your device.',
    icon: '🔔',
    horrorIcon: '🔮',
  },
  {
    id: 'alert-slack',
    value: 'Slack',
    label: 'Slack',
    description: 'The Séance Channel. Group communion with market spirits.',
    icon: '💬',
    horrorIcon: '🕯️',
  },
];

// Review Frequency Options (Requirements 9.2)
export const reviewFrequencyOptions: OptionCard[] = [
  {
    id: 'review-quarterly',
    value: 'quarterly',
    label: 'Quarterly',
    description: 'Seasonal séances. Commune with your investments every three moons.',
    icon: '📅',
    horrorIcon: '🌙',
  },
  {
    id: 'review-yearly',
    value: 'yearly',
    label: 'Yearly',
    description: 'Annual ritual. A grand ceremony once per cycle of the dead.',
    icon: '📆',
    horrorIcon: '💀',
  },
];

// Price Alert Options (Requirements 9.3)
export const priceAlertOptions: RangeOption[] = [
  {
    id: 'alert-5',
    label: '5%',
    minValue: 5,
    maxValue: 5,
    description: 'Minor curse trigger. Alert when price moves 5%.',
  },
  {
    id: 'alert-10',
    label: '10%',
    minValue: 10,
    maxValue: 10,
    description: 'Moderate curse trigger. Alert when price moves 10%.',
  },
  {
    id: 'alert-15',
    label: '15%',
    minValue: 15,
    maxValue: 15,
    description: 'Major curse trigger. Alert when price moves 15%.',
  },
  {
    id: 'alert-20',
    label: '20%',
    minValue: 20,
    maxValue: 20,
    description: 'Critical curse trigger. Alert when price moves 20%.',
  },
  {
    id: 'alert-25',
    label: '25%',
    minValue: 25,
    maxValue: 25,
    description: 'Catastrophic curse trigger. Alert when price moves 25%.',
  },
];

// Complete form configuration export
export const horrorFormConfig: HorrorFormConfig = {
  riskToleranceOptions,
  investmentHorizonOptions,
  capitalRangeOptions,
  investmentGoalOptions,
  marketCapOptions,
  dividendYieldOptions,
  peRatioOptions,
  sectorOptions,
  riskModelOptions,
  portfolioSizeOptions,
  brokerOptions,
  orderTypeOptions,
  alertAppOptions,
  reviewFrequencyOptions,
  priceAlertOptions,
};

// Helper function to get option by value
export function getOptionByValue<T extends OptionCard>(
  options: T[],
  value: string | number
): T | undefined {
  return options.find(opt => opt.value === value);
}

// Helper function to get range option by value
export function getRangeOptionByValue(
  options: RangeOption[],
  value: number
): RangeOption | undefined {
  return options.find(opt => {
    if (opt.maxValue === null) {
      return value >= opt.minValue;
    }
    return value >= opt.minValue && value <= opt.maxValue;
  });
}

// Investment horizon value mapping helper
export const investmentHorizonValueMap: Record<string, number> = {
  '1-3 years': 2,
  '3-5 years': 4,
  '5-10 years': 7,
  '10+ years': 15,
};

// Risk model allocation rules
export const riskModelAllocationRules: Record<string, { maxPositionPercent: number; minPositions: number }> = {
  conservative: { maxPositionPercent: 5, minPositions: 20 },
  balanced: { maxPositionPercent: 10, minPositions: 10 },
  aggressive: { maxPositionPercent: 20, minPositions: 5 },
};
