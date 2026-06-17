import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Activity as ActivityIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { BotCard } from './BotCard';
import { Bot, Activity } from '../types';

interface AppFleetGridProps {
  bots: Bot[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: string;
  setStatusFilter: (s: any) => void;
  bulkAction: (status: 'online' | 'offline') => void;
  filteredBots: Bot[];
  executingBots: Set<string>;
  setSelectedBot: (bot: Bot | null) => void;
  updateBotStatus: (botId: string, status: Bot['status']) => void;
  handleConnect: (botType: string, authType: string) => void;
  globalActivities: Activity[];
}

export const AppFleetGrid: React.FC<AppFleetGridProps> = ({
  bots,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  bulkAction,
  filteredBots,
  executingBots,
  setSelectedBot,
  updateBotStatus,
  handleConnect,
  globalActivities
}) => {
  const activeBots = filteredBots.filter(b => b.status === 'online' || b.status === 'error');
  const standbyBots = filteredBots.filter(b => b.status === 'offline' || b.status === 'auth-required');

  const [showStandby, setShowStandby] = React.useState(activeBots.length === 0);

  const lastActivityMap = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const activity of globalActivities) {
      if (activity.botId && !map.has(activity.botId)) {
        map.set(activity.botId, activity.text);
      }
    }
    return map;
  }, [globalActivities]);

  return (
    <motion.div 
      key="fleet"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col h-full"
    >
      {/* Fleet Summary Row (Desktop Only) */}
      <div className="hidden lg:grid grid-cols-2 xl:grid-cols-4 gap-6 px-12 pt-12">
         {[
           { label: "Total Fleet", value: bots.length, color: "bg-white", detail: "Defined Protocols" },
           { label: "Active Cycles", value: bots.filter(b => b.status === 'online').length, color: "bg-[var(--brand)]", detail: "Online Units" },
           { label: "Protocol Wins", value: bots.reduce((a, b) => a + (b.config?.winCount || 0), 0), color: "bg-[#00E0FF]", detail: "Strategic Success" },
           { label: "Active Threads", value: bots.reduce((a, b) => a + (b.config?.workflows?.length || 0), 0), color: "bg-[#FF2E00] text-white", detail: "Running Automations" }
         ].map(stat => (
            <div key={stat.label} className={cn("p-6 border-[4px] border-black brutal-shadow group transition-transform hover:-translate-y-1 relative overflow-hidden", stat.color)}>
               <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-100 transition-opacity">
                  <ActivityIcon className="w-4 h-4 animate-pulse" />
               </div>
               <span className="mono-type text-[10px] font-black uppercase opacity-60 block mb-1">{stat.label}</span>
               <span className="text-xl font-black tracking-tighter tabular-nums">{stat.value}</span>
               <span className="block mt-2 mono-type text-[8px] font-black uppercase opacity-40">{stat.detail}</span>
            </div>
         ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="p-8 lg:p-12 pb-0 flex flex-wrap gap-6 items-end">
         <div className="flex-grow space-y-2 min-w-[280px]">
            <label className="mono-type text-[10px] font-black uppercase text-white/50">Intelligence Search</label>
            <div className="relative group brutal-shadow hover:-translate-y-1 hover:translate-x-1 hover:shadow-[-8px_8px_0_0_rgba(255,255,255,1)] transition-all duration-300">
               <input 
                 type="text"
                 placeholder="Search Nodes (Platform, ID, Custom Name)..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-black border-[4px] border-white/20 p-4 pl-12 mono-type text-[12px] text-white focus:border-[var(--brand)] focus:outline-none transition-colors"
               />
               <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white opacity-20 group-focus-within:opacity-100 group-focus-within:text-[var(--brand)] transition-colors" />
            </div>
         </div>
         <div className="space-y-2 w-full md:w-auto">
            <label className="mono-type text-[10px] font-black uppercase text-white/50">Deployment Filter</label>
            <div className="relative group brutal-shadow hover:-translate-y-1 hover:translate-x-1 transition-all duration-300">
               <select 
                 value={statusFilter}
                 onChange={(e) => setStatusFilter(e.target.value as any)}
                 className="w-full md:w-56 bg-black border-[4px] border-white/20 p-4 mono-type text-[10px] font-black uppercase text-white focus:border-[var(--brand)] outline-none cursor-pointer appearance-none pr-10"
               >
                  <option value="all">Filter Nodes: All</option>
                  <option value="online">Status: Online [Active]</option>
                  <option value="offline">Status: Offline [Standby]</option>
                  <option value="auth-required">Condition: Needs Key</option>
                  <option value="error">Condition: Critical Error</option>
               </select>
               <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                  <TrendingUp className="w-4 h-4 rotate-90" />
               </div>
            </div>
         </div>
         {activeBots.length > 0 && (
           <button 
             onClick={() => setShowStandby(!showStandby)}
             className={cn(
               "px-8 py-4 border-[4px] font-black uppercase text-[11px] transition-all brutal-shadow",
               showStandby ? "bg-black text-white border-white" : "bg-white text-black border-black hover:bg-[var(--brand)]"
             )}
           >
             {showStandby ? "Close Deployment Center" : "Deploy More Agents"}
           </button>
         )}
      </div>

      {/* Active Grid */}
      {activeBots.length > 0 && (
        <div className="px-4 lg:px-12 mt-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-2 h-8 bg-[var(--brand)]" />
            <h2 className="display-type text-2xl font-black uppercase text-white tracking-tighter">Active Deployment</h2>
          </div>
          
          <motion.div 
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8"
          >
            {activeBots.map((bot, i) => {
              const lastLog = lastActivityMap.get(bot.id) || "";
              return (
                <motion.div 
                  key={bot.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
                  }}
                >
                  <BotCard 
                    bot={bot} 
                    index={i} 
                    isExecuting={executingBots.has(bot.id)}
                    lastActivity={lastLog}
                    onSelect={setSelectedBot} 
                    onUpdateStatus={updateBotStatus}
                    onConnect={handleConnect}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      )}

      {/* Standby Grid */}
      <AnimatePresence>
        {standbyBots.length > 0 && showStandby && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 lg:px-12 mt-20 mb-20 overflow-hidden"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-2 h-8 bg-white/20" />
              <h2 className="display-type text-2xl font-black uppercase text-white/40 tracking-tighter">Available Agents</h2>
              <span className="mono-type text-[10px] font-black uppercase text-white/20 ml-2">[{standbyBots.length} Units on Standby]</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6 gap-4 md:gap-6">
              {standbyBots.map((bot, i) => (
                <div key={bot.id} className="scale-90 origin-top-left opacity-60 hover:opacity-100 transition-opacity">
                  <BotCard 
                    bot={bot} 
                    index={i} 
                    isExecuting={false}
                    onSelect={setSelectedBot} 
                    onUpdateStatus={updateBotStatus}
                    onConnect={handleConnect}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {filteredBots.length === 0 && (
        <div className="col-span-full py-32 text-center opacity-30 animate-pulse text-2xl font-black uppercase border-4 border-dashed border-white/10 flex flex-col items-center gap-4 mx-12 mt-12 mb-20">
           <ActivityIcon className="w-16 h-16 mb-4" />
           No units match the current filter.
        </div>
      )}
    </motion.div>
  );
};
