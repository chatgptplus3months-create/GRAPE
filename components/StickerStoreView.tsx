import React, { useState, useEffect } from 'react';
import { db, AVAILABLE_BADGES } from '../services/supabase';
import { UserProfile, Badge } from '../types';

const StickerStoreView: React.FC<{ searchQuery: string }> = ({ searchQuery }) => {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [awardingTo, setAwardingTo] = useState<UserProfile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    try {
      const [s, u] = await Promise.all([db.getAllProfiles(), db.getCurrentUser()]);
      setStudents(s.filter(p => p.role === 'student'));
      setUser(u);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAwardBadge = async (studentId: string) => {
    if (!selectedBadge) return;
    setIsProcessing(true);
    try {
      await db.awardBadge(studentId, selectedBadge.id);
      setIsProcessing(false);
      setSelectedBadge(null);
      setAwardingTo(null);
      showToast(`Success! Awarded ${selectedBadge.name} sticker! 🎖️`);
      fetchData();
    } catch (err: any) {
      showToast(`Award Error: ${err.message}`, 'error');
      setIsProcessing(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="py-24 text-center">
      <div className="w-16 h-16 border-4 border-[#790BFD] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
      <p className="text-[#790BFD] font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">Opening the Sticker Vault...</p>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[1000] px-8 py-4 rounded-3xl border shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-10 ${
          toast.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-[#3DD598]/10 border-[#3DD598]/30 text-[#3DD598]'
        }`}>
          <span className="text-xl">{toast.type === 'error' ? '⚠️' : '✅'}</span>
          <span className="text-[11px] font-black uppercase tracking-widest">{toast.message}</span>
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase mb-2">Sticker Store 🏷️</h1>
          <p className="text-[#A1A1B3] font-bold">Pick a premium sticker to reward exceptional student performance!</p>
        </div>
        <div className="px-6 py-3 bg-[#181922] border border-[#232435] rounded-2xl flex items-center gap-3">
          <span className="text-2xl">📦</span>
          <span className="text-[10px] font-black text-white uppercase tracking-widest">{AVAILABLE_BADGES.length} Designs Unlocked</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {AVAILABLE_BADGES.map((badge) => {
          const holders = students.filter(s => s.badges?.some(b => b.id === badge.id)).length;
          // Assign visual "tier" colors
          const badgeTier = holders < 2 ? 'legendary' : holders < 5 ? 'epic' : 'rare';
          
          return (
            <div 
              key={badge.id}
              onClick={() => user?.role === 'admin' && setSelectedBadge(badge)}
              className={`group bg-[#181922] p-10 rounded-[48px] border-2 transition-all cursor-pointer transform hover:-translate-y-2 relative overflow-hidden flex flex-col items-center text-center shadow-xl ${
                selectedBadge?.id === badge.id ? 'border-[#790BFD] bg-[#790BFD]/5 shadow-[#790BFD]/20' : 'border-[#232435] hover:border-[#790BFD]/50'
              }`}
            >
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none"
                style={{ backgroundColor: badge.color }}
              ></div>

              <div 
                className="w-28 h-28 rounded-[40px] flex items-center justify-center text-6xl mb-6 shadow-2xl border-2 relative"
                style={{ backgroundColor: `${badge.color}10`, borderColor: `${badge.color}40`, color: badge.color }}
              >
                <div className="absolute inset-0 bg-white/5 blur-xl rounded-full scale-50 group-hover:scale-100 transition-transform"></div>
                <span className="relative z-10 drop-shadow-lg">{badge.icon}</span>
              </div>
              
              <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">{badge.name}</h3>
              <p className="text-[#790BFD] text-[10px] font-black mb-8 uppercase tracking-[0.3em]">{badgeTier} Recognition</p>
              
              <div className="flex flex-col gap-3 w-full">
                <div className="flex items-center justify-between px-8 py-3 bg-[#0E0E17] rounded-3xl border border-[#232435]">
                   <span className="text-[9px] font-black text-[#4C4D5E] uppercase tracking-widest">Total Issued</span>
                   <span className="text-xs font-black text-white">{holders} Users</span>
                </div>
                {user?.role === 'admin' && (
                  <button className="w-full py-5 bg-[#790BFD] text-white font-black rounded-3xl text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-[#790BFD]/20 group-hover:bg-[#8d2dfd] transition-all">
                    Assign Sticker
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-in fade-in" onClick={() => setSelectedBadge(null)}>
           <div className="bg-[#181922] border border-[#232435] rounded-[56px] max-w-xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
              <div className="bg-[#0E0E17] border-b border-[#232435] p-12 text-center relative">
                 <button onClick={() => setSelectedBadge(null)} className="absolute top-8 right-8 w-12 h-12 bg-[#232435] rounded-full flex items-center justify-center text-white text-xl hover:bg-red-500 transition-all">✕</button>
                 <div className="w-24 h-24 bg-[#181922] rounded-[32px] flex items-center justify-center text-5xl mx-auto mb-6 border-2 border-[#232435] shadow-2xl">
                   {selectedBadge.icon}
                 </div>
                 <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Assign recognition</h2>
                 <p className="text-[#790BFD] font-black uppercase tracking-widest text-[10px]">Ecosystem Item: {selectedBadge.name}</p>
              </div>

              <div className="p-8 max-h-[400px] overflow-y-auto space-y-3 bg-[#11121A]">
                 {filteredStudents.map(student => {
                   const alreadyHas = student.badges?.some(b => b.id === selectedBadge.id);
                   return (
                     <div 
                      key={student.id} 
                      onClick={() => !alreadyHas && !isProcessing && setAwardingTo(student)}
                      className={`flex items-center gap-5 p-5 rounded-[32px] border transition-all ${
                        alreadyHas ? 'opacity-40 grayscale cursor-not-allowed bg-[#0E0E17]' : 
                        awardingTo?.id === student.id ? 'bg-[#790BFD]/10 border-[#790BFD] shadow-inner' : 'bg-[#0E0E17] border-[#232435] hover:border-[#790BFD]/30 cursor-pointer'
                      }`}
                     >
                        <img src={student.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.id}`} className="w-14 h-14 rounded-2xl object-cover border-2 border-[#232435]" alt="" />
                        <div className="flex-1">
                           <p className="text-base font-black text-white">{student.name}</p>
                           <p className="text-[10px] text-[#A1A1B3] uppercase font-black tracking-widest">{student.class_name || 'Member'}</p>
                        </div>
                        {alreadyHas ? (
                          <span className="text-[8px] font-black text-[#3DD598] uppercase tracking-widest bg-[#3DD598]/10 px-3 py-1.5 rounded-full border border-[#3DD598]/20">Acquired</span>
                        ) : (
                          awardingTo?.id === student.id ? <span className="text-2xl animate-pulse">🎯</span> : <div className="w-8 h-8 rounded-full border border-[#232435]"></div>
                        )}
                     </div>
                   );
                 })}
                 {filteredStudents.length === 0 && (
                   <div className="text-center py-10">
                     <p className="text-[#4C4D5E] font-black uppercase tracking-widest text-xs">No students matching "{searchQuery}"</p>
                   </div>
                 )}
              </div>

              <div className="p-10 border-t border-[#232435] flex gap-4 bg-[#0E0E17]">
                 <button 
                  onClick={() => setSelectedBadge(null)}
                  className="flex-1 py-5 text-[10px] font-black text-[#4C4D5E] uppercase tracking-widest hover:text-white transition-colors"
                 >
                   Discard Selection
                 </button>
                 <button 
                  disabled={!awardingTo || isProcessing}
                  onClick={() => awardingTo && handleAwardBadge(awardingTo.id)}
                  className="flex-[2] py-5 bg-[#790BFD] text-white font-black rounded-3xl uppercase text-xs tracking-widest shadow-2xl shadow-[#790BFD]/30 hover:scale-[1.05] active:scale-95 transition-all disabled:opacity-50"
                 >
                   {isProcessing ? 'Synchronizing Reward...' : `Assign to ${awardingTo?.name.split(' ')[0] || 'Member'}`}
                 </button>
              </div>
           </div>
        </div>
      )}

      {user?.role === 'student' && (
        <div className="bg-[#181922] p-16 rounded-[64px] border border-[#232435] text-center border-dashed relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-r from-[#790BFD]/5 via-transparent to-[#790BFD]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
           <span className="text-6xl block mb-8 animate-bounce">🏆</span>
           <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">Unlock Your Profile Deck</h3>
           <p className="text-[#A1A1B3] font-bold max-w-md mx-auto leading-relaxed">
             Stickers are awarded for exceptional performance in club missions. Complete challenges to earn your spot in the Hall of Fame.
           </p>
        </div>
      )}
    </div>
  );
};

export default StickerStoreView;