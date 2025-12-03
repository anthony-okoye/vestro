import { BaseDataSourceAdapter } from "../data-adapter";
import { DataRequest, DataResponse } from "../types";

export interface Filing {
  accessionNumber: string;
  filingDate: string;
  reportDate: string;
  formType: string;
  fileNumber: string;
  filmNumber: string;
  items?: string;
  size?: number;
  isXBRL?: boolean;
  primaryDocument?: string;
  primaryDocDescription?: string;
}

export interface CompanyInfo {
  cik: string;
  entityType: string;
  sic: string;
  sicDescription: string;
  name: string;
  tickers?: string[];
  exchanges?: string[];
}

/**
 * Adapter for SEC EDGAR API
 * Fetches financial filings and company information
 */
export class SECEdgarAdapter extends BaseDataSourceAdapter {
  sourceName = "SEC EDGAR";

  constructor() {
    super("https://data.sec.gov", 10); // SEC rate limit: 10 requests per second
  }

  /**
   * Fetch filings for a specific company and form type
   */
  async fetchFilings(
    ticker: string,
    formType: string = "10-K"
  ): Promise<Filing[]> {
    try {
      // First, get the CIK for the ticker
      const companyInfo = await this.searchCompany(ticker);
      
      if (!companyInfo || companyInfo.length === 0) {
        throw new Error(`Company not found for ticker: ${ticker}`);
      }

      const cik = companyInfo[0].cik.padStart(10, "0");

      const request: DataRequest = {
        endpoint: `/submissions/CIK${cik}.json`,
        headers: {
          "User-Agent": "ResurrectionStockPicker research@example.com",
        },
      };

      const response = await this.fetch(request);
      const filings = this.parseFilings(response.data, formType);

      return filings;
    } catch (error) {
      throw new Error(
        `Failed to fetch filings for ${ticker}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Search for company information by ticker or name
   */
  async searchCompany(query: string): Promise<CompanyInfo[]> {
    try {
      const request: DataRequest = {
        endpoint: "/files/company_tickers.json",
        headers: {
          "User-Agent": "ResurrectionStockPicker research@example.com",
        },
      };

      const response = await this.fetch(request);
      const companies = this.parseCompanySearch(response.data, query);

      return companies;
    } catch (error) {
      throw new Error(
        `Failed to search company ${query}: ${(error as Error).message}`
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
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    return {
      data,
      status: response.status,
      timestamp: new Date(),
      source: this.sourceName,
    };
  }

  /**
   * Parse filings from SEC response
   */
  private parseFilings(data: any, formType: string): Filing[] {
    if (!data.filings || !data.filings.recent) {
      return [];
    }

    const recent = data.filings.recent;
    const filings: Filing[] = [];

    for (let i = 0; i < recent.accessionNumber.length; i++) {
      if (recent.form[i] === formType) {
        filings.push({
          accessionNumber: recent.accessionNumber[i],
          filingDate: recent.filingDate[i],
          reportDate: recent.reportDate[i],
          formType: recent.form[i],
          fileNumber: recent.fileNumber[i],
          filmNumber: recent.filmNumber[i],
          items: recent.items?.[i],
          size: recent.size?.[i],
          isXBRL: recent.isXBRL?.[i] === 1,
          primaryDocument: recent.primaryDocument?.[i],
          primaryDocDescription: recent.primaryDocDescription?.[i],
        });
      }
    }

    return filings;
  }

  /**
   * Parse company search results
   */
  private parseCompanySearch(data: any, query: string): CompanyInfo[] {
    const results: CompanyInfo[] = [];
    const queryLower = query.toLowerCase();

    // SEC company_tickers.json format is an object with numeric keys
    for (const key in data) {
      const company = data[key];
      const ticker = company.ticker?.toLowerCase();
      const title = company.title?.toLowerCase();

      if (ticker === queryLower || title?.includes(queryLower)) {
        results.push({
          cik: String(company.cik_str),
          entityType: company.entity_type || "",
          sic: String(company.sic || ""),
          sicDescription: company.sic_description || "",
          name: company.title,
          tickers: [company.ticker],
          exchanges: [company.exchange],
        });
      }
    }

    return results;
  }
}
