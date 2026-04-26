import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function PerformanceChart({ data }: { data: { time: string; yield: number }[] }) {
  return (
    <div className="w-full h-32 md:h-48 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--brand)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            dataKey="time" 
            stroke="rgba(255,255,255,0.3)" 
            fontSize={8} 
            tickLine={false} 
            axisLine={false}
          />
          <YAxis hide />
          <Tooltip 
            contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px' }}
            itemStyle={{ color: 'var(--brand)' }}
          />
          <Area 
            type="monotone" 
            dataKey="yield" 
            stroke="var(--brand)"
            fillOpacity={1} 
            fill="url(#colorYield)" 
            strokeWidth={1}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
