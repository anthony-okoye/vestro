'use client';

import { useState, useRef } from 'react';
import { useHorror } from './HorrorProvider';

interface HorrorButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  /** Chance (0-1) to trigger a scare on click */
  scareChance?: number;
  /** Type of button styling */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export default function HorrorButton({
  children,
  onClick,
  className = '',
  scareChance = 0.15,
  variant = 'primary',
  disabled = false,
  type = 'button'
}: HorrorButtonProps) {
  const { triggerGlitch, triggerJumpscare, horrorIntensity } = useHorror();
  const [isHovered, setIsHovered] = useState(false);
  const [isPossessed, setIsPossessed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    // Random scare chance
    const adjustedChance = scareChance * (horrorIntensity / 5);
    
    if (Math.random() < adjustedChance * 0.3) {
      // 30% of scare chance = jumpscare
      triggerJumpscare();
    } else if (Math.random() < adjustedChance) {
      // Rest = glitch
      triggerGlitch();
    }

    // Possession effect
    if (Math.random() < 0.1) {
      setIsPossessed(true);
      setTimeout(() => setIsPossessed(false), 500);
    }

    onClick?.();
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    // Small chance of glitch on hover
    if (Math.random() < 0.05 * horrorIntensity) {
      triggerGlitch();
    }
  };

  const variantStyles = {
    primary: `
      bg-gradient-to-r from-purple-600 to-purple-800 
      hover:from-purple-500 hover:to-purple-700
      text-white border-purple-500
      shadow-lg shadow-purple-500/20
      hover:shadow-purple-500/40
    `,
    secondary: `
      bg-gray-800/80 hover:bg-gray-700/80
      text-gray-200 border-gray-600
      hover:border-purple-500/50
    `,
    danger: `
      bg-gradient-to-r from-red-600 to-red-800
      hover:from-red-500 hover:to-red-700
      text-white border-red-500
      shadow-lg shadow-red-500/20
      hover:shadow-red-500/40
    `,
    ghost: `
      bg-transparent hover:bg-gray-800/50
      text-gray-400 hover:text-white
      border-transparent hover:border-gray-600
    `
  };

  return (
    <button
      ref={buttonRef}
      type={type}
      disabled={disabled}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative px-6 py-3 font-semibold rounded-lg border
        transition-all duration-200 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed
        overflow-hidden group
        ${variantStyles[variant]}
        ${isPossessed ? 'animate-possession' : ''}
        ${className}
      `}
    >
      {/* Hover glow effect */}
      <span className={`
        absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
        translate-x-[-100%] group-hover:translate-x-[100%]
        transition-transform duration-700 ease-out
      `} />
      
      {/* Blood drip on hover (rare) */}
      {isHovered && Math.random() < 0.01 && (
        <span className="blood-drip absolute top-0 left-1/2" />
      )}
      
      {/* Content */}
      <span className={`relative z-10 flex items-center justify-center gap-2 ${
        isPossessed ? 'text-red-400' : ''
      }`}>
        {children}
      </span>
      
      {/* Creepy underline on hover */}
      <span className={`
        absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-red-500 via-purple-500 to-red-500
        transition-all duration-300
        ${isHovered ? 'w-full' : 'w-0'}
      `} />
    </button>
  );
}

// Possessed checkbox with creepy styling
export function HorrorCheckbox({
  checked,
  onChange,
  label,
  className = ''
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}) {
  const { triggerGlitch } = useHorror();

  const handleChange = () => {
    if (Math.random() < 0.1) {
      triggerGlitch();
    }
    onChange(!checked);
  };

  return (
    <label className={`flex items-center gap-3 cursor-pointer group ${className}`}>
      <div className={`
        relative w-5 h-5 rounded border-2 transition-all duration-200
        ${checked 
          ? 'bg-purple-600 border-purple-500' 
          : 'bg-gray-800 border-gray-600 group-hover:border-purple-500/50'
        }
      `}>
        {checked && (
          <svg 
            className="absolute inset-0 w-full h-full text-white p-0.5" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3"
          >
            <path d="M5 12l5 5L20 7" />
          </svg>
        )}
        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>
      {label && (
        <span className="text-gray-300 group-hover:text-white transition-colors">
          {label}
        </span>
      )}
    </label>
  );
}
