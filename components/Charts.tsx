
import React from 'react';
import { MOCK_CHART_DATA, CATEGORY_DISTRIBUTION } from '../constants';

// A high-performance, dependency-free Area Chart using SVG
export const ActivityTrendsChart: React.FC = () => {
  const data = MOCK_CHART_DATA;
  const maxVal = Math.max(...data.map(d => d.value));
  const height = 300;
  const width = 600;
  
  // Calculate SVG path
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (d.value / maxVal) * height;
    return `${x},${y}`;
  }).join(' ');

  const areaPath = `M0,${height} L${points} L${width},${height} Z`;
  const linePath = `M${points}`;

  return (
    <div className="bg-[#181922] p-8 rounded-[32px] border border-[#232435] h-[450px] shadow-2xl relative overflow-hidden group">
      <div className="flex justify-between items-start mb-10 relative z-10">
        <div>
          <h3 className="text-xl font-bold text-white mb-1 tracking-tight">Activity Trends</h3>
          <p className="text-[11px] font-medium text-[#A1A1B3]">Daily student participation logs</p>
        </div>
      </div>
      
      <div className="relative w-full h-[280px] mt-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#790BFD" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#790BFD" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Horizontal Grid Lines */}
          {[0, 1, 2, 3].map(i => (
            <line key={i} x1="0" y1={(i * height) / 3} x2={width} y2={(i * height) / 3} stroke="#232435" strokeWidth="1" />
          ))}
          <path d={areaPath} fill="url(#areaGradient)" />
          <path d={linePath} fill="none" stroke="#790BFD" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        
        <div className="flex justify-between mt-6">
          {data.map(d => (
            <span key={d.name} className="text-[10px] font-black text-[#A1A1B3] uppercase">{d.name}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export const CategoryDistribution: React.FC = () => {
  return (
    <div className="bg-[#181922] p-8 rounded-[32px] border border-[#232435] h-[450px] flex flex-col shadow-2xl relative">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="text-xl font-bold text-white mb-1 tracking-tight">Category Distribution</h3>
          <p className="text-[11px] font-medium text-[#A1A1B3]">Submissions by domain</p>
        </div>
      </div>
      
      <div className="space-y-7 flex-1">
        {(CATEGORY_DISTRIBUTION ?? []).map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-[11px] font-black uppercase tracking-wider mb-2.5">
              <span className="text-white opacity-90">{item.label}</span>
              <span className="text-[#790BFD]">{item.percentage}%</span>
            </div>
            <div className="h-2.5 w-full bg-[#0E0E17] rounded-full overflow-hidden border border-[#232435]">
              <div 
                className="h-full bg-gradient-to-r from-[#790BFD] to-[#9B5CFF] rounded-full shadow-[0_0_12px_rgba(121,11,253,0.3)] transition-all duration-1000"
                style={{ width: `${item.percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-8 border-t border-[#232435] grid grid-cols-2 gap-4 mt-4">
        <div className="text-center group cursor-default">
          <p className="text-2xl font-black text-white group-hover:text-[#790BFD] transition-colors tracking-tighter">15</p>
          <p className="text-[9px] text-[#A1A1B3] uppercase tracking-[0.2em] font-black mt-1">Avg Score</p>
        </div>
        <div className="text-center border-l border-[#232435] group cursor-default">
          <p className="text-2xl font-black text-white group-hover:text-[#790BFD] transition-colors tracking-tighter">8.2m</p>
          <p className="text-[9px] text-[#A1A1B3] uppercase tracking-[0.2em] font-black mt-1">Time Spent</p>
        </div>
      </div>
    </div>
  );
};
