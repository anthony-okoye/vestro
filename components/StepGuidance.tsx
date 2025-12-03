'use client';

interface StepGuidanceProps {
  stepId: number;
}

interface GuidanceContent {
  title: string;
  description: string;
  whatToExpect: string[];
  howToUse: string[];
  tips: string[];
  commonQuestions: { q: string; a: string }[];
}

const stepGuidance: Record<number, GuidanceContent> = {
  1: {
    title: 'Define Your Investment Profile',
    description: 'Set up your personal investment parameters to tailor the research workflow to your needs.',
    whatToExpect: [
      'Questions about your risk tolerance (low, medium, high)',
      'Your investment time horizon in years',
      'Amount of capital you plan to invest',
      'Your primary investment goals'
    ],
    howToUse: [
      'Be honest about your risk tolerance - this affects position sizing recommendations',
      'Consider your actual time horizon - when will you need this money?',
      'Enter the capital you\'re comfortable investing in stocks',
      'Choose goals that align with your financial situation'
    ],
    tips: [
      'Conservative investors should choose low risk tolerance',
      'Longer time horizons (10+ years) allow for more growth-focused strategies',
      'Only invest money you won\'t need in the short term',
      'Your profile can be updated as your situation changes'
    ],
    commonQuestions: [
      {
        q: 'What if I\'m not sure about my risk tolerance?',
        a: 'Start with "low" or "medium" - you can always adjust later. Consider how you\'d feel if your investment dropped 20% in value.'
      },
      {
        q: 'Can I change my profile later?',
        a: 'Yes, you can create a new workflow session with updated parameters at any time.'
      }
    ]
  },
  2: {
    title: 'Review Market Conditions',
    description: 'Understand the current macroeconomic environment that affects all investments.',
    whatToExpect: [
      'Current interest rates from the Federal Reserve',
      'Inflation and unemployment data',
      'Overall market trend (bullish, bearish, or neutral)',
      'Economic summary and interpretation'
    ],
    howToUse: [
      'Review each economic indicator and its current level',
      'Consider how these factors might affect stock valuations',
      'Note whether conditions favor growth or value investing',
      'Use this context when evaluating individual stocks'
    ],
    tips: [
      'High interest rates typically pressure stock valuations',
      'Low unemployment often indicates economic strength',
      'Market trends provide context but shouldn\'t drive all decisions',
      'Economic conditions change - review periodically'
    ],
    commonQuestions: [
      {
        q: 'Should I avoid investing in bearish markets?',
        a: 'Not necessarily. Bearish markets can present buying opportunities for long-term investors. Focus on company fundamentals.'
      },
      {
        q: 'How often does this data update?',
        a: 'Economic data is typically updated monthly or quarterly. Check the timestamps on each data source.'
      }
    ]
  },
  3: {
    title: 'Identify Growth Sectors',
    description: 'Find industries with strong growth potential to focus your stock research.',
    whatToExpect: [
      'Ranked list of industry sectors',
      'Growth scores for each sector',
      'Rationale explaining each sector\'s ranking',
      'Performance metrics and momentum indicators'
    ],
    howToUse: [
      'Review the top-ranked sectors first',
      'Read the rationale to understand growth drivers',
      'Consider diversifying across multiple sectors',
      'Use sector rankings to guide stock screening'
    ],
    tips: [
      'Top sectors change over time - don\'t chase last year\'s winners',
      'Consider both cyclical and defensive sectors',
      'Sector rotation is normal - diversification helps',
      'Strong sectors can still have weak individual stocks'
    ],
    commonQuestions: [
      {
        q: 'Should I only invest in top-ranked sectors?',
        a: 'Not necessarily. Diversification across sectors reduces risk. Lower-ranked sectors may have undervalued opportunities.'
      },
      {
        q: 'How are sectors scored?',
        a: 'Scores combine growth rates, market momentum, and industry outlook from multiple sources.'
      }
    ]
  },
  4: {
    title: 'Screen for Stock Candidates',
    description: 'Filter stocks based on your criteria to create a shortlist for deeper analysis.',
    whatToExpect: [
      'Filtering options for market cap, dividend yield, P/E ratio',
      'Ability to filter by specific sectors',
      'List of stocks matching your criteria',
      'Basic metrics for each candidate'
    ],
    howToUse: [
      'Start with broad filters and narrow down gradually',
      'Consider your investment goals when setting filters',
      'Review the full list before selecting stocks to analyze',
      'Note interesting candidates for fundamental analysis'
    ],
    tips: [
      'Large-cap stocks tend to be more stable',
      'High dividend yields may indicate value or risk',
      'Very low P/E ratios deserve extra scrutiny',
      'Quality matters more than quantity - focus on best candidates'
    ],
    commonQuestions: [
      {
        q: 'What\'s a good P/E ratio to filter for?',
        a: 'It varies by sector. Technology stocks often have higher P/E ratios than utilities. Compare to sector averages.'
      },
      {
        q: 'How many stocks should I screen for?',
        a: 'Aim for 5-10 candidates for detailed analysis. Too many becomes overwhelming.'
      }
    ]
  },
  5: {
    title: 'Analyze Fundamentals',
    description: 'Deep dive into a company\'s financial health and growth trajectory.',
    whatToExpect: [
      'Revenue and earnings growth over 5 years',
      'Profit margins and efficiency metrics',
      'Debt levels and financial leverage',
      'Free cash flow generation',
      'Data from SEC filings and Morningstar'
    ],
    howToUse: [
      'Look for consistent growth trends, not just single-year spikes',
      'Compare metrics to industry peers',
      'Consider both growth and profitability',
      'Assess financial health through debt ratios'
    ],
    tips: [
      'Consistent growth is often better than erratic high growth',
      'High debt isn\'t always bad - consider the industry context',
      'Positive free cash flow indicates financial flexibility',
      'Look for improving trends, not just current levels'
    ],
    commonQuestions: [
      {
        q: 'What\'s a good revenue growth rate?',
        a: 'It depends on company size and industry. 10-15% is strong for large companies, while smaller companies may grow faster.'
      },
      {
        q: 'Is negative free cash flow always bad?',
        a: 'Not always. Growing companies may invest heavily. Check if it\'s temporary or chronic.'
      }
    ]
  },
  6: {
    title: 'Assess Competitive Position',
    description: 'Evaluate the company\'s sustainable competitive advantages (economic moat).',
    whatToExpect: [
      'Analysis of patents and intellectual property',
      'Brand strength assessment',
      'Customer base characteristics',
      'Cost leadership evaluation',
      'Overall moat rating'
    ],
    howToUse: [
      'Look for multiple sources of competitive advantage',
      'Consider how durable these advantages are',
      'Think about potential threats to the moat',
      'Strong moats support premium valuations'
    ],
    tips: [
      'Wide moats protect against competition',
      'Network effects and switching costs are powerful moats',
      'Brand strength varies by industry',
      'Moats can erode over time - stay vigilant'
    ],
    commonQuestions: [
      {
        q: 'Can a company succeed without a moat?',
        a: 'Yes, but it\'s riskier. Without competitive advantages, profits may be competed away.'
      },
      {
        q: 'How important is moat analysis?',
        a: 'Very important for long-term investing. Moats help companies maintain profitability over time.'
      }
    ]
  },
  7: {
    title: 'Evaluate Valuation',
    description: 'Determine if the stock is fairly priced relative to its fundamentals and peers.',
    whatToExpect: [
      'P/E and P/B ratios',
      'Comparison to industry peers',
      'Fair value estimates',
      'Upside/downside potential'
    ],
    howToUse: [
      'Compare valuation to historical averages',
      'Consider valuation in context of growth rates',
      'Look at multiple valuation metrics',
      'Compare to similar companies'
    ],
    tips: [
      'Low valuation alone doesn\'t make a stock a buy',
      'High-growth companies often trade at premium valuations',
      'Peer comparison provides important context',
      'Consider both absolute and relative valuation'
    ],
    commonQuestions: [
      {
        q: 'What\'s a "good" P/E ratio?',
        a: 'It varies by industry and growth rate. Compare to sector averages and historical ranges.'
      },
      {
        q: 'Should I wait for a lower price?',
        a: 'Timing the market is difficult. Focus on long-term value rather than short-term price movements.'
      }
    ]
  },
  8: {
    title: 'Review Technical Trends (Optional)',
    description: 'Consider price trends and momentum for potential entry timing.',
    whatToExpect: [
      'Current price trend direction',
      'Moving average signals',
      'RSI momentum indicator',
      'Chart visualization'
    ],
    howToUse: [
      'Use technical analysis as a supplement, not primary driver',
      'Look for confirmation of fundamental thesis',
      'Consider entry timing based on trends',
      'Don\'t let short-term moves override long-term analysis'
    ],
    tips: [
      'This step is optional - fundamentals matter more for long-term investing',
      'Uptrends may continue, but don\'t chase prices',
      'Downtrends can present buying opportunities',
      'Technical analysis works better for shorter timeframes'
    ],
    commonQuestions: [
      {
        q: 'Should I skip this step?',
        a: 'If you\'re a long-term investor focused on fundamentals, you can skip it. It\'s most useful for timing entries.'
      },
      {
        q: 'What if technical and fundamental analysis disagree?',
        a: 'For long-term investing, prioritize fundamentals. Technical factors are often short-term.'
      }
    ]
  },
  9: {
    title: 'Gather Analyst Sentiment',
    description: 'Review professional analyst opinions and price targets.',
    whatToExpect: [
      'Buy, hold, and sell recommendation counts',
      'Consensus rating',
      'Average price target',
      'Implied upside/downside'
    ],
    howToUse: [
      'Consider analyst consensus as one data point',
      'Look at the distribution of ratings, not just the average',
      'Compare price targets to your own valuation',
      'Don\'t rely solely on analyst opinions'
    ],
    tips: [
      'Analysts can be wrong - do your own research',
      'Consensus often lags major changes',
      'Wide disagreement among analysts suggests uncertainty',
      'Price targets are estimates, not guarantees'
    ],
    commonQuestions: [
      {
        q: 'Should I follow analyst recommendations?',
        a: 'Use them as input, not as the sole basis for decisions. Analysts have varying track records.'
      },
      {
        q: 'Why do analysts disagree?',
        a: 'Different assumptions, models, and time horizons lead to different conclusions.'
      }
    ]
  },
  10: {
    title: 'Calculate Position Sizing',
    description: 'Determine appropriate investment amounts based on your risk profile.',
    whatToExpect: [
      'Recommended share quantities',
      'Dollar amounts for each position',
      'Portfolio percentage allocations',
      'Order type suggestions (market vs limit)'
    ],
    howToUse: [
      'Review recommended allocations carefully',
      'Ensure total investment fits your budget',
      'Consider diversification across positions',
      'Adjust if recommendations don\'t feel comfortable'
    ],
    tips: [
      'Don\'t put all capital in one stock',
      'Conservative allocations reduce risk',
      'Keep some cash for opportunities',
      'Position sizes should reflect conviction and risk'
    ],
    commonQuestions: [
      {
        q: 'Can I adjust the recommended amounts?',
        a: 'Yes, these are suggestions based on your risk profile. Adjust to your comfort level.'
      },
      {
        q: 'Should I use market or limit orders?',
        a: 'Market orders execute immediately; limit orders give price control. For liquid stocks, market orders are usually fine.'
      }
    ]
  },
  11: {
    title: 'Execute Mock Trade',
    description: 'Practice the trade execution process without risking real capital.',
    whatToExpect: [
      'Simulated trade execution',
      'Confirmation details',
      'Mock confirmation ID',
      'Educational disclaimers'
    ],
    howToUse: [
      'Review all trade details before executing',
      'Note the confirmation ID for your records',
      'Understand this is for practice only',
      'Use this experience when making real trades'
    ],
    tips: [
      'Real trades require a brokerage account',
      'Review broker fees and commissions',
      'Consider tax implications of real trades',
      'Start small when transitioning to real trading'
    ],
    commonQuestions: [
      {
        q: 'How do I make a real trade?',
        a: 'Open an account with a licensed broker. This tool is for education and planning only.'
      },
      {
        q: 'What happens after I execute the mock trade?',
        a: 'Nothing - it\'s simulated. Use the insights to inform real investment decisions with a broker.'
      }
    ]
  },
  12: {
    title: 'Set Up Monitoring',
    description: 'Create a plan to track your investments and review performance over time.',
    whatToExpect: [
      'Price alert configuration',
      'Review schedule setup',
      'Monitoring dashboard',
      'Review checklist'
    ],
    howToUse: [
      'Set realistic alert thresholds',
      'Choose review frequency that matches your style',
      'Use the checklist during reviews',
      'Adjust monitoring as needed'
    ],
    tips: [
      'Don\'t check prices obsessively',
      'Focus on fundamental changes, not daily volatility',
      'Quarterly reviews are sufficient for most long-term investors',
      'Document your investment thesis to review later'
    ],
    commonQuestions: [
      {
        q: 'How often should I review my investments?',
        a: 'Quarterly is typical for long-term investors. More frequent reviews can lead to overtrading.'
      },
      {
        q: 'What should trigger a sell decision?',
        a: 'Fundamental deterioration, better opportunities, or reaching your price target. Not short-term volatility.'
      }
    ]
  }
};

