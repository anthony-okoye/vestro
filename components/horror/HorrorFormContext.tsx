'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import { useHorror } from './HorrorProvider';

// Form state types based on design document
export interface HorrorFormState {
  // Step 1: Profile
  riskTolerance: 'low' | 'medium' | 'high' | null;
  investmentHorizonYears: number | null;
  capitalAvailable: number | null;
  longTermGoals: 'steady growth' | 'dividend income' | 'capital preservation' | null;
  
  // Step 4: Screening
  marketCap: 'large' | 'mid' | 'small' | null;
  dividendYieldMin: number | null;
  peRatioMax: number | null;
  sector: string | null;
  
  // Step 5-9: Stock Analysis
  selectedTicker: string | null;
  selectedTickers: string[];
  
  // Step 10: Position Sizing
  portfolioSize: number | null;
  riskModel: 'conservative' | 'balanced' | 'aggressive' | null;
  
  // Step 11: Trade
  brokerPlatform: string | null;
  orderType: 'market' | 'limit' | null;
  
  // Step 12: Monitoring
  alertApp: string | null;
  reviewFrequency: 'quarterly' | 'yearly' | null;
  priceDropPercent: number | null;
  priceGainPercent: number | null;
}

// Validation message type
export interface ValidationMessage {
  field: string;
  type: 'error' | 'warning' | 'success';
  message: string;
}

// Required fields configuration
export interface RequiredFieldConfig {
  field: keyof HorrorFormState;
  section: string;
  label: string;
}

// Context value interface
export interface HorrorFormContextValue {
  // Form state
  formData: HorrorFormState;
  setFormData: <K extends keyof HorrorFormState>(key: K, value: HorrorFormState[K]) => void;
  
  // Validation
  errors: Record<string, string>;
  validateField: (key: keyof HorrorFormState, value: any) => boolean;
  isFormValid: boolean;
  validationMessages: ValidationMessage[];
  clearFieldError: (field: string) => void;
  
  // Progress
  completedSections: string[];
  currentSection: string;
  setCurrentSection: (section: string) => void;
  progressPercentage: number;
  
  // Horror effects
  triggerPossession: (elementId: string) => void;
  triggerGlitch: () => void;
  triggerJumpscare: (intensity: 'minor' | 'major') => void;
  triggerResurrection: (elementId: string) => void;
  
  // Required fields configuration
  requiredFields: RequiredFieldConfig[];
  setRequiredFields: (fields: RequiredFieldConfig[]) => void;
}

// Initial form state
const initialFormState: HorrorFormState = {
  riskTolerance: null,
  investmentHorizonYears: null,
  capitalAvailable: null,
  longTermGoals: null,
  marketCap: null,
  dividendYieldMin: null,
  peRatioMax: null,
  sector: null,
  selectedTicker: null,
  selectedTickers: [],
  portfolioSize: null,
  riskModel: null,
  brokerPlatform: null,
  orderType: null,
  alertApp: null,
  reviewFrequency: null,
  priceDropPercent: null,
  priceGainPercent: null,
};


// Form sections for progress tracking
const FORM_SECTIONS = [
  'profile',
  'screening',
  'stock-selection',
  'position-sizing',
  'trade-execution',
  'monitoring',
];

// Create context
const HorrorFormContext = createContext<HorrorFormContextValue | null>(null);

// Custom hook to use the context
export const useHorrorForm = () => {
  const context = useContext(HorrorFormContext);
  if (!context) {
    throw new Error('useHorrorForm must be used within HorrorFormProvider');
  }
  return context;
};

// Provider props
interface HorrorFormProviderProps {
  children: ReactNode;
  initialData?: Partial<HorrorFormState>;
}

