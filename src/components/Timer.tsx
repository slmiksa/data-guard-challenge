
import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  isActive: boolean;
  onTimeUpdate: (seconds: number) => void;
  className?: string;
}

const Timer: React.FC<TimerProps> = ({ isActive, onTimeUpdate, className = '' }) => {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive) {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now() - (seconds * 1000);
      }
      
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current!) / 1000);
        setSeconds(elapsed);
        onTimeUpdate(elapsed);
      }, 100); // Update more frequently for better accuracy
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, onTimeUpdate]);

  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (seconds < 300) return 'text-green-300'; // Less than 5 minutes - green
    if (seconds < 600) return 'text-yellow-300'; // Less than 10 minutes - yellow
    return 'text-red-300'; // More than 10 minutes - red
  };

  return (
    <div className={`flex items-center space-x-2 space-x-reverse ${className}`}>
      <div className="relative">
        <Clock className={`h-6 w-6 ${getTimerColor()} animate-pulse`} />
      </div>
      <div className="bg-black/30 rounded-lg px-3 py-1 border border-white/20">
        <span className={`timer-display text-xl font-mono font-bold ${getTimerColor()}`}>
          {formatTime(seconds)}
        </span>
      </div>
    </div>
  );
};

export default Timer;
