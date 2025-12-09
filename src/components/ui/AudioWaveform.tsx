import React, { useEffect, useRef, useState } from 'react';

export type WaveformState = 'idle' | 'listening' | 'speaking';

export interface AudioWaveformProps {
  state?: WaveformState;
  barCount?: number;
  className?: string;
  color?: string;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  state = 'idle',
  barCount = 5,
  className = '',
  color,
}) => {
  const [heights, setHeights] = useState<number[]>(Array(barCount).fill(20));
  const animationRef = useRef<number>();

  useEffect(() => {
    if (state === 'idle') {
      setHeights(Array(barCount).fill(20));
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const animate = () => {
      setHeights((prev) =>
        prev.map((_, i) => {
          if (state === 'listening') {
            // Gentle wave for listening
            return 20 + Math.sin(Date.now() / 300 + i) * 15;
          } else {
            // More energetic for speaking
            return 20 + Math.sin(Date.now() / 200 + i * 0.8) * 25 + Math.random() * 10;
          }
        })
      );
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state, barCount]);

  const getBarColor = () => {
    if (color) return color;

    switch (state) {
      case 'listening':
        return 'bg-blue-500';
      case 'speaking':
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div
      className={`flex items-center justify-center gap-1 ${className}`}
      role="img"
      aria-label={`Audio waveform - ${state}`}
    >
      {heights.map((height, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-100 ${getBarColor()}`}
          style={{ height: `${height}px` }}
        />
      ))}
    </div>
  );
};

export interface AudioVisualizerProps {
  isRecording: boolean;
  isSpeaking?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isRecording,
  isSpeaking = false,
  size = 'md',
  className = '',
}) => {
  const state: WaveformState = !isRecording ? 'idle' : isSpeaking ? 'speaking' : 'listening';

  const sizeConfig = {
    sm: { barCount: 3, containerSize: 'w-16 h-16' },
    md: { barCount: 5, containerSize: 'w-24 h-24' },
    lg: { barCount: 7, containerSize: 'w-32 h-32' },
  };

  const config = sizeConfig[size];

  return (
    <div
      className={`
        ${config.containerSize}
        rounded-full flex items-center justify-center
        transition-all duration-300
        ${isRecording ? 'bg-primary-50 ring-4 ring-primary-200 ring-opacity-50' : 'bg-gray-100'}
        ${className}
      `}
    >
      <AudioWaveform state={state} barCount={config.barCount} />
    </div>
  );
};

export interface PulseIndicatorProps {
  isActive: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'danger';
  className?: string;
}

export const PulseIndicator: React.FC<PulseIndicatorProps> = ({
  isActive,
  size = 'md',
  color = 'primary',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  };

  const colorClasses = {
    primary: 'bg-primary-500',
    success: 'bg-green-500',
    danger: 'bg-red-500',
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className={`
          ${sizeClasses[size]}
          ${colorClasses[color]}
          rounded-full
          ${isActive ? 'opacity-100' : 'opacity-30'}
          transition-opacity duration-300
        `}
      />
      {isActive && (
        <>
          <div
            className={`
              absolute inset-0
              ${colorClasses[color]}
              rounded-full
              animate-ping
              opacity-75
            `}
          />
          <div
            className={`
              absolute inset-0
              ${colorClasses[color]}
              rounded-full
              opacity-50
              blur-sm
            `}
          />
        </>
      )}
    </div>
  );
};
