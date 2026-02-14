
import React from 'react';

const EmptyState: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="flex flex-col items-center justify-center py-40 bg-[#181922] rounded-[32px] border border-[#232435] border-dashed">
    <div className="w-20 h-20 bg-[#790BFD]/10 rounded-3xl flex items-center justify-center mb-6 text-[#790BFD]">
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    </div>
    <h2 className="text-2xl font-black text-white mb-2">{title}</h2>
    <p className="text-[#A1A1B3]">{subtitle}</p>
  </div>
);

export const ResourcesView: React.FC = () => (
  <div className="animate-in fade-in duration-500">
    <h1 className="text-4xl font-black text-white mb-8 tracking-tight uppercase">Resource Library</h1>
    <EmptyState title="Resource Library" subtitle="Shared documents and tutorials will appear here." />
  </div>
);
