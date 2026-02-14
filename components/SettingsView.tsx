
import React, { useState, useEffect } from 'react';
import { db } from '../services/supabase';
import { UserProfile } from '../types';

const AVATAR_COLLECTION = [
  { id: 'av-17', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gaya' },
  { id: 'av-1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
  { id: 'av-2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka' },
  { id: 'av-3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia' },
  { id: 'av-5', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James' }
];

interface SettingsViewProps {
  user: UserProfile;
  onUpdate: (updatedUser: UserProfile) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, onUpdate }) => {
  const [saving, setSaving] = useState(false);
  const [dbHealthy, setDbHealthy] = useState<boolean | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [formData, setFormData] = useState({
    name: user.name || '',
    class_name: user.class_name || '',
    skill_level: user.skill_level || '',
    avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
  });

  const isAdmin = user.role === 'admin';

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    db.verifySchemaHealth().then(setDbHealthy);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedUser = await db.updateProfile(user.id, formData);
      onUpdate(updatedUser);
      showToast('Profile Synchronized! 🍇');
    } catch (err: any) {
      showToast(`Sync Failed: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLinkPaidKey = async () => {
    try {
      // @ts-ignore
      if (window.aistudio && window.aistudio.openSelectKey) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        showToast("Neural link updated. Refreshing ecosystem...", "info");
        setTimeout(() => window.location.reload(), 2000);
      } else {
        showToast("AI Studio selector not available in this environment.", "error");
      }
    } catch (e) {
      showToast("Link process aborted.", "error");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in slide-in-from-bottom-6 duration-700 pb-20 relative px-4">
      {toast && (
        <div className={`fixed bottom-12 left-1/2 -translate-x-1/2 z-[1000] px-8 py-4 border rounded-full shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-12 backdrop-blur-3xl ${
          toast.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 
          toast.type === 'info' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-[#3DD598]/10 border-[#3DD598]/30 text-[#3DD598]'
        }`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            toast.type === 'error' ? 'bg-red-500' : toast.type === 'info' ? 'bg-blue-400' : 'bg-[#3DD598]'
          }`}></div>
          <span className="text-[10px] font-black text-white uppercase tracking-widest">{toast.message}</span>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-5xl font-black text-white uppercase tracking-tighter mb-2">Hub Identity</h1>
          <p className="text-[#A1A1B3] font-bold text-sm">Configure your connection and profile data.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Profile Card */}
        <form onSubmit={handleSave} className="lg:col-span-8 bg-[#181922] border border-[#232435] rounded-[48px] p-8 md:p-12 shadow-2xl space-y-10">
          <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
            <div className="shrink-0">
               <div className="w-32 h-32 rounded-[32px] overflow-hidden border-2 border-[#232435] bg-[#0E0E17] shadow-xl">
                  <img src={formData.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
               </div>
            </div>
            <div className="flex-1 space-y-4">
               <h3 className="text-xl font-black text-white uppercase tracking-tight text-center md:text-left">Node Avatar</h3>
               <div className="grid grid-cols-5 gap-3">
                 {AVATAR_COLLECTION.map(avatar => (
                   <button 
                    key={avatar.id}
                    type="button"
                    onClick={() => setFormData({...formData, avatar_url: avatar.url})}
                    className={`aspect-square rounded-xl border-2 overflow-hidden transition-all hover:scale-105 ${formData.avatar_url === avatar.url ? 'border-[#790BFD] shadow-lg' : 'border-[#232435]'}`}
                   >
                     <img src={avatar.url} className="w-full h-full object-cover" />
                   </button>
                 ))}
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 pt-8 border-t border-[#232435]">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-[#790BFD] uppercase tracking-widest px-4">Full Name</label>
               <input 
                 required
                 value={formData.name} 
                 onChange={e => setFormData({...formData, name: e.target.value})} 
                 className="w-full bg-[#0E0E17] border border-[#232435] rounded-3xl py-5 px-8 text-white text-base font-bold outline-none focus:border-[#790BFD] transition-all shadow-inner" 
               />
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black text-[#3DD598] uppercase tracking-widest px-4">
                 {isAdmin ? 'Hub Designation' : 'Academy Grade'}
               </label>
               <input 
                 required
                 value={isAdmin ? formData.skill_level : formData.class_name} 
                 onChange={e => isAdmin ? setFormData({...formData, skill_level: e.target.value}) : setFormData({...formData, class_name: e.target.value})} 
                 className="w-full bg-[#0E0E17] border border-[#232435] rounded-3xl py-5 px-8 text-white text-base font-bold outline-none focus:border-[#3DD598] transition-all" 
               />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="w-full py-6 bg-[#790BFD] text-white rounded-[32px] font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-[#8d2dfd] transition-all disabled:opacity-50"
          >
            {saving ? 'Syncing...' : 'Update Node Profile'}
          </button>
        </form>

        {/* System Status Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#181922] border border-[#232435] rounded-[48px] p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#790BFD]/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
            <h3 className="text-[11px] font-black text-[#A1A1B3] uppercase tracking-[0.4em] mb-10 flex items-center gap-4">
              <span className="w-2 h-2 rounded-full bg-[#790BFD]"></span>
              Neural Link Diagnostics
            </h3>
            
            <div className="space-y-6">
                <div className="p-6 bg-[#0E0E17] rounded-[32px] border border-[#232435]">
                  <p className="text-[10px] font-bold text-white uppercase tracking-widest mb-2">Gemini API Status</p>
                  <p className="text-[8px] font-medium text-[#A1A1B3] leading-relaxed mb-4">
                    Note: Your personal <span className="text-[#790BFD]">Gemini Advanced</span> subscription does NOT cover this API. You must use a Google Cloud project with billing enabled.
                  </p>
                  <button 
                    onClick={handleLinkPaidKey}
                    className="w-full py-4 bg-[#790BFD]/10 text-[#790BFD] border border-[#790BFD]/20 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-[#790BFD] hover:text-white transition-all"
                  >
                    Sync Paid Project ⚡
                  </button>
                  <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="block text-center text-[7px] text-[#4C4D5E] mt-3 hover:text-white uppercase tracking-widest">View Billing Docs ↗</a>
                </div>

                <div className="p-6 bg-[#0E0E17] rounded-[32px] border border-[#232435]">
                  <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] font-black text-[#4C4D5E] uppercase tracking-widest">Registry Sync</span>
                      <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${dbHealthy ? 'bg-[#3DD598]/10 text-[#3DD598]' : 'bg-red-500/10 text-red-500'}`}>
                        {dbHealthy ? 'Synced' : 'Error'}
                      </div>
                  </div>
                  <p className="text-[8px] font-medium text-[#4C4D5E] mt-1 leading-tight">Identity data lives in 'public.profiles' table.</p>
                </div>
            </div>

            {!dbHealthy && (
              <div className="mt-8 p-6 bg-red-500/5 border border-red-500/20 rounded-[32px] space-y-4">
                  <p className="text-[9px] font-black text-red-500 uppercase tracking-widest text-center">DATABASE REPAIR REQUIRED</p>
                  <button 
                    onClick={() => {
                      const sql = "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS passkey TEXT; ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS awarded_badge_id TEXT;";
                      navigator.clipboard.writeText(sql);
                      alert("SQL Copied. Paste in Supabase SQL Editor and click RUN.");
                    }}
                    className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest"
                  >
                    Copy Fix SQL
                  </button>
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="bg-[#181922] border border-[#3DD598]/20 rounded-[48px] p-10 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-[#3DD598]/5 blur-3xl rounded-full"></div>
               <h3 className="text-[11px] font-black text-[#3DD598] uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
                 Deployment Guide
               </h3>
               <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-5 h-5 rounded-full bg-[#3DD598]/10 flex items-center justify-center text-[10px] font-bold text-[#3DD598] shrink-0 border border-[#3DD598]/20">1</div>
                    <p className="text-[10px] font-medium text-[#A1A1B3] leading-relaxed">Ensure <span className="text-white">API_KEY</span> is set in your Vercel project settings.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-5 h-5 rounded-full bg-[#3DD598]/10 flex items-center justify-center text-[10px] font-bold text-[#3DD598] shrink-0 border border-[#3DD598]/20">2</div>
                    <p className="text-[10px] font-medium text-[#A1A1B3] leading-relaxed">Verify all <span className="text-white">schema.sql</span> tables are created in Supabase.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-5 h-5 rounded-full bg-[#3DD598]/10 flex items-center justify-center text-[10px] font-bold text-[#3DD598] shrink-0 border border-[#3DD598]/20">3</div>
                    <p className="text-[10px] font-medium text-[#A1A1B3] leading-relaxed">Set your student's first <span className="text-white">passkey</span> in the Hall of Fame.</p>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
