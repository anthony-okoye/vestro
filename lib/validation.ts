import { ValidationResult } from "./types";

/**
 * Validation functions for user inputs across the workflow
 */

// Requirement 1.1: Validate risk tolerance
export function validateRiskTolerance(
  value: any
): ValidationResult {
  const errors: string[] = [];
  const validValues = ["low", "medium", "high"];

  if (value === undefined || value === null) {
    errors.push("Risk tolerance is required");
  } else if (!validValues.includes(value)) {
    errors.push(
      `Risk tolerance must be one of: ${validValues.join(", ")}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Requirement 1.2: Validate investment horizon
export function validateInvestmentHorizon(
  value: any
): ValidationResult {
  const errors: string[] = [];

  if (value === undefined || value === null) {
    errors.push("Investment horizon is required");
  } else if (!Number.isInteger(value)) {
    errors.push("Investment horizon must be an integer");
  } else if (value <= 0) {
    errors.push("Investment horizon must be greater than 0 years");
  } else if (value > 100) {
    errors.push("Investment horizon must be 100 years or less");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Requirement 1.3: Validate capital available
export function validateCapitalAvailable(
  value: any
): ValidationResult {
  const errors: string[] = [];

  if (value === undefined || value === null) {
    errors.push("Capital available is required");
  } else if (typeof value !== "number" || isNaN(value)) {
    errors.push("Capital available must be a number");
  } else if (value <= 0) {
    errors.push("Capital available must be greater than 0");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Requirement 1.4: Validate investment goals
export function validateInvestmentGoals(
  value: any
): ValidationResult {
  const errors: string[] = [];
  const validValues = ["steady growth", "dividend income", "capital preservation"];

  if (value === undefined || value === null) {
    errors.push("Investment goals are required");
  } else if (!validValues.includes(value)) {
    errors.push(
      `Investment goals must be one of: ${validValues.join(", ")}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Requirement 1.1-1.4: Validate complete investment profile
export function validateInvestmentProfile(profile: {
  riskTolerance?: any;
  investmentHorizonYears?: any;
  capitalAvailable?: any;
  longTermGoals?: any;
}): ValidationResult {
  const errors: string[] = [];

  const riskResult = validateRiskTolerance(profile.riskTolerance);
  errors.push(...riskResult.errors);

  const horizonResult = validateInvestmentHorizon(profile.investmentHorizonYears);
  errors.push(...horizonResult.errors);

  const capitalResult = validateCapitalAvailable(profile.capitalAvailable);
  errors.push(...capitalResult.errors);

  const goalsResult = validateInvestmentGoals(profile.longTermGoals);
  errors.push(...goalsResult.errors);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Requirement 4.1: Validate market capitalization filter
export function validateMarketCap(
  value: any
): ValidationResult {
  const errors: string[] = [];
  const validValues = ["large", "mid", "small"];

  if (value !== undefined && value !== null && !validValues.includes(value)) {
    errors.push(
      `Market cap must be one of: ${validValues.join(", ")}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Requirement 4.2: Validate dividend yield filter
export function validateDividendYield(
  value: any
): ValidationResult {
  const errors: string[] = [];

  if (value !== undefined && value !== null) {
    if (typeof value !== "number" || isNaN(value)) {
      errors.push("Dividend yield must be a number");
    } else if (value < 0) {
      errors.push("Dividend yield cannot be negative");
    } else if (value > 100) {
      errors.push("Dividend yield cannot exceed 100%");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Requirement 4.3: Validate PE ratio filter
export function validatePERatio(
  value: any
): ValidationResult {
  const errors: string[] = [];

  if (value !== undefined && value !== null) {
    if (typeof value !== "number" || isNaN(value)) {
      errors.push("PE ratio must be a number");
    } else if (value < 0) {
      errors.push("PE ratio cannot be negative");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Requirement 4.4: Validate sector filter
export function validateSector(
  value: any
): ValidationResult {
  const errors: string[] = [];

  if (value !== undefined && value !== null) {
    if (typeof value !== "string") {
      errors.push("Sector must be a string");
    } else if (value.trim().length === 0) {
      errors.push("Sector cannot be empty");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Requirement 4.1-4.4: Validate screening filters
export function validateScreeningFilters(filters: {
  marketCap?: any;
  dividendYieldMin?: any;
  peRatioMax?: any;
  sector?: any;
  minPrice?: any;
  maxPrice?: any;
}): ValidationResult {
  const errors: string[] = [];

  const marketCapResult = validateMarketCap(filters.marketCap);
  errors.push(...marketCapResult.errors);

  const dividendResult = validateDividendYield(filters.dividendYieldMin);
  errors.push(...dividendResult.errors);

  const peResult = validatePERatio(filters.peRatioMax);
  errors.push(...peResult.errors);

  const sectorResult = validateSector(filters.sector);
  errors.push(...sectorResult.errors);

  // Additional price validations
  if (filters.minPrice !== undefined && filters.minPrice !== null) {
    if (typeof filters.minPrice !== "number" || isNaN(filters.minPrice)) {
      errors.push("Minimum price must be a number");
    } else if (filters.minPrice < 0) {
      errors.push("Minimum price cannot be negative");
    }
  }

  if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
    if (typeof filters.maxPrice !== "number" || isNaN(filters.maxPrice)) {
      errors.push("Maximum price must be a number");
    } else if (filters.maxPrice < 0) {
      errors.push("Maximum price cannot be negative");
    }
  }

  if (
    filters.minPrice !== undefined &&
    filters.maxPrice !== undefined &&
    filters.minPrice > filters.maxPrice
  ) {
    errors.push("Minimum price cannot be greater than maximum price");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Requirement 10.1: Validate portfolio size
export function validatePortfolioSize(
  value: any
): ValidationResult {
  const errors: string[] = [];

  if (value === undefined || value === null) {
    errors.push("Portfolio size is required");
  } else if (typeof value !== "number" || isNaN(value)) {
    errors.push("Portfolio size must be a number");
  } else if (value <= 0) {
    errors.push("Portfolio size must be greater than 0");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Requirement 10.2: Validate risk model
export function validateRiskModel(
  value: any
): ValidationResult {
  const errors: string[] = [];
  const validValues = ["conservative", "balanced", "aggressive"];

  if (value === undefined || value === null) {
    errors.push("Risk model is required");
  } else if (!validValues.includes(value)) {
    errors.push(
      `Risk model must be one of: ${validValues.join(", ")}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Requirement 12.2: Validate review frequency
export function validateReviewFrequency(
  value: any
): ValidationResult {
  const errors: string[] = [];
  const validValues = ["quarterly", "yearly"];

  if (value === undefined || value === null) {
    errors.push("Review frequency is required");
  } else if (!validValues.includes(value)) {
    errors.push(
      `Review frequency must be one of: ${validValues.join(", ")}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Requirement 12.1: Validate alert application name
export function validateAlertApp(
  value: any
): ValidationResult {
  const errors: string[] = [];

  if (value === undefined || value === null) {
    errors.push("Alert application name is required");
  } else if (typeof value !== "string") {
    errors.push("Alert application name must be a string");
  } else if (value.trim().length === 0) {
    errors.push("Alert application name cannot be empty");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Requirement 11.1: Validate broker platform name
export function validateBrokerPlatform(
  value: any
): ValidationResult {
  const errors: string[] = [];

  if (value === undefined || value === null) {
    errors.push("Broker platform name is required");
  } else if (typeof value !== "string") {
    errors.push("Broker platform name must be a string");
  } else if (value.trim().length === 0) {
    errors.push("Broker platform name cannot be empty");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Validate ticker symbol (used across multiple steps)
export function validateTicker(
  value: any
): ValidationResult {
  const errors: string[] = [];

  if (value === undefined || value === null) {
    errors.push("Ticker symbol is required");
  } else if (typeof value !== "string") {
    errors.push("Ticker symbol must be a string");
  } else if (value.trim().length === 0) {
    errors.push("Ticker symbol cannot be empty");
  } else if (!/^[A-Z]{1,5}$/.test(value.trim())) {
    errors.push("Ticker symbol must be 1-5 uppercase letters");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
