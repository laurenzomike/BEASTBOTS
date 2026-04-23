import React from "react";
import { motion } from "motion/react";
import { Bot, BotType } from "../types";
import { BOT_TYPES } from "../constants";
import { cn } from "../lib/utils";
import { Layers, Key, Square, Play, Trophy, Activity as ActivityIcon, Zap, ShieldCheck } from "lucide-react";

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
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="grid-cell flex flex-col justify-between group min-h-[340px] border-4 border-white/10 hover:border-white transition-all duration-300 rounded-none brutal-shadow bg-[#0A0A0A] hover:bg-black overflow-hidden relative"
    >
      {/* Dynamic Background Noise/Pattern */}
      <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.07] pointer-events-none transition-opacity duration-500" 
           style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '24px 24px' }} />

      {/* Execution Scanline */}
      {isExecuting && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
           <motion.div 
             animate={{ y: ["-100%", "200%"] }}
             transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
             className="w-full h-20 bg-gradient-to-b from-transparent via-[#FF2E00]/20 to-transparent"
           />
        </div>
      )}
      
      <div className="flex justify-between items-start relative z-10 p-4 pb-0">
        <div className="flex items-center gap-3">
           <span className={cn(
             "mono-type text-[9px] bg-white text-black px-2 py-1 font-black uppercase border-2 border-black transition-all",
             isExecuting ? "bg-[#FF2E00] text-white -translate-x-1 -translate-y-1 brutal-shadow-mini" : "group-hover:bg-[var(--brand)] group-hover:text-black group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:brutal-shadow-mini"
           )}>
             NODE_{bot.type.slice(0, 4)}
           </span>
           <span className="mono-type text-[10px] font-black text-white/20 group-hover:text-white/40 tabular-nums">
             ID: {bot.id.slice(0, 6)}
           </span>
        </div>
        <div className="flex items-center gap-2">
           {bot.config?.winCount > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-[#00D1FF] text-black mono-type text-[8px] uppercase font-black border-2 border-black brutal-shadow-mini">
                 <ShieldCheck className="w-2.5 h-2.5" />
                 <span>{bot.config.winCount}</span>
              </div>
           )}
           <div className={cn(
             "w-3 h-3 border-2 border-black brutal-shadow-mini transition-all duration-300",
             bot.status === "online" && "bg-[#D4FF00] scale-110",
             bot.status === "offline" && "bg-white/10 opacity-50",
             bot.status === "error" && "bg-[#FF2E00] animate-pulse",
             bot.status === "auth-required" && "bg-[#FF00FF]"
           )} />
        </div>
      </div>
      
      <div className="relative z-10 flex-grow px-6 pt-6 flex flex-col justify-center">
        <div className="flex items-center gap-4 mb-4">
          {bot.avatar && (
            <div className="w-16 h-16 bg-black border-2 border-white/20 brutal-shadow-mini shrink-0 overflow-hidden group-hover:border-[var(--brand)] transition-colors">
              <img src={bot.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          )}
          <h2 className="display-type text-4xl font-black uppercase leading-[0.9] text-white group-hover:text-[var(--brand)] transition-all duration-300 tracking-tighter">
            <span className="block">{firstWord}</span>
            <span className="block opacity-30 group-hover:opacity-100">{restWords || bot.type}</span>
          </h2>
        </div>
        
        <div className="flex items-center gap-2 mt-0">
           {bot.autonomous ? (
             <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black border border-white/20 text-[7px] font-black uppercase text-[#D4FF00]">
                <Zap className="w-2.5 h-2.5 fill-current" />
                Autonomous Mode
             </div>
           ) : (
             <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black border border-white/20 text-[7px] font-black uppercase text-white/40">
                Manual Control
             </div>
           )}
           {bot.config?.workflows?.length > 0 && (
             <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#00D1FF]/10 border border-[#00D1FF]/30 text-[7px] font-black uppercase text-[#00D1FF]">
                {bot.config.workflows.length} Pipeline Threads
             </div>
           )}
        </div>

        <div className="mt-6 flex flex-wrap gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
           {typeDef?.responsibilities?.slice(0, 3).map(r => (
             <span key={r.id} className={cn(
               "text-[7px] font-black uppercase px-2 py-0.5 border border-white/10",
               bot.config?.responsibilities?.includes(r.id) ? "border-[#D4FF00] text-[#D4FF00]" : "opacity-30"
             )}>
               {r.label}
             </span>
           ))}
           {(typeDef?.responsibilities?.length || 0) > 3 && (
             <span className="text-[7px] font-black uppercase px-2 py-0.5 border border-white/10 opacity-30">+{typeDef!.responsibilities!.length - 3}</span>
           )}
        </div>

        {cleanLastActivity && (
          <div className="mt-8 relative h-12 overflow-hidden border-l border-white/10 pl-3">
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
             <span className="mono-type text-[7px] font-black uppercase opacity-20 block mb-1">Signal Pulse</span>
             <p className="mono-type text-[9px] font-bold text-white/60 group-hover:text-white leading-tight italic line-clamp-2">
               {cleanLastActivity}
             </p>
          </div>
        )}
      </div>
      
      <div className="p-4 pt-0 flex justify-between items-end gap-2 relative z-10 transition-all">
        <div className="flex flex-col gap-1">
           <span className="text-[6px] font-black uppercase text-white/20 tracking-[0.2em]">Deployment State</span>
           <span className={cn(
             "font-sans text-[10px] px-3 py-1.5 uppercase font-black transition-all duration-300",
             bot.status === "online" && "bg-[#D4FF00] text-black border-2 border-black brutal-shadow-mini",
             bot.status === "offline" && "bg-transparent border-2 border-white/20 text-white/40 hover:border-white hover:text-white",
             bot.status === "auth-required" && "bg-black text-[#FF00FF] border-2 border-[#FF00FF] brutal-shadow-mini",
             bot.status === "error" && "bg-[#FF2E00] text-white border-2 border-black brutal-shadow-mini"
           )}>
             {bot.status === "auth-required" ? "Needs Permission" : bot.status}
           </span>
        </div>

        <div className="flex gap-2">
           <button 
            onClick={(e) => { e.stopPropagation(); onSelect(bot); }}
            className="p-3 bg-black border-2 border-white/20 text-white hover:border-[#D4FF00] hover:text-[#D4FF00] transition-all brutal-shadow-mini hover:-translate-y-1 active:translate-y-0" 
            title="Configure Unit"
          >
            <Layers className="w-5 h-5" />
          </button>

          {bot.status === "auth-required" ? (
            <button 
              onClick={(e) => { e.stopPropagation(); onConnect(bot.type, typeDef?.authType || "oauth"); }}
              className="p-3 bg-black border-2 border-[#FF00FF] text-[#FF00FF] hover:bg-[#FF00FF] hover:text-black transition-all brutal-shadow-mini hover:-translate-y-1" 
              title="Authenticate"
            >
              <Key className="w-5 h-5" />
            </button>
          ) : bot.status === "online" ? (
            <button 
              onClick={(e) => { e.stopPropagation(); onUpdateStatus(bot.id, "offline"); }}
              className="p-3 bg-black border-2 border-white/20 text-white hover:bg-[#FF2E00] hover:border-black hover:text-white transition-all brutal-shadow-mini hover:-translate-y-1" 
              title="Deactivate"
            >
              <Square className="w-5 h-5" />
            </button>
          ) : (
            <button 
              onClick={(e) => { e.stopPropagation(); onUpdateStatus(bot.id, "online"); }}
              className="p-3 bg-black border-2 border-[#D4FF00] text-[#D4FF00] hover:bg-[#D4FF00] hover:text-black transition-all brutal-shadow-mini hover:-translate-y-1" 
              title="Activate"
            >
              <Play className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
