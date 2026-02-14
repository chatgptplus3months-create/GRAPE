import React from 'react';

interface BrandLogoProps {
  size?: number;
  className?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ size = 48, className = "" }) => (
  <div 
    className={`relative inline-flex items-center justify-center rounded-[28px] bg-[#2D2E3B] shadow-xl transition-transform hover:scale-110 duration-500 overflow-visible ${className}`} 
    style={{ width: size, height: size }}
  >
    <style>
      {`
        @keyframes nodePulse {
          0%, 100% { transform: scale(1); opacity: 0.95; filter: drop-shadow(0 0 2px rgba(121, 11, 253, 0.5)); }
          50% { transform: scale(1.2); opacity: 1; filter: drop-shadow(0 0 8px rgba(121, 11, 253, 0.8)); }
        }
        @keyframes corePulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 2px rgba(61, 213, 152, 0.5)); }
          50% { transform: scale(1.1); filter: drop-shadow(0 0 10px rgba(61, 213, 152, 0.9)); }
        }
        .node-pulse {
          animation: nodePulse 2.5s infinite ease-in-out;
          transform-origin: center;
        }
        .node-pulse-delayed {
          animation: nodePulse 2.5s infinite ease-in-out;
          animation-delay: 1.25s;
          transform-origin: center;
        }
        .core-pulse {
          animation: corePulse 2s infinite ease-in-out;
          transform-origin: center;
        }
      `}
    </style>
    
    <svg 
      width="80%" 
      height="80%" 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className="overflow-visible"
    >
      {/* Network Connections */}
      <g stroke="#9B5CFF" strokeWidth="2.2" strokeOpacity="0.9">
          <path d="M50 35 L35 45" />
          <path d="M50 35 L65 45" />
          <path d="M35 45 L28 58" />
          <path d="M65 45 L72 58" />
          <path d="M28 58 L35 73" />
          <path d="M72 58 L65 73" />
      </g>

      {/* Top Leaf Node */}
      <path d="M50 35 C50 20 60 15 70 15 C75 15 75 25 70 30 C65 35 55 35 50 35 Z" 
        stroke="#3DD598" strokeWidth="2.5" fill="#3DD598" fillOpacity="0.8" className="core-pulse" />
      
      {/* Primary Grapes */}
      <circle cx="35" cy="45" r="6.5" fill="#790BFD" className="node-pulse" />
      <circle cx="65" cy="45" r="6.5" fill="#790BFD" className="node-pulse-delayed" />
      
      {/* Center Vital Node */}
      <circle cx="50" cy="48" r="8.5" fill="#3DD598" stroke="#FFFFFF" strokeWidth="1.5" className="core-pulse" />
      
      {/* Middleware Nodes */}
      <circle cx="28" cy="58" r="6.5" fill="#790BFD" className="node-pulse-delayed" />
      <circle cx="42" cy="61" r="6.5" fill="#790BFD" className="node-pulse" />
      <circle cx="58" cy="61" r="6.5" fill="#790BFD" className="node-pulse-delayed" />
      <circle cx="72" cy="58" r="6.5" fill="#790BFD" className="node-pulse" />
      
      {/* Secondary Clusters */}
      <circle cx="35" cy="73" r="7" fill="#3DD598" className="core-pulse" />
      <circle cx="50" cy="76" r="6.5" fill="#790BFD" className="node-pulse-delayed" />
      <circle cx="65" cy="73" r="6.5" fill="#790BFD" className="node-pulse" />
      
      {/* Terminal Base Nodes */}
      <circle cx="42" cy="85" r="7" fill="#3DD598" className="core-pulse" />
      <circle cx="58" cy="85" r="6.5" fill="#790BFD" className="node-pulse" />
      <circle cx="50" cy="94" r="8" stroke="#FFFFFF" strokeWidth="1.5" fill="#790BFD" className="node-pulse" />
    </svg>
  </div>
);

export default BrandLogo;