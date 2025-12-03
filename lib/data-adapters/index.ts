// Data source adapters
export { SECEdgarAdapter } from "./sec-edgar-adapter";
export type { Filing, CompanyInfo } from "./sec-edgar-adapter";

export { YahooFinanceAdapter } from "./yahoo-finance-adapter";
export type { Quote, SectorData, CompanyProfile } from "./yahoo-finance-adapter";

export { FinvizAdapter } from "./finviz-adapter";
export type { StockScreenResult } from "./finviz-adapter";

export { FederalReserveAdapter } from "./federal-reserve-adapter";
export type { EconomicData } from "./federal-reserve-adapter";

export { CNBCAdapter } from "./cnbc-adapter";
export type { MarketTrendData } from "./cnbc-adapter";

export { BloombergAdapter } from "./bloomberg-adapter";
export type { MarketData } from "./bloomberg-adapter";

export { TipRanksAdapter } from "./tipranks-adapter";
export type { AnalystRating, TipRanksAnalystData } from "./tipranks-adapter";

export { MarketBeatAdapter } from "./marketbeat-adapter";
export type { MarketBeatRating, MarketBeatAnalystData } from "./marketbeat-adapter";

export { MorningstarAdapter } from "./morningstar-adapter";
export type { FinancialSnapshot } from "./morningstar-adapter";

export { ReutersAdapter } from "./reuters-adapter";
export type { CompanyProfile as ReutersCompanyProfile, CompanyNews } from "./reuters-adapter";

export { SimplyWallStAdapter } from "./simplywallst-adapter";
export type { ValuationData, PeerComparison } from "./simplywallst-adapter";

export { TradingViewAdapter } from "./tradingview-adapter";
export type { ChartData, TechnicalIndicators } from "./tradingview-adapter";

export { AnalystAggregator } from "./analyst-aggregator";
