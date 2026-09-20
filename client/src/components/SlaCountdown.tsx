import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface SlaCountdownProps {
  deadline: string | Date;
  status: string;
  className?: string;
}

export const SlaCountdown: React.FC<SlaCountdownProps> = ({ deadline, status, className = '' }) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isOverdue: boolean;
    totalSeconds: number;
  }>({ hours: 0, minutes: 0, seconds: 0, isOverdue: false, totalSeconds: 0 });

  useEffect(() => {
    const calculateTime = () => {
      const targetTime = new Date(deadline).getTime();
      const now = new Date().getTime();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft({
          hours: Math.abs(Math.floor(diff / (1000 * 60 * 60))),
          minutes: Math.abs(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))),
          seconds: Math.abs(Math.floor((diff % (1000 * 60)) / 1000)),
          isOverdue: true,
          totalSeconds: diff,
        });
      } else {
        setTimeLeft({
          hours: Math.floor(diff / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
          isOverdue: false,
          totalSeconds: diff,
        });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (status === 'CLOSED') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
        ✓ Closed / Compliant
      </span>
    );
  }

  const format2 = (n: number) => n.toString().padStart(2, '0');

  if (timeLeft.isOverdue || status === 'OVERDUE' || status === 'ESCALATED') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md bg-red-600 text-white animate-pulse ${className}`}>
        <AlertTriangle className="w-3.5 h-3.5" />
        SLA BREACHED: +{format2(timeLeft.hours)}:{format2(timeLeft.minutes)}:{format2(timeLeft.seconds)}
      </span>
    );
  }

  // Warning when less than 3 hours
  const isUrgent = timeLeft.hours < 3;
  const isWarning = timeLeft.hours < 12;

  const badgeColor = isUrgent
    ? 'bg-rose-100 text-rose-700 border-rose-300'
    : isWarning
    ? 'bg-amber-100 text-amber-800 border-amber-300'
    : 'bg-blue-50 text-blue-700 border-blue-200';

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${badgeColor} ${className}`}>
      <Clock className="w-3.5 h-3.5" />
      {format2(timeLeft.hours)}:{format2(timeLeft.minutes)}:{format2(timeLeft.seconds)} remaining
    </span>
  );
};
