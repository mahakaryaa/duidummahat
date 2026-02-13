import React, { useState, useEffect } from 'react';

const GiftBoxAnimation: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Auto-animate every 3 seconds
    const interval = setInterval(() => {
      setIsHovered(true);
      setTimeout(() => setIsHovered(false), 600);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="relative w-32 h-32 flex items-center justify-center cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        animation: 'floatGift 3s ease-in-out infinite'
      }}
    >
      {/* Gift Box */}
      <div
        className={`relative w-24 h-24 transition-transform duration-500 ${
          isHovered ? 'scale-110 -translate-y-2' : 'scale-100 translate-y-0'
        }`}
      >
        {/* Main Box */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#7C9B93] to-[#638079] rounded-lg shadow-xl transform-gpu"
          style={{
            boxShadow: '0 20px 30px rgba(124, 155, 147, 0.3), inset -2px -2px 8px rgba(0,0,0,0.1)'
          }}
        />

        {/* Ribbon Horizontal */}
        <div className="absolute top-1/2 left-0 right-0 h-3 bg-gradient-to-r from-[#FFD60A] via-[#FFE66D] to-[#FFD60A] -translate-y-1/2 shadow-md" />

        {/* Ribbon Vertical */}
        <div className="absolute top-0 bottom-0 left-1/2 w-3 bg-gradient-to-b from-[#FFD60A] via-[#FFE66D] to-[#FFD60A] -translate-x-1/2 shadow-md" />

        {/* Bow Top */}
        <div className={`absolute -top-2 left-1/2 -translate-x-1/2 transition-all duration-500 ${
          isHovered ? 'opacity-100 scale-100' : 'opacity-80 scale-95'
        }`}>
          {/* Left Bow */}
          <div className="absolute right-2 w-4 h-6 bg-gradient-to-r from-[#FFD60A] to-[#FFE66D] rounded-full shadow-md"
            style={{ transform: 'rotate(-25deg)' }}
          />
          {/* Right Bow */}
          <div className="absolute left-2 w-4 h-6 bg-gradient-to-r from-[#FFD60A] to-[#FFE66D] rounded-full shadow-md"
            style={{ transform: 'rotate(25deg)' }}
          />
          {/* Center Bow */}
          <div className="absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-[#FFE66D] rounded-full shadow-md" />
        </div>

        {/* Shine Effect */}
        <div className={`absolute top-1 left-1 w-8 h-8 bg-white rounded-lg opacity-0 transition-opacity duration-400 ${
          isHovered ? 'opacity-20' : 'opacity-0'
        }`}
          style={{ mixBlendMode: 'overlay' }}
        />

        {/* Sparkles */}
        {isHovered && (
          <>
            <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-300 rounded-full animate-pulse" />
            <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-yellow-200 rounded-full animate-pulse"
              style={{ animationDelay: '0.2s' }}
            />
            <div className="absolute top-1/2 right-1 w-1 h-1 bg-yellow-300 rounded-full animate-pulse"
              style={{ animationDelay: '0.4s' }}
            />
          </>
        )}
      </div>

      {/* Floating Animation */}
      <style>{`
        @keyframes floatGift {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-4px) rotate(-1deg); }
          75% { transform: translateY(-4px) rotate(1deg); }
        }
        
        .gift-float {
          animation: floatGift 3s ease-in-out infinite;
        }
        
        .gift-bounce {
          animation: bounce-subtle 0.6s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default GiftBoxAnimation;
