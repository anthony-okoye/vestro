# Implementation Plan

- [x] 1. Set up Horror Form infrastructure and context






  - [x] 1.1 Create HorrorFormContext provider

    - Create components/horror/HorrorFormContext.tsx with form state, validation, and horror effects
    - Implement triggerPossession, triggerGlitch, triggerJumpscare, triggerResurrection methods
    - Add form data management with setFormData and validateField
    - _Requirements: 1.3, 1.4, 10.1, 10.4, 10.5_

  - [x] 1.2 Create form configuration with predefined options

    - Create lib/horror-form-config.ts with all option definitions
    - Define riskToleranceOptions, investmentHorizonOptions, capitalRangeOptions, investmentGoalOptions
    - Define screeningFilterOptions (marketCap, dividendYield, peRatio, sector)
    - Define riskModelOptions, portfolioSizeOptions, brokerOptions, orderTypeOptions
    - Define alertAppOptions, reviewFrequencyOptions, priceAlertOptions
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 5.2, 5.3, 5.4, 7.1, 7.2, 8.1, 8.2, 9.1, 9.2, 9.3_
  - [ ]* 1.3 Write property test for option selection state consistency
    - **Property 1: Option Selection State Consistency**
    - **Validates: Requirements 1.4**



- [x] 2. Implement OptionCardSelector component




  - [x] 2.1 Create base OptionCardSelector component

    - Create components/horror/OptionCardSelector.tsx
    - Implement single-select and multi-select modes
    - Add horror theme variants (tombstone, spirit, cauldron, treasure, ritual)
    - Implement possession animation on hover
    - Add selected state with glowing border and pulsing animation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 2.2 Add keyboard navigation support

    - Implement Tab navigation between cards
    - Add Enter/Space key selection
    - Implement Arrow key navigation within groups
    - Add visible focus indicators with horror styling
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  - [ ]* 2.3 Write property test for keyboard navigation
    - **Property 11: Keyboard Navigation Completeness**
    - **Validates: Requirements 12.1, 12.2, 12.3**

- [ ] 3. Implement profile input components (Step 1)
  - [ ] 3.1 Create RiskToleranceCards component
    - Create components/horror/RiskToleranceCards.tsx using OptionCardSelector
    - Configure three options: low, medium, high with horror descriptions
    - Add skull, balance, and fire icons for each option
    - _Requirements: 1.1, 1.2, 1.4, 1.5_
  - [ ] 3.2 Create InvestmentHorizonCards component
    - Create components/horror/InvestmentHorizonCards.tsx using OptionCardSelector
    - Configure four options: 1-3, 3-5, 5-10, 10+ years
    - Map selections to integer year values (2, 4, 7, 15)
    - Add hourglass and time-themed horror icons
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [ ]* 3.3 Write property test for investment horizon value mapping
    - **Property 2: Investment Horizon Value Mapping**
    - **Validates: Requirements 2.3**
  - [ ] 3.4 Create CapitalRangeInput component
    - Create components/horror/CapitalRangeInput.tsx
    - Configure five predefined ranges with treasure chest styling
    - Add optional custom input field with paranormal focus effects
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [ ] 3.5 Create InvestmentGoalCards component
    - Create components/horror/InvestmentGoalCards.tsx using OptionCardSelector
    - Configure three options: steady growth, dividend income, capital preservation
    - Add spirit confirmation animation on selection
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement screening filter components (Step 4)
  - [ ] 5.1 Create ScreeningFilterCards component
    - Create components/horror/ScreeningFilterCards.tsx
    - Implement market cap options as haunted mansion sizes
    - Implement dividend yield options as blood drop intensity levels
    - Implement PE ratio options as ghost age categories
    - Implement sector options as cursed realm selections
    - Add cauldron bubbling animation on selection
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  - [ ]* 5.2 Write property test for multi-filter selection tracking
    - **Property 3: Multi-Filter Selection Tracking**
    - **Validates: Requirements 5.6**

- [ ] 6. Implement stock selection components (Steps 5-9)
  - [ ] 6.1 Create HorrorStockSelector component
    - Create components/horror/HorrorStockSelector.tsx
    - Display stocks as tombstone cards with ticker and company name
    - Add rising spirit effect on hover to reveal metrics
    - Implement resurrection animation on selection
    - Support multi-select with visual indication
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [ ]* 6.2 Write property test for stock candidate display
    - **Property 4: Stock Candidate Display Completeness**
    - **Validates: Requirements 6.1**
  - [ ]* 6.3 Write property test for multi-stock selection
    - **Property 5: Multi-Stock Selection Tracking**
    - **Validates: Requirements 6.5**

