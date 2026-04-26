import React from 'react';
import { motion } from 'motion/react';
import { Layers, Settings, LogOut } from 'lucide-react';
import { User } from 'firebase/auth';
import { Bot } from '../types';

interface AppHeaderProps {
  user: User;
  bots: Bot[];
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  setIsSettingsOpen: (open: boolean) => void;
  logout: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ 
  user, 
  bots, 
  isMobileMenuOpen, 
  setIsMobileMenuOpen, 
  setIsSettingsOpen,
  logout 
}) => {
  const totalObjectivesMet = bots.reduce((acc, curr) => acc + (curr.config?.winCount || 0), 0);

  return (
    <header className="z-10 bg-[#020202] text-white border-b border-white/10 relative overflow-hidden">
      {/* Dynamic Digital Header Strip */}
      <div className="bg-[var(--brand)] text-black py-1.5 overflow-hidden whitespace-nowrap flex border-b border-black select-none">
         <motion.div 
           initial={{ x: "0%" }}
           animate={{ x: "-50%" }}
           transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
           className="flex gap-20 font-mono text-[8px] font-black uppercase tracking-[0.3em] pointer-events-none"
         >
            {[...Array(12)].map((_, i) => (
               <React.Fragment key={i}>
                  <div className="flex items-center gap-6">
                     <span className="opacity-40">SIGNAL: NOMINAL</span>
                     <div className="w-1 h-1 bg-black rounded-full" />
                     <span>SYS_INTEGRITY: 100%</span>
                     <div className="w-1 h-1 bg-black rounded-full" />
                     <span className="opacity-40">GRID: SYNCED</span>
                  </div>
               </React.Fragment>
            ))}
         </motion.div>
         <motion.div 
           initial={{ x: "0%" }}
           animate={{ x: "-50%" }}
           transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
           className="flex gap-20 font-mono text-[8px] font-black uppercase tracking-[0.3em] pointer-events-none"
         >
            {[...Array(12)].map((_, i) => (
               <React.Fragment key={i}>
                  <div className="flex items-center gap-6">
                     <span className="opacity-40">SIGNAL: NOMINAL</span>
                     <div className="w-1 h-1 bg-black rounded-full" />
                     <span>SYS_INTEGRITY: 100%</span>
                     <div className="w-1 h-1 bg-black rounded-full" />
                     <span className="opacity-40">GRID: SYNCED</span>
                  </div>
               </React.Fragment>
            ))}
         </motion.div>
      </div>

      <div className="px-10 py-12 lg:px-14 lg:py-16 relative group">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-white/2 skew-x-[30deg] translate-x-1/4 pointer-events-none group-hover:bg-white/5 transition-colors duration-1000" />
        
        <div className="flex flex-col lg:flex-row justify-between items-end relative z-10 gap-12">
           <div className="flex flex-col gap-8 w-full lg:w-auto">
              <div className="flex items-center gap-8">
                 <div className="flex flex-col">
                    <span className="mono-type text-[9px] font-black uppercase text-[var(--brand)] mb-2 tracking-[0.4em] italic opacity-80">Operational Pulse</span>
                    <div className="flex items-center gap-4">
                       <motion.div 
                          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="w-2 h-2 bg-[var(--brand)]" 
                       />
                       <span className="display-type text-2xl font-black italic tabular-nums tracking-tighter">00:24:14:92</span>
                    </div>
                 </div>
                 <div className="h-10 w-px bg-white/10" />
                 <div className="flex flex-col">
                    <span className="mono-type text-[9px] font-black uppercase text-white/20 mb-2 tracking-[0.4em] italic">Fleet Efficiency</span>
                    <span className="display-type text-2xl font-black italic tabular-nums tracking-tighter text-white/40">98.2%</span>
                 </div>
              </div>
              <h1 className="display-type text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-none text-white italic group-hover:not-italic transition-all duration-1000">
                 BEAST BOTS
              </h1>
           </div>

           <div className="flex flex-col items-end gap-8 w-full lg:w-auto">
              <div className="flex items-center gap-4">
                 <div className="flex flex-col items-end">
                    <span className="mono-type text-[9px] font-black uppercase text-white/10 tracking-[0.3em]">Auth Operator</span>
                    <span className="display-type text-xl font-black uppercase italic text-white/40 hover:text-white transition-colors duration-500">{user.email?.split('@')[0]}</span>
                 </div>
                 <div className="w-14 h-14 border border-white/10 flex items-center justify-center p-1 group-hover:border-[var(--brand)]/30 transition-colors duration-1000 relative">
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-[var(--brand)] scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
                    <div className="w-full h-full bg-white/5" />
                 </div>
              </div>

              <div className="flex gap-3">
                 <button 
                   onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                   className="lg:hidden w-14 h-14 border border-white/10 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all"
                 >
                   <Layers className="w-6 h-6" />
                 </button>
                 <button 
                   onClick={() => setIsSettingsOpen(true)}
                   className="w-14 h-14 border border-white/10 text-white flex items-center justify-center hover:bg-[var(--brand)] hover:text-black hover:border-[var(--brand)] transition-all group/btn relative" 
                 >
                   <Settings className="w-6 h-6 group-hover/btn:rotate-180 transition-transform duration-1000" />
                 </button>
                 <button 
                   onClick={logout} 
                   className="w-14 h-14 border border-white/10 text-white/40 flex items-center justify-center hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-all group/btn" 
                 >
                   <LogOut className="w-6 h-6 group-hover/btn:-translate-x-1 transition-transform" />
                 </button>
              </div>
           </div>
        </div>
      </div>
    </header>
  );
};
