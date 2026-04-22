import { ConfigProps } from './TradingSettings';

export interface ContentConfig {
  tone?: string;
}

export const ContentSettings = ({ config, setConfig }: ConfigProps<ContentConfig>) => (
  <div className="space-y-4 bg-white/5 p-4 border border-purple-500/20 rounded-sm">
    <label className="mono-type text-[10px] uppercase text-purple-400 font-bold">Content Tone Settings</label>
    <div>
        <label className="text-[9px] uppercase opacity-50 block mb-1">Target Tone</label>
        <select value={config.tone || "professional"} onChange={(e) => setConfig({...config, tone: e.target.value})} className="w-full bg-black border border-white/10 p-2 text-xs text-white">
          <option value="professional">Professional</option>
          <option value="casual">Casual</option>
          <option value="aggressive">Aggressive</option>
          <option value="witty">Witty</option>
        </select>
    </div>
  </div>
);
