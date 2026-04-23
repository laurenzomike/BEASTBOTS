import React from "react";
import { ShieldAlert, Zap, BarChart3 } from "lucide-react";
import { Bot, Activity } from "../types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface AuditViewProps {
  bots: Bot[];
  activities: Activity[];
}

export const AuditView: React.FC<AuditViewProps> = ({ bots, activities }) => {
  const strategicAnalysis = activities.filter(a => a.type === 'analysis');
  const totalWins = bots.reduce((acc, curr) => acc + (curr.config?.winCount || 0), 0);

  const [chartMode, setChartMode] = React.useState<'activity' | 'efficiency'>('activity');

  const errors = activities.filter(a => a.type === 'error').length;
  const reliability = activities.length > 0 ? Math.max(0, 100 - (errors / activities.length * 100)).toFixed(1) : "100";

  // Prepare data for activity by bot type
  const botStats = activities.reduce((acc: any, curr) => {
    acc[curr.botType] = (acc[curr.botType] || 0) + 1;
    return acc;
  }, {});

  const efficiencyData = bots.map(b => ({
    name: b.type,
    wins: b.config?.winCount || 0,
    activity: botStats[b.type] || 0,
    ratio: botStats[b.type] ? ((b.config?.winCount || 0) / botStats[b.type] * 100).toFixed(1) : 0
  })).sort((a, b) => Number(b.ratio) - Number(a.ratio));

  const intelLogs = activities.filter(a => a.botId === 'fleet-intelligence');

  const chartData = Object.entries(botStats).map(([name, value]) => ({ name, value }));

  return (
    <div className="p-8 lg:p-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto">
      {/* ... header remains ... */}
      <div className="flex flex-col md:flex-col lg:flex-row lg:items-center justify-between gap-6 border-b-[4px] border-white pb-10">
        <div className="flex items-center gap-6">
          <div className="bg-[#FF2E00] p-4 brutal-shadow border-[4px] border-white">
            <ShieldAlert className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="font-display text-4xl md:text-6xl font-black uppercase text-white tracking-widest leading-none">Fleet Audit</h2>
            <p className="font-mono text-[10px] text-[var(--brand)] font-black uppercase mt-2 tracking-[0.3em]">Institutional grade analysis of autonomous agent performance.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="bg-black border-2 border-white/20 p-4 brutal-shadow text-center min-w-[120px] flex-grow md:flex-grow-0">
             <span className="block text-[var(--brand)] text-2xl font-black">{bots.filter(b => b.status === 'online').length}</span>
             <span className="block text-[10px] text-white/50 uppercase font-bold text-nowrap">Active Units</span>
          </div>
          <div className="bg-black border-2 border-white/20 p-4 brutal-shadow text-center min-w-[120px] flex-grow md:flex-grow-0">
            <span className="block text-[var(--accent)] text-2xl font-black">{totalWins}</span>
            <span className="block text-[10px] text-white/50 uppercase font-bold text-nowrap">Total Wins</span>
          </div>
          <div className="bg-black border-2 border-white/20 p-4 brutal-shadow text-center min-w-[120px] flex-grow md:flex-grow-0">
            <span className="block text-white text-2xl font-black">{reliability}%</span>
            <span className="block text-[10px] text-white/50 uppercase font-bold text-nowrap">Reliability</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 border-[4px] border-black brutal-shadow group hover:scale-[1.02] transition-all">
          <span className="mono-type text-[9px] font-black uppercase opacity-60 block mb-2 text-black">Bot Memory</span>
          <span className="text-4xl font-sans font-black text-black tracking-tighter">SECURED</span>
          <p className="mt-3 font-mono text-[9px] font-bold text-black opacity-60 leading-tight">Bot context is isolated per neural link.</p>
        </div>
        <div className="bg-[var(--brand)] p-6 border-[4px] border-black brutal-shadow group hover:scale-[1.02] transition-all">
          <span className="mono-type text-[9px] font-black uppercase opacity-60 block mb-2 text-black">Goal Progress</span>
          <span className="text-4xl font-sans font-black text-black tracking-tighter">PHASE_1</span>
          <p className="mt-3 font-mono text-[9px] font-bold text-black opacity-60 leading-tight">Fleet is currently optimizing towards $ directive.</p>
        </div>
        <div className="bg-black p-6 border-[4px] border-white brutal-shadow-red group hover:scale-[1.02] transition-all text-white">
          <span className="mono-type text-[9px] font-black uppercase opacity-60 block mb-2">Sync Health</span>
          <span className="text-4xl font-sans font-black text-[#FF2E00] tracking-tighter">NOMINAL</span>
          <p className="mt-3 font-mono text-[9px] font-bold opacity-60 leading-tight">All systems functioning within defined parameters.</p>
        </div>
        <div className="bg-[var(--accent)] p-6 border-[4px] border-black brutal-shadow group hover:scale-[1.02] transition-all">
          <span className="mono-type text-[9px] font-black uppercase opacity-60 block mb-2 text-white">Grid Coverage</span>
          <span className="text-4xl font-sans font-black text-white tracking-tighter">GLOBAL</span>
          <p className="mt-3 font-mono text-[9px] font-bold text-white/60 leading-tight">{bots.filter(b => b.status === "online").length}/14 nodes currently reporting live.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 xl:col-span-8 bg-[#0A0A0A] border-[4px] border-white p-8 brutal-shadow">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
             <div className="flex items-center gap-4">
                <BarChart3 className="w-8 h-8 text-[var(--brand)]" />
                <h3 className="font-display text-2xl font-black uppercase tracking-tighter text-white">Performance Analytics</h3>
             </div>
             <div className="flex bg-white/5 border-2 border-white/10 p-1">
                <button 
                  onClick={() => setChartMode('activity')}
                  className={`px-4 py-2 text-[9px] font-black uppercase transition-all ${chartMode === 'activity' ? 'bg-[var(--brand)] text-black' : 'text-white/40 hover:text-white'}`}
                >
                  Log Volume
                </button>
                <button 
                  onClick={() => setChartMode('efficiency')}
                  className={`px-4 py-2 text-[9px] font-black uppercase transition-all ${chartMode === 'efficiency' ? 'bg-[var(--brand)] text-black' : 'text-white/40 hover:text-white'}`}
                >
                  Win Efficiency
                </button>
             </div>
          </div>

          <div className="h-[400px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               {chartMode === 'activity' ? (
                  <BarChart data={chartData}>
                    <XAxis 
                      dataKey="name" 
                      stroke="#666" 
                      fontSize={10} 
                      tickFormatter={(val) => val.toUpperCase()}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis stroke="#666" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#000', border: '2px solid #D4FF00', borderRadius: '0', color: '#fff' }}
                      itemStyle={{ color: '#D4FF00', fontSize: '12px', fontWeight: 'bold' }}
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <Bar dataKey="value" fill="#D4FF00">
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#D4FF00' : '#FF2E00'} />
                        ))}
                    </Bar>
                  </BarChart>
               ) : (
                  <BarChart data={efficiencyData} layout="vertical">
                    <XAxis type="number" stroke="#666" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      stroke="#666" 
                      fontSize={10} 
                      tickFormatter={(val) => val.toUpperCase()} 
                      axisLine={false}
                      tickLine={false}
                      width={80}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#000', border: '2px solid #D4FF00', borderRadius: '0', color: '#fff' }}
                      itemStyle={{ color: '#D4FF00', fontSize: '12px', fontWeight: 'bold' }}
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <Bar dataKey="ratio" name="Efficiency %" fill="#00D1FF" radius={[0, 4, 4, 0]}>
                      {efficiencyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={Number(entry.ratio) > 5 ? '#D4FF00' : '#444'} />
                      ))}
                    </Bar>
                  </BarChart>
               )}
             </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-12 xl:col-span-4 bg-[#FF2E00]/10 border-[4px] border-[#FF2E00] p-8 brutal-shadow overflow-hidden relative group">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Zap className="w-48 h-48 animate-pulse" />
           </div>
           <div className="relative z-10 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-2 h-2 bg-[#FF2E00] animate-ping" />
                 <h3 className="font-display text-2xl font-black uppercase text-[#FF2E00]">Strategic Evolution</h3>
              </div>
              <p className="mono-type text-[9px] font-black uppercase text-[#FF2E00] mb-8 leading-tight">
                Collective intelligence broadcasted via fleet-wide neural links. Patterns detected by one are shared with all.
              </p>
              
              <div className="flex-grow space-y-4 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                {intelLogs.length === 0 ? (
                  <div className="border border-[#FF2E00]/20 p-6 text-center opacity-40">
                     <span className="mono-type text-[8px] uppercase font-black italic">No strategic updates detected yet.</span>
                  </div>
                ) : (
                  intelLogs.map((log, i) => (
                    <div key={i} className="border-l-2 border-[#FF2E00] bg-black/40 p-4 hover:bg-[#FF2E00]/20 transition-colors">
                       <span className="block mono-type text-[8px] uppercase text-[#FF2E00] opacity-60 mb-2">{log.timestamp?.toDate().toLocaleTimeString()}</span>
                       <p className="text-[10px] text-white/90 font-bold leading-relaxed">{log.text}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-[#FF2E00]/20">
                 <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black uppercase text-[#FF2E00]">Synaptic Sync Status</span>
                    <span className="text-[10px] font-mono text-white font-black uppercase bg-[#FF2E00] px-2">ACTIVE</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-[#1A1A1A] border-[4px] border-white brutal-shadow p-10 text-white overflow-hidden relative">
        <Zap className="absolute top-[-20px] right-[-20px] w-64 h-64 text-white/5 pointer-events-none" />
        <h3 className="font-display text-3xl font-black uppercase tracking-tighter border-b-2 border-white/20 pb-4 mb-8">Recent Activity</h3>
        <div className="space-y-6 relative z-10">
          {strategicAnalysis.length === 0 ? (
            <p className="text-sm font-mono opacity-40 uppercase italic">Waiting for bots to do something...</p>
          ) : (
            strategicAnalysis.slice(0, 5).map((act, i) => (
              <div key={i} className="flex gap-6 items-start border-l-[3px] border-[var(--brand)] pl-6 py-2 bg-white/5">
                <span className="mono-type text-[10px] font-black text-[var(--brand)] opacity-60 mt-1">[{act.timestamp?.toDate().toLocaleTimeString()}]</span>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase opacity-100 bg-white text-black px-2 self-start mb-2">{act.botType}</span>
                  <p className="font-sans text-sm font-bold opacity-80 leading-snug">{act.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="p-8 border-[4px] border-dashed border-white/20 text-center">
        <p className="text-sm font-mono font-bold text-white/40 uppercase tracking-[0.5em]">End of Global Fleet Audit Log</p>
      </div>
    </div>
  );
};
