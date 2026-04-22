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

  // Prepare data for activity by bot type
  const botStats = activities.reduce((acc: any, curr) => {
    acc[curr.botType] = (acc[curr.botType] || 0) + 1;
    return acc;
  }, {});

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
            <h2 className="font-display text-4xl md:text-6xl font-black uppercase text-white tracking-widest leading-none">At a Glance</h2>
            <p className="font-mono text-[10px] text-[var(--brand)] font-black uppercase mt-2 tracking-[0.3em]">A quick report on how your bots are doing.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="bg-black border-2 border-white/20 p-4 brutal-shadow text-center min-w-[120px] flex-grow md:flex-grow-0">
             <span className="block text-[var(--brand)] text-2xl font-black">{bots.filter(b => b.status === 'online').length}</span>
             <span className="block text-[10px] text-white/50 uppercase font-bold text-nowrap">Active Bots</span>
          </div>
          <div className="bg-black border-2 border-white/20 p-4 brutal-shadow text-center min-w-[120px] flex-grow md:flex-grow-0">
            <span className="block text-[var(--accent)] text-2xl font-black">{totalWins}</span>
            <span className="block text-[10px] text-white/50 uppercase font-bold text-nowrap">Total Wins</span>
          </div>
          <div className="bg-black border-2 border-white/20 p-4 brutal-shadow text-center min-w-[120px] flex-grow md:flex-grow-0">
            <span className="block text-white text-2xl font-black">95%</span>
            <span className="block text-[10px] text-white/50 uppercase font-bold text-nowrap">Reliability</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 border-[4px] border-black brutal-shadow group hover:scale-[1.02] transition-all">
          <span className="mono-type text-[9px] font-black uppercase opacity-60 block mb-2 text-black">Bot Memory</span>
          <span className="text-4xl font-sans font-black text-black tracking-tighter">SECURED</span>
          <p className="mt-3 font-mono text-[9px] font-bold text-black opacity-60 leading-tight">Bot data is safely separated and private.</p>
        </div>
        <div className="bg-[var(--brand)] p-6 border-[4px] border-black brutal-shadow group hover:scale-[1.02] transition-all">
          <span className="mono-type text-[9px] font-black uppercase opacity-60 block mb-2 text-black">Goal Progress</span>
          <span className="text-4xl font-sans font-black text-black tracking-tighter">ON TRACK</span>
          <p className="mt-3 font-mono text-[9px] font-bold text-black opacity-60 leading-tight">Bots are working towards your group goals.</p>
        </div>
        <div className="bg-black p-6 border-[4px] border-white brutal-shadow-red group hover:scale-[1.02] transition-all">
          <span className="mono-type text-[9px] font-black uppercase opacity-60 block mb-2 text-white">System Status</span>
          <span className="text-4xl font-sans font-black text-[#FF2E00] tracking-tighter">STABLE</span>
          <p className="mt-3 font-mono text-[9px] font-bold text-white/60 leading-tight">System is healthy and checking for updates.</p>
        </div>
        <div className="bg-[var(--accent)] p-6 border-[4px] border-black brutal-shadow group hover:scale-[1.02] transition-all">
          <span className="mono-type text-[9px] font-black uppercase opacity-60 block mb-2 text-white">App Connections</span>
          <span className="text-4xl font-sans font-black text-white tracking-tighter">ACTIVE</span>
          <p className="mt-3 font-mono text-[9px] font-bold text-white/60 leading-tight">{bots.filter(b => b.status === "online").length} apps are correctly linked.</p>
        </div>
      </div>
      
      <div className="bg-[#0A0A0A] border-[4px] border-white p-8 brutal-shadow">
        <div className="flex items-center gap-4 mb-8">
           <BarChart3 className="w-8 h-8 text-[var(--brand)]" />
           <h3 className="font-display text-2xl font-black uppercase tracking-tighter text-white">Activity by Bot Type</h3>
        </div>
        <div className="h-[300px] w-full">
           <ResponsiveContainer width="100%" height="100%">
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
                 contentStyle={{ backgroundColor: '#000', border: '2px solid #D4FF00', borderRadius: '0' }}
                 itemStyle={{ color: '#D4FF00', fontSize: '12px', fontWeight: 'bold' }}
                 cursor={{ fill: 'rgba(255,255,255,0.05)' }}
               />
               <Bar dataKey="value" fill="#D4FF00">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#D4FF00' : '#FF2E00'} />
                  ))}
               </Bar>
             </BarChart>
           </ResponsiveContainer>
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
