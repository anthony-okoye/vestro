import { BaseDataSourceAdapter } from "../data-adapter";
import { DataRequest, DataResponse } from "../types";

export interface CompanyProfile {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  description: string;
  website?: string;
  employees?: number;
  headquarters?: string;
  founded?: string;
  ceo?: string;
  marketCap?: number;
  businessSummary?: string;
}

export interface CompanyNews {
  headline: string;
  summary: string;
  publishedAt: Date;
  url: string;
  source: string;
}

/**
 * Adapter for Reuters company data
 * Fetches company profiles and business information
 * Requirements: 6.1
 */
export class ReutersAdapter extends BaseDataSourceAdapter {
  sourceName = "Reuters";

  constructor() {
    super("https://www.reuters.com", 30); // Conservative rate limit
  }

  /**
   * Fetch company profile information
   */
  async fetchCompanyProfile(ticker: string): Promise<CompanyProfile> {
    try {
      const request: DataRequest = {
        endpoint: `/companies/${ticker}`,
        params: {
          view: "overview",
        },
      };

      const response = await this.fetch(request);
      const profile = this.parseCompanyProfile(response.data, ticker);

      return profile;
    } catch (error) {
      throw new Error(
        `Failed to fetch company profile for ${ticker}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Fetch recent company news
   */
  async fetchCompanyNews(ticker: string, limit: number = 10): Promise<CompanyNews[]> {
    try {
      const request: DataRequest = {
        endpoint: `/companies/${ticker}/news`,
        params: {
          limit,
        },
      };

      const response = await this.fetch(request);
      const news = this.parseCompanyNews(response.data);

      return news;
    } catch (error) {
      throw new Error(
        `Failed to fetch company news for ${ticker}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Perform the actual HTTP fetch
   */
  protected async performFetch(request: DataRequest): Promise<DataResponse> {
    const url = this.buildUrl(request.endpoint, request.params);

    const response = await fetch(url, {
      headers: {
        ...request.headers,
        "User-Agent": "Mozilla/5.0 (compatible; ResurrectionStockPicker/1.0)",
        Accept: "application/json, text/html",
      },
    });

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${response.statusText}`
      );
    }

    // Reuters may return HTML or JSON depending on endpoint
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return {
      data,
      status: response.status,
      timestamp: new Date(),
      source: this.sourceName,
    };
  }

  /**
   * Parse company profile from Reuters response
   */
  private parseCompanyProfile(data: any, ticker: string): CompanyProfile {
    // Handle both JSON and parsed HTML data structures
    const profile = data.profile || data.company || data;

    return {
      ticker,
      name: profile.name || profile.companyName || ticker,
      sector: profile.sector || "Unknown",
      industry: profile.industry || "Unknown",
      description: profile.description || profile.businessSummary || "",
      website: profile.website || profile.url,
      employees: profile.employees || profile.fullTimeEmployees,
      headquarters: this.formatHeadquarters(profile),
      founded: profile.founded || profile.foundedYear,
      ceo: profile.ceo || profile.chiefExecutive,
      marketCap: profile.marketCap || profile.marketCapitalization,
      businessSummary: profile.businessSummary || profile.longBusinessSummary,
    };
  }

  /**
   * Parse company news from Reuters response
   */
  private parseCompanyNews(data: any): CompanyNews[] {
    const articles = data.articles || data.news || [];

    return articles.map((article: any) => ({
      headline: article.headline || article.title,
      summary: article.summary || article.description || "",
      publishedAt: new Date(article.publishedAt || article.date),
      url: article.url || article.link,
      source: article.source || "Reuters",
    }));
  }

  /**
   * Format headquarters location from various fields
   */
  private formatHeadquarters(profile: any): string | undefined {
    if (profile.headquarters) {
      return profile.headquarters;
    }

    const parts = [];
    if (profile.city) parts.push(profile.city);
    if (profile.state) parts.push(profile.state);
    if (profile.country) parts.push(profile.country);

    return parts.length > 0 ? parts.join(", ") : undefined;
  }
}
