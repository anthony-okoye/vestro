'use client';

import { useState, useEffect } from 'react';
import { useHorror } from './HorrorProvider';

interface GlitchTextProps {
  children: string;
  className?: string;
  /** Intensity of glitch effect 1-10 */
  intensity?: number;
  /** Enable random possession state */
  canBePossessed?: boolean;
}

export default function GlitchText({ 
  children, 
  className = '', 
  intensity = 5,
  canBePossessed = true 
}: GlitchTextProps) {
  const [displayText, setDisplayText] = useState(children);
  const [isGlitching, setIsGlitching] = useState(false);
  const { isPossessed, horrorIntensity } = useHorror();

  // Zalgo text generator for possessed state
  const zalgoify = (text: string): string => {
    const zalgoChars = {
      up: ['̍', '̎', '̄', '̅', '̿', '̑', '̆', '̐', '͒', '͗', '͑', '̇', '̈', '̊', '͂', '̓', '̈́', '͊', '͋', '͌', '̃', '̂', '̌', '͐', '̀', '́', '̋', '̏', '̒', '̓', '̔', '̽', '̉', 'ͣ', 'ͤ', 'ͥ', 'ͦ', 'ͧ', 'ͨ', 'ͩ', 'ͪ', 'ͫ', 'ͬ', 'ͭ', 'ͮ', 'ͯ', '̾', '͛', '͆', '̚'],
      down: ['̖', '̗', '̘', '̙', '̜', '̝', '̞', '̟', '̠', '̤', '̥', '̦', '̩', '̪', '̫', '̬', '̭', '̮', '̯', '̰', '̱', '̲', '̳', '̹', '̺', '̻', '̼', 'ͅ', '͇', '͈', '͉', '͍', '͎', '͓', '͔', '͕', '͖', '͙', '͚', '̣'],
      mid: ['̕', '̛', '̀', '́', '͘', '̡', '̢', '̧', '̨', '̴', '̵', '̶', '͜', '͝', '͞', '͟', '͠', '͢', '̸', '̷', '͡']
    };

    return text.split('').map(char => {
      if (char === ' ') return char;
      let result = char;
      const count = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < count; i++) {
        const type = ['up', 'down', 'mid'][Math.floor(Math.random() * 3)] as keyof typeof zalgoChars;
        result += zalgoChars[type][Math.floor(Math.random() * zalgoChars[type].length)];
      }
      return result;
    }).join('');
  };

  // Random glitch effect
  useEffect(() => {
    if (intensity < 3) return;

    const glitchInterval = setInterval(() => {
      if (Math.random() < (intensity * horrorIntensity) / 200) {
        setIsGlitching(true);
        
        // Scramble text briefly
        const scrambled = children.split('').map(char => 
          Math.random() < 0.3 ? String.fromCharCode(33 + Math.floor(Math.random() * 94)) : char
        ).join('');
        setDisplayText(scrambled);

        setTimeout(() => {
          setDisplayText(children);
          setIsGlitching(false);
        }, 50 + Math.random() * 100);
      }
    }, 500);

    return () => clearInterval(glitchInterval);
  }, [children, intensity, horrorIntensity]);

  // Possessed state
  useEffect(() => {
    if (isPossessed && canBePossessed) {
      setDisplayText(zalgoify(children));
    } else {
      setDisplayText(children);
    }
  }, [isPossessed, children, canBePossessed]);

  return (
    <span 
      className={`${className} ${isGlitching ? 'glitch-text' : ''} ${isPossessed && canBePossessed ? 'text-red-500' : ''}`}
      data-text={children}
    >
      {displayText}
    </span>
  );
}

// Flickering text component
export function FlickerText({ children, className = '' }: { children: string; className?: string }) {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const flicker = setInterval(() => {
      if (Math.random() < 0.1) {
        setOpacity(0.3 + Math.random() * 0.4);
        setTimeout(() => setOpacity(1), 50 + Math.random() * 100);
      }
    }, 200);

    return () => clearInterval(flicker);
  }, []);

  return (
    <span className={className} style={{ opacity, transition: 'opacity 0.05s' }}>
      {children}
    </span>
  );
}

// Text that types itself with creepy pauses
export function CreepyTypewriter({ 
  text, 
  className = '',
  onComplete 
}: { 
  text: string; 
  className?: string;
  onComplete?: () => void;
}) {
  const [displayText, setDisplayText] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    let index = 0;
    const chars = text.split('');
    
    const typeChar = () => {
      if (index < chars.length) {
        setDisplayText(prev => prev + chars[index]);
        index++;
        
        // Random delays for creepy effect
        const delay = chars[index - 1] === ' ' 
          ? 50 + Math.random() * 100
          : Math.random() < 0.1 
            ? 300 + Math.random() * 500 // Long pause
            : 30 + Math.random() * 70;
        
        setTimeout(typeChar, delay);
      } else {
        onComplete?.();
      }
    };

    const startDelay = setTimeout(typeChar, 500);
    
    // Cursor blink
    const cursorInterval = setInterval(() => {
      setCursorVisible(v => !v);
    }, 500);

    return () => {
      clearTimeout(startDelay);
      clearInterval(cursorInterval);
    };
  }, [text, onComplete]);

  return (
    <span className={className}>
      {displayText}
      <span className={`${cursorVisible ? 'opacity-100' : 'opacity-0'} text-red-500`}>|</span>
    </span>
  );
}
