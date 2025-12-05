'use client';

import { useState, useEffect } from 'react';
import { useHorror } from './HorrorProvider';

interface JumpscareProps {
  /** Trigger on scroll past this percentage */
  scrollTrigger?: number;
  /** Trigger after idle for this many ms */
  idleTrigger?: number;
  /** Trigger on click */
  clickTrigger?: boolean;
  /** Random chance (0-1) to trigger on any interaction */
  randomChance?: number;
  children?: React.ReactNode;
}

export default function Jumpscare({
  scrollTrigger,
  idleTrigger,
  clickTrigger,
  randomChance = 0,
  children
}: JumpscareProps) {
  const { triggerJumpscare, horrorIntensity } = useHorror();
  const [hasTriggered, setHasTriggered] = useState(false);

  // Scroll-based trigger
  useEffect(() => {
    if (!scrollTrigger || hasTriggered) return;

    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent >= scrollTrigger) {
        setHasTriggered(true);
        triggerJumpscare();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollTrigger, hasTriggered, triggerJumpscare]);

  // Idle-based trigger
  useEffect(() => {
    if (!idleTrigger || hasTriggered) return;

    const timer = setTimeout(() => {
      setHasTriggered(true);
      triggerJumpscare();
    }, idleTrigger);

    const resetTimer = () => {
      clearTimeout(timer);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
    };
  }, [idleTrigger, hasTriggered, triggerJumpscare]);

  // Click trigger with random chance
  const handleClick = () => {
    if (clickTrigger && !hasTriggered) {
      if (Math.random() < (randomChance || 1)) {
        setHasTriggered(true);
        triggerJumpscare();
      }
    }
  };

  if (children) {
    return (
      <div onClick={handleClick} className="cursor-pointer">
        {children}
      </div>
    );
  }

  return null;
}

// Standalone ghost popup that appears randomly
export function RandomGhostPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const { horrorIntensity } = useHorror();

  useEffect(() => {
    const schedulePopup = () => {
      const delay = (20000 + Math.random() * 40000) / (horrorIntensity / 5);
      
      return setTimeout(() => {
        setPosition({
          x: Math.random() * (window.innerWidth - 200),
          y: Math.random() * (window.innerHeight - 200)
        });
        setIsVisible(true);
        
        setTimeout(() => setIsVisible(false), 300 + Math.random() * 500);
      }, delay);
    };

    const timer = schedulePopup();
    return () => clearTimeout(timer);
  }, [isVisible, horrorIntensity]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed z-[9000] pointer-events-none animate-ghost-appear"
      style={{ left: position.x, top: position.y }}
    >
      <div className="w-32 h-40 opacity-60">
        <svg viewBox="0 0 100 120" className="w-full h-full filter blur-[1px]">
          <path
            d="M50 5 C20 5 10 35 10 60 C10 85 10 110 10 115 L25 100 L40 115 L50 100 L60 115 L75 100 L90 115 C90 110 90 85 90 60 C90 35 80 5 50 5Z"
            fill="rgba(150,150,150,0.8)"
          />
          <circle cx="35" cy="45" r="8" fill="#000"/>
          <circle cx="65" cy="45" r="8" fill="#000"/>
          <ellipse cx="50" cy="75" rx="12" ry="10" fill="#000"/>
        </svg>
      </div>
    </div>
  );
}

// Ghost that peeks from screen edges
export function EdgePeekingGhost() {
  const [isVisible, setIsVisible] = useState(false);
  const [edge, setEdge] = useState<'left' | 'right' | 'top' | 'bottom'>('left');
  const { horrorIntensity } = useHorror();

  useEffect(() => {
    const schedulePeek = () => {
      const delay = (30000 + Math.random() * 60000) / (horrorIntensity / 5);
      
      return setTimeout(() => {
        const edges: Array<'left' | 'right' | 'top' | 'bottom'> = ['left', 'right', 'top', 'bottom'];
        setEdge(edges[Math.floor(Math.random() * edges.length)]);
        setIsVisible(true);
        
        setTimeout(() => setIsVisible(false), 2000 + Math.random() * 2000);
      }, delay);
    };

    const timer = schedulePeek();
    return () => clearTimeout(timer);
  }, [isVisible, horrorIntensity]);

  if (!isVisible) return null;

  const positionStyles = {
    left: { left: 0, top: '30%', transform: 'translateX(-70%)' },
    right: { right: 0, top: '40%', transform: 'translateX(70%) scaleX(-1)' },
    top: { top: 0, left: '50%', transform: 'translateY(-70%) translateX(-50%) rotate(90deg)' },
    bottom: { bottom: 0, left: '60%', transform: 'translateY(70%) translateX(-50%) rotate(-90deg)' }
  };

  return (
    <div
      className="fixed z-[8000] pointer-events-none transition-transform duration-1000 ease-in-out"
      style={{
        ...positionStyles[edge],
        ...(isVisible ? { transform: positionStyles[edge].transform.replace(/translate[XY]\([^)]+\)/, 'translate(0)') } : {})
      }}
    >
      <div className="w-24 h-32 opacity-40 animate-peek">
        <svg viewBox="0 0 80 100" className="w-full h-full">
          <ellipse cx="40" cy="35" rx="35" ry="30" fill="rgba(100,100,100,0.6)"/>
          <circle cx="28" cy="30" r="6" fill="#000"/>
          <circle cx="52" cy="30" r="6" fill="#000"/>
          <circle cx="28" cy="32" r="2" fill="#600"/>
          <circle cx="52" cy="32" r="2" fill="#600"/>
        </svg>
      </div>
    </div>
  );
}
