export interface TradingConfig {
  maxPosition?: number;
  profitTarget?: number;
  stopLoss?: number;
  strategy?: string;
  riskTolerance?: number;
  startHour?: number;
  endHour?: number;
  timezone?: string;
}

export interface ConfigProps<T> {
  config: T;
  setConfig: (config: T) => void;
}

export const TradingSettings = ({ config, setConfig }: ConfigProps<TradingConfig>) => (
  <div className="space-y-4 bg-white/5 p-4 border border-blue-500/20 rounded-sm">
    <label className="mono-type text-[10px] uppercase text-blue-400 font-bold">Trading Parameters</label>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="text-[9px] uppercase opacity-50 block mb-1">Max Position Size</label>
        <input type="number" value={config.maxPosition || 0} onChange={(e) => setConfig({...config, maxPosition: Number(e.target.value)})} className="w-full bg-black border border-white/10 p-2 text-xs" />
      </div>
      <div>
        <label className="text-[9px] uppercase opacity-50 block mb-1">Profit Target %</label>
        <input type="number" value={config.profitTarget || 0} onChange={(e) => setConfig({...config, profitTarget: Number(e.target.value)})} className="w-full bg-black border border-white/10 p-2 text-xs" />
      </div>
      <div>
        <label className="text-[9px] uppercase opacity-50 block mb-1">Stop Loss %</label>
        <input type="number" value={config.stopLoss || 0} onChange={(e) => setConfig({...config, stopLoss: Number(e.target.value)})} className="w-full bg-black border border-white/10 p-2 text-xs" />
      </div>
      <div>
        <label className="text-[9px] uppercase opacity-50 block mb-1">Risk Tolerance %</label>
        <input type="number" value={config.riskTolerance || 0} onChange={(e) => setConfig({...config, riskTolerance: Number(e.target.value)})} className="w-full bg-black border border-white/10 p-2 text-xs" />
      </div>
      <div className="col-span-2">
        <label className="text-[9px] uppercase opacity-50 block mb-1">Strategy</label>
        <select value={config.strategy || "scalping"} onChange={(e) => setConfig({...config, strategy: e.target.value})} className="w-full bg-black border border-white/10 p-2 text-xs text-white">
          <option value="scalping">Scalping</option>
          <option value="swing">Swing Trading</option>
          <option value="arbitrage">Arbitrage</option>
        </select>
      </div>
    </div>
    <div className="mt-4 border-t border-white/10 pt-4">
      <label className="mono-type text-[10px] uppercase text-blue-400 font-bold block mb-4">Operational Hours</label>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[9px] uppercase opacity-50 block mb-1">Start Hour (0-23)</label>
          <input type="number" min="0" max="23" value={config.startHour || 0} onChange={(e) => setConfig({...config, startHour: Number(e.target.value)})} className="w-full bg-black border border-white/10 p-2 text-xs" />
        </div>
        <div>
          <label className="text-[9px] uppercase opacity-50 block mb-1">End Hour (0-23)</label>
          <input type="number" min="0" max="23" value={config.endHour || 23} onChange={(e) => setConfig({...config, endHour: Number(e.target.value)})} className="w-full bg-black border border-white/10 p-2 text-xs" />
        </div>
        <div className="col-span-2">
          <label className="text-[9px] uppercase opacity-50 block mb-1">Timezone</label>
          <input type="text" value={config.timezone || "UTC"} onChange={(e) => setConfig({...config, timezone: e.target.value})} className="w-full bg-black border border-white/10 p-2 text-xs" />
        </div>
      </div>
    </div>
  </div>
);
