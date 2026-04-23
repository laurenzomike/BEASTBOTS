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
    <header className="z-10 bg-[var(--brand)] text-black relative overflow-hidden">
      {/* Live Ticker Strip */}
      <div className="bg-black text-[var(--brand)] py-1 overflow-hidden whitespace-nowrap border-b-2 border-black flex">
         <motion.div 
           initial={{ x: "0%" }}
           animate={{ x: "-50%" }}
           transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
           className="flex gap-12 font-mono text-[8px] font-black uppercase tracking-widest pointer-events-none pr-12"
         >
            {[...Array(10)].map((_, i) => (
               <React.Fragment key={i}>
                  <span>// FLEET_STATUS: NOMINAL</span>
                  <span>// AI_READY: 100%</span>
                  <span>// LATENCY: 24MS</span>
                  <span>// UPTIME: 99.98%</span>
                  <span>// LOAD: BALANCED</span>
                  <span>// PROTOCOL: EXTREME_GROWTH</span>
               </React.Fragment>
            ))}
         </motion.div>
         <motion.div 
           initial={{ x: "0%" }}
           animate={{ x: "-50%" }}
           transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
           className="flex gap-12 font-mono text-[8px] font-black uppercase tracking-widest pointer-events-none pr-12"
         >
            {[...Array(10)].map((_, i) => (
               <React.Fragment key={i}>
                  <span>// FLEET_STATUS: NOMINAL</span>
                  <span>// AI_READY: 100%</span>
                  <span>// LATENCY: 24MS</span>
                  <span>// UPTIME: 99.98%</span>
                  <span>// LOAD: BALANCED</span>
                  <span>// PROTOCOL: EXTREME_GROWTH</span>
               </React.Fragment>
            ))}
         </motion.div>
      </div>

      <div className="p-6 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rotate-45 translate-x-32 -translate-y-32 pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-end relative z-10">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 mb-2">
             <div className="w-4 h-4 bg-[#FF2E00] brutal-shadow-red animate-pulse border-2 border-black" />
             <span className="mono-type text-[10px] font-black uppercase bg-black px-2 py-1 text-white">System Online</span>
             <span className="mono-type text-[10px] font-black uppercase bg-[var(--accent)] px-2 py-1 text-white">
                {totalObjectivesMet} Objectives Met
             </span>
          </div>
          <h1 className="display-type text-4xl sm:text-5xl md:text-[8vw] font-black uppercase tracking-tighter leading-none text-black">Bot Boss</h1>
        </div>
        <div className="mt-8 md:mt-0 flex flex-col items-end gap-2">
           <span className="mono-type text-xs font-black uppercase bg-black text-white px-3 py-1">User: {user.email?.split('@')[0]}</span>
           <div className="flex gap-4">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                className="lg:hidden p-2 border-4 border-black"
                title="Toggle Menu"
              >
                <Layers className="w-8 h-8" />
              </button>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                title="Settings" 
                className="p-2 border-4 border-black hover:bg-black hover:text-white transition-all"
              >
                <Settings className="w-8 h-8" />
              </button>
              <button 
                onClick={logout} 
                title="Logout" 
                className="p-2 border-4 border-black text-red-600 hover:bg-red-600 hover:text-white transition-all"
              >
                <LogOut className="w-8 h-8" />
              </button>
           </div>
        </div>
        </div>
      </div>
    </header>
  );
};