export default function StepGuidance({ stepId }: StepGuidanceProps) {
  const guidance = stepGuidance[stepId];

  if (!guidance) {
    return null;
  }

  return (
    <div className="bg-white border-2 border-gray-800 p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">📖</span>
          <h3 className="text-xl font-bold text-gray-900">
            Step {stepId} Guide: {guidance.title}
          </h3>
        </div>
        <p className="text-sm text-gray-700">
          {guidance.description}
        </p>
      </div>

      {/* What to Expect */}
      <div>
        <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
          <span>👀</span>
          <span>What to Expect</span>
        </h4>
        <ul className="space-y-1 text-sm text-gray-700">
          {guidance.whatToExpect.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* How to Use */}
      <div>
        <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
          <span>🎯</span>
          <span>How to Use This Step</span>
        </h4>
        <ul className="space-y-1 text-sm text-gray-700">
          {guidance.howToUse.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-green-600 mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Tips */}
      <div className="bg-yellow-50 border-2 border-yellow-600 p-4">
        <h4 className="text-sm font-bold text-yellow-900 mb-2 flex items-center gap-2">
          <span>💡</span>
          <span>Pro Tips</span>
        </h4>
        <ul className="space-y-1 text-sm text-yellow-800">
          {guidance.tips.map((tip, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="mt-1">→</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Common Questions */}
      <div>
        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span>❓</span>
          <span>Common Questions</span>
        </h4>
        <div className="space-y-3">
          {guidance.commonQuestions.map((qa, index) => (
            <div key={index} className="bg-gray-50 border border-gray-300 p-3">
              <p className="text-sm font-bold text-gray-900 mb-1">
                Q: {qa.q}
              </p>
              <p className="text-sm text-gray-700">
                A: {qa.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