- [ ] 7. Implement position sizing components (Step 10)
  - [ ] 7.1 Create RiskModelCards component
    - Create components/horror/RiskModelCards.tsx using OptionCardSelector
    - Configure three options: conservative, balanced, aggressive as spirit strength levels
    - Add spirit guardian animation on selection
    - _Requirements: 7.1, 7.3_
  - [ ] 7.2 Create PortfolioSizeInput component
    - Create components/horror/PortfolioSizeInput.tsx
    - Configure predefined ranges as treasure vault sizes
    - Add optional custom input for exact amounts
    - _Requirements: 7.2_
  - [ ] 7.3 Create PositionCalculator component
    - Create components/horror/PositionCalculator.tsx
    - Calculate positions based on risk model rules
    - Display recommendations with haunted calculation effects
    - Add ritual completion animation when done
    - _Requirements: 7.4, 7.5_
  - [ ]* 7.4 Write property test for position sizing calculation
    - **Property 6: Position Sizing Calculation Correctness**
    - **Validates: Requirements 7.4**

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement trade execution components (Step 11)
  - [ ] 9.1 Create TradeConfigCards component
    - Create components/horror/TradeConfigCards.tsx
    - Display broker options as haunted trading post cards
    - Display order type options as spell casting methods
    - Add dark ritual animation on selection
    - _Requirements: 8.1, 8.2, 8.3_
  - [ ] 9.2 Create TradePreview component
    - Create components/horror/TradePreview.tsx
    - Display trade confirmation preview with horror styling
    - Add final warning with jumpscare potential before execution
    - _Requirements: 8.4, 8.5_

- [ ] 10. Implement monitoring setup components (Step 12)
  - [ ] 10.1 Create MonitoringConfigCards component
    - Create components/horror/MonitoringConfigCards.tsx
    - Display alert app options as haunted messenger cards
    - Display review frequency as séance schedule cards
    - Display price alert thresholds as curse trigger levels
    - Add spirit binding animation on configuration
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  - [ ] 10.2 Create HauntedCalendar component
    - Create components/horror/HauntedCalendar.tsx
    - Display complete monitoring plan visualization
    - Show next review dates with spectral styling
    - _Requirements: 9.5_

- [ ] 11. Implement validation and progress components
  - [ ] 11.1 Create HorrorValidationFeedback component
    - Create components/horror/HorrorValidationFeedback.tsx
    - Display errors with skull icons and blood-red styling
    - Trigger minor jumpscare on invalid data
    - Display success with green spectral glow
    - Implement inline validation feedback
    - _Requirements: 10.1, 10.2, 10.3, 10.5_
  - [ ]* 11.2 Write property test for required field validation
    - **Property 7: Required Field Validation**
    - **Validates: Requirements 10.1**
  - [ ]* 11.3 Write property test for form validity and submit button
    - **Property 8: Form Validity and Submit Button State**
    - **Validates: Requirements 10.4**
  - [ ]* 11.4 Write property test for inline validation feedback
    - **Property 9: Inline Validation Feedback**
    - **Validates: Requirements 10.5**
  - [ ] 11.5 Create HorrorProgressIndicator component
    - Create components/horror/HorrorProgressIndicator.tsx
    - Display ritual progress with completed/remaining sections
    - Animate transitions with spectral energy flow
    - Mark completed sections with glowing soul orbs
    - Display estimated time with haunted hourglass
    - Trigger celebration animation on completion
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  - [ ]* 11.6 Write property test for progress indicator accuracy
    - **Property 10: Progress Indicator Accuracy**
    - **Validates: Requirements 11.1**

- [ ] 12. Integrate horror forms into workflow pages
  - [ ] 12.1 Update ProfileForm with horror components
    - Replace existing inputs with RiskToleranceCards, InvestmentHorizonCards, CapitalRangeInput, InvestmentGoalCards
    - Integrate HorrorFormContext
    - Add HorrorProgressIndicator and HorrorValidationFeedback
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.3, 3.1, 4.1_
  - [ ] 12.2 Update workflow session page with horror components
    - Integrate ScreeningFilterCards for Step 4
    - Integrate HorrorStockSelector for Steps 5-9
    - Integrate RiskModelCards and PortfolioSizeInput for Step 10
    - Integrate TradeConfigCards and TradePreview for Step 11
    - Integrate MonitoringConfigCards and HauntedCalendar for Step 12
    - _Requirements: 5.1, 5.6, 6.1, 6.5, 7.1, 7.4, 8.1, 8.5, 9.1, 9.5_

- [ ] 13. Add horror CSS animations and effects
  - [ ] 13.1 Create horror form animations
    - Add possession animation keyframes
    - Add resurrection animation keyframes
    - Add spirit binding animation keyframes
    - Add cauldron bubbling animation keyframes
    - Add ritual completion celebration animation
    - _Requirements: 1.3, 6.3, 7.3, 8.3, 9.4, 11.2, 11.5_
  - [ ] 13.2 Create horror form styling
    - Add tombstone card styles
    - Add treasure chest input styles
    - Add haunted calendar styles
    - Add soul orb indicator styles
    - Add spectral glow effects
    - _Requirements: 1.2, 3.4, 6.4, 9.5, 10.3, 11.3_

- [ ] 14. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

