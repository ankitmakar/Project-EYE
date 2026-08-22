import React from 'react';

interface Props {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  animate?: boolean;
}

export const EyeLogo: React.FC<Props> = ({
  size = 36,
  className = '',
  showWordmark = false,
  animate = true,
}) => {
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Custom Vector EYE Symbol */}
      <div
        style={{ width: size, height: size }}
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-400/40 shadow-glow-primary overflow-hidden group"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full p-1.5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle Outer Shield Geometry */}
          <path
            d="M50 10 L85 24 V50 C85 70 50 90 50 90 C50 90 15 70 15 50 V24 Z"
            stroke="rgba(155, 124, 255, 0.4)"
            strokeWidth="2.5"
            strokeDasharray="4 4"
            className={animate ? 'animate-pulse' : ''}
          />

          {/* Eye Contour Outer Arcs */}
          <path
            d="M20 50 Q50 20 80 50 Q50 80 20 50 Z"
            stroke="#4de7ff"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Tactical Radar Ring */}
          <circle
            cx="50"
            cy="50"
            r="18"
            stroke="rgba(77, 231, 255, 0.6)"
            strokeWidth="2"
            strokeDasharray="3 3"
          />

          {/* Glowing Circular Iris */}
          <circle
            cx="50"
            cy="50"
            r="10"
            fill="url(#iris-gradient)"
            stroke="#9b7cff"
            strokeWidth="1.5"
          />

          {/* Center Tactical Pulse Dot */}
          <circle
            cx="50"
            cy="50"
            r="4"
            fill="#ffffff"
            className={animate ? 'animate-ping' : ''}
          />

          {/* Gradients */}
          <defs>
            <radialGradient id="iris-gradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#4de7ff" />
              <stop offset="100%" stopColor="#9b7cff" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* Wordmark */}
      {showWordmark && (
        <div>
          <div className="flex items-center gap-1 font-display font-bold tracking-wider text-slate-100 text-lg leading-none">
            PROJECT <span className="text-eye-primary glow-cyan">EYE</span>
          </div>
          <div className="text-[9px] text-eye-muted font-mono tracking-widest uppercase mt-0.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-eye-success animate-ping inline-block" />
            CYBER-SOC v1.0
          </div>
        </div>
      )}
    </div>
  );
};
