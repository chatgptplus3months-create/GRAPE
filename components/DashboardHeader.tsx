
import React from 'react';
import { UserProfile } from '../types';
import { db } from '../services/supabase';

interface DashboardHeaderProps {
  onMenuClick?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  user: UserProfile;
  unreadCount: number;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onMenuClick, searchQuery, onSearchChange, user, unreadCount }) => {
  const isAdmin = user.role === 'admin';
  const displayName = user.name || (isAdmin ? 'Faculty' : 'Member');
  const displayAvatar = user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name || user.id}&mood=happy`;
  
  const displaySubtitle = isAdmin 
    ? (user.skill_level || 'ICT Faculty') 
    : (user.class_name || 'Member Node');

  return (
    <header className="h-24 bg-[#0E0E17]/90 backdrop-blur-3xl border-b border-[#232435] sticky top-0 z-30 flex items-center justify-between px-6 lg:px-12 shadow-sm">
      <div className="flex items-center gap-6 flex-1 max-w-2xl">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-3 bg-[#181922] border border-[#232435] rounded-2xl text-[#A1A1B3] hover:text-white transition-all shadow-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <div className="relative group flex-1 max-w-md hidden sm:block">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <svg 
              className="w-5 h-5 text-[#4C4D5E] group-focus-within:text-[#790BFD] transition-colors" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Search ecosystem..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#181922] border border-[#232435] rounded-[24px] py-4 pl-14 pr-12 text-sm text-white placeholder-[#4C4D5E] focus:border-[#790BFD] outline-none transition-all shadow-inner focus:ring-4 focus:ring-[#790BFD]/5"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 ml-4">
        {/* Connection Pulse Badge */}
        <div className="hidden lg:flex items-center gap-3 px-5 py-2.5 bg-[#181922] border border-[#232435] rounded-full mr-4">
          <div className="relative">
             <div className="w-2 h-2 rounded-full bg-[#3DD598] animate-pulse"></div>
             <div className="absolute inset-0 w-2 h-2 rounded-full bg-[#3DD598] animate-ping opacity-30"></div>
          </div>
          <span className="text-[9px] font-black text-[#4C4D5E] uppercase tracking-widest">Ecosystem Live</span>
        </div>

        <button 
          onClick={() => window.location.hash = '#Messages'}
          className="relative p-3 bg-[#181922] border border-[#232435] rounded-2xl text-[#A1A1B3] hover:text-[#790BFD] transition-all group"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-[#181922] text-[8px] font-black flex items-center justify-center text-white">
              {unreadCount}
            </span>
          )}
        </button>

        <div className="h-8 w-px bg-[#232435] mx-2"></div>

        <div className="flex items-center gap-4 pl-2 group cursor-pointer" onClick={() => window.location.hash = '#Settings'}>
          <div className="text-right hidden md:block">
            <p className="text-sm font-black text-white group-hover:text-[#790BFD] transition-colors tracking-tight">
              {displayName}
            </p>
            <p className={`text-[9px] uppercase tracking-[0.2em] font-black mt-0.5 ${isAdmin ? 'text-[#790BFD]' : 'text-[#3DD598]'}`}>
              {displaySubtitle}
            </p>
          </div>
          <div className="relative shrink-0">
             <div className={`absolute inset-0 blur-lg rounded-full opacity-0 group-hover:opacity-40 transition-opacity ${isAdmin ? 'bg-[#790BFD]' : 'bg-[#3DD598]'}`}></div>
             <img 
               src={displayAvatar} 
               className={`w-12 h-12 rounded-2xl border-2 transition-all object-cover relative z-10 shadow-2xl group-hover:scale-105 ${isAdmin ? 'border-[#790BFD]/40' : 'border-[#3DD598]/40'}`} 
               alt={displayName} 
             />
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
