'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Horror Event Types
type HorrorEventType = 'jumpscare' | 'glitch' | 'whisper' | 'shadow' | 'flicker' | 'possession';

interface HorrorEvent {
  type: HorrorEventType;
  intensity: 'low' | 'medium' | 'high';
  duration: number;
}

interface HorrorContextType {
  triggerEvent: (event: HorrorEvent) => void;
  triggerJumpscare: () => void;
  triggerGlitch: () => void;
  isGlitching: boolean;
  isJumpscareActive: boolean;
  horrorIntensity: number;
  setHorrorIntensity: (level: number) => void;
  isPossessed: boolean;
}

const HorrorContext = createContext<HorrorContextType | null>(null);

export const useHorror = () => {
  const context = useContext(HorrorContext);
  if (!context) throw new Error('useHorror must be used within HorrorProvider');
  return context;
};

interface HorrorProviderProps {
  children: ReactNode;
}

export default function HorrorProvider({ children }: HorrorProviderProps) {
  const [isGlitching, setIsGlitching] = useState(false);
  const [isJumpscareActive, setIsJumpscareActive] = useState(false);
  const [isPossessed, setIsPossessed] = useState(false);
  const [horrorIntensity, setHorrorIntensity] = useState(5); // 1-10 scale
  const [idleTime, setIdleTime] = useState(0);

  // Random horror event scheduler
  useEffect(() => {
    const scheduleRandomEvent = () => {
      const minDelay = Math.max(15000, 60000 - horrorIntensity * 5000);
      const maxDelay = Math.max(30000, 120000 - horrorIntensity * 8000);
      const delay = Math.random() * (maxDelay - minDelay) + minDelay;

      return setTimeout(() => {
        const events: HorrorEventType[] = ['glitch', 'shadow', 'flicker', 'whisper'];
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        
        if (randomEvent === 'glitch') {
          triggerGlitch();
        } else if (randomEvent === 'flicker') {
          triggerFlicker();
        }
        
        // 10% chance of jumpscare during random events at high intensity
        if (horrorIntensity >= 7 && Math.random() < 0.1) {
          setTimeout(triggerJumpscare, 500);
        }
      }, delay);
    };

    const timer = scheduleRandomEvent();
    return () => clearTimeout(timer);
  }, [horrorIntensity, isGlitching]);

  // Idle detection for surprise scares
  useEffect(() => {
    let idleTimer: NodeJS.Timeout;
    
    const resetIdle = () => {
      setIdleTime(0);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (horrorIntensity >= 5 && Math.random() < 0.3) {
          triggerJumpscare();
        }
      }, 30000 + Math.random() * 30000);
    };

    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keydown', resetIdle);
    window.addEventListener('scroll', resetIdle);

    return () => {
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keydown', resetIdle);
      window.removeEventListener('scroll', resetIdle);
      clearTimeout(idleTimer);
    };
  }, [horrorIntensity]);

  const triggerGlitch = useCallback(() => {
    if (isGlitching) return;
    setIsGlitching(true);
    document.body.classList.add('horror-glitch-active');
    
    setTimeout(() => {
      setIsGlitching(false);
      document.body.classList.remove('horror-glitch-active');
    }, 200 + Math.random() * 300);
  }, [isGlitching]);

  const triggerFlicker = useCallback(() => {
    document.body.classList.add('horror-flicker');
    setTimeout(() => document.body.classList.remove('horror-flicker'), 150);
    setTimeout(() => document.body.classList.add('horror-flicker'), 200);
    setTimeout(() => document.body.classList.remove('horror-flicker'), 250);
    setTimeout(() => document.body.classList.add('horror-flicker'), 400);
    setTimeout(() => document.body.classList.remove('horror-flicker'), 450);
  }, []);

  const triggerJumpscare = useCallback(() => {
    if (isJumpscareActive) return;
    setIsJumpscareActive(true);
    document.body.classList.add('horror-shake');
    
    // Play scream sound if available
    try {
      const audio = new Audio('/ghost-sounds/scream.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}

    setTimeout(() => {
      setIsJumpscareActive(false);
      document.body.classList.remove('horror-shake');
    }, 800);
  }, [isJumpscareActive]);

  const triggerEvent = useCallback((event: HorrorEvent) => {
    switch (event.type) {
      case 'jumpscare':
        triggerJumpscare();
        break;
      case 'glitch':
        triggerGlitch();
        break;
      case 'flicker':
        triggerFlicker();
        break;
      case 'possession':
        setIsPossessed(true);
        setTimeout(() => setIsPossessed(false), event.duration);
        break;
    }
  }, [triggerJumpscare, triggerGlitch, triggerFlicker]);

  return (
    <HorrorContext.Provider value={{
      triggerEvent,
      triggerJumpscare,
      triggerGlitch,
      isGlitching,
      isJumpscareActive,
      horrorIntensity,
      setHorrorIntensity,
      isPossessed
    }}>
      {children}
      
      {/* Global Horror Overlays */}
      <JumpscareOverlay isActive={isJumpscareActive} />
      <GlitchOverlay isActive={isGlitching} />
      <AmbientFog />
      <FloatingShadows intensity={horrorIntensity} />
      <CursorGhostTrail />
    </HorrorContext.Provider>
  );
}

// Jumpscare Popup Component
function JumpscareOverlay({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center">
      <div className="jumpscare-ghost animate-jumpscare">
        {/* SVG Ghost Face */}
        <svg viewBox="0 0 200 200" className="w-[80vmin] h-[80vmin] filter drop-shadow-[0_0_50px_rgba(255,0,0,0.8)]">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          {/* Ghost body */}
          <path 
            d="M100 10 C40 10 20 60 20 100 C20 140 20 180 20 190 L40 170 L60 190 L80 170 L100 190 L120 170 L140 190 L160 170 L180 190 C180 180 180 140 180 100 C180 60 160 10 100 10Z" 
            fill="rgba(200,200,200,0.9)"
            filter="url(#glow)"
          />
          {/* Hollow eyes */}
          <ellipse cx="70" cy="80" rx="20" ry="25" fill="#000"/>
          <ellipse cx="130" cy="80" rx="20" ry="25" fill="#000"/>
          {/* Red pupils */}
          <circle cx="70" cy="85" r="8" fill="#ff0000" className="animate-pulse"/>
          <circle cx="130" cy="85" r="8" fill="#ff0000" className="animate-pulse"/>
          {/* Screaming mouth */}
          <ellipse cx="100" cy="140" rx="30" ry="25" fill="#000"/>
        </svg>
      </div>
      {/* Red flash overlay */}
      <div className="absolute inset-0 bg-red-900/30 animate-flash"/>
    </div>
  );
}

// VHS Glitch Overlay
function GlitchOverlay({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none">
      {/* Scanlines */}
      <div className="absolute inset-0 bg-scanlines opacity-30"/>
      {/* RGB Split effect */}
      <div className="absolute inset-0 glitch-rgb"/>
      {/* Static noise */}
      <div className="absolute inset-0 bg-noise opacity-20 animate-noise"/>
    </div>
  );
}

// Ambient Fog Layer
function AmbientFog() {
  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {/* Bottom fog */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/40 via-gray-900/20 to-transparent"/>
      {/* Drifting fog layers */}
      <div className="absolute inset-0 fog-layer-1"/>
      <div className="absolute inset-0 fog-layer-2"/>
      {/* Vignette */}
      <div className="absolute inset-0 bg-radial-vignette"/>
    </div>
  );
}

// Floating Shadow Figures
function FloatingShadows({ intensity }: { intensity: number }) {
  const [shadows, setShadows] = useState<Array<{ id: number; x: number; delay: number; duration: number }>>([]);

  useEffect(() => {
    const count = Math.floor(intensity / 3) + 1;
    const newShadows = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 15 + Math.random() * 20
    }));
    setShadows(newShadows);
  }, [intensity]);

  return (
    <div className="fixed inset-0 z-[99] pointer-events-none overflow-hidden">
      {shadows.map((shadow) => (
        <div
          key={shadow.id}
          className="absolute shadow-figure"
          style={{
            left: `${shadow.x}%`,
            animationDelay: `${shadow.delay}s`,
            animationDuration: `${shadow.duration}s`
          }}
        />
      ))}
    </div>
  );
}

// Cursor Ghost Trail
function CursorGhostTrail() {
  const [trails, setTrails] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const trailIdRef = React.useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const newTrail = {
        id: trailIdRef.current++,
        x: e.clientX,
        y: e.clientY
      };
      
      setTrails(prev => [...prev.slice(-8), newTrail]);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const cleanup = setInterval(() => {
      setTrails(prev => prev.slice(1));
    }, 100);
    return () => clearInterval(cleanup);
  }, []);

  return (
    <div className="fixed inset-0 z-[98] pointer-events-none">
      {trails.map((trail, index) => (
        <div
          key={trail.id}
          className="absolute w-6 h-6 rounded-full bg-white/10 blur-sm transition-opacity duration-300"
          style={{
            left: trail.x - 12,
            top: trail.y - 12,
            opacity: (index + 1) / trails.length * 0.3,
            transform: `scale(${1 + index * 0.1})`
          }}
        />
      ))}
    </div>
  );
}
