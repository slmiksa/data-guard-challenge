
import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  isActive: boolean;
  onTimeUpdate: (seconds: number) => void;
  className?: string;
}

const Timer: React.FC<TimerProps> = ({ isActive, onTimeUpdate, className = '' }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        setSeconds(prevSeconds => {
          const newSeconds = prevSeconds + 1;
          onTimeUpdate(newSeconds);
          return newSeconds;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, onTimeUpdate]);

  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center space-x-2 space-x-reverse text-white/90 ${className}`}>
      <Clock className="h-5 w-5" />
      <span className="timer-display text-lg">
        {formatTime(seconds)}
      </span>
    </div>
  );
};

export default Timer;
