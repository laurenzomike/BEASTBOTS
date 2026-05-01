import React, { useMemo } from "react";
import { ShieldAlert, Zap, BarChart3, TrendingUp, Activity as ActivityIcon, Layers, Cpu, RefreshCw } from "lucide-react";
import { Bot, Activity } from "../types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

interface AuditViewProps {
  bots: Bot[];
  activities: Activity[];
}

export const AuditView: React.FC<AuditViewProps> = ({ bots, activities }) => {
  const [chartMode, setChartMode] = React.useState<'activity' | 'efficiency'>('activity');

  // ⚡ Bolt Optimization:
  // Combined multiple O(N) array traversals (previously multiple .filter and .reduce calls)
  // into a single O(N) pass, and wrapped in useMemo to prevent recalculation on every render
  // (e.g., when chartMode changes). This significantly reduces CPU overhead on large datasets.
  const { strategicAnalysis, intelLogs, errors, botStats, reliability } = useMemo(() => {
    const analysis: Activity[] = [];
    const intel: Activity[] = [];
    let errCount = 0;
    const stats: Record<string, number> = {};

    for (let i = 0; i < activities.length; i++) {
      const a = activities[i];
      if (a.type === 'analysis') {
        analysis.push(a);
      } else if (a.type === 'error') {
        errCount++;
      }

      if (a.botId === 'fleet-intelligence') {
        intel.push(a);
      }

      stats[a.botType] = (stats[a.botType] || 0) + 1;
    }

    const rel = activities.length > 0
      ? Math.max(0, 100 - (errCount / activities.length * 100)).toFixed(1)
      : "100";

    return {
      strategicAnalysis: analysis,
      intelLogs: intel,
      errors: errCount,
      botStats: stats,
      reliability: rel
    };
  }, [activities]);

  const totalWins = useMemo(() =>
    bots.reduce((acc, curr) => acc + (curr.config?.winCount || 0), 0)
  , [bots]);

  const efficiencyData = useMemo(() =>
    bots.map(b => ({
      name: b.type,
      wins: b.config?.winCount || 0,
      activity: botStats[b.type] || 0,
      ratio: botStats[b.type] ? ((b.config?.winCount || 0) / botStats[b.type] * 100).toFixed(1) : 0
    })).sort((a, b) => Number(b.ratio) - Number(a.ratio))
  , [bots, botStats]);

  const chartData = useMemo(() =>
    Object.entries(botStats).map(([name, value]) => ({ name, value }))
  , [botStats]);

  return (
    <div className="flex flex-col gap-16 py-12 px-10 lg:px-14 animate-in fade-in slide-in-from-bottom-6 duration-1000 max-w-screen-2xl mx-auto overflow-hidden">
      {/* Protocol Dashboard Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-white/10 pb-16 gap-12 relative"
      >
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-[var(--brand)] blur-[150px] opacity-10 pointer-events-none" />
        <div className="space-y-8 relative z-10 w-full lg:w-2/3">
          <div className="flex items-center gap-4">
             <div className="w-3 h-3 bg-[var(--brand)] animate-pulse" />
             <span className="mono-type text-[10px] font-black uppercase text-[var(--brand)] tracking-[0.5em] italic">System Audit v3.0</span>
          </div>
          <h2 className="display-type text-5xl lg:text-[7vw] font-black uppercase tracking-tighter leading-[0.8] text-white italic group-hover:not-italic transition-all duration-1000">
            FLEET <br /> <span className="text-white/20">PROTOCOL</span>
          </h2>
          <p className="mono-type text-[13px] font-medium text-white/40 max-w-xl leading-relaxed italic border-l-2 border-white/10 pl-6">
            Autonomous multi-agent neural performance and capital velocity metrics. Fleet integrity verified across all nodes.
          </p>
        </div>
        
        <div className="w-full lg:w-auto grid grid-cols-2 gap-px bg-white/10 border border-white/10">
           <div className="p-10 bg-[#0A0A0A] flex flex-col gap-3 group hover:bg-[#0F0F0F] transition-colors relative overflow-hidden">
              <div className="absolute inset-x-0 bottom-0 h-1 bg-[var(--brand)] scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
              <span className="mono-type text-[10px] font-black uppercase text-white/30 tracking-widest italic">Success_Rate</span>
              <div className="flex items-baseline gap-2 relative z-10">
                 <span className="text-2xl font-black text-white italic tabular-nums leading-none group-hover:not-italic transition-all">{reliability}</span>
                 <span className="text-2xl font-black text-[var(--brand)]">%</span>
              </div>
           </div>
           <div className="p-10 bg-[#0A0A0A] flex flex-col gap-3 group hover:bg-[#0F0F0F] transition-colors relative overflow-hidden border-l border-white/10">
              <div className="absolute inset-x-0 bottom-0 h-1 bg-[var(--brand)] scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
              <span className="mono-type text-[10px] font-black uppercase text-white/30 tracking-widest italic">Neural_Sync</span>
              <span className="text-xl font-black text-white uppercase italic leading-none relative z-10">Optimum</span>
           </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-px bg-white/10 border border-white/10">
        {[
          { label: "Active Nodes", val: bots.filter(b => b.status === "online").length, color: "text-[var(--brand)]" },
          { label: "Total Yield", val: `SHARD_${totalWins}`, color: "text-white" },
          { label: "Stability", val: "NOMINAL", color: "text-white/60" },
          { label: "Memory", val: "ENCRYPTED", color: "text-white/40" },
          { label: "Phase", val: "B3_ST", color: "text-white/30" },
          { label: "Grid Reg", val: "G_01", color: "text-white/20" }
        ].map((s, i) => (
          <div key={i} className="bg-[#050505] p-10 flex flex-col gap-2 hover:bg-white/5 transition-colors group">
            <span className="mono-type text-[9px] font-black uppercase text-white/20 tracking-[0.2em] group-hover:text-white transition-colors uppercase italic">{s.label}</span>
            <span className={cn("text-2xl font-black italic tabular-nums tracking-tighter group-hover:not-italic transition-all", s.color)}>{s.val}</span>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-white/10 border border-white/10">
        <div className="lg:col-span-12 xl:col-span-8 bg-[#050505] p-12 lg:p-16 relative overflow-hidden group border-b xl:border-b-0 xl:border-r border-white/10">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--brand)]/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-1000" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-12 mb-16">
             <div className="flex items-center gap-6">
                <BarChart3 className="w-10 h-10 text-[var(--brand)]" />
                <h3 className="display-type text-4xl lg:text-5xl font-black uppercase tracking-tighter text-white italic">Neural_Load</h3>
             </div>
             <div className="flex bg-white/5 p-1 border border-white/10">
                <button 
                  onClick={() => setChartMode('activity')}
                  className={cn(
                    "px-8 py-3 text-[10px] font-black uppercase transition-all duration-500 italic",
                    chartMode === 'activity' ? 'bg-white text-black' : 'text-white/20 hover:text-white hover:bg-white/5'
                  )}
                >
                  Signals
                </button>
                <button 
                  onClick={() => setChartMode('efficiency')}
                  className={cn(
                    "px-8 py-3 text-[10px] font-black uppercase transition-all duration-500 italic",
                    chartMode === 'efficiency' ? 'bg-white text-black' : 'text-white/20 hover:text-white hover:bg-white/5'
                  )}
                >
                  Ratio
                </button>
             </div>
          </div>

          <div className="h-[450px] w-full pt-10">
             <ResponsiveContainer width="100%" height="100%">
               {chartMode === 'activity' ? (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="name" 
                      stroke="rgba(255,255,255,0.2)" 
                      fontSize={10} 
                      tickFormatter={(val) => val.toUpperCase()}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#020202', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0' }}
                      itemStyle={{ color: 'var(--brand)', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}
                      cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    />
                    <Bar dataKey="value" barSize={60}>
                        {chartData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "var(--brand)" : "rgba(255,255,255,0.1)"} />
                        ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <BarChart data={efficiencyData} layout="vertical">
                    <XAxis type="number" stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      stroke="rgba(255,255,255,0.2)" 
                      fontSize={10} 
                      tickFormatter={(val) => val.toUpperCase()} 
                      axisLine={false}
                      tickLine={false}
                      width={120}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#020202', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0' }}
                      itemStyle={{ color: 'var(--brand)', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}
                    />
                    <Bar dataKey="ratio" name="Efficiency %" barSize={32}>
                      {efficiencyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={Number(entry.ratio) > 5 ? "var(--brand)" : "rgba(255,255,255,0.1)"} />
                      ))}
                    </Bar>
                  </BarChart>
               )}
             </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-12 xl:col-span-4 bg-[#050505] p-12 lg:p-16 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity rotate-12 scale-150">
              <Zap className="w-64 h-64 text-[var(--accent)]" />
           </div>
           <div className="relative z-10 h-full flex flex-col">
              <div className="flex items-center justify-between mb-12">
                 <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-[var(--accent)] animate-pulse" />
                    <h3 className="display-type text-4xl font-black uppercase text-white italic tracking-tighter">BEAST_Intel</h3>
                 </div>
                 <Cpu className="w-6 h-6 text-white/20" />
              </div>
              
              <div className="flex-grow space-y-8 overflow-y-auto max-h-[450px] pr-4 custom-scrollbar">
                {intelLogs.length === 0 ? (
                  <div className="border border-white/10 p-16 text-center opacity-20 bg-white/[0.02] flex flex-col items-center gap-4">
                     <RefreshCw className="w-8 h-8 animate-spin" />
                     <span className="mono-type text-[10px] uppercase font-black italic tracking-[0.3em]">SYNCHRONIZING_CORE...</span>
                  </div>
                ) : (
                  intelLogs.map((log, i) => (
                    <div key={i} className="border-l-4 border-[var(--accent)] bg-white/5 p-8 group/log hover:bg-white/10 transition-all duration-700 relative">
                       <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/log:opacity-40 transition-opacity">
                          <ShieldAlert className="w-4 h-4" />
                       </div>
                       <span className="block mono-type text-[10px] uppercase text-[var(--accent)] font-black mb-4 italic tracking-widest">[{log.timestamp?.toDate().toLocaleTimeString()}]</span>
                       <p className="mono-type text-[15px] text-white/70 group-hover/log:text-white leading-relaxed font-bold transition-colors">{log.text}</p>
                    </div>
                  ))
                )}
              </div>
           </div>
        </div>
      </div>

      <div className="bg-[#050505] border border-white/10 p-12 lg:p-16 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-16 opacity-5 scale-150 rotate-45 pointer-events-none">
           <Layers className="w-80 h-80" />
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-16 border-b border-white/10 pb-10 relative z-10 gap-8">
           <h3 className="display-type text-xl lg:text-2xl font-black uppercase tracking-tighter text-white italic">Recent_Signals</h3>
           <div className="flex items-center gap-4">
              <ActivityIcon className="w-6 h-6 text-[var(--brand)] animate-pulse" />
              <span className="mono-type text-[10px] font-black uppercase text-white/20 tracking-[0.4em]">Node_Stream: ACTIVE</span>
           </div>
        </div>
        <div className="grid grid-cols-1 gap-4 relative z-10">
          {strategicAnalysis.length === 0 ? (
            <p className="mono-type text-sm font-black text-white/10 uppercase italic tracking-[0.5em] text-center py-32 bg-white/[0.02] border border-dashed border-white/10">SYSTEM_QUIET</p>
          ) : (
            strategicAnalysis.slice(0, 8).map((act, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-10 items-start border-l border-white/10 pl-10 py-6 bg-white/[0.01] group/item hover:bg-white/5 transition-all duration-500 relative"
              >
                <div className="absolute left-0 top-0 w-[1px] h-0 group-hover/item:h-full bg-[var(--brand)] transition-all duration-700" />
                <span className="mono-type text-[12px] font-black text-[var(--brand)] opacity-30 tabular-nums italic">0{i+1}</span>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                     <span className="mono-type text-[10px] font-black uppercase bg-white/10 text-white/60 px-4 py-1.5 tracking-widest italic group-hover/item:bg-[var(--brand)] group-hover/item:text-black transition-all">{act.botType}</span>
                     <span className="mono-type text-[10px] font-black uppercase text-white/15 tabular-nums">[{act.timestamp?.toDate().toLocaleTimeString()}]</span>
                  </div>
                  <p className="mono-type text-lg font-bold text-white/50 group-hover/item:text-white leading-relaxed transition-all italic selection:bg-[var(--brand)] selection:text-black">{act.text}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <div className="py-20 flex flex-col items-center gap-6 opacity-20">
        <div className="w-px h-24 bg-white" />
        <p className="mono-type text-[10px] font-black text-white uppercase tracking-[1em]">SYSTEM_END_AUDIT</p>
      </div>
    </div>
  );
};
