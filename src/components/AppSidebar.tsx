import React from 'react';
import { Layers, ShieldAlert, RefreshCw, ChevronRight, X, Cpu } from 'lucide-react';
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
        "border-r-[4px] border-white p-8 bg-[#0A0A0A] flex-col gap-12 relative",
        isMobileMenuOpen ? "flex fixed inset-0 z-50 w-full" : "hidden lg:flex",
        className
    )}>
       <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden absolute top-8 right-8 text-white">
         <X className="w-8 h-8" />
       </button>
       <nav className="flex flex-col gap-4 mt-12 lg:mt-0">
          {[
            { id: 'fleet', label: 'Active Agents', icon: Layers },
            { id: 'audit', label: 'Protocol Logs', icon: ShieldAlert },
            { id: 'integrations', label: 'Nerve Center', icon: Cpu }
          ].map(v => (
            <button 
              key={v.id}
              onClick={() => { setCurrentView(v.id as 'fleet' | 'audit' | 'integrations'); setIsMobileMenuOpen(false); }}
              className={cn(
                "w-full p-4 flex items-center gap-4 border-[4px] font-black uppercase text-sm transition-all brutal-shadow duration-200 hover:-translate-y-1 active:scale-95",
                currentView === v.id ? "bg-[var(--brand)] text-black border-black translate-x-2 -translate-y-1 shadow-none" : "bg-black text-white border-white hover:border-[var(--brand)]"
              )}
            >
              <v.icon className={cn("w-6 h-6 transition-transform", currentView !== v.id && "group-hover:rotate-12")} />
              {v.label}
            </button>
          ))}
       </nav>

       <div className="space-y-4">
          <label className="mono-type text-[9px] font-black text-white/50 uppercase tracking-widest block border-b border-white/20 pb-1">Fleet Persona</label>
          <div className="grid grid-cols-3 gap-2">
             {(['aggressive', 'balanced', 'passive'] as const).map(p => (
               <button 
                 key={p}
                 onClick={() => setPersona(p)}
                 className={cn(
                   "text-[8px] font-black uppercase p-2 border-2 transition-all transition-colors",
                   persona === p 
                    ? "bg-[var(--brand)] text-black border-black brutal-shadow-mini translate-x-1 -translate-y-1" 
                    : "bg-black text-white border-white/20 hover:border-white"
                 )}
               >
                 {p}
               </button>
             ))}
          </div>
       </div>

       <div className="space-y-6">
          <span className="font-display text-2xl uppercase font-black text-white border-b-2 border-white pb-2 flex items-center justify-between">
            Executive Overview
            <button onClick={generateExecutiveBriefing} className={cn("p-2 transition-transform hover:rotate-180 hover:text-[var(--brand)] duration-300 hover:scale-110", isBriefingLoading && "animate-spin text-[var(--brand)] pointer-events-none")}>
              <RefreshCw className="w-5 h-5" />
            </button>
          </span>
          <div className="p-6 bg-white border-[4px] border-black brutal-shadow-red text-black relative group text-xs overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-[var(--brand)] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
            {isBriefingLoading && <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center font-black uppercase text-[10px] animate-pulse">Syncing Agent Status...</div>}
            <p className="font-mono font-bold leading-relaxed selection:bg-black selection:text-[var(--brand)]">{briefing}</p>
            <div className="mt-4 h-8 flex items-end gap-0.5 opacity-20 group-hover:opacity-40 transition-opacity">
               {[...Array(20)].map((_, i) => (
                 <div key={i} className="flex-grow bg-black" style={{ height: `${Math.random() * 100}%` }} />
               ))}
            </div>
            <div className="mt-2 flex justify-between text-[8px] mono-type font-black uppercase opacity-50 group-hover:opacity-100 transition-opacity">
              <span>Status: {isBriefingLoading ? "Processing" : "Normal"}</span>
              <span>95% Reliable</span>
            </div>
          </div>

          {fleetIntelligence && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-5 bg-[#FF2E00] border-[4px] border-black brutal-shadow text-white relative group overflow-hidden"
            >
               <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">Fleet Neural Sync</span>
               </div>
               <p className="font-mono text-[11px] font-black leading-tight uppercase italic relative z-10 selection:bg-white selection:text-[#FF2E00]">{fleetIntelligence}</p>
               <div className="absolute -bottom-4 -right-4 p-2 opacity-5 rotate-12">
                  <Cpu className="w-20 h-20" />
               </div>
               <div className="absolute top-0 right-0 p-2 opacity-20">
                  <span className="text-[8px] font-mono">INTEL_NODE_SHARING</span>
               </div>
            </motion.div>
          )}
       </div>

       <div className="hidden lg:block space-y-4">
           <span className="mono-type text-[10px] font-black text-[#D4FF00] uppercase tracking-widest border-b border-[#D4FF00]/30 pb-1 block flex items-center justify-between">
              Hardware Status
              <div className="flex gap-1">
                 <div className="w-1 h-3 bg-[#D4FF00] animate-[pulse_1s_infinite_0ms]" />
                 <div className="w-1 h-3 bg-[#D4FF00] animate-[pulse_1s_infinite_200ms]" />
                 <div className="w-1 h-3 bg-[#D4FF00] animate-[pulse_1s_infinite_400ms]" />
              </div>
           </span>
           <div className="grid grid-cols-2 gap-2 text-[9px] font-mono uppercase">
                <div className="border border-white/10 p-2 bg-white/5 flex flex-col gap-1 hover:bg-white/10 transition-colors group">
                   <span className="opacity-40 group-hover:opacity-60 text-[7px]">Core Load</span>
                   <span className="font-bold text-white tracking-widest shadow-sm">{coreLoad}%</span>
                </div>
                <div className="border border-white/10 p-2 bg-white/5 flex flex-col gap-1 hover:bg-white/10 transition-colors group">
                   <span className="opacity-40 group-hover:opacity-60 text-[7px]">Mem Sync</span>
                   <span className="font-bold text-white tracking-widest">{memSync}</span>
                </div>
                <div className="border border-white/10 p-2 bg-white/5 flex flex-col gap-1 hover:bg-white/10 transition-colors group">
                   <span className="opacity-40 group-hover:opacity-60 text-[7px]">AI Latency</span>
                   <span className="font-bold text-white tracking-widest">{latency}ms</span>
                </div>
                <div className="border border-white/10 p-2 bg-white/5 flex flex-col gap-1 hover:bg-white/10 transition-colors group">
                   <span className="opacity-40 group-hover:opacity-60 text-[7px]">Grid Pwr</span>
                   <span className="font-bold text-white tracking-widest">{power}</span>
                </div>
           </div>
           
           <div className="mt-4 p-4 border-[3px] border-white/10 bg-black brutal-shadow-mini">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-[8px] font-black uppercase text-white/40">Neural Link</span>
                 <span className="text-[8px] font-black uppercase text-[#D4FF00]">Active</span>
              </div>
              <div className="w-full h-1 bg-white/10 overflow-hidden relative">
                 <motion.div 
                   animate={{ x: ["-100%", "100%"] }}
                   transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                   className="absolute top-0 left-0 h-full w-20 bg-gradient-to-r from-transparent via-[#D4FF00] to-transparent"
                 />
              </div>
           </div>
        </div>

       <div className="mt-auto pt-10 border-t border-white/10">
          <form onSubmit={handleGlobalDirectiveSubmit} className="space-y-4">
            <label className="mono-type text-[9px] font-black text-white/50 uppercase">Operational Constraint</label>
            <div className="relative group brutal-shadow hover:translate-x-1 hover:-translate-y-1 transition-transform group-focus-within:-translate-y-1">
               <input 
                 name="directive"
                 defaultValue={globalDirective}
                 placeholder="e.g. Prioritize data security..."
                 className="w-full bg-black border-2 border-white p-3 pl-8 mono-type text-[10px] text-white focus:border-[var(--brand)] focus:outline-none transition-colors"
               />
               <ChevronRight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white group-focus-within:text-[var(--brand)] group-focus-within:translate-x-1 transition-all" />
            </div>
          </form>
       </div>
    </aside>
  );
};
