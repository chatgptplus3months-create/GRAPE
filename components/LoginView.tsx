
import React, { useState, useEffect } from 'react';
import { db } from '../services/supabase';
import BrandLogo from './BrandLogo';

interface LoginViewProps {
  onLoginSuccess: (manualUser?: any) => Promise<void>;
}

const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  const [formData, setFormData] = useState({ email: '', password: '' });

  useEffect(() => {
    db.verifyDatabase().then(healthy => setDbStatus(healthy ? 'online' : 'offline'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setError(null);

    let inputEmail = formData.email.toLowerCase().trim();
    const inputPassword = formData.password.trim();

    // User-friendly helper: if they just type "name", we assume "@grape.com"
    if (inputEmail && !inputEmail.includes('@')) {
      inputEmail = `${inputEmail}@grape.com`;
    }

    try {
      const profile = await db.attemptLogin(inputEmail, inputPassword);
      await onLoginSuccess(profile);
    } catch (err: any) {
      setError(err.message || "Access denied.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E17] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background visual glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#790BFD]/10 blur-[160px] rounded-full"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#3DD598]/5 blur-[160px] rounded-full"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
           <BrandLogo size={70} className="mb-6 mx-auto" />
           <div className="flex items-center justify-center gap-2">
              <div className={`w-1 h-1 rounded-full ${dbStatus === 'online' ? 'bg-[#3DD598]' : 'bg-red-500 animate-pulse'}`}></div>
              <p className="text-[#4C4D5E] font-black uppercase tracking-[0.4em] text-[8px]">
                {dbStatus === 'online' ? 'Ecosystem Linked' : 'System Offline'}
              </p>
           </div>
        </div>

        <div className="bg-[#181922]/95 border border-[#232435] rounded-[48px] p-8 md:p-10 shadow-[0_40px_100px_rgba(0,0,0,0.6)] backdrop-blur-3xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input 
                required 
                type="text" 
                placeholder="EMAIL OR USERNAME" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                className="w-full bg-[#0E0E17] border border-[#232435] rounded-3xl py-5 px-8 text-white font-black outline-none focus:border-[#790BFD] transition-all text-[10px] tracking-widest placeholder-[#2D2E3B]" 
              />
            </div>
            
            <div className="relative">
              <input 
                required 
                type={showPassword ? "text" : "password"} 
                placeholder="PASSWORD" 
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
                className="w-full bg-[#0E0E17] border border-[#232435] rounded-3xl py-5 px-8 text-white font-black outline-none focus:border-[#790BFD] transition-all text-[10px] tracking-widest placeholder-[#2D2E3B]" 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-[#2D2E3B] hover:text-[#790BFD] transition-colors"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-[8px] font-black uppercase tracking-widest text-red-500 text-center">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-5 bg-[#790BFD] text-white rounded-3xl font-black uppercase text-[10px] tracking-[0.3em] shadow-xl hover:bg-[#8d2dfd] active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'SYNCING...' : 'LOGIN'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[7px] font-bold text-[#232435] uppercase tracking-[0.8em]">
              AUTHORIZED ACCESS ONLY
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