// Provider component
export default function HorrorFormProvider({ children, initialData }: HorrorFormProviderProps) {
  const horror = useHorror();
  
  // Form state
  const [formData, setFormDataState] = useState<HorrorFormState>({
    ...initialFormState,
    ...initialData,
  });
  
  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationMessages, setValidationMessages] = useState<ValidationMessage[]>([]);
  
  // Progress state
  const [currentSection, setCurrentSection] = useState<string>('profile');
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  
  // Required fields configuration
  const [requiredFields, setRequiredFields] = useState<RequiredFieldConfig[]>([
    { field: 'riskTolerance', section: 'profile', label: 'Risk Tolerance' },
    { field: 'investmentHorizonYears', section: 'profile', label: 'Investment Horizon' },
    { field: 'capitalAvailable', section: 'profile', label: 'Available Capital' },
    { field: 'longTermGoals', section: 'profile', label: 'Investment Goals' },
  ]);
  
  // Refs for animation targets
  const possessedElements = useRef<Set<string>>(new Set());
  const resurrectedElements = useRef<Set<string>>(new Set());

  // Set form data with validation
  const setFormData = useCallback(<K extends keyof HorrorFormState>(
    key: K,
    value: HorrorFormState[K]
  ) => {
    setFormDataState(prev => ({ ...prev, [key]: value }));
    
    // Clear error for this field if it exists
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
      
      // Update validation messages
      setValidationMessages(prev => 
        prev.filter(msg => msg.field !== key)
      );
    }
    
    // Add success message for inline feedback (Requirements 10.5)
    setValidationMessages(prev => [
      ...prev.filter(msg => msg.field !== key),
      { field: key, type: 'success', message: 'Valid' }
    ]);
    
    // Update completed sections
    updateCompletedSections(key, value);
  }, [errors]);

  // Update completed sections based on field changes
  const updateCompletedSections = useCallback((
    key: keyof HorrorFormState,
    value: any
  ) => {
    const fieldConfig = requiredFields.find(f => f.field === key);
    if (!fieldConfig) return;
    
    const sectionFields = requiredFields.filter(f => f.section === fieldConfig.section);
    const sectionComplete = sectionFields.every(f => {
      if (f.field === key) return value !== null && value !== undefined && value !== '';
      return formData[f.field] !== null && formData[f.field] !== undefined && formData[f.field] !== '';
    });
    
    setCompletedSections(prev => {
      if (sectionComplete && !prev.includes(fieldConfig.section)) {
        return [...prev, fieldConfig.section];
      } else if (!sectionComplete && prev.includes(fieldConfig.section)) {
        return prev.filter(s => s !== fieldConfig.section);
      }
      return prev;
    });
  }, [formData, requiredFields]);

  // Validate a single field
  const validateField = useCallback((key: keyof HorrorFormState, value: any): boolean => {
    const fieldConfig = requiredFields.find(f => f.field === key);
    
    // Check if field is required and empty
    if (fieldConfig && (value === null || value === undefined || value === '')) {
      const errorMessage = `${fieldConfig.label} is required`;
      setErrors(prev => ({ ...prev, [key]: errorMessage }));
      setValidationMessages(prev => [
        ...prev.filter(msg => msg.field !== key),
        { field: key, type: 'error', message: errorMessage }
      ]);
      
      // Trigger minor jumpscare for validation error (Requirements 10.2)
      horror.triggerGlitch();
      
      return false;
    }
    
    // Field is valid
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
    
    setValidationMessages(prev => [
      ...prev.filter(msg => msg.field !== key),
      { field: key, type: 'success', message: 'Valid' }
    ]);
    
    return true;
  }, [requiredFields, horror]);

  // Clear error for a specific field
  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
    setValidationMessages(prev => prev.filter(msg => msg.field !== field));
  }, []);

  // Check if form is valid (all required fields filled)
  const isFormValid = requiredFields.every(field => {
    const value = formData[field.field];
    return value !== null && value !== undefined && value !== '';
  });

  // Calculate progress percentage (Requirements 11.1)
  const progressPercentage = FORM_SECTIONS.length > 0
    ? Math.round((completedSections.length / FORM_SECTIONS.length) * 100)
    : 0;


  // Horror effect: Trigger possession animation on element (Requirements 1.3)
  const triggerPossession = useCallback((elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Add possession class
    element.classList.add('horror-possessed');
    possessedElements.current.add(elementId);
    
    // Trigger global glitch effect
    horror.triggerGlitch();
    
    // Remove after animation
    setTimeout(() => {
      element.classList.remove('horror-possessed');
      possessedElements.current.delete(elementId);
    }, 500);
  }, [horror]);

  // Horror effect: Trigger glitch effect
  const triggerGlitch = useCallback(() => {
    horror.triggerGlitch();
  }, [horror]);

  // Horror effect: Trigger jumpscare with intensity
  const triggerJumpscare = useCallback((intensity: 'minor' | 'major') => {
    if (intensity === 'major') {
      horror.triggerJumpscare();
    } else {
      // Minor jumpscare - just glitch and shake
      horror.triggerGlitch();
      document.body.classList.add('horror-minor-shake');
      setTimeout(() => {
        document.body.classList.remove('horror-minor-shake');
      }, 200);
    }
  }, [horror]);

  // Horror effect: Trigger resurrection animation on element
  const triggerResurrection = useCallback((elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Add resurrection class
    element.classList.add('horror-resurrection');
    resurrectedElements.current.add(elementId);
    
    // Add glow effect
    element.style.boxShadow = '0 0 20px rgba(0, 255, 100, 0.5), 0 0 40px rgba(0, 255, 100, 0.3)';
    
    // Remove after animation
    setTimeout(() => {
      element.classList.remove('horror-resurrection');
      element.style.boxShadow = '';
      resurrectedElements.current.delete(elementId);
    }, 800);
  }, []);

  // Context value
  const contextValue: HorrorFormContextValue = {
    formData,
    setFormData,
    errors,
    validateField,
    isFormValid,
    validationMessages,
    clearFieldError,
    completedSections,
    currentSection,
    setCurrentSection,
    progressPercentage,
    triggerPossession,
    triggerGlitch,
    triggerJumpscare,
    triggerResurrection,
    requiredFields,
    setRequiredFields,
  };

  return (
    <HorrorFormContext.Provider value={contextValue}>
      {children}
    </HorrorFormContext.Provider>
  );
}
