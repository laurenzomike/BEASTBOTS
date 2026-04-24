import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, ChevronUp, Activity as ActivityIcon, Brain, AlertTriangle } from 'lucide-react';
import { Activity } from '../types';
import { cn } from '../lib/utils';

interface GlobalTerminalProps {
  showTerminal: boolean;
  setShowTerminal: (show: boolean) => void;
  globalActivities: Activity[];
  onGlobalCommand: (cmd: string) => void;
}

export const GlobalTerminal: React.FC<GlobalTerminalProps> = ({ 
  showTerminal, 
  setShowTerminal, 
  globalActivities,
  onGlobalCommand
}) => {
  const [filter, setFilter] = React.useState<string>('all');
  const [search, setSearch] = React.useState('');
  const [command, setCommand] = React.useState('');
  
  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;
    onGlobalCommand(command);
    setCommand('');
  };

  // ⚡ Bolt: Memoize filtered activity list to prevent O(N) recalculation on every key stroke or render.
  // search.toLowerCase is hoisted to prevent redundant allocations inside the loop.
  const filteredActivities = React.useMemo(() => {
    const searchLower = search.toLowerCase();
    return globalActivities
      .filter(a => filter === 'all' || a.botType === filter)
      .filter(a => a.text.toLowerCase().includes(searchLower) || a.botType.toLowerCase().includes(searchLower));
  }, [globalActivities, filter, search]);

  // ⚡ Bolt: Memoize uniqueBots to prevent O(N) iteration and Set allocations over globalActivities array on each render
  const uniqueBots = React.useMemo(() => Array.from(new Set(globalActivities.map(a => a.botType))), [globalActivities]);

  return (
    <>
      {/* Terminal Toggle Button */}
      {!showTerminal && (
         <motion.button 
           initial={{ opacity: 0, scale: 0.8, y: 20 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           transition={{ type: "spring", stiffness: 400, damping: 25 }}
           onClick={() => setShowTerminal(true)} 
           className="fixed bottom-4 right-4 sm:bottom-8 sm:left-8 z-30 p-3 sm:p-4 bg-black border-[4px] border-white text-white hover:bg-[var(--brand)] hover:text-black transition-all brutal-shadow hover:-translate-y-1 hover:scale-105 active:scale-95 duration-200"
         >
            <motion.div animate={{ rotate: [0, -5, 5, -5, 5, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}>
              <Terminal className="w-6 h-6 sm:w-8 sm:h-8" />
            </motion.div>
         </motion.button>
      )}

      {/* Terminal Overlay */}
      <AnimatePresence>
        {showTerminal && (
          <motion.div 
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 250, mass: 0.8 }}
            className="fixed bottom-0 left-0 right-0 sm:bottom-8 sm:left-8 sm:right-8 lg:left-auto lg:right-8 lg:w-[600px] z-[50]"
          >
             <div className="bg-[#0A0A0A] border-t-4 sm:border-[4px] border-white brutal-shadow flex flex-col h-[300px] sm:h-[400px]">
                <div className="p-4 border-b-2 border-white flex flex-col sm:flex-row justify-between items-start sm:items-center bg-black group transition-colors gap-4">
                   <div className="flex items-center gap-3">
                     <Terminal className="w-5 h-5 text-[var(--brand)] group-hover:scale-110 transition-transform origin-left" />
                     <span className="text-[10px] font-black uppercase text-white tracking-widest">Live Activity Log</span>
                   </div>
                   
                   <div className="flex gap-2 flex-wrap items-center">
                      <input 
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="SIG_SEARCH..."
                        className="bg-white/5 border border-white/20 text-[8px] px-2 py-0.5 text-white focus:outline-none focus:border-[var(--brand)] mono-type w-24"
                      />
                      <div className="h-4 w-[1px] bg-white/20 mx-1 hidden sm:block" />
                      <button 
                        onClick={() => setFilter('all')}
                        className={`text-[8px] font-black uppercase px-2 py-0.5 border border-white/20 transition-all hover:border-white ${filter === 'all' ? 'bg-[var(--brand)] text-black border-black' : 'text-white'}`}
                      >
                        All
                      </button>
                      {uniqueBots.map(bot => (
                        <button 
                          key={bot}
                          onClick={() => setFilter(bot)}
                          className={`text-[8px] font-black uppercase px-2 py-0.5 border border-white/20 transition-all hover:border-white ${filter === bot ? 'bg-[var(--brand)] text-black border-black' : 'text-white'}`}
                        >
                          {bot}
                        </button>
                      ))}
                   </div>

                   <button 
                     onClick={() => setShowTerminal(false)} 
                     className="absolute top-4 right-4 text-white hover:text-[var(--brand)] hover:scale-125 transition-all p-1"
                   >
                     <ChevronUp className="w-5 h-5 rotate-180" />
                   </button>
                </div>
                <div className="flex-grow overflow-y-auto p-4 space-y-4 font-mono text-[10px] custom-scrollbar bg-[#050505]">
                   {filteredActivities.length === 0 ? (
                     <div className="text-center opacity-20 py-20 uppercase font-black tracking-[0.2em] text-white animate-pulse">Waiting for network signals...</div>
                   ) : (
                     filteredActivities.map(a => {
                        const isLive = a.text.includes("[LIVE EXECUTION]");
                        const cleanText = a.text.replace("[LIVE EXECUTION]", "").trim();
                        
                        const Icon = a.type === 'error' ? AlertTriangle : a.type === 'analysis' ? Brain : ActivityIcon;
                        const typeColor = a.type === 'error' ? 'text-[#FF2E00]' : a.type === 'analysis' ? 'text-[#00D1FF]' : 'text-[#D4FF00]';
                        
                        return (
                         <motion.div 
                           initial={{ opacity: 0, scale: 0.95 }} 
                           animate={{ opacity: 1, scale: 1 }} 
                           key={a.id} 
                           className="flex gap-4 border-l-[3px] border-white/5 pl-3 transition-all hover:bg-white/[0.03] py-3 hover:border-l-white group relative"
                         >
                            <span className="opacity-20 italic text-[7px] self-start mt-1 text-white tabular-nums">{a.timestamp?.toDate().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                            <div className="flex-grow flex gap-4">
                               <div className={cn("p-2 h-fit border-2 border-white/5 group-hover:border-white/20 transition-all shadow-inner", typeColor)}>
                                  <Icon className="w-4 h-4" />
                               </div>
                               <div className="flex flex-col gap-1.5 min-w-0">
                                  <div className="flex items-center gap-3 flex-wrap">
                                    <span className="text-white font-black uppercase tracking-widest text-[9px] bg-white/10 px-2 py-0.5 border border-white/5">
                                      {a.botType}
                                    </span>
                                    <div className={cn("flex items-center gap-1 text-[8px] font-black uppercase", typeColor)}>
                                       <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", a.type === 'error' ? 'bg-[#FF2E00]' : a.type === 'analysis' ? 'bg-[#00D1FF]' : 'bg-[#D4FF00]')} />
                                       {a.type || 'EVENT'}
                                    </div>
                                    {isLive && (
                                       <span className="bg-[#FF2E00] text-white px-2 py-0.5 text-[7px] animate-pulse font-black border border-[#FF2E00] shadow-[0_0_10px_rgba(255,46,0,0.4)]">
                                          EXECUTION ACTIVE
                                       </span>
                                    )}
                                  </div>
                                  <p className="text-white/80 leading-relaxed text-[11px] font-medium selection:bg-[#D4FF00] selection:text-black">{cleanText}</p>
                               </div>
                            </div>
                         </motion.div>
                        );
                      })
                   )}
                </div>

                {/* Command Input */}
                <div className="p-4 border-t-2 border-white bg-black">
                  <form onSubmit={handleCommandSubmit} className="flex gap-4">
                    <div className="flex-grow flex items-center bg-white/5 border-2 border-white/20 px-4 focus-within:border-[var(--brand)] transition-colors">
                       <span className="mono-type text-[10px] text-[var(--brand)] mr-3 font-black tracking-widest hidden sm:inline">FLEET@ROOT &gt;</span>
                       <input 
                         type="text"
                         value={command}
                         onChange={(e) => setCommand(e.target.value)}
                         placeholder="Broadcast command to all active agents..."
                         className="w-full bg-transparent border-none focus:outline-none text-white font-mono text-[11px] py-1 selection:bg-[var(--brand)] selection:text-black"
                       />
                    </div>
                    <button 
                      type="submit"
                      className="bg-[var(--brand)] text-black px-6 py-2 border-2 border-black font-black uppercase text-[10px] brutal-shadow hover:-translate-y-1 active:translate-y-0 transition-all font-sans"
                    >
                      EXEC
                    </button>
                  </form>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
