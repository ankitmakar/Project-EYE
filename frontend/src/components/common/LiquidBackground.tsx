import React from 'react';

export const LiquidBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Liquid Orb 1: Top-Left Cyan Atmosphere */}
      <div className="liquid-orb-cyan -top-20 -left-20 animate-eye-float" />

      {/* Liquid Orb 2: Bottom-Right Violet Atmosphere */}
      <div className="liquid-orb-violet -bottom-24 -right-24 animate-eye-float" style={{ animationDelay: '-3s' }} />

      {/* Liquid Orb 3: Center-Subtle Accent */}
      <div className="liquid-orb-red top-1/3 left-1/2 -translate-x-1/2 opacity-30" />

      {/* Subtle Masked Cyber Grid */}
      <div className="absolute inset-0 cyber-grid opacity-60" />

      {/* Matrix Scanline Subtle Layer */}
      <div className="scanline-overlay" />
    </div>
  );
};
