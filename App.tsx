
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import DashboardHeader from './components/DashboardHeader';
import DashboardOverview from './components/DashboardOverview';
import StudentsView from './components/StudentsView';
import ChallengesView from './components/ChallengesView';
import SubmissionsReviewView from './components/SubmissionsReviewView';
import VaultView from './components/VaultView';
import EventsView from './components/EventsView';
import SettingsView from './components/SettingsView';
import LoginView from './components/LoginView';
import StickerStoreView from './components/StickerStoreView';
import MessagesView from './components/MessagesView';
import { AppTab, UserProfile } from './types';
import { db } from './services/supabase';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [schemaHealthy, setSchemaHealthy] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingSubmissionsCount, setPendingSubmissionsCount] = useState(0);
  
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as AppTab;
      const validTabs: AppTab[] = ['Dashboard', 'Students', 'Challenges', 'Messages', 'Submissions', 'Vault', 'Events', 'Sticker Store', 'Settings'];
      if (validTabs.includes(hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    if (window.location.hash) handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const checkHealth = useCallback(async () => {
    const healthy = await db.verifySchemaHealth();
    setSchemaHealthy(healthy);
    return healthy;
  }, []);

  const initAuth = useCallback(async (manualUser?: UserProfile) => {
    try {
      if (manualUser) {
        setUser(manualUser);
        await checkHealth();
        return;
      }
      await checkHealth();
      const resolvedUser = await db.getCurrentUser();
      setUser(resolvedUser);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [checkHealth]);

  useEffect(() => { 
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    initAuth(); 
  }, [initAuth]);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      try { 
        const count = await db.getUnreadCount(user.id); 
        setUnreadCount(count); 
        
        if (user.role === 'admin') {
          const subs = await db.getSubmissions();
          setPendingSubmissionsCount(subs.filter(s => s.status === 'pending' || s.status === 'event_pending').length);
        }
      } catch (e) {}
    };
    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E17] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 border-4 border-[#790BFD] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#A1A1B3] font-black uppercase tracking-[0.4em] text-[10px] mt-10">Synchronizing GRAPE Ecosystem...</p>
      </div>
    );
  }

  if (!user) return <LoginView onLoginSuccess={(manual) => initAuth(manual)} />;

  const renderContent = () => {
    const isAdmin = user.role === 'admin';
    switch (activeTab) {
      case 'Dashboard': return <DashboardOverview searchQuery={searchQuery} user={user} />;
      case 'Students': return <StudentsView searchQuery={searchQuery} user={user} />;
      case 'Challenges': return <ChallengesView searchQuery={searchQuery} user={user} />;
      case 'Messages': return <MessagesView user={user} />;
      case 'Submissions': return isAdmin ? <SubmissionsReviewView searchQuery={searchQuery} user={user} /> : <DashboardOverview searchQuery={searchQuery} user={user} />;
      case 'Vault': return user.role === 'student' ? <VaultView user={user} /> : <DashboardOverview searchQuery={searchQuery} user={user} />;
      case 'Events': return <EventsView user={user} />;
      case 'Sticker Store': return isAdmin ? <StickerStoreView searchQuery={searchQuery} /> : <DashboardOverview searchQuery={searchQuery} user={user} />;
      case 'Settings': return <SettingsView user={user} onUpdate={(u) => setUser(u)} />;
      default: return <DashboardOverview searchQuery={searchQuery} user={user} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0E0E17] text-white">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />}
      <Sidebar activeTab={activeTab} onNavigate={(tab) => { setActiveTab(tab); setIsSidebarOpen(false); }} isOpen={isSidebarOpen} user={user} pendingSubmissionsCount={pendingSubmissionsCount} />
      <main className="flex-1 md:ml-[280px] transition-all min-w-0">
        <DashboardHeader user={user} onMenuClick={() => setIsSidebarOpen(true)} searchQuery={searchQuery} onSearchChange={setSearchQuery} unreadCount={unreadCount} />
        
        {!schemaHealthy && (
          <div className="bg-red-500 text-white py-6 px-8 flex flex-col md:flex-row items-center justify-between animate-in slide-in-from-top-full duration-500 relative z-20 shadow-2xl gap-4">
            <div className="flex items-center gap-4">
              <span className="text-3xl">⚠️</span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] leading-tight">Column 'started_at' Missing</p>
                <p className="text-[9px] opacity-80 uppercase font-bold mt-1">DO NOT DELETE your database. Just run the Fix SQL below.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  const sql = "ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();";
                  navigator.clipboard.writeText(sql);
                  alert("One-Line Fix Copied! Paste it into Supabase SQL Editor and click RUN.");
                }}
                className="bg-white text-red-500 px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
              >
                Copy One-Line Fix
              </button>
              <button 
                onClick={() => checkHealth()}
                className="bg-black/20 border border-white/20 text-white px-6 py-3 rounded-2xl text-[9px] font-black uppercase transition-all"
              >
                Retry Health Check
              </button>
            </div>
          </div>
        )}

        <div className="p-4 sm:p-6 lg:p-12 max-w-[1440px] mx-auto pb-12">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
