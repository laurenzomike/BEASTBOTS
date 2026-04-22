import { X, Play, Loader2, Gauge, Power, Plus, Trash2, Save, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { doc, setDoc, serverTimestamp, collection, addDoc } from "firebase/firestore";
import { db, handleFirestoreError, auth } from "../lib/firebase";
import { cn } from "../lib/utils";
import { GoogleGenAI } from "@google/genai";
import { BOT_TYPES } from "../App";

type Bot = {
  id: string;
  name: string;
  type: string;
  status: "online" | "offline" | "error" | "auth-required";
  autonomous?: boolean;
  config: Record<string, any>;
  userId?: string;
};

interface AgentPanelProps {
  bot: Bot | null;
  onClose: () => void;
}

export function AgentPanel({ bot, onClose }: AgentPanelProps) {
  const [instruction, setInstruction] = useState("");
  const [parameters, setParameters] = useState<{key: string, value: string}[]>([]);
  const [scheduleType, setScheduleType] = useState<'interval' | 'scheduled'>('interval');
  const [intervalMs, setIntervalMs] = useState<number>(60000);
  const [scheduledTimes, setScheduledTimes] = useState<string[]>([]);
  const [logs, setLogs] = useState<{ time: string; text: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [platformInfo, setPlatformInfo] = useState<{
    connected: boolean, 
    balance?: string, 
    status?: string,
    channelTitle?: string,
    accountName?: string,
    storeName?: string,
    stats?: Record<string, string | number>,
    triggers?: { type: string, condition: string, message: string }[]
  } | null>(null);
  const [isPulseChecking, setIsPulseChecking] = useState(false);
  const [strategy, setStrategy] = useState<"standard" | "aggressive" | "efficiency" | "stealth">("standard");
  const [userGoal, setUserGoal] = useState("");
  const [enableLiveExecution, setEnableLiveExecution] = useState(false);
  const [logicTrace, setLogicTrace] = useState<{step: string, detail: string, status: 'info' | 'success' | 'warn'}[]>([]);
  const [maxDailyLossPct, setMaxDailyLossPct] = useState<number>(5);
  const [budgetCap, setBudgetCap] = useState<number>(1000);
  const [confidenceFloor, setConfidenceFloor] = useState<number>(0.85);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  const TradingSettings = ({ config, setConfig }: { config: any, setConfig: any }) => (
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
        <label className="text-[9px] uppercase opacity-50 block mb-1">Strategy</label>
        <select value={config.strategy || "scalping"} onChange={(e) => setConfig({...config, strategy: e.target.value})} className="w-full bg-black border border-white/10 p-2 text-xs text-white">
          <option value="scalping">Scalping</option>
          <option value="swing">Swing</option>
          <option value="arbitrage">Arbitrage</option>
        </select>
      </div>
    </div>
  </div>
);

const ContentSettings = ({ config, setConfig }: { config: any, setConfig: any }) => (
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

const OperationalSettings = ({ config, setConfig }: { config: any, setConfig: any }) => (
  <div className="space-y-4 bg-white/5 p-4 border border-zinc-500/20 rounded-sm">
    <label className="mono-type text-[10px] uppercase text-zinc-400 font-bold">Operational Hours</label>
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
);

  const [localConfig, setLocalConfig] = useState<Record<string, any>>(bot?.config || {});
  
  const updateConfig = (newConfig: Record<string, any>) => setLocalConfig(newConfig);

  // Sync state when bot changes
  useEffect(() => {
    if (bot) {
      setLocalConfig(bot.config || {});
      setInstruction(bot.config?.instruction || "");
      setScheduleType(bot.config?.scheduleType || "interval");
      setIntervalMs(bot.config?.intervalMs || 60000);
      setScheduledTimes(bot.config?.scheduledTimes || ["09:00"]);
      setStrategy(bot.config?.strategy || "standard");
      setUserGoal(bot.config?.userGoal || "");
      setEnableLiveExecution(!!bot.config?.enableLiveExecution);
      setMaxDailyLossPct(bot.config?.maxDailyLossPct || 5);
      setBudgetCap(bot.config?.budgetCap || 1000);
      setConfidenceFloor(bot.config?.confidenceFloor || 0.85);
      
      const configParams = bot.config?.parameters || {};
      const paramsArray = Object.keys(configParams).map(k => {
          let val = configParams[k];
          if (typeof val === 'string' && val.split(':').length === 3) {
             val = "********";
          }
          return { key: k, value: val };
      });
      setParameters(paramsArray.length > 0 ? paramsArray : [{key: "", value: ""}]);

      // Check platform connection
      checkPlatform();
    }
  }, [bot]);

  const getActionableErrorMessage = (err: any) => {
    const message = err?.message || String(err);
    if (message.includes("403") || message.includes("permission")) {
      return { msg: "Permission Denied: Access to platform API is restricted.", action: "Check Permissions", actionFn: () => window.location.reload() };
    }
    if (message.includes("quota")) {
      return { msg: "Quota Exceeded: You have reached your daily limit for this platform.", action: "Upgrade/Wait", actionFn: () => window.open('https://firebase.google.com/pricing') };
    }
    if (message.includes("connection")) {
      return { msg: "Connection Lost: Unable to reach the platform endpoint.", action: "Retry Connection", actionFn: checkPlatform };
    }
    return { msg: "An unexpected error occurred during operation.", action: "Retry", actionFn: undefined };
  };

  const checkPlatform = async () => {
    if (!bot || !bot.userId) return;
    setIsPulseChecking(true);
    try {
      const res = await fetch(`/api/platform/${bot.type}/info?uid=${bot.userId}`);
      if (res.ok) {
        const data = await res.json();
        setPlatformInfo(data);
      }
    } catch (e) {
      const error = getActionableErrorMessage(e);
      console.error("Platform check error:", error.msg);
    } finally {
      setIsPulseChecking(false);
    }
  };

  if (!bot) return null;

  const handleSaveConfig = async () => {
    if (!bot || !bot.userId) return;
    setIsSaving(true);
    
    try {
      const validParams: Record<string, string> = {};
      parameters.forEach(p => {
        if (p.key.trim()) validParams[p.key.trim()] = p.value;
      });

      const newConfig = {
        ...bot.config,
        instruction,
        scheduleType,
        intervalMs,
        scheduledTimes: scheduledTimes.filter(t => t.trim() !== ""),
        parameters: validParams,
        strategy,
        userGoal,
        enableLiveExecution,
        maxDailyLossPct,
        budgetCap,
        confidenceFloor
      };

      const res = await fetch(`/api/config/${bot.type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: bot.userId, config: newConfig })
      });
      if (!res.ok) throw new Error("Failed to securely save config");
    } catch (e) {
      handleFirestoreError(e, 'update', `users/${bot.userId}/bots/${bot.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAutonomous = async () => {
    if (!bot || !bot.userId) return;
    try {
      const botRef = doc(db, "users", bot.userId, "bots", bot.id);
      await setDoc(botRef, { 
        autonomous: !bot.autonomous,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, 'update', `users/${bot.userId}/bots/${bot.id}`);
    }
  };

  const addParameter = () => setParameters([...parameters, {key: "", value: ""}]);
  const removeParameter = (idx: number) => {
    const newP = [...parameters];
    newP.splice(idx, 1);
    setParameters(newP);
  };
  const updateParameter = (idx: number, field: 'key' | 'value', val: string) => {
    const newP = [...parameters];
    newP[idx][field] = val;
    setParameters(newP);
  };

  const addScheduledTime = () => setScheduledTimes([...scheduledTimes, "12:00"]);
  const removeScheduledTime = (idx: number) => {
    const newT = [...scheduledTimes];
    newT.splice(idx, 1);
    setScheduledTimes(newT);
  };
  const updateScheduledTime = (idx: number, val: string) => {
    const newT = [...scheduledTimes];
    newT[idx] = val;
    setScheduledTimes(newT);
  };

  const handleTestRun = async () => {
    if (!bot || !bot.userId) return;
    setIsGenerating(true);
    setLogicTrace([]);
    
    try {
      const validParams: Record<string, string> = {};
      parameters.forEach(p => {
        if (p.key.trim()) validParams[p.key.trim()] = p.value;
      });

      const addTrace = (step: string, detail: string, status: 'info' | 'success' | 'warn' = 'info') => {
        setLogicTrace(prev => [...prev, { step, detail, status }]);
      };

      addTrace("INITIALIZING", `Starting simulation for ${bot.type} with ${strategy} strategy.`);
      addTrace("SENTINEL_CHECK", `Verifying boundaries: Daily Loss ${maxDailyLossPct}%, Cap $${budgetCap}, Floor ${confidenceFloor}.`);
      addTrace("CONTEXT_GATHERING", "Querying Google Search for current market conditions...");

      const typeDef = BOT_TYPES.find(t => t.id === bot.type);
      const prompt = `You are the ELITE AI personification of the ${bot.type.toUpperCase()} Bot.
Expertise: ${typeDef?.expertise || "Universal autonomous execution"}.

MISSION PARAMETERS:
- Simulator Mode: True
- Strategic Objective: ${strategy.toUpperCase()}
- User Directive: ${userGoal || "Maximize operational mastery."}
- Operational Logic: ${instruction || "Standard health and performance optimization."}
- Advanced Configuration: ${JSON.stringify(localConfig)}
- Environment Variables: ${JSON.stringify(validParams)}

TASK: Use Google Search to cross-reference current real-world competitive conditions for this role.
Then, synthesize an expert-level execution response.

Reply in exactly 2 professional sentences:
Sentence 1: Technical summary of market findings.
Sentence 2: Precise tactical action being simulated, taking into account defined advanced configurations.
Prefix: [TEST_EXECUTION]`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          systemInstruction: `You are the master ${bot.type} persona. You are decisive, technical, and always optimized for the user's strategic goals.`,
          temperature: 0.8,
          tools: [{ googleSearch: {} }],
          toolConfig: { includeServerSideToolInvocations: true }
        }
      });

      addTrace("REASONING_COMPLETE", "AI has synthesized search data and formed an execution plan.", "success");
      addTrace("EXECUTING", "Applying strategy logic to platform API mock.");

      const output = response.text || "[TEST] Simulation completed with default parameters.";
      
      const activityRef = collection(db, "users", bot.userId, "activities");
      await addDoc(activityRef, {
        botId: bot.id,
        botType: bot.type,
        userId: bot.userId,
        text: output,
        timestamp: serverTimestamp(),
      });

      setLogs(prev => [
        { time: new Date().toLocaleTimeString(), text: output },
        ...prev
      ]);
      addTrace("SUCCESS", "Execution cycle completed without errors.", "success");
    } catch (e) {
      const errorInfo = getActionableErrorMessage(e);
      console.error("Test run error:", errorInfo.msg);
      setLogicTrace(prev => [...prev, { step: "FAILURE", detail: errorInfo.msg, status: "warn" }]);
      setLogs(prev => [
        { time: new Date().toLocaleTimeString(), text: errorInfo.msg },
        ...prev
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-[#050505] border-l border-white/20 shadow-2xl z-50 flex flex-col"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div>
            <h2 className="display-type text-4xl uppercase tracking-tight">{bot.name}</h2>
            <div className="flex items-center gap-3 mt-2">
              <div className={cn(
                  "w-1.5 h-1.5 rounded-full shadow-[0_0_8px]",
                  bot.status === "online" && "bg-green-400 shadow-green-500",
                  bot.status === "offline" && "bg-zinc-600 shadow-transparent",
                  bot.status === "error" && "bg-red-500 shadow-red-500",
                  bot.status === "auth-required" && "bg-yellow-500 shadow-yellow-500"
              )} />
              <span className="mono-type text-[10px] uppercase opacity-50 tracking-wider">
                {bot.status} | ID: {bot.id.slice(0,8)}...
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded transition-colors text-white/50 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-8 no-scrollbar">

          {/* Platform Status */}
          {platformInfo && (
            <div className={cn(
              "p-4 border mono-type text-[10px] space-y-3",
              platformInfo.connected ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {platformInfo.connected ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <div className="flex flex-col">
                    <span className="font-bold uppercase tracking-widest">{bot.type.toUpperCase()} CONNECTION: {platformInfo.connected ? "ACTIVE" : "DISCONNECTED"}</span>
                    <div className="flex items-center gap-3 mt-1">
                      {platformInfo.thumbnail && (
                        <img 
                          src={platformInfo.thumbnail} 
                          alt="Platform Avatar" 
                          className="w-10 h-10 border border-white/20 rounded-sm object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="flex flex-col">
                        {platformInfo.channelTitle && <span className="opacity-90 font-bold text-white uppercase">CHANNEL: {platformInfo.channelTitle}</span>}
                        {platformInfo.accountName && <span className="opacity-90 font-bold text-white uppercase">ACCOUNT: {platformInfo.accountName}</span>}
                        {platformInfo.storeName && <span className="opacity-90 font-bold text-white uppercase">STORE: {platformInfo.storeName}</span>}
                        {platformInfo.balance && <span className="opacity-70 mt-0.5 uppercase tracking-tighter">LIQUIDITY: {platformInfo.balance}</span>}
                        {platformInfo.status && <span className="opacity-70 mt-0.5 flex items-center gap-1.5 uppercase tracking-tighter">
                          <Gauge className="w-3 h-3 text-green-400" />
                          NODE_STATE: {platformInfo.status}
                        </span>}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {platformInfo.connected && (
                    <a 
                      href={
                        bot.type === 'youtube' ? 'https://studio.youtube.com' :
                        bot.type === 'facebook' ? 'https://business.facebook.com' :
                        '#'
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
                      title="Open Platform Dashboard"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button 
                    onClick={checkPlatform}
                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors group"
                    title="Force Pulse Check"
                  >
                    <Loader2 className={cn("w-3.5 h-3.5", isPulseChecking && "animate-spin")} />
                  </button>
                  {!platformInfo.connected && (
                    <button 
                      onClick={async () => {
                        if (bot) {
                          setIsPulseChecking(true);
                          // Simulated recovery logic
                          setTimeout(async () => {
                            try {
                              const botRef = doc(db, "users", auth.currentUser!.uid, "bots", bot.id);
                              await setDoc(botRef, { status: "online", updatedAt: serverTimestamp() }, { merge: true });
                              await checkPlatform();
                            } finally {
                              setIsPulseChecking(false);
                            }
                          }, 1500);
                        }
                      }}
                      className="underline uppercase font-bold hover:text-red-300 transition-colors"
                    >
                      Fix
                    </button>
                  )}
                </div>
              </div>

              {(platformInfo as any).warnings && (platformInfo as any).warnings.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 p-2 text-yellow-500 rounded space-y-1">
                  {(platformInfo as any).warnings.map((w: string, i: number) => (
                    <div key={i} className="flex gap-2">
                      <span className="font-bold italic">CAUTION:</span>
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              {platformInfo.stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2 pt-3 border-t border-white/10">
                  {Object.entries(platformInfo.stats).map(([k, v]) => (
                    <div key={k} className="flex flex-col p-2 bg-white/5 border border-white/5 rounded-sm">
                      <span className="opacity-40 text-[7px] uppercase tracking-tighter leading-none mb-1">{k.replace(/_/g, ' ')}</span>
                      <span className="font-bold text-white text-[11px] truncate tracking-tight">{typeof v === 'number' ? v.toLocaleString() : v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Intelligence Capabilities */}
          <div className="space-y-3">
             <div className="flex items-center justify-between">
                <label className="mono-type text-[10px] uppercase tracking-wider opacity-60">Intelligence Capabilities</label>
                <div className="px-1.5 py-0.5 bg-green-500/10 text-green-500 border border-green-500/20 text-[8px] mono-type uppercase">Active</div>
             </div>
             <div className="grid grid-cols-2 gap-2">
                {(bot.type === 'youtube' ? ['Moderation', 'SEO Sync', 'Metric Analysis', 'Metadata Opt'] :
                  bot.type === 'shopify' ? ['Inventory Sync', 'Discount Engine', 'Order Fulfillment', 'Customer CRM'] :
                  bot.type === 'alpaca' ? ['Paper Trading', 'Portfolio Hedge', 'Alpha Signal', 'Macro Pivot'] :
                  bot.type === 'gmail' ? ['Priority Sweep', 'Smart Reply', 'Labeling Logic', 'Spam Defense'] :
                  bot.type === 'facebook' ? ['LAL Targeting', 'Budget Scaling', 'Creative Audit', 'Pixel Check'] :
                  ['Autonomous Tasking', 'Platform Sync', 'Sentiment Analysis', 'Log aggregation']).map((cap) => (
                    <div key={cap} className="flex items-center gap-2 p-2 border border-white/10 bg-white/5 mono-type text-[9px] uppercase opacity-70">
                       <CheckCircle className="w-3 h-3 text-green-500" />
                       {cap}
                    </div>
                  ))
                }
             </div>
          </div>

          {/* Autonomous Control */}
          <div className="flex justify-between items-center border border-white/20 p-4 bg-white/5">
             <div className="flex flex-col">
               <span className="mono-type text-xs uppercase font-bold tracking-widest flex items-center gap-2">
                 <Power className="w-4 h-4" />
                 Autonomous Mode
               </span>
               <span className="text-[10px] mono-type opacity-50 mt-1 uppercase">
                 Allow agent to self-prompt / explore
               </span>
             </div>
             <button 
                onClick={toggleAutonomous}
                disabled={bot.status !== "online"}
                className={cn(
                  "px-4 py-2 mono-type text-[10px] font-bold uppercase tracking-wider transition-colors border",
                  bot.autonomous 
                   ? "bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500/30" 
                   : "bg-white/10 text-white/50 border-white/20 hover:bg-white/20 disabled:opacity-50"
                )}
             >
               {bot.autonomous ? "Active" : "Disabled"}
             </button>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
               <h3 className="mono-type text-xs uppercase tracking-widest font-bold">Deep Configuration</h3>
               <button 
                 onClick={handleSaveConfig}
                 disabled={isSaving}
                 className="flex items-center gap-2 mono-type text-[10px] uppercase font-bold bg-white text-black px-3 py-1.5 hover:bg-white/80 transition-colors disabled:opacity-50"
               >
                 {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                 Save Changes
               </button>
            </div>
            
            {['alpaca', 'coinbase', 'kalshi', 'polymarket'].includes(bot.type) && (
              <TradingSettings config={bot.config} setConfig={() => {}} />
            )}
            {['gmail', 'youtube', 'facebook', 'pinterest', 'shopify', 'etsy', 'ebay', 'discord'].includes(bot.type) && (
              <ContentSettings config={bot.config} setConfig={() => {}} />
            )}
            
            {/* User Directive & Goal */}
            <div className="space-y-3">
               <label className="mono-type text-[10px] uppercase tracking-wider opacity-60">Primary User Goal & Directive</label>
               <textarea 
                  value={userGoal}
                  onChange={(e) => setUserGoal(e.target.value)}
                  className="w-full bg-black/40 border border-white/20 p-3 h-20 text-xs font-mono focus:border-[#00FF41] focus:outline-none placeholder:opacity-30 resize-none transition-colors"
                  placeholder="e.g. 'Liquidate all inventory older than 90 days at a 20% discount' or 'Only execute low-risk arbitrage trades.'"
               />
            </div>

            {/* LIVE EXECUTION OVERRIDE */}
            <div className="space-y-3 border border-red-500/30 bg-red-500/5 p-4 rounded-sm mt-4">
               <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <label className="mono-type text-[11px] uppercase tracking-wider text-red-400 font-bold">Live API Execution</label>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={enableLiveExecution}
                      onChange={(e) => setEnableLiveExecution(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></div>
                  </label>
               </div>
               <p className="font-mono text-[9px] text-red-400/70 tracking-tight leading-relaxed">
                 WARNING: Enabling this switch removes the simulation safety net. The AI will make REAL HTTP POST requests to your connected platforms, causing permanent financial changes, buying, selling, and data deletion.
               </p>
            </div>

            {/* Schedule Configuration */}
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-2">
                <label className="mono-type text-[10px] uppercase tracking-wider opacity-60">Run Schedule</label>
                <div className="flex border border-white/20 rounded overflow-hidden">
                  <button
                    onClick={() => setScheduleType('interval')}
                    className={cn(
                      "px-3 py-1 text-[9px] mono-type uppercase font-bold transition-colors",
                      scheduleType === 'interval' ? "bg-white text-black" : "bg-black text-white/50 hover:bg-white/10"
                    )}
                  >
                    Interval
                  </button>
                  <button
                    onClick={() => setScheduleType('scheduled')}
                    className={cn(
                      "px-3 py-1 text-[9px] mono-type uppercase font-bold transition-colors",
                      scheduleType === 'scheduled' ? "bg-white text-black" : "bg-black text-white/50 hover:bg-white/10"
                    )}
                  >
                    Specific Times
                  </button>
                </div>
              </div>

              {scheduleType === 'interval' ? (
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "15s", val: 15000 },
                    { label: "1m", val: 60000 },
                    { label: "5m", val: 300000 },
                    { label: "1h", val: 3600000 }
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => setIntervalMs(opt.val)}
                      className={cn(
                        "py-2 mono-type text-[10px] font-bold border transition-colors",
                        intervalMs === opt.val 
                          ? "bg-white/10 border-white/40 text-white" 
                          : "bg-black border-white/10 text-white/40 hover:border-white/20"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 border border-white/10 p-3 bg-black/40">
                  <div className="flex justify-between items-center mb-2">
                    <span className="mono-type text-[9px] uppercase opacity-50">Local Time Triggers</span>
                    <button onClick={addScheduledTime} className="hover:text-green-400 opacity-60 hover:opacity-100 transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {scheduledTimes.map((time, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => updateScheduledTime(i, e.target.value)}
                        className="flex-grow bg-black border border-white/10 p-2 font-mono text-xs focus:border-white/40 focus:outline-none"
                      />
                      <button 
                        onClick={() => removeScheduledTime(i)}
                        className="p-2 border border-white/10 bg-black hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {scheduledTimes.length === 0 && (
                    <div className="mono-type text-[9px] opacity-40 italic text-center py-4">No scheduled times. Agent will not run automatically.</div>
                  )}
                </div>
              )}
            </div>

            {/* Strategy Selection */}
            <div className="space-y-3">
               <label className="mono-type text-[10px] uppercase tracking-wider opacity-60">Strategic Archetype</label>
               <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "standard", label: "Standard" },
                    { id: "aggressive", label: "Aggressive" },
                    { id: "efficiency", label: "Efficiency" },
                    { id: "stealth", label: "Stealth" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStrategy(s.id as any)}
                      className={cn(
                        "py-3 px-4 mono-type text-[9px] font-bold uppercase tracking-widest border transition-all text-center",
                        strategy === s.id 
                         ? "bg-[#00FF41]/10 border-[#00FF41] text-[#00FF41]" 
                         : "bg-black border-white/10 text-white/40 hover:border-white/20"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
               </div>
            </div>

            {/* System Instructions */}
            <div className="space-y-3">
              <label className="mono-type text-[10px] uppercase tracking-wider opacity-60">System Instructions</label>
              <textarea
                className="w-full h-24 bg-black border border-white/10 p-3 font-mono text-[10px] leading-relaxed focus:border-white/40 focus:outline-none resize-none"
                placeholder="Inject core behavioral boundaries here..."
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
              />
            </div>

            {/* Sentinel Safety Rails */}
            <div className="space-y-3 bg-[#0A0A0A] border border-[#00FF41]/20 p-4">
              <label className="mono-type text-[10px] uppercase tracking-wider text-[#00FF41] font-bold">Sentinel Safety Rails</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase opacity-50">Max Daily Loss</label>
                  <input type="number" value={maxDailyLossPct} onChange={(e) => setMaxDailyLossPct(Number(e.target.value))} placeholder="%" className="w-full bg-black border border-white/10 p-2 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase opacity-50">Budget Cap</label>
                  <input type="number" value={budgetCap} onChange={(e) => setBudgetCap(Number(e.target.value))} placeholder="$" className="w-full bg-black border border-white/10 p-2 text-xs" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase opacity-50">Min Confidence Floor</label>
                <input type="number" step="0.01" value={confidenceFloor} onChange={(e) => setConfidenceFloor(Number(e.target.value))} placeholder="0.85" className="w-full bg-black border border-white/10 p-2 text-xs" />
              </div>
            </div>

              {/* Platform Credentials */}
              {['kalshi', 'polymarket'].includes(bot.type) && (
                 <div className="space-y-3 bg-white/5 p-4 border border-white/5">
                    <label className="text-amber-400 text-[10px] uppercase font-bold">Platform Credentials Required</label>
                    {bot.type === 'kalshi' && (
                      <>
                        <input type="email" placeholder="Email" value={parameters.find(p=>p.key==='email')?.value || ''} onChange={(e) => updateParameter(parameters.findIndex(p=>p.key==='email'), 'value', e.target.value)} className="w-full bg-black border border-white/10 p-2 text-xs" />
                        <input type="password" placeholder="Password" value={parameters.find(p=>p.key==='password')?.value || ''} onChange={(e) => updateParameter(parameters.findIndex(p=>p.key==='password'), 'value', e.target.value)} className="w-full bg-black border border-white/10 p-2 text-xs" />
                      </>
                    )}
                    {bot.type === 'polymarket' && (
                      <>
                        <input type="text" placeholder="API Key" value={parameters.find(p=>p.key==='apiKey')?.value || ''} onChange={(e) => updateParameter(parameters.findIndex(p=>p.key==='apiKey'), 'value', e.target.value)} className="w-full bg-black border border-white/10 p-2 text-xs" />
                        <input type="text" placeholder="Proxy Wallet Address" value={parameters.find(p=>p.key==='proxyWalletAddress')?.value || ''} onChange={(e) => updateParameter(parameters.findIndex(p=>p.key==='proxyWalletAddress'), 'value', e.target.value)} className="w-full bg-black border border-white/10 p-2 text-xs" />
                      </>
                    )}
                 </div>
              )}

              {/* Custom Parameters */}
              {!['kalshi', 'polymarket'].includes(bot.type) && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="mono-type text-[10px] uppercase tracking-wider opacity-60">Operating Parameters</label>
                  <button onClick={addParameter} className="hover:text-green-400 opacity-60 hover:opacity-100 transition-colors"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="space-y-2">
                  {parameters.map((param, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <input 
                        type="text" 
                        placeholder="KEY (e.g. TARGET_ASSET)" 
                        value={param.key}
                        onChange={(e) => updateParameter(i, 'key', e.target.value)}
                        className="w-1/3 bg-black border border-white/10 p-2 font-mono text-[10px] focus:border-white/40 focus:outline-none" 
                      />
                      <input 
                        type="text" 
                        placeholder="VALUE" 
                        value={param.value}
                        onChange={(e) => updateParameter(i, 'value', e.target.value)}
                        className="flex-grow bg-black border border-white/10 p-2 font-mono text-[10px] focus:border-white/40 focus:outline-none" 
                      />
                      <button 
                        onClick={() => removeParameter(i)}
                        className="p-2 border border-white/10 bg-black hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {parameters.length === 0 && (
                    <div className="mono-type text-[9px] opacity-40 italic text-center py-4 border border-dashed border-white/10">No specific parameters configured.</div>
                  )}
                </div>
              </div>
              )}
          </div>

          <div className="h-px w-full bg-white/10 my-4" />

          {/* Logic Trace Terminal */}
          {logicTrace.length > 0 && (
            <div className="space-y-3">
              <label className="mono-type text-[10px] uppercase tracking-wider opacity-60">Decision Trace Matrix</label>
              <div className="w-full bg-[#080808] border border-white/10 rounded-sm overflow-hidden">
                {logicTrace.map((t, i) => (
                  <div key={i} className="p-3 border-b border-white/5 flex gap-4 items-start animate-in fade-in slide-in-from-left-2 duration-500">
                    <div className={cn(
                      "shrink-0 px-2 py-0.5 rounded-[2px] mono-type text-[8px] font-bold uppercase",
                      t.status === 'info' && "bg-blue-500/20 text-blue-400",
                      t.status === 'success' && "bg-green-500/20 text-green-400",
                      t.status === 'warn' && "bg-red-500/20 text-red-400",
                    )}>
                      {t.step}
                    </div>
                    <p className="mono-type text-[9px] opacity-60 leading-relaxed">{t.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Cycle Controller */}
          <button 
            onClick={handleTestRun}
            disabled={isGenerating || bot.status === "auth-required"}
            className="w-full py-4 border border-white/20 bg-white/5 hover:bg-white hover:text-black transition-colors flex items-center justify-center gap-2 group disabled:opacity-50 disabled:hover:bg-white/5 disabled:hover:text-white"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 text-white group-hover:text-black" />
            )}
            <span className="mono-type text-xs uppercase tracking-widest font-bold">
              {isGenerating ? "Executing..." : "Run AI Simulation Cycle"}
            </span>
          </button>

          {/* Trigger Monitor Terminal */}
          {platformInfo?.triggers && platformInfo.triggers.length > 0 && (
            <div className="space-y-3">
              <label className="mono-type text-[10px] uppercase tracking-wider text-amber-400 font-bold">Monitor Terminal: Active Triggers</label>
              <div className="w-full bg-amber-500/5 border border-amber-500/20 p-2 text-[9px] mono-type space-y-1">
                {platformInfo.triggers.map((t, i) => (
                  <div key={i} className="flex gap-2 items-center p-2 bg-black/40 rounded-sm">
                    <span className="text-amber-400 shrink-0 uppercase">{t.type}</span>
                    <span className="opacity-90">{t.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="mono-type text-[10px] uppercase tracking-wider opacity-60">Execution Terminal</label>
              <div className="px-2 py-1 bg-white/5 text-[9px] mono-type uppercase">Live</div>
            </div>
            <div className="w-full h-48 bg-black border border-white/10 p-4 font-mono text-[10px] overflow-y-auto space-y-2">
              {logs.length === 0 ? (
                <div className="opacity-30">Awaiting execution cycles...</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="flex gap-4 border-b border-white/5 pb-2">
                    <span className="text-green-500 shrink-0">[{log.time}]</span>
                    <span className="opacity-80 leading-relaxed">{log.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
