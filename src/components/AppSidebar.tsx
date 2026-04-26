import React from 'react';
import { Layers, ShieldAlert, RefreshCw, ChevronRight, X, Cpu, Terminal, CircleDot } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface AppSidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  currentView: 'fleet' | 'audit' | 'integrations';
  setCurrentView: (view: 'fleet' | 'audit' | 'integrations') => void;
  isBriefingLoading: boolean;
  briefing: string;
  generateExecutiveBriefing: () => void;
  globalDirective: string;
  handleGlobalDirectiveSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  persona: 'aggressive' | 'passive' | 'balanced';
  setPersona: (p: 'aggressive' | 'passive' | 'balanced') => void;
  fleetIntelligence?: string;
  bots: any[];
  className?: string;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  currentView,
  setCurrentView,
  isBriefingLoading,
  briefing,
  generateExecutiveBriefing,
  globalDirective,
  handleGlobalDirectiveSubmit,
  persona,
  setPersona,
  fleetIntelligence,
  bots,
  className
}) => {
  const coreLoad = bots.filter(b => b.status === 'online').length * 15 + 5;
  const memSync = bots.some(b => b.status === 'online') ? "Active" : "Idle";
  const latency = bots.some(b => b.status === 'online') ? Math.floor(Math.random() * 20) + 15 : 0;
  const power = bots.some(b => b.status === 'online') ? "Stable" : "Standby";

  return (
    <aside className={cn(
        "border-r border-white/10 px-8 py-12 bg-[#020202] flex-col gap-16 relative overflow-y-auto custom-scrollbar",
        isMobileMenuOpen ? "flex fixed inset-0 z-50 w-full" : "hidden lg:flex",
        className
    )}>
       <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden absolute top-10 right-10 text-white/40 hover:text-white transition-colors">
         <X className="w-10 h-10" />
       </button>
       
       <div className="flex flex-col gap-4">
          <span className="mono-type text-[10px] font-black text-[var(--brand)] uppercase tracking-[0.5em] mb-4 italic opacity-80">Command Suite v3.2</span>
          <nav className="flex flex-col gap-2">
             {[
               { id: 'fleet', label: 'Nodes', icon: Layers },
               { id: 'audit', label: 'Intelligence', icon: ShieldAlert },
               { id: 'integrations', label: 'Grid_Mesh', icon: Cpu }
             ].map(v => (
               <button 
                 key={v.id}
                 onClick={() => { setCurrentView(v.id as any); setIsMobileMenuOpen(false); }}
                 className={cn(
                   "w-full px-6 py-5 flex items-center justify-between border-b border-white/5 font-display font-black uppercase text-lg transition-all duration-500 relative group overflow-hidden",
                   currentView === v.id 
                    ? "text-[var(--brand)] italic translate-x-2" 
                    : "text-white/20 hover:text-white hover:border-white/20"
                 )}
               >
                 <div className="flex items-center gap-6 relative z-10">
                    <v.icon className={cn("w-6 h-6 transition-all duration-700", currentView === v.id ? "rotate-0 scale-110" : "group-hover:rotate-12 opacity-40 group-hover:opacity-100")} />
                    <span>{v.label}</span>
                 </div>
                 <ChevronRight className={cn("w-5 h-5 transition-all duration-500 relative z-10", currentView === v.id ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8 group-hover:opacity-100 group-hover:translate-x-0")} />
                 {currentView === v.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[var(--brand)] blur-[2px]" />
                 )}
               </button>
             ))}
          </nav>
       </div>

       <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
             <label className="mono-type text-[9px] font-black text-white/20 uppercase tracking-[0.3em] italic">Strat_Matrix</label>
             <div className="w-8 h-[1px] bg-white/10" />
          </div>
          <div className="grid grid-cols-1 gap-px bg-white/5 border border-white/5">
             {(['aggressive', 'balanced', 'passive'] as const).map(p => (
               <button 
                 key={p}
                 onClick={() => setPersona(p)}
                 className={cn(
                   "text-[9px] font-black uppercase py-4 transition-all duration-500 relative overflow-hidden",
                   persona === p 
                    ? "bg-white text-black italic px-8" 
                    : "text-white/20 hover:text-white hover:bg-white/5 px-6"
                 )}
               >
                 {persona === p && <div className="absolute left-0 inset-y-0 w-2 bg-[var(--brand)]" />}
                 {p}
               </button>
             ))}
          </div>
       </div>

       <div className="space-y-6">
          <div className="flex items-center justify-between group">
             <h3 className="font-display text-lg uppercase font-black text-white tracking-widest italic flex items-center gap-2">
                <span className="w-2 h-2 bg-[var(--brand)] animate-pulse" />
                Situational Intel
             </h3>
             <button onClick={generateExecutiveBriefing} className={cn("p-2 text-white/40 hover:text-[var(--brand)] transition-all duration-500", isBriefingLoading && "animate-spin text-[var(--brand)]")}>
               <RefreshCw className="w-4 h-4" />
             </button>
          </div>
          
          <div className="bg-[#0A0A0A] border-2 border-white/10 p-6 relative group brutal-shadow-white transition-all duration-500 overflow-hidden">
            {isBriefingLoading && (
               <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-10 flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-1 bg-[var(--brand)] animate-[loading_2s_infinite]" />
                  <span className="mono-type text-[8px] font-black uppercase text-[var(--brand)] animate-pulse">Decrypting...</span>
               </div>
            )}
            <p className="mono-type text-[11px] font-bold leading-relaxed text-white/70 group-hover:text-white transition-colors selection:bg-[var(--brand)] selection:text-black">
               {briefing}
            </p>
            <div className="mt-6 flex items-end gap-1 opacity-10 group-hover:opacity-20 transition-opacity h-12">
               {[...Array(12)].map((_, i) => (
                 <div key={i} className="flex-grow bg-white" style={{ height: `${Math.random() * 100}%` }} />
               ))}
            </div>
          </div>

          {fleetIntelligence && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-[var(--accent)] border-2 border-black brutal-shadow-white text-white relative group"
            >
               <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                     <ShieldAlert className="w-4 h-4" />
                     <span className="mono-type text-[9px] font-black uppercase tracking-widest">Global Patch</span>
                  </div>
                  <Cpu className="w-4 h-4 opacity-40" />
               </div>
               <p className="mono-type text-[11px] font-black leading-tight uppercase italic selection:bg-white selection:text-[var(--accent)]">
                  {fleetIntelligence}
               </p>
            </motion.div>
          )}
       </div>

       <div className="space-y-4">
           <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="mono-type text-[9px] font-black text-white/30 uppercase tracking-widest">Hardware Grid</span>
              <div className="flex gap-1">
                 <div className="w-1 h-2 bg-[var(--brand)] animate-[pulse_0.8s_infinite_0ms]" />
                 <div className="w-1 h-2 bg-[var(--brand)] animate-[pulse_0.8s_infinite_200ms]" />
                 <div className="w-1 h-2 bg-[var(--brand)] animate-[pulse_0.8s_infinite_400ms]" />
              </div>
           </div>
           <div className="grid grid-cols-2 gap-px bg-white/10 border border-white/10">
                {[
                  { label: "Core Node", val: `${coreLoad}%` },
                  { label: "Neural Net", val: memSync },
                  { label: "Ping", val: `${latency}ms` },
                  { label: "Energy", val: power }
                ].map((stat, i) => (
                  <div key={i} className="bg-[#050505] p-3 flex flex-col gap-1 hover:bg-white/5 transition-colors">
                     <span className="text-[7px] font-black uppercase text-white/20 tracking-tighter">{stat.label}</span>
                     <span className="mono-type text-[11px] font-black text-white italic">{stat.val}</span>
                  </div>
                ))}
           </div>
           
           <div className="mt-4 h-1 w-full bg-white/5 overflow-hidden">
              <motion.div 
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="h-full w-32 bg-white/20"
              />
           </div>
        </div>

       <div className="mt-auto pt-10">
          <form onSubmit={handleGlobalDirectiveSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
               <label className="mono-type text-[9px] font-black text-white/30 uppercase tracking-widest">Global Protocol</label>
               <CircleDot className="w-2 h-2 text-[var(--brand)] animate-pulse" />
            </div>
            <div className="relative group">
               <input 
                 name="directive"
                 defaultValue={globalDirective}
                 placeholder="BROADCAST COMMAND..."
                 className="w-full bg-[#0A0A0A] border-2 border-white/10 px-5 py-4 mono-type text-[10px] text-white focus:border-white focus:bg-white focus:text-black focus:outline-none transition-all placeholder:text-white/10"
               />
               <div className="absolute top-0 right-0 h-full px-4 flex items-center pointer-events-none text-white/10 group-focus-within:text-black">
                  <Terminal className="w-4 h-4" />
               </div>
            </div>
          </form>
       </div>
    </aside>
  );
};
