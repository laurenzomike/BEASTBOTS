import React from 'react';
import { motion } from 'motion/react';
import { Zap, Shield, Cpu, Activity, ArrowRight, ShieldCheck, Database, Globe } from 'lucide-react';
import { cn } from '../lib/utils';

interface LandingProps {
  login: () => void;
}

export const Landing: React.FC<LandingProps> = ({ login }) => {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-white selection:bg-[var(--brand)] selection:text-black overflow-hidden font-sans relative">
      {/* Dynamic Grid Background */}
      <div className="absolute inset-0 opacity-[0.05]" 
           style={{ backgroundImage: `linear-gradient(to right, #FFF 1px, transparent 1px), linear-gradient(to bottom, #FFF 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
      
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--brand)]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[var(--brand)]/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 p-8 flex justify-between items-center z-50">
         <div className="flex items-center gap-3">
            <div className="bg-[var(--brand)] p-2 border-2 border-black brutal-shadow-mini">
               <Zap className="w-6 h-6 text-black fill-current" />
            </div>
            <span className="font-display text-2xl font-black uppercase tracking-tighter">Bot Boss</span>
         </div>
         <button 
           onClick={login}
           className="hidden md:flex items-center gap-2 px-6 py-2 bg-black border-2 border-white/20 hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all font-black uppercase text-[10px] brutal-shadow-mini"
         >
            Initialize Auth <ArrowRight className="w-3 h-3" />
         </button>
      </header>

      {/* Main Content */}
      <main className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
         <motion.div 
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, ease: "easeOut" }}
           className="space-y-6"
         >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--brand)]/10 border border-[var(--brand)]/30 rounded-full mb-4">
               <span className="w-2 h-2 bg-[var(--brand)] rounded-full animate-pulse" />
               <span className="text-[9px] font-black uppercase tracking-widest text-[var(--brand)]">Autonomous Fleet V.4.0 is Live</span>
            </div>
            
            <h1 className="display-type text-4xl md:text-6xl font-black leading-[0.85] tracking-tighter uppercase max-w-5xl mx-auto mb-8">
               Manage Your <span className="text-[var(--brand)]">Digital</span> Empire
            </h1>
            
            <p className="max-w-xl mx-auto text-white/50 font-mono text-xs leading-relaxed uppercase font-bold tracking-widest">
               The ultimate dashboard for fleet management. Deploy agents across E-commerce, Trading, and Social platforms with Zero-Latency monitoring.
            </p>

            <div className="pt-12 flex flex-col sm:flex-row gap-6 justify-center">
               <button 
                 onClick={login}
                 className="px-10 py-5 bg-[var(--brand)] text-black border-[4px] border-black font-black uppercase text-sm brutal-shadow hover:-translate-y-2 active:translate-y-1 transition-all group flex items-center gap-3"
               >
                 Authorize Control <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
               </button>
               <div className="p-[4px] bg-white/10 brutal-shadow relative">
                  <div className="bg-black p-4 flex items-center gap-4 border border-white/10">
                     <div className="flex -space-x-2">
                        {[1,2,3].map(i => (
                           <div key={i} className="w-8 h-8 rounded-none border-2 border-black bg-white/20 overflow-hidden">
                              <div className="w-full h-full bg-gradient-to-br from-white/40 to-transparent" />
                           </div>
                        ))}
                     </div>
                     <div className="text-left">
                        <div className="text-[10px] font-black uppercase text-[var(--brand)]">7,204 Active Nodes</div>
                        <div className="text-[8px] font-black uppercase text-white/40 italic">Syncing across 12 platforms</div>
                     </div>
                  </div>
               </div>
            </div>
         </motion.div>

         {/* Features Grid */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-40 w-full">
            {[
              { icon: Cpu, label: "Core Autonomy", desc: "Agents operate independently based on your Universal Protocol." },
              { icon: Database, label: "State Persistence", desc: "Memories are committed to the ledger for long-term intelligence." },
              { icon: Globe, label: "Omni-Platform", desc: "Shopify, Coinbase, Twitter, and Gmail integration out of the box." }
            ].map((f, i) => (
              <motion.div 
                key={f.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + (i * 0.1) }}
                className="p-8 border-[4px] border-white/5 bg-black/40 backdrop-blur-xl group hover:border-[var(--brand)] transition-all text-left brutal-shadow-mini"
              >
                 <div className="w-12 h-12 bg-white/5 flex items-center justify-center p-3 mb-6 border border-white/10 group-hover:border-[var(--brand)] transition-colors">
                    <f.icon className="w-full h-full text-white group-hover:text-[var(--brand)]" />
                 </div>
                 <h3 className="font-display text-xl font-black uppercase mb-3">{f.label}</h3>
                 <p className="text-white/40 text-[10px] font-mono font-bold leading-relaxed uppercase">{f.desc}</p>
              </motion.div>
            ))}
         </div>

         {/* Trust Section */}
         <div className="mt-40 pt-20 border-t border-white/10 w-full flex flex-col items-center">
            <span className="mono-type text-[9px] font-black text-white/30 uppercase tracking-[0.4em] mb-12">Hardware Protocol Compatibility</span>
            <div className="flex flex-wrap justify-center gap-12 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
               <Shield className="w-8 h-8" />
               <Activity className="w-8 h-8" />
               <Cpu className="w-8 h-8" />
               <Database className="w-8 h-8" />
            </div>
         </div>
      </main>

      {/* Footer Decoration */}
      <div className="p-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 font-mono text-[8px] font-black uppercase text-white/20">
         <div className="flex gap-4">
            <span>© 2026 Bot Boss Systems</span>
            <span>All Nodes Operational</span>
         </div>
         <div className="flex gap-4">
            <span className="hover:text-[var(--brand)] cursor-pointer">Protocol</span>
            <span className="hover:text-[var(--brand)] cursor-pointer">Compliance</span>
            <span className="hover:text-[var(--brand)] cursor-pointer">Telemetry</span>
         </div>
      </div>
    </div>
  );
};
