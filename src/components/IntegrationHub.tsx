import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Key, ShieldCheck, ShieldAlert, CheckCircle, RefreshCw, Layers, ExternalLink, Cpu, Trash2, Plus, Search, Filter, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { BOT_TYPES } from '../constants';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Bot } from '../types';

interface IntegrationHubProps {
  bots: Bot[];
  handleConnect: (type: string, authType: string) => void;
  deployNewBot: (typeId: string) => void;
}

export const IntegrationHub: React.FC<IntegrationHubProps> = ({ bots, handleConnect, deployNewBot }) => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'connected' | 'unlinked'>('all');
  const [showDeployModal, setShowDeployModal] = useState(false);

  const platforms = BOT_TYPES.map(type => {
    const instances = bots.filter(b => b.type === type.id);
    const isConnected = instances.some(b => b.status !== 'auth-required');
    return {
      ...type,
      instances,
      isConnected
    };
  });

  const filteredPlatforms = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    return platforms.filter(p => {
      if (activeTab === 'connected' && !p.isConnected) return false;
      if (activeTab === 'unlinked' && p.isConnected) return false;
      return p.name.toLowerCase().includes(lowerSearch) || p.role.toLowerCase().includes(lowerSearch);
    });
  }, [platforms, search, activeTab]);

  return (
    <div className="p-8 lg:p-14 space-y-16 animate-in fade-in slide-in-from-bottom-6 duration-1000 max-w-screen-2xl mx-auto overflow-hidden">
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-12 border-b-2 border-white/10 pb-16 relative">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-[var(--brand)] blur-[150px] opacity-10 pointer-events-none" />
        <div className="space-y-8 relative z-10 w-full xl:w-2/3">
          <div className="flex items-center gap-4">
             <div className="w-3 h-3 bg-[var(--brand)] animate-pulse" />
             <span className="mono-type text-[10px] font-black uppercase text-[var(--brand)] tracking-[0.5em]">Network Infrastructure v3.1</span>
          </div>
          <h1 className="display-type text-5xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.8] text-white">
            NERVE <br /> <span className="text-white/20 italic group-hover:text-white transition-colors duration-700">CENTER</span>
          </h1>
          <p className="mono-type text-[13px] font-medium text-white/40 max-w-xl leading-relaxed italic border-l-2 border-[var(--brand)]/20 pl-6">
            Centralized authentication and pipeline management for the entire fleet integration layer. 
            Authorize target platforms to enable autonomous agent deployment and neural context sharing.
          </p>
        </div>

        <div className="flex flex-col gap-6 w-full xl:w-1/3">
           <div className="relative group">
              <input 
                type="text" 
                placeholder="PROBE NETWORK..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#0A0A0A] border-2 border-white/10 p-6 mono-type text-[11px] text-white focus:border-white focus:bg-white focus:text-black outline-none transition-all placeholder:text-white/10"
              />
              <Search className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/10 group-focus-within:text-black" />
           </div>
           <div className="grid grid-cols-3 gap-px bg-white/10 border border-white/10 p-px">
              {(['all', 'connected', 'unlinked'] as const).map(t => (
                <button 
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={cn(
                    "py-3 text-[9px] font-black uppercase transition-all duration-300",
                    activeTab === t ? "bg-white text-black" : "bg-[#050505] text-white/40 hover:text-white hover:bg-white/5"
                  )}
                >
                  {t}
                </button>
              ))}
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-white/10 border border-white/10">
        {filteredPlatforms.map((p, idx) => (
          <motion.div 
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={cn(
              "p-12 flex flex-col justify-between group transition-all duration-500 relative overflow-hidden h-[480px]",
              p.isConnected ? "bg-white" : "bg-[#050505] hover:bg-[#0A0A0A]"
            )}
          >
            {/* Background Grain */}
            <div className={cn(
              "absolute inset-0 opacity-[0.03] pointer-events-none group-hover:opacity-[0.06] transition-opacity duration-700",
              p.isConnected ? "bg-black" : "bg-white"
            )} style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }} />

            <div className="relative z-10 h-full flex flex-col">
              <div className="flex justify-between items-start mb-12">
                <div className={cn(
                  "w-16 h-16 border-2 flex items-center justify-center transition-all duration-500",
                  p.isConnected ? "bg-black text-[var(--brand)] border-black" : "bg-white/5 text-white/20 border-white/10"
                )}>
                  <Cpu className="w-8 h-8" />
                </div>
                <div className={cn(
                  "px-4 py-2 text-[10px] font-black uppercase italic border-2 flex items-center gap-3 transition-all duration-500",
                  p.isConnected ? "bg-[var(--brand)] border-black text-black brutal-shadow-white" : "bg-transparent border-white/10 text-white/20"
                )}>
                  {p.isConnected ? <CheckCircle className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                  {p.isConnected ? 'Authorized' : 'Unlinked'}
                </div>
              </div>

              <h2 className={cn(
                "display-type text-xl font-black uppercase tracking-tighter mb-4 italic group-hover:not-italic transition-all duration-500",
                p.isConnected ? "text-black" : "text-white"
              )}>
                {p.name}
              </h2>
              <p className={cn(
                "mono-type text-[11px] font-bold leading-relaxed mb-10 max-w-[80%]",
                p.isConnected ? "text-black/50" : "text-white/30"
              )}>
                {p.expertise}
              </p>

              <div className="mt-auto space-y-4">
                <span className={cn("mono-type text-[9px] font-black uppercase block tracking-widest", p.isConnected ? "text-black/30" : "text-white/20")}>Active Nodes</span>
                <div className="flex flex-wrap gap-2">
                  {p.instances.length > 0 ? p.instances.map(instance => (
                    <div key={instance.id} className={cn(
                      "px-3 py-1.5 text-[9px] font-black uppercase border transition-all duration-300",
                      p.isConnected ? "border-black/10 bg-black/5 text-black/60" : "border-white/10 bg-white/5 text-white/40 group-hover:border-white/20"
                    )}>
                      {instance.name}
                    </div>
                  )) : (
                    <span className={cn("text-[10px] italic font-medium", p.isConnected ? "text-black/20" : "text-white/10")}>Zero nodes reported</span>
                  )}
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-10 border-t border-current/10 mt-10">
               {!p.isConnected ? (
                 <button 
                    onClick={() => handleConnect(p.id, p.authType)}
                    className="w-full py-5 bg-white text-black border-2 border-white font-display font-black uppercase text-base hover:bg-[var(--brand)] hover:border-[var(--brand)] transition-all duration-500 group-hover:italic"
                 >
                    Establish Neural Link
                 </button>
               ) : (
                 <div className="flex gap-2">
                    <button className="flex-grow py-4 bg-black text-white border-2 border-black font-display font-black uppercase text-xs hover:bg-white hover:text-black transition-all duration-500 italic">
                      Neural Keys
                    </button>
                    <button className="w-14 h-14 flex items-center justify-center bg-transparent border-2 border-black hover:bg-black hover:text-white transition-all duration-500">
                      <ExternalLink className="w-5 h-5" />
                    </button>
                 </div>
               )}
            </div>
          </motion.div>
        ))}
      </div>

      <section className="bg-[#050505] border-2 border-white/5 p-16 relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-16 opacity-5 rotate-12 scale-150">
            <RefreshCw className="w-64 h-64 animate-[spin_40s_linear_infinite]" />
         </div>
         <div className="relative z-10 max-w-3xl space-y-10">
            <div className="flex items-center gap-4">
               <div className="w-3 h-3 bg-[var(--brand)]" />
               <span className="mono-type text-[10px] font-black uppercase text-[var(--brand)] tracking-[0.5em]">Fleet Scaling Modules</span>
            </div>
            <h3 className="display-type text-4xl lg:text-6xl font-black text-white uppercase tracking-tighter leading-none italic">
               HARDWARE <br /> <span className="text-white/20">ADDONS</span>
            </h3>
            <p className="mono-type text-base text-white/40 leading-relaxed font-bold italic border-l-2 border-white/10 pl-8">
               Looking to scale? You can deploy multiple agents of the same type to manage different shards of your business. 
               Deploying a second agent requires a unique profile label and neural context assignment.
            </p>
            <button 
              onClick={() => setShowDeployModal(true)}
              className="px-12 py-6 bg-white text-black font-display font-black uppercase text-lg border-2 border-white hover:bg-[var(--brand)] hover:border-[var(--brand)] transition-all duration-500 italic hover:not-italic"
            >
               Deploy New Agent Cluster
            </button>
         </div>
      </section>

      <AnimatePresence>
        {showDeployModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeployModal(false)}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative w-full max-w-5xl bg-[#050505] border-2 border-white p-16 brutal-shadow-white overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start mb-16 gap-10 border-b border-white/10 pb-16">
                 <div className="space-y-6">
                    <div className="flex items-center gap-3">
                       <span className="w-2 h-2 bg-[var(--brand)]" />
                       <span className="mono-type text-[10px] font-black uppercase tracking-[0.4em] text-[var(--brand)]">Node Factory</span>
                    </div>
                    <h2 className="display-type text-4xl font-black uppercase tracking-tighter leading-none text-white italic">
                      Hardware <br /> <span className="text-white/20">Provisioning</span>
                    </h2>
                 </div>
                 <button onClick={() => setShowDeployModal(false)} className="w-16 h-16 border-2 border-white text-white hover:bg-white hover:text-black transition-all">
                   <X className="w-7 h-7" />
                 </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border border-white/10">
                 {BOT_TYPES.map((type) => (
                   <button 
                     key={type.id}
                     onClick={() => {
                        deployNewBot(type.id);
                        setShowDeployModal(false);
                     }}
                     className="p-10 bg-[#0A0A0A] text-left hover:bg-white hover:text-black transition-all duration-500 group flex flex-col gap-6 relative"
                   >
                      <div className="w-14 h-14 bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-black group-hover:border-black transition-all duration-500">
                        <Cpu className="w-6 h-6 text-white group-hover:text-[var(--brand)]" />
                      </div>
                      <div className="space-y-2">
                        <span className="block font-display font-black uppercase text-xl leading-tight group-hover:italic transition-all duration-500">{type.name}</span>
                        <span className="block mono-type text-[11px] uppercase opacity-30 font-black tracking-widest">{type.expertise}</span>
                      </div>
                      <div className="mt-6 pt-6 border-t border-white/5 group-hover:border-black/10 flex items-center justify-between">
                         <span className="text-[9px] font-black uppercase tracking-widest opacity-20 group-hover:opacity-100 italic transition-all">Select Node</span>
                         <Plus className="w-4 h-4 opacity-10 group-hover:opacity-100 transition-all" />
                      </div>
                   </button>
                 ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
