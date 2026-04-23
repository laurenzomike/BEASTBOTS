import React, { useState, useEffect } from 'react';
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

  const filteredPlatforms = platforms.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.role.toLowerCase().includes(search.toLowerCase());
    if (activeTab === 'connected') return matchesSearch && p.isConnected;
    if (activeTab === 'unlinked') return matchesSearch && !p.isConnected;
    return matchesSearch;
  });

  return (
    <div className="p-8 lg:p-12 space-y-12">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b-[8px] border-white pb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-4 h-4 bg-[var(--brand)] border-2 border-black animate-pulse" />
             <span className="mono-type text-[10px] font-black uppercase tracking-[0.2em] opacity-60">System // Integration Mesh</span>
          </div>
          <h1 className="display-type text-7xl md:text-8xl font-black uppercase tracking-tighter leading-none italic">
            Nerve <span className="text-[var(--brand)]">Center</span>
          </h1>
          <p className="mono-type text-xs uppercase font-black opacity-40 max-w-xl">
            Centralized authentication and pipeline management for the entire fleet integration layer. 
            Authorize platforms to enable autonomous agent deployment.
          </p>
        </div>

        <div className="flex flex-col gap-4 min-w-[300px]">
           <div className="relative group">
              <input 
                type="text" 
                placeholder="Search platforms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-black border-[4px] border-white p-4 pl-12 mono-type text-xs text-white focus:border-[var(--brand)] outline-none transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-[var(--brand)]" />
           </div>
           <div className="flex gap-2">
              {(['all', 'connected', 'unlinked'] as const).map(t => (
                <button 
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={cn(
                    "flex-grow p-2 text-[9px] font-black uppercase border-2 transition-all",
                    activeTab === t ? "bg-[var(--brand)] text-black border-black brutal-shadow-mini" : "bg-black text-white border-white/20 hover:border-white"
                  )}
                >
                  {t}
                </button>
              ))}
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredPlatforms.map((p, idx) => (
          <motion.div 
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={cn(
              "border-[4px] p-8 flex flex-col justify-between group transition-all duration-300 relative overflow-hidden",
              p.isConnected ? "bg-white border-black brutal-shadow" : "bg-black border-white/10 hover:border-white"
            )}
          >
            {/* Background Pattern */}
            <div className={cn(
              "absolute inset-0 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity",
              p.isConnected ? "bg-black" : "bg-white"
            )} style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '16px 16px' }} />

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div className={cn(
                  "p-3 border-2 transition-all",
                  p.isConnected ? "bg-black text-[var(--brand)] border-black" : "bg-white/10 text-white border-white/10"
                )}>
                  <Cpu className="w-8 h-8" />
                </div>
                <div className={cn(
                  "px-3 py-1 text-[9px] font-black uppercase border-2 flex items-center gap-2",
                  p.isConnected ? "bg-[#D4FF00] border-black text-black" : "bg-black border-white/20 text-white/40"
                )}>
                  {p.isConnected ? <CheckCircle className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                  {p.isConnected ? 'Authorized' : 'Unlinked'}
                </div>
              </div>

              <h2 className={cn(
                "font-display text-4xl font-black uppercase tracking-tighter mb-2",
                p.isConnected ? "text-black" : "text-white"
              )}>
                {p.name}
              </h2>
              <p className={cn(
                "mono-type text-[10px] font-bold leading-relaxed mb-8",
                p.isConnected ? "text-black/60" : "text-white/40"
              )}>
                {p.expertise}
              </p>

              <div className="space-y-2 mb-8">
                <span className={cn("text-[8px] font-black uppercase block", p.isConnected ? "text-black/30" : "text-white/20")}>Active Nodes</span>
                <div className="flex flex-wrap gap-2">
                  {p.instances.length > 0 ? p.instances.map(instance => (
                    <div key={instance.id} className={cn(
                      "px-2 py-1 text-[8px] font-black uppercase border",
                      p.isConnected ? "border-black/10 bg-black/5" : "border-white/10 bg-white/5 text-white/60"
                    )}>
                      {instance.name}
                    </div>
                  )) : (
                    <span className="text-[9px] italic opacity-40">Zero agents deployed</span>
                  )}
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-6 border-t border-current/10 mt-auto">
               {!p.isConnected ? (
                 <button 
                   onClick={() => handleConnect(p.id, p.authType)}
                   className="w-full py-4 bg-[var(--brand)] text-black border-[4px] border-black font-black uppercase text-sm brutal-shadow hover:translate-x-1 hover:-translate-y-1 transition-all active:translate-y-0"
                 >
                   Establish Protocol link
                 </button>
               ) : (
                 <div className="flex gap-3">
                    <button className="flex-grow py-3 bg-black text-white border-2 border-black font-black uppercase text-[10px] hover:bg-white hover:text-black transition-colors">
                      Manage keys
                    </button>
                    <button className="p-3 bg-white border-2 border-black hover:bg-black hover:text-white transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                 </div>
               )}
            </div>
          </motion.div>
        ))}
      </div>

      <section className="bg-black border-[4px] border-white p-12 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-5">
            <RefreshCw className="w-64 h-64 animate-[spin_20s_linear_infinite]" />
         </div>
         <div className="relative z-10 max-w-2xl space-y-6">
            <h3 className="display-type text-5xl font-black text-white uppercase tracking-tighter">Fleet Market <span className="text-[var(--brand)]">Addons</span></h3>
            <p className="mono-type text-sm text-white/60 leading-relaxed font-bold">
              Looking to scale? You can deploy multiple agents of the same type to manage different shards of your business. 
              Deploying a second agent requires a unique profile label.
            </p>
            <button 
              onClick={() => setShowDeployModal(true)}
              className="px-8 py-4 bg-white text-black font-black uppercase text-sm border-4 border-black hover:bg-[var(--brand)] transition-all brutal-shadow"
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
              className="absolute inset-0 bg-black/95 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-white border-[8px] border-black p-12 brutal-shadow shadow-[20px_20px_0px_rgba(212,255,0,0.5)] max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-12 border-b-[4px] border-black pb-8">
                 <div className="space-y-4">
                    <h2 className="display-type text-6xl font-black uppercase tracking-tighter leading-none italic">
                      Hardware <span className="text-[var(--brand)]">Provisioning</span>
                    </h2>
                    <p className="mono-type text-[10px] font-black uppercase opacity-40">Select target integration platform for new node deployment.</p>
                 </div>
                 <button onClick={() => setShowDeployModal(false)} className="p-4 bg-black text-white hover:rotate-90 transition-transform">
                   <X className="w-8 h-8" />
                 </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {BOT_TYPES.map((type) => (
                   <button 
                     key={type.id}
                     onClick={() => {
                        deployNewBot(type.id);
                        setShowDeployModal(false);
                     }}
                     className="p-6 border-[3px] border-black text-left hover:bg-[var(--brand)] transition-all group flex flex-col gap-4 brutal-shadow-mini hover:-translate-y-1 active:translate-y-0"
                   >
                      <div className="p-3 bg-black text-white w-max group-hover:bg-white group-hover:text-black transition-colors">
                        <Cpu className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <span className="block font-sans font-black uppercase text-xl leading-none">{type.name}</span>
                        <span className="block mono-type text-[9px] uppercase opacity-40 font-black">{type.expertise}</span>
                      </div>
                      <div className="mt-4 pt-4 border-t border-black/10 flex items-center justify-between">
                         <span className="text-[8px] font-black uppercase">Fleet Unit</span>
                         <Plus className="w-4 h-4 opacity-20 group-hover:opacity-100 transition-opacity" />
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
