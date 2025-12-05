'use client';

import React, { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { useHorror } from './HorrorProvider';
import { OptionCard } from '@/lib/horror-form-config';

// Horror theme variants for different card styles
export type HorrorTheme = 'tombstone' | 'spirit' | 'cauldron' | 'treasure' | 'ritual';

export interface OptionCardSelectorProps {
  options: OptionCard[];
  value: string | number | null;
  onChange: (value: string | number) => void;
  multiSelect?: boolean;
  selectedValues?: (string | number)[];
  onMultiChange?: (values: (string | number)[]) => void;
  name: string;
  label: string;
  required?: boolean;
  horrorTheme?: HorrorTheme;
  className?: string;
  disabled?: boolean;
}

// Theme-specific styles
const themeStyles: Record<HorrorTheme, {
  card: string;
  cardHover: string;
  cardSelected: string;
  icon: string;
  border: string;
  glow: string;
}> = {
  tombstone: {
    card: 'bg-gradient-to-b from-gray-800 to-gray-900 border-gray-700',
    cardHover: 'hover:from-gray-700 hover:to-gray-800 hover:border-gray-500',
    cardSelected: 'from-purple-900/50 to-gray-900 border-purple-500',
    icon: 'text-gray-400',
    border: 'border-gray-600',
    glow: 'shadow-purple-500/50',
  },
  spirit: {
    card: 'bg-gradient-to-b from-indigo-900/50 to-gray-900 border-indigo-800',
    cardHover: 'hover:from-indigo-800/50 hover:to-gray-800 hover:border-indigo-500',
    cardSelected: 'from-indigo-700/50 to-gray-900 border-indigo-400',
    icon: 'text-indigo-400',
    border: 'border-indigo-600',
    glow: 'shadow-indigo-500/50',
  },
  cauldron: {
    card: 'bg-gradient-to-b from-green-900/50 to-gray-900 border-green-800',
    cardHover: 'hover:from-green-800/50 hover:to-gray-800 hover:border-green-500',
    cardSelected: 'from-green-700/50 to-gray-900 border-green-400',
    icon: 'text-green-400',
    border: 'border-green-600',
    glow: 'shadow-green-500/50',
  },
  treasure: {
    card: 'bg-gradient-to-b from-amber-900/50 to-gray-900 border-amber-800',
    cardHover: 'hover:from-amber-800/50 hover:to-gray-800 hover:border-amber-500',
    cardSelected: 'from-amber-700/50 to-gray-900 border-amber-400',
    icon: 'text-amber-400',
    border: 'border-amber-600',
    glow: 'shadow-amber-500/50',
  },
  ritual: {
    card: 'bg-gradient-to-b from-red-900/50 to-gray-900 border-red-800',
    cardHover: 'hover:from-red-800/50 hover:to-gray-800 hover:border-red-500',
    cardSelected: 'from-red-700/50 to-gray-900 border-red-400',
    icon: 'text-red-400',
    border: 'border-red-600',
    glow: 'shadow-red-500/50',
  },
};

export default function OptionCardSelector({
  options,
  value,
  onChange,
  multiSelect = false,
  selectedValues = [],
  onMultiChange,
  name,
  label,
  required = false,
  horrorTheme = 'tombstone',
  className = '',
  disabled = false,
}: OptionCardSelectorProps) {
  const { triggerGlitch, horrorIntensity } = useHorror();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [possessedId, setPossessedId] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const theme = themeStyles[horrorTheme];

  // Check if an option is selected
  const isSelected = useCallback((optionValue: string | number): boolean => {
    if (multiSelect) {
      return selectedValues.includes(optionValue);
    }
    return value === optionValue;
  }, [multiSelect, selectedValues, value]);

  // Handle card selection
  const handleSelect = useCallback((option: OptionCard) => {
    if (disabled) return;

    // Trigger possession animation
    setPossessedId(option.id);
    setTimeout(() => setPossessedId(null), 500);

    // Random glitch effect based on horror intensity
    if (Math.random() < 0.15 * (horrorIntensity / 5)) {
      triggerGlitch();
    }

    if (multiSelect && onMultiChange) {
      const currentValues = [...selectedValues];
      const index = currentValues.indexOf(option.value);
      if (index > -1) {
        currentValues.splice(index, 1);
      } else {
        currentValues.push(option.value);
      }
      onMultiChange(currentValues);
    } else {
      onChange(option.value);
    }
  }, [disabled, multiSelect, onMultiChange, onChange, selectedValues, horrorIntensity, triggerGlitch]);

  // Handle hover with possession effect
  const handleMouseEnter = useCallback((option: OptionCard) => {
    setHoveredId(option.id);
    
    // Small chance of possession effect on hover
    if (Math.random() < 0.08 * (horrorIntensity / 5)) {
      setPossessedId(option.id);
      setTimeout(() => setPossessedId(null), 300);
    }
  }, [horrorIntensity]);

  const handleMouseLeave = useCallback(() => {
    setHoveredId(null);
  }, []);

  // Keyboard navigation (Requirements 12.1, 12.2, 12.3)
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    const { key } = e;
    const optionsCount = options.length;

    switch (key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => {
          const next = prev < optionsCount - 1 ? prev + 1 : 0;
          cardRefs.current[next]?.focus();
          return next;
        });
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => {
          const next = prev > 0 ? prev - 1 : optionsCount - 1;
          cardRefs.current[next]?.focus();
          return next;
        });
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        cardRefs.current[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(optionsCount - 1);
        cardRefs.current[optionsCount - 1]?.focus();
        break;
    }
  }, [options.length]);

  // Handle card key press (Enter/Space selection)
  const handleCardKeyDown = useCallback((e: KeyboardEvent<HTMLButtonElement>, option: OptionCard) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(option);
    }
  }, [handleSelect]);

  // Handle focus on individual cards
  const handleCardFocus = useCallback((index: number) => {
    setFocusedIndex(index);
  }, []);

  return (
    <div className={`option-card-selector ${className}`}>
      {/* Label */}
      <label className="block text-lg font-semibold text-gray-200 mb-4">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Cards container with keyboard navigation */}
      <div
        ref={containerRef}
        role="radiogroup"
        aria-label={label}
        aria-required={required}
        onKeyDown={handleKeyDown}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {options.map((option, index) => {
          const selected = isSelected(option.value);
          const hovered = hoveredId === option.id;
          const possessed = possessedId === option.id;
          const focused = focusedIndex === index;

          return (
            <button
              key={option.id}
              ref={el => { cardRefs.current[index] = el; }}
              type="button"
              role={multiSelect ? 'checkbox' : 'radio'}
              aria-checked={selected}
              aria-label={`${option.label}: ${option.description}`}
              disabled={disabled}
              onClick={() => handleSelect(option)}
              onMouseEnter={() => handleMouseEnter(option)}
              onMouseLeave={handleMouseLeave}
              onKeyDown={(e) => handleCardKeyDown(e, option)}
              onFocus={() => handleCardFocus(index)}
              tabIndex={focused || (focusedIndex === -1 && index === 0) ? 0 : -1}
              className={`
                option-card relative p-5 rounded-xl border-2 text-left
                transition-all duration-300 ease-out
                ${theme.card}
                ${!selected && !disabled ? theme.cardHover : ''}
                ${selected ? `${theme.cardSelected} shadow-lg ${theme.glow}` : ''}
                ${possessed ? 'horror-possessed' : ''}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                focus:outline-none
                group
              `}
              id={`${name}-${option.id}`}
              data-testid={`option-card-${option.id}`}
            >
              {/* Selection indicator */}
              {selected && (
                <div className="absolute top-3 right-3">
                  <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center
                    ${horrorTheme === 'tombstone' ? 'bg-purple-500' : ''}
                    ${horrorTheme === 'spirit' ? 'bg-indigo-500' : ''}
                    ${horrorTheme === 'cauldron' ? 'bg-green-500' : ''}
                    ${horrorTheme === 'treasure' ? 'bg-amber-500' : ''}
                    ${horrorTheme === 'ritual' ? 'bg-red-500' : ''}
                    animate-pulse
                  `}>
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Icon */}
              <div className={`
                text-3xl mb-3 transition-transform duration-300
                ${hovered || possessed ? 'scale-110' : ''}
                ${possessed ? 'animate-bounce' : ''}
              `}>
                {hovered || selected ? option.horrorIcon : option.icon}
              </div>

              {/* Label */}
              <h3 className={`
                text-lg font-bold mb-2 transition-colors duration-200
                ${selected ? 'text-white' : 'text-gray-200'}
                ${hovered ? 'text-white' : ''}
              `}>
                {option.label}
              </h3>

              {/* Description with glitch effect on hover */}
              <p className={`
                text-sm leading-relaxed transition-all duration-200
                ${selected ? 'text-gray-300' : 'text-gray-400'}
                ${hovered ? 'text-gray-300' : ''}
                ${possessed ? 'glitch-text' : ''}
              `} data-text={option.description}>
                {option.description}
              </p>

              {/* Hover glow effect */}
              <div className={`
                absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300
                ${hovered && !selected ? 'opacity-100' : ''}
                bg-gradient-to-t from-transparent via-transparent to-white/5
                pointer-events-none
              `} />

              {/* Selected pulsing border */}
              {selected && (
                <div className={`
                  absolute inset-0 rounded-xl border-2 animate-pulse
                  ${horrorTheme === 'tombstone' ? 'border-purple-400' : ''}
                  ${horrorTheme === 'spirit' ? 'border-indigo-400' : ''}
                  ${horrorTheme === 'cauldron' ? 'border-green-400' : ''}
                  ${horrorTheme === 'treasure' ? 'border-amber-400' : ''}
                  ${horrorTheme === 'ritual' ? 'border-red-400' : ''}
                  pointer-events-none
                `} />
              )}

              {/* Horror-styled focus indicator (Requirements 12.4) */}
              {focused && (
                <div className={`
                  absolute -inset-1 rounded-xl border-2 border-dashed
                  ${horrorTheme === 'tombstone' ? 'border-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : ''}
                  ${horrorTheme === 'spirit' ? 'border-indigo-300 shadow-[0_0_10px_rgba(129,140,248,0.5)]' : ''}
                  ${horrorTheme === 'cauldron' ? 'border-green-300 shadow-[0_0_10px_rgba(134,239,172,0.5)]' : ''}
                  ${horrorTheme === 'treasure' ? 'border-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.5)]' : ''}
                  ${horrorTheme === 'ritual' ? 'border-red-300 shadow-[0_0_10px_rgba(252,165,165,0.5)]' : ''}
                  pointer-events-none animate-pulse
                `} />
              )}
            </button>
          );
        })}
      </div>

      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name={name}
        value={multiSelect ? JSON.stringify(selectedValues) : (value ?? '')}
      />
    </div>
  );
}
