
import React from 'react';
import { AppTab, UserProfile } from '../types';
import { db } from '../services/supabase';
import BrandLogo from './BrandLogo';

interface SidebarProps {
  activeTab: AppTab;
  onNavigate: (tab: AppTab) => void;
  isOpen?: boolean;
  user: UserProfile;
  pendingSubmissionsCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onNavigate, isOpen, user, pendingSubmissionsCount = 0 }) => {
  const role = user.role;

  const navItems: { label: AppTab; displayLabel: string; icon: string; roleRestriction?: 'admin' | 'student' }[] = [
    { label: 'Dashboard', displayLabel: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { label: 'Students', displayLabel: 'Hall of Fame', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { label: 'Messages', displayLabel: 'Messages', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
    { label: 'Challenges', displayLabel: 'Missions', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { label: 'Submissions', displayLabel: 'Audits', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', roleRestriction: 'admin' },
    { label: 'Sticker Store', displayLabel: 'Stickers/Rewards', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', roleRestriction: 'admin' },
    { label: 'Vault', displayLabel: 'Vault', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', roleRestriction: 'student' },
    { label: 'Events', displayLabel: 'Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z' },
    { label: 'Settings', displayLabel: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ];

  const filteredItems = navItems.filter(item => !item.roleRestriction || item.roleRestriction === role);

  return (
    <aside className={`w-[300px] bg-[#0E0E17] border-r border-white/5 min-h-screen flex flex-col fixed left-0 top-0 z-40 transition-all duration-500 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
      <div className="p-10 pb-12 flex items-center gap-6">
        <BrandLogo size={56} />
        <div>
          <span className="text-2xl font-black text-white tracking-tighter block leading-none">GRAPE</span>
          <span className="text-[10px] text-[#790BFD] uppercase font-black tracking-[0.4em] mt-2 block opacity-80">Hub Terminal</span>
        </div>
      </div>

      <nav className="flex-1 px-8 space-y-2 overflow-y-auto custom-scrollbar">
        {filteredItems.map((item) => {
          const isActive = activeTab === item.label;
          const hasBadge = (item.label === 'Submissions' || item.label === 'Dashboard') && pendingSubmissionsCount > 0 && role === 'admin';
          
          return (
            <button 
              key={item.label} 
              onClick={() => onNavigate(item.label)} 
              className={`w-full flex items-center gap-6 px-8 py-4 rounded-3xl text-[13px] font-bold transition-all relative group ${
                isActive ? 'text-white bg-[#790BFD] shadow-2xl shadow-[#790BFD]/20' : 'text-[#4C4D5E] hover:text-white hover:bg-white/5'
              }`}
            >
              <svg className={`w-6 h-6 shrink-0 transition-transform duration-500 ${isActive ? 'text-white' : 'text-[#4C4D5E] group-hover:text-[#790BFD]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={item.icon} />
              </svg>
              <span className={`uppercase tracking-[0.2em] text-[10px] whitespace-nowrap ${isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>{item.displayLabel}</span>
              
              {hasBadge && item.label === 'Submissions' && (
                <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center animate-pulse border-2 border-white/20">
                  {pendingSubmissionsCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-10 mt-auto border-t border-white/5">
        <button 
          onClick={() => db.signOut()}
          className="w-full flex items-center justify-center gap-4 px-8 py-5 rounded-3xl text-[9px] font-black uppercase tracking-[0.3em] text-[#4C4D5E] hover:text-red-500 hover:bg-red-500/5 transition-all border border-white/5 group"
        >
          <span>🔒</span>
          Disconnect Link
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
