import React from "react";
import { Bot, BotType } from "../types";
import { BOT_TYPES } from "../constants";
import { cn } from "../lib/utils";
import { Layers, Key, Square, Play, Trophy } from "lucide-react";

interface BotCardProps {
  bot: Bot;
  index: number;
  onSelect: (bot: Bot) => void;
  onUpdateStatus: (id: string, status: any) => void;
  onConnect: (type: string, authType: string) => void;
  isExecuting?: boolean;
}

export const BotCard: React.FC<BotCardProps> = ({ bot, index, onSelect, onUpdateStatus, onConnect, isExecuting }) => {
  const typeDef = BOT_TYPES.find(t => t.id === bot.type);
  const words = bot.name.split(' ');
  const firstWord = words.shift();
  const restWords = words.join(' ');

  return (
    <div 
      className="grid-cell flex flex-col justify-between group min-h-[300px] border-[3px] border-white/20 hover:border-white transition-all rounded-none brutal-shadow hover:-translate-y-1 bg-[#0A0A0A] hover:bg-black overflow-hidden relative"
    >
      {/* Decorative scanning line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-[var(--accent)] opacity-0 group-hover:opacity-100 group-hover:animate-bounce shadow-[0_0_20px_var(--accent)] transition-opacity z-10" />
      
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
           <span className="mono-type text-[10px] bg-white text-black px-2 py-0.5 group-hover:bg-[var(--brand)] transition-colors font-black uppercase border-2 border-black">BOT_{bot.type}</span>
           <span className="mono-type text-[11px] opacity-100 font-black text-white/40">
             {(index + 1).toString().padStart(2, '0')}
           </span>

           <div className="grid grid-cols-3 gap-[1px] w-6 h-6 ml-4">
             {[...Array(9)].map((_, i) => (
               <div key={i} className="bg-[var(--brand)] w-full h-full" style={{animation: `pulse ${Math.random() * 2 + 0.5}s infinite`}}></div>
             ))}
           </div>
        </div>
        <div className="flex items-center gap-3">
          {bot.config?.winCount > 0 && (
             <div className="flex items-center gap-1 px-2 py-0.5 bg-[var(--accent)] text-white mono-type text-[8px] uppercase font-black border-2 border-black brutal-shadow">
                <Trophy className="w-2.5 h-2.5" />
                <span>{bot.config.winCount}</span>
             </div>
          )}
          {isExecuting && (
             <div className="px-2 py-0.5 bg-white text-black animate-pulse mono-type text-[8px] uppercase font-black border-2 border-black brutal-shadow">Thinking...</div>
          )}
          {bot.autonomous && bot.status === "online" && (
             <div className="px-2 py-0.5 bg-[var(--brand)] text-black mono-type text-[8px] uppercase font-black border-2 border-black brutal-shadow group-hover:animate-pulse">Active</div>
          )}
          <div className={cn(
            "w-4 h-4 border-2 border-black brutal-shadow",
            bot.status === "online" && "bg-[var(--brand)]",
            bot.status === "offline" && "bg-[#333333]",
            bot.status === "error" && "bg-[#FF2E00]",
            bot.status === "auth-required" && "bg-[#FF00FF]"
          )} />
        </div>
      </div>
      
      <h2 className="display-type text-4xl md:text-5xl font-black uppercase mt-8 leading-none mix-blend-difference group-hover:mix-blend-normal text-white group-hover:text-[var(--brand)] transition-colors">
        {firstWord}<br />{restWords}
      </h2>
      <p className="font-sans text-xs font-black mt-3 uppercase border-b-[3px] border-white/20 group-hover:border-[var(--brand)] pb-2 inline-block transition-colors">
        {typeDef?.role || "Unknown"}
      </p>

      <div className="mt-4 p-4 border-[3px] border-white/10 group-hover:border-white bg-black transition-all">
        <span className="font-sans text-[10px] font-black uppercase opacity-60 block mb-2 text-white">What it does</span>
        <p className="mono-type text-[11px] leading-tight text-white/80 font-bold h-8 overflow-hidden">
          {typeDef && 'expertise' in typeDef ? typeDef.expertise : "General Operations"}
        </p>
      </div>

      <div className="flex-grow" />
      
      <div className="mt-8 flex justify-between items-end gap-2 border-t-[3px] border-white/10 group-hover:border-white pt-4 transition-all">
        <span className={cn(
          "font-sans text-[11px] px-2 py-1 uppercase font-black border-[3px] border-transparent transition-all",
          bot.status === "online" && "bg-[var(--brand)] text-black border-black brutal-shadow",
          bot.status === "offline" && "bg-transparent border-white text-white opacity-50",
          bot.status === "auth-required" && "bg-black text-[#FF00FF] border-[#FF00FF] brutal-shadow",
          bot.status === "error" && "bg-[var(--accent)] text-white border-black brutal-shadow-red"
        )}>
          {bot.status === "auth-required" ? "Needs Login" : bot.status}
        </span>
        <div className="flex space-x-3">
           <button 
            onClick={() => onSelect(bot)}
            className="p-2 border-[3px] border-white text-white hover:bg-white hover:text-black transition-colors brutal-shadow" 
            title="Settings"
          >
            <Layers className="w-5 h-5" />
          </button>

          {bot.status === "auth-required" ? (
            <button 
              onClick={() => onConnect(bot.type, typeDef?.authType || "oauth")}
              className="p-2 border-[3px] border-[#FF00FF] bg-black text-[#FF00FF] hover:bg-[#FF00FF] hover:text-black transition-colors brutal-shadow" 
              title="Connect Account"
            >
              <Key className="w-5 h-5" />
            </button>
          ) : bot.status === "online" ? (
            <button 
              onClick={() => onUpdateStatus(bot.id, "offline")}
              className="p-2 border-[3px] border-white text-white hover:bg-black hover:border-black hover:animate-pulse transition-colors brutal-shadow" 
              title="Stop Bot"
            >
              <Square className="w-5 h-5" />
            </button>
          ) : (
            <button 
              onClick={() => onUpdateStatus(bot.id, "online")}
              className="p-2 border-[3px] border-[var(--brand)] text-[var(--brand)] bg-black hover:bg-[var(--brand)] hover:text-black transition-colors brutal-shadow" 
              title="Start Bot"
            >
              <Play className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="absolute top-2 left-2 w-2 h-2 rounded-full border border-white/50 flex items-center justify-center"><div className="w-1 h-[1px] bg-white/50 rotate-45"></div></div>
      <div className="absolute top-2 right-2 w-2 h-2 rounded-full border border-white/50 flex items-center justify-center"><div className="w-1 h-[1px] bg-white/50 -rotate-45"></div></div>
      <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full border border-white/50 flex items-center justify-center"><div className="w-1 h-[1px] bg-white/50 -rotate-45"></div></div>
      <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full border border-white/50 flex items-center justify-center"><div className="w-1 h-[1px] bg-white/50 rotate-45"></div></div>

      <div className="h-4 w-full flex gap-[1px] mt-4 opacity-50">
        {Array.from({length: 30}).map((_, i) => (
          <div key={i} className="bg-white h-full flex-grow" style={{opacity: Math.random()}}></div>
        ))}
      </div>
    </div>
  );
};
