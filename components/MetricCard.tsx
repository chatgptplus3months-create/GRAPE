
import React from 'react';
import { MetricData } from '../types';

interface MetricCardProps {
  metric: MetricData;
}

const MetricCard: React.FC<MetricCardProps> = ({ metric }) => {
  return (
    <div className="bg-[#181922] p-6 rounded-[32px] border-2 border-[#232435] transition-all group shadow-2xl relative overflow-hidden hover:-translate-y-3 hover:border-[#790BFD]/40">
      <div className="absolute inset-0 bg-gradient-to-br from-[#790BFD]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-700"></div>

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="space-y-3">
          <p className="text-[10px] font-black text-[#4C4D5E] uppercase tracking-[0.5em] group-hover:text-[#790BFD] transition-colors duration-500 leading-none">{metric.label}</p>
          <div className="h-1.5 w-8 bg-[#232435] group-hover:w-16 group-hover:bg-[#790BFD] transition-all duration-700 rounded-full"></div>
        </div>
        <div className="w-12 h-12 bg-[#0E0E17] border-2 border-[#232435] rounded-[20px] flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-2xl shadow-black/40">
          <svg className="w-6 h-6 text-[#790BFD] drop-shadow-[0_0_8px_rgba(121,11,253,0.5)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {metric.icon === 'users' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />}
            {metric.icon === 'zap' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />}
            {metric.icon === 'check-circle' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
          </svg>
        </div>
      </div>

      <div className="relative z-10 flex items-end justify-between">
        <h3 className="text-5xl font-black text-white tracking-tighter group-hover:scale-105 origin-left transition-transform duration-700 tabular-nums">
          {metric.value}
        </h3>
        {metric.trend !== undefined && (
          <div className="flex items-center gap-2 mb-3 px-4 py-2 bg-[#0E0E17] rounded-full border border-[#232435] group-hover:border-[#3DD598]/30 transition-colors">
            <span className="text-[10px] font-black text-[#3DD598] tracking-widest">+{metric.trend}%</span>
            <svg className="w-3 h-3 text-[#3DD598]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 15l7-7 7 7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
