import React from 'react';
import { UserProfile, Badge } from '../types';

interface VaultViewProps {
  user: UserProfile;
}

const VaultView: React.FC<VaultViewProps> = ({ user }) => {
  const stickers = user.badges || [];
  const bonusPoints = stickers.length * 50;

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20 max-w-[1200px] mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase mb-2">Digital Vault</h1>
          <p className="text-[#A1A1B3] font-bold">Your high-security storage for earned recognitions and elite stickers.</p>
        </div>
        <div className="px-8 py-4 bg-[#181922] border border-[#232435] rounded-[28px] text-center shadow-xl">
           <p className="text-[10px] font-black text-[#3DD598] uppercase tracking-widest mb-1">Sticker Bonus</p>
           <p className="text-3xl font-black text-white">{bonusPoints} Stars</p>
        </div>
      </header>

      {/* STICKER SHELF */}
      <section className="bg-[#181922] p-12 rounded-[56px] border border-[#232435] shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-96 h-96 bg-[#790BFD]/5 blur-[120px] rounded-full -mr-48 -mt-48"></div>
         
         <div className="flex items-center gap-4 mb-12">
            <div className="w-10 h-10 bg-[#790BFD]/10 rounded-xl flex items-center justify-center text-xl">🎖️</div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tight">Active Collection</h3>
         </div>

         {stickers.length > 0 ? (
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
             {stickers.map((badge, idx) => (
               <div key={badge.id + idx} className="group/sticker flex flex-col items-center">
                  <div 
                    className="w-32 h-32 bg-[#0E0E17] rounded-[40px] border-2 flex items-center justify-center text-5xl shadow-2xl transition-all duration-500 group-hover/sticker:-translate-y-4 group-hover/sticker:rotate-6 group-hover/sticker:scale-110 relative"
                    style={{ borderColor: `${badge.color}40`, boxShadow: `0 20px 40px ${badge.color}15` }}
                  >
                     <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/sticker:opacity-100 blur-2xl rounded-full transition-opacity"></div>
                     <span className="relative z-10 drop-shadow-2xl">{badge.icon}</span>
                  </div>
                  <h4 className="mt-6 text-xs font-black text-white uppercase tracking-widest text-center">{badge.name}</h4>
                  <p className="mt-1 text-[8px] font-black text-[#790BFD] uppercase tracking-[0.3em]">Verified Reward</p>
               </div>
             ))}
           </div>
         ) : (
           <div className="py-24 border-2 border-dashed border-[#232435] rounded-[40px] flex flex-col items-center justify-center text-center opacity-40">
              <span className="text-5xl mb-6">🔒</span>
              <h4 className="text-xl font-black text-white uppercase tracking-tight mb-2">Vault Empty</h4>
              <p className="text-sm font-medium text-[#A1A1B3] max-w-xs">Complete missions and earn approvals to unlock stickers here.</p>
           </div>
         )}
      </section>

      {/* ACQUISITION HISTORY */}
      {stickers.length > 0 && (
        <section className="space-y-6">
           <h3 className="text-[10px] font-black text-[#A1A1B3] uppercase tracking-[0.4em] px-4">Acquisition Log</h3>
           <div className="bg-[#181922] border border-[#232435] rounded-[40px] overflow-hidden shadow-xl">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-[#0E0E17] border-b border-[#232435]">
                       <th className="px-8 py-6 text-[10px] font-black text-[#4C4D5E] uppercase tracking-widest">Item</th>
                       <th className="px-8 py-6 text-[10px] font-black text-[#4C4D5E] uppercase tracking-widest">Rarity</th>
                       <th className="px-8 py-6 text-[10px] font-black text-[#4C4D5E] uppercase tracking-widest text-right">Energy Yield</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-[#232435]">
                    {stickers.map((badge, i) => (
                       <tr key={i} className="hover:bg-white/5 transition-colors">
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-4">
                                <span className="text-2xl">{badge.icon}</span>
                                <span className="text-sm font-black text-white uppercase tracking-tight">{badge.name}</span>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <span className="px-3 py-1 bg-[#790BFD]/10 text-[#790BFD] rounded-full text-[9px] font-black uppercase tracking-widest border border-[#790BFD]/20">Legendary</span>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <span className="text-sm font-black text-[#3DD598]">+50 Stars</span>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </section>
      )}
    </div>
  );
};

export default VaultView;