import React from "react";
import { motion } from "motion/react";
import { Bot, BotType } from "../types";
import { BOT_TYPES } from "../constants";
import { cn } from "../lib/utils";
import { Layers, Key, Square, Play, Trophy, Activity as ActivityIcon, Zap, ShieldCheck, Cpu } from "lucide-react";

interface BotCardProps {
  bot: Bot;
  index: number;
  onSelect: (bot: Bot) => void;
  onUpdateStatus: (id: string, status: any) => void;
  onConnect: (type: string, authType: string) => void;
  isExecuting?: boolean;
  lastActivity?: string;
}

export const BotCard: React.FC<BotCardProps> = ({ bot, index, onSelect, onUpdateStatus, onConnect, isExecuting, lastActivity }) => {
  const typeDef = BOT_TYPES.find(t => t.id === bot.type);
  const words = bot.name.split(' ');
  const firstWord = words.shift();
  const restWords = words.join(' ');

  const cleanLastActivity = lastActivity?.replace(/\[ACTION\]|\[ANALYSIS\]/g, "").trim() || "";

  return (
    <motion.div 
      layout
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="border-2 border-white/10 flex flex-col justify-between group min-h-[220px] bg-[#0A0A0A] hover:bg-[#0F0F0F] relative backdrop-blur-sm p-5 overflow-hidden"
    >
      {/* Dynamic Background Grid */}
      <div className="absolute inset-0 opacity-[0.05] group-hover:opacity-[0.1] pointer-events-none transition-opacity duration-700" 
           style={{ backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize: '16px 16px' }} />

      {/* Status Glow Overlay */}
      <div className={cn(
        "absolute -top-12 -right-12 w-24 h-24 blur-[40px] pointer-events-none transition-all duration-700 opacity-0 group-hover:opacity-20",
        bot.status === "online" ? "bg-[var(--brand)]" : 
        bot.status === "error" ? "bg-[var(--accent)]" : "bg-white"
      )} />

      {/* Execution Pulse */}
      {isExecuting && (
        <div className="absolute inset-0 pointer-events-none z-0">
           <motion.div 
             animate={{ height: ["0%", "100%", "0%"], top: ["0%", "0%", "100%"] }}
             transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
             className="absolute left-0 w-full bg-gradient-to-b from-transparent via-[var(--accent)]/10 to-transparent"
           />
           <div className="absolute inset-0 bg-[var(--accent)]/5 animate-pulse" />
        </div>
      )}
      
      <div className="flex justify-between items-start relative z-10">
        <div className="flex items-center gap-2">
           <div className="flex flex-col">
              <span className="mono-type text-[7px] font-black text-white/40 tracking-[0.2em] uppercase leading-none mb-1">Node</span>
              <span className="mono-type text-[9px] font-black text-white tracking-widest tabular-nums italic">
                {bot.id.slice(0, 8).toUpperCase()}
              </span>
           </div>
        </div>
        <div className="flex items-center gap-2">
           {bot.config?.winCount > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-white text-black mono-type text-[7px] font-black uppercase tracking-tighter italic">
                 <ShieldCheck className="w-2 h-2" />
                 <span>{bot.config.winCount}</span>
              </div>
           )}
           <div className="relative">
              <div className={cn(
                "w-2.5 h-2.5 border-2 border-black transition-all duration-500",
                bot.status === "online" && "bg-[var(--brand)] shadow-[0_0_10px_rgba(0,240,255,0.4)]",
                bot.status === "offline" && "bg-white/10 opacity-40",
                bot.status === "error" && "bg-[var(--accent)] animate-pulse",
                bot.status === "auth-required" && "bg-[#FF00FF]"
              )} />
           </div>
        </div>
      </div>
      
      <div className="relative z-10 flex-grow pt-4 flex flex-col">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            {bot.avatar ? (
              <div className="w-12 h-12 bg-black border border-white/10 p-0.5 shrink-0 relative group-hover:border-white transition-colors duration-500">
                <img src={bot.avatar} alt="Avatar" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-white/20 border border-black" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-white/5 border border-white/5 flex items-center justify-center shrink-0 group-hover:border-white/20 transition-all">
                 <Cpu className="w-5 h-5 text-white/10 group-hover:text-white/40 transition-colors" />
              </div>
            )}
            <div className="flex flex-col ml-1">
              <span className="mono-type text-[7px] font-black uppercase text-[var(--brand)] mb-1 tracking-[0.2em]">{typeDef?.role || "Agent"}</span>
              <h2 className="display-type text-lg font-black uppercase leading-tight text-white tracking-tighter group-hover:italic transition-all duration-500 break-words line-clamp-1">
                {firstWord} {restWords}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             <div className={cn(
               "flex items-center gap-1.5 px-2 py-1 border text-[6px] font-black uppercase tracking-widest transition-all duration-500",
               bot.autonomous ? "bg-[var(--brand)]/10 border-[var(--brand)]/30 text-[var(--brand)]" : "border-white/5 text-white/20",
               isExecuting && "bg-[var(--brand)] text-black"
             )}>
                <Zap className={cn("w-2 h-2", bot.autonomous ? "text-[var(--brand)] fill-current" : "text-white/10", isExecuting && "text-black")} />
                {bot.autonomous ? "Autonomous" : "Manual"}
             </div>
             {typeof bot.config?.workflows?.length === 'number' && (
                <div 
                  className="flex items-center gap-1.5 px-2 py-1 border border-white/10 text-[6px] font-black uppercase tracking-widest text-white/40 cursor-help"
                  title={`${bot.config.workflows.length} Active Automation Sequences`}
                >
                   {bot.config.workflows.length} Threads
                </div>
             )}
             {bot.config?.responsibilities?.length > 0 && (
                <div 
                  className="flex items-center gap-1.5 px-2 py-1 border border-white/10 text-[6px] font-black uppercase tracking-widest text-white/40 cursor-help"
                  title={`Active Scopes: ${bot.config.responsibilities.map((r: string) => typeDef?.responsibilities?.find(tr => tr.id === r)?.label || r).join(', ')}`}
                >
                   {bot.config.responsibilities.length} Scopes
                </div>
             )}
             <div className="h-[1px] flex-grow bg-white/5 relative overflow-hidden">
                <motion.div 
                   animate={{ left: ["-100%", "100%"] }}
                   transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                   className="absolute top-0 w-1/3 h-full bg-white/10"
                />
             </div>
          </div>
        </div>

        {cleanLastActivity && (
          <div className="mt-3 border-l-2 border-[var(--brand)]/20 pl-3 relative flex-grow overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[var(--brand)]/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
             <span className="mono-type text-[6px] font-black uppercase text-white/20 block mb-1 tracking-[0.2em]">Telemetry</span>
             <p className="mono-type text-[8px] font-medium text-white/50 group-hover:text-white/80 leading-relaxed italic line-clamp-2 transition-colors duration-500">
               {cleanLastActivity}
             </p>
          </div>
        )}
      </div>
      
      <div className="pt-3 flex items-center justify-between gap-4 relative z-10 mt-auto">
        <div className="flex flex-col gap-1">
           <span className="text-[6px] font-black uppercase text-white/20 tracking-[0.3em]">Status</span>
           <div className={cn(
             "px-2 py-1 border-2 text-[8px] font-black uppercase italic tracking-wider transition-all duration-500",
             bot.status === "online" ? "bg-[var(--brand)] text-black border-black shadow-[2px_2px_0_0_#FFF]" : 
             "bg-transparent border-white/10 text-white/30"
           )}>
             {bot.status === "auth-required" ? "Locked" : bot.status}
           </div>
        </div>

        <div className="flex gap-2">
           <button 
            onClick={(e) => { e.stopPropagation(); onSelect(bot); }}
            className="w-8 h-8 bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all hover:border-white group/btn" 
            title="Configure Unit"
          >
            <Layers className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
          </button>

          {bot.status === "auth-required" ? (
            <button 
              onClick={(e) => { e.stopPropagation(); onConnect(bot.type, typeDef?.authType || "oauth"); }}
              className="w-8 h-8 bg-black border border-white text-white hover:bg-[var(--brand)] hover:text-black hover:border-[var(--brand)] transition-all" 
              title="Authenticate"
            >
              <Key className="w-3.5 h-3.5" />
            </button>
          ) : bot.status === "online" ? (
            <button 
              onClick={(e) => { e.stopPropagation(); onUpdateStatus(bot.id, "offline"); }}
              className="w-8 h-8 bg-black border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-all shadow-[0_0_10px_rgba(188,0,255,0.2)]" 
              title="Deactivate"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button 
              onClick={(e) => { e.stopPropagation(); onUpdateStatus(bot.id, "online"); }}
              className="w-8 h-8 bg-black border border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-black transition-all shadow-[0_0_10px_rgba(0,240,255,0.2)]" 
              title="Activate"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
