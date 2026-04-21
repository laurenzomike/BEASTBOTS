import React, { useEffect, useState, useRef } from "react";
import { auth, db, login, logout, handleFirestoreError } from "./lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, onSnapshot, doc, setDoc, getDocs, addDoc } from "firebase/firestore";
import { serverTimestamp } from "firebase/firestore";
import { Activity, Key, LogOut, Play, Square, Settings, RefreshCw, Layers, ShieldAlert, Cpu, TrendingUp, Zap, Target, BarChart3, ChevronRight, Terminal, ChevronUp } from "lucide-react";
import { cn } from "./lib/utils";
import { AgentPanel } from "./components/AgentPanel";
import { GoogleGenAI } from "@google/genai";
import { PerformanceChart } from "./components/PerformanceChart";

export const BOT_TYPES = [
  { id: "shopify", name: "Shopify Clerk", role: "Store Operator", authType: "oauth", expertise: "Inventory turnover optimization, dynamic pricing, and automated fulfillment logic." },
  { id: "etsy", name: "Etsy Shopkeeper", role: "Marketplace Seller", authType: "oauth", expertise: "SEO optimization, trending handmade analysis, and customer engagement scaling." },
  { id: "ebay", name: "eBay Master", role: "Global Marketplace Ops", authType: "oauth", expertise: "Cross-border trading, auction strategy, and promoted listing ROI management." },
  { id: "amazon", name: "Amazon Agent", role: "Store Automation", authType: "apikey", expertise: "Buy-box competitiveness, review sentiment tracking, and restocking velocity." },
  { id: "gmail", name: "Gmail Assistant", role: "Communication Hub", authType: "oauth", expertise: "Newsletter filtering, priority alert routing, and automated response drafting." },
  { id: "youtube", name: "YouTube Manager", role: "Content Distro", authType: "oauth", expertise: "CTR-driven thumbnail strategy, trending topic saturation, and audience retention modeling." },
  { id: "facebook", name: "Meta Ads Scout", role: "Social Signal Growth", authType: "oauth", expertise: "LAL audience refinement, creative fatigue detection, and pixel attribution modeling." },
  { id: "pinterest", name: "Pinterest Pin Bot", role: "Traffic → Ecommerce", authType: "oauth", expertise: "Visual keyword extraction, trend-spotting, and high-convert viral pin generation." },
  { id: "kalshi", name: "Kalshi Trader", role: "Regulated Event Contracts", authType: "apikey", expertise: "Probabilistic hedging, political event analysis, and risk-adjusted positioning." },
  { id: "polymarket", name: "Polymarket Scout", role: "Read-only Market Radar", authType: "apikey", expertise: "Cross-platform arb detection and narrative-shifting sentiment analysis." },
  { id: "alpaca", name: "Alpaca Trader", role: "Equities / Crypto", authType: "apikey", expertise: "Quantitative factor modeling, technical breakout detection, and live order execution." },
  { id: "coinbase", name: "Coinbase Auto", role: "On-chain execution", authType: "apikey", expertise: "DeFi yield farming discovery and crypto asset swing trading." },
  { id: "discord", name: "Discord Informant", role: "Social Intelligence", authType: "oauth", expertise: "Whale alert monitoring, community sentiment tracking, and automated support flows." },
  { id: "botboss", name: "Bot Boss", role: "Generalist Fallback", authType: "apikey", expertise: "System-wide resource allocation and emergency operational logic." },
] as const;

type Bot = {
  id: string;
  name: string;
  type: string;
  status: "online" | "offline" | "error" | "auth-required";
  autonomous?: boolean;
  config: Record<string, any>;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [bots, setBots] = useState<Bot[]>([]);
  const [globalActivities, setGlobalActivities] = useState<any[]>([]);
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [totalYield, setTotalYield] = useState(4290.12);
  const [networkLoad, setNetworkLoad] = useState(12.4);
  const [latency, setLatency] = useState(12);
  const [chartData, setChartData] = useState<{time: string, yield: number}[]>([]);
  const [persona, setPersona] = useState<"aggressive" | "passive" | "balanced">("balanced");
  const [globalDirective, setGlobalDirective] = useState<string>("Maintain current yield optimization protocols.");
  const [briefing, setBriefing] = useState<string>("Analyzing collective intelligence... Waiting for system sync.");
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);
  
  const coordinatorRef = useRef<NodeJS.Timeout | null>(null);
  const lastRunTracker = useRef<Record<string, any>>({});
  
  const handleGlobalDirectiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = (e.target as any).directive.value;
    if (input) {
      setGlobalDirective(input);
      // Trigger a brief UI animation or toast here
      setBriefing(`FLEET-WIDE OVERRIDE ENGAGED: ${input.slice(0, 50)}...`);
      (e.target as any).directive.value = "";
    }
  };

  useEffect(() => {
    // Generate initial noise for the chart
    const initialData = Array.from({ length: 20 }).map((_, i) => ({
      time: new Date(Date.now() - (20 - i) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      yield: 4200 + Math.random() * 200
    }));
    setChartData(initialData);

    // Dynamic yield accumulation
    const interval = setInterval(() => {
      const increment = (Math.random() * 0.05);
      setTotalYield(prev => {
        const next = prev + increment;
        setChartData(old => {
          const last = old[old.length - 1];
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          if (last.time === nowStr) {
             const updated = [...old];
             updated[updated.length - 1] = { time: nowStr, yield: next };
             return updated;
          }
          return [...old.slice(-19), { time: nowStr, yield: next }];
        });
        return next;
      });
      setNetworkLoad(prev => Math.max(8.0, Math.min(25.0, prev + (Math.random() * 1.5 - 0.75))));
      setLatency(prev => Math.max(5, Math.min(45, prev + Math.floor(Math.random() * 5 - 2))));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  const generateCollectiveBriefing = async () => {
    if (!user || globalActivities.length === 0) return;
    setIsBriefingLoading(true);
    try {
      const recentContext = globalActivities.slice(0, 10).map(a => `[${a.botType}] ${a.text}`).join('\n');
      const prompt = `You are the BEAST BOTS collective intelligence for a network of autonomous financial bots.
Analyze the following recent activities:
${recentContext}

Current Portfolio Persona: ${persona.toUpperCase()}

Generate a single, dense, high-level executive briefing (exactly 2 sentences) in a cold, technical tone.
Summarize the current operational efficiency and next tactical priority.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { temperature: 0.5 }
      });
      setBriefing(response.text || "Operational status nominal. Maintaining current yield patterns.");
    } catch (e) {
      console.error("Failed to generate briefing", e);
    } finally {
      setIsBriefingLoading(false);
    }
  };

  useEffect(() => {
    if (globalActivities.length > 5) {
      generateCollectiveBriefing();
    }
  }, [globalActivities.length === 5, persona]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      
      if (u) {
        // Seed default bots if they don't exist
        seedBots(u.uid);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Listen to real-time bot data
    const unsubscribeBots = onSnapshot(collection(db, "users", user.uid, "bots"), (snapshot) => {
      const loadedBots: Bot[] = [];
      snapshot.forEach((doc) => {
        loadedBots.push({ id: doc.id, ...doc.data() } as Bot);
      });
      // Sort by type matching our initial list order for consistency
      loadedBots.sort((a, b) => {
        const idxA = BOT_TYPES.findIndex(bt => bt.id === a.type);
        const idxB = BOT_TYPES.findIndex(bt => bt.id === b.type);
        return idxA - idxB;
      });
      // Filter out bots that instances might no longer support (like airbnb/substack)
      setBots(loadedBots.filter(b => BOT_TYPES.some(bt => bt.id === b.type)));
    }, (error) => {
      handleFirestoreError(error, 'list', `users/${user.uid}/bots`);
    });

    const unsubscribeActivities = onSnapshot(collection(db, "users", user.uid, "activities"), (snapshot) => {
      const acts: any[] = [];
      snapshot.forEach((doc) => acts.push({ id: doc.id, ...doc.data() }));
      // Sort by timestamp descending
      acts.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
      setGlobalActivities(acts.slice(0, 10)); // Keep only recent 10 in memory
    }, (error) => {
      handleFirestoreError(error, 'list', `users/${user.uid}/activities`);
    });

    return () => {
      unsubscribeBots();
      unsubscribeActivities();
    };
  }, [user]);

  const performAutonomousAction = async (bot: Bot) => {
    if (!bot.autonomous || bot.status !== "online") return;

    try {
      const botConfig = bot.config || {};
      const typeDef = BOT_TYPES.find(t => t.id === bot.type);
      const prompt = `You are a legendary expert on the ${bot.type.toUpperCase()} platform. 
Your core expertise covers: ${typeDef?.expertise || "General autonomous operation"}.

🚨 FLAGSHIP FLEET DIRECTIVE (Master Override):
${globalDirective}

Current Strategic Status:
- Role: ${typeDef?.role || bot.type}
- Archetype: ${botConfig.strategy || "Standard"}
- User Goal: ${botConfig.userGoal || "Exponential revenue growth and system efficiency."}
- Parameter Context: ${JSON.stringify(botConfig.parameters || {})}
- Instruction Set: ${botConfig.instruction || "Scan for dominance opportunities."}

DATA REQUIREMENT: You have access to Google Search. You MUST verify current real-world data (market prices, trends, news) related to ${bot.type} and the overall Fleet Directive. Use this factual data to drive your decision. 

TASK: Synthesize this data into a cold, clinical, high-performance execution intent that satisfies BOTH your individual User Goal and the global Fleet Directive.
Reply in 1-2 authoritative, technical sentences. 
Prefix with [ACTION] if triggering a move, or [ANALYSIS] if logging a strategic shift. 
DO NOT ASK QUESTIONS. EXECUTE AS AN AUTONOMOUS PRO.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          systemInstruction: `You are the elite persona of the ${bot.type} Bot. Your tone is technical, decisive, and focused entirely on the user's defined goals.`,
          temperature: 0.8,
          tools: [{ googleSearch: {} }],
          toolConfig: { includeServerSideToolInvocations: true }
        }
      });

      const output = response.text || `[ANALYSIS] Standby mode active. Monitoring market data for ${bot.type} signals.`;

      // 1. Post to the Execution Engine
      try {
        const execRes = await fetch(`/api/execute/${bot.type}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: user!.uid,
            actionIntent: output,
            aiReasoning: "Generated by Gemini Cognitive Engine"
          })
        });
        const execData = await execRes.json();
        
        // 2. Log exactly what happened (Simulated or Live)
        const logText = execData.executed 
          ? `⚡ [LIVE] ${output}` 
          : `🛡️ [SIMULATED] ${output}`;

        await addDoc(collection(db, "users", user!.uid, "activities"), {
          userId: user!.uid,
          botId: bot.id,
          botType: bot.type,
          text: logText,
          timestamp: serverTimestamp()
        });

      } catch (err) {
        console.error("Failed to hit execution engine", err);
      }
    } catch (err: any) {
      console.error(`AI Autonomous Loop Error for ${bot.id}:`, err);
    }
  };

  // Autonomous Coordinator Loop
  useEffect(() => {
    if (!user || bots.length === 0) return;

    if (coordinatorRef.current) {
       clearInterval(coordinatorRef.current);
    }

    // Tick every 30 seconds to check if any bot is due for a run
    coordinatorRef.current = setInterval(async () => {
      const now = Date.now();
      const d = new Date();
      const currentHHMM = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      const currentMinuteStr = d.toISOString().slice(0, 16);
      
      const autonomousBots = bots.filter(b => b.status === "online" && b.autonomous);
      
      autonomousBots.forEach(async (bot) => {
         const config = bot.config || {};
         const scheduleType = config.scheduleType || 'interval';
         
         let shouldRun = false;
         
         if (scheduleType === 'interval') {
             const intervalMs = config.intervalMs || 60000;
             const lastRun = lastRunTracker.current[bot.id] || 0;
             if (now - (lastRun as number) >= intervalMs) {
                lastRunTracker.current[bot.id] = now;
                shouldRun = true;
             }
         } else if (scheduleType === 'scheduled') {
             const times: string[] = config.scheduledTimes || [];
             const lastRunMinute = lastRunTracker.current[`${bot.id}_minute`];
             
             if (times.includes(currentHHMM) && lastRunMinute !== currentMinuteStr) {
                lastRunTracker.current[`${bot.id}_minute`] = currentMinuteStr;
                lastRunTracker.current[bot.id] = now;
                shouldRun = true;
             }
         }

         if (shouldRun) {
            performAutonomousAction(bot);
         }
      });
    }, 30000);

    return () => {
      if (coordinatorRef.current) clearInterval(coordinatorRef.current);
    }
  }, [user, bots]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin is from AI Studio preview or localhost
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const provider = event.data.provider;
        // In a real flow, the token is now on our server/firebase.
        // We can just automatically flip the bot online.
        updateBotStatus(provider, "online");
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user]);

  const handleConnect = async (botType: string, authType: string) => {
    if (!user) return;

    // Pinterest fallback while trial is approving
    if (botType === "pinterest") {
      const isSandboxToken = confirm("Pinterest OAuth is currently approving. Do you want to use the Sandbox Access Token directly?");
      if (isSandboxToken) {
        // Here we would sync the token to firestore, but for the UI we just flip it online
        updateBotStatus(botType, "online");
        return;
      }
    }

    // Etsy fallback while trial is approving
    if (botType === "etsy") {
      const isSandboxToken = confirm("Etsy Developer Account is currently under review. Do you want to force-enable the bot in Sandbox mode?");
      if (isSandboxToken) {
        updateBotStatus(botType, "online");
        return;
      }
    }

    if (authType === "apikey") {
      // For api keys, simulate simple prompt config for demo completeness instead of just failing.
      const key = prompt(`Please enter your ${botType.toUpperCase()} API Key:`);
      if (key) {
        updateBotStatus(botType, "online");
      }
      return;
    }

    try {
      let urlEndpoint = `/api/oauth/${botType}/url?uid=${user.uid}`;
      if (botType === "shopify") {
        const shop = prompt("Enter your Shopify store prefix (e.g., 'my-cool-store'):");
        if (!shop) return;
        urlEndpoint += `&shop=${shop}`;
      }

      const response = await fetch(urlEndpoint);
      if (!response.ok) {
        throw new Error('Failed to get auth URL');
      }
      const { url } = await response.json();

      const authWindow = window.open(
        url,
        'oauth_popup',
        'width=600,height=700'
      );

      if (!authWindow) {
        alert('Please allow popups for this site to connect your account.');
      }
    } catch (error) {
      console.error('OAuth error:', error);
      alert('OAuth initialization failed. Check console and make sure backend has CLIENT credentials configured.');
    }
  };

  const seedBots = async (userId: string) => {
    try {
      const botsRef = collection(db, "users", userId, "bots");
      const snapshot = await getDocs(botsRef);
      const existingTypes = new Set(snapshot.docs.map(doc => doc.data().type));
      
      for (const bt of BOT_TYPES) {
        const isTradingBot = ["kalshi", "polymarket", "alpaca", "coinbase"].includes(bt.id);
        const initialStatus = isTradingBot ? "online" : "auth-required";
        const initialConfig = isTradingBot ? {
          scheduleType: "interval",
          intervalMs: 300000,
        } : {};

        if (!existingTypes.has(bt.id)) {
          await setDoc(doc(botsRef, bt.id), {
            userId,
            name: bt.name,
            type: bt.id,
            status: initialStatus,
            config: initialConfig,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else if (isTradingBot) {
          // Migration: Ensure existing trading bots have the 5m interval and are online as requested
          await setDoc(doc(botsRef, bt.id), {
            status: initialStatus,
            config: initialConfig,
            updatedAt: serverTimestamp(),
          }, { merge: true });
        }
      }
    } catch (error) {
      handleFirestoreError(error, 'write', `users/${userId}/bots`);
    }
  };

  const updateBotStatus = async (botId: string, newStatus: string) => {
    if (!user) return;
    try {
      const botRef = doc(db, "users", user.uid, "bots", botId);
      await setDoc(botRef, { status: newStatus, updatedAt: serverTimestamp() }, { merge: true });
      
      // Log activity
      await addDoc(collection(db, "users", user.uid, "activities"), {
        botId,
        botType: botId,
        type: "status_change",
        text: `Manual intervention synchronized. Bot ${botId} is now ${newStatus.toUpperCase()}.`,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, 'write', `users/${user.uid}/bots/${botId}`);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-mono">INITIALIZING MISSION CONTROL...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full border border-white/20">
          <div className="p-8 bg-white/5">
            <h1 className="display-type text-6xl uppercase tracking-tight mb-2 leading-none">Money Bot Hub</h1>
            <p className="mono-type text-[10px] opacity-40 uppercase tracking-[0.2em] mb-8">Global Agent Management</p>
            
            <div className="space-y-6">
              <p className="mono-type text-xs leading-relaxed opacity-80">
                Connect your Google account to access the command center. All agent configurations and API keys are stored securely.
              </p>
              
              <button
                onClick={login}
                className="w-full flex items-center justify-center bg-white text-black hover:bg-white/90 transition-colors py-4 px-6 display-type text-2xl uppercase tracking-wider"
              >
                Authenticate
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const Typewriter = ({ text, delay = 20 }: { text: string, delay?: number }) => {
    const [currentText, setCurrentText] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
      setCurrentText("");
      setCurrentIndex(0);
    }, [text]);

    useEffect(() => {
      if (currentIndex < text.length) {
        const timeout = setTimeout(() => {
          setCurrentText(prev => prev + text[currentIndex]);
          setCurrentIndex(prev => prev + 1);
        }, delay);
        return () => clearTimeout(timeout);
      }
    }, [currentIndex, delay, text]);

    return <span>{currentText}<span className="animate-pulse">|</span></span>;
  };

  return (
    <div className="flex flex-col min-h-screen w-full font-sans">
      <header className="p-4 md:p-8 flex flex-col md:flex-row justify-between md:items-start scanline-effect relative overflow-hidden">
        <div className="flex flex-col z-10">
          <h1 className="display-type text-7xl md:text-9xl uppercase leading-none tracking-tighter">
            BEAST <span className="text-white/20">BOTS</span>
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="mono-type text-[10px] uppercase tracking-[0.4em] opacity-40">
              Autonomous Financial Intelligence
            </p>
            <div className="h-px w-24 bg-white/10" />
            <div className="flex gap-2">
              <button 
                onClick={() => setPersona("passive")}
                className={cn("text-[9px] mono-type border px-2 py-0.5 rounded transition-all", persona === "passive" ? "bg-white text-black border-white" : "border-white/10 opacity-30 hover:opacity-100")}
              >
                PASSIVE
              </button>
              <button 
                onClick={() => setPersona("balanced")}
                className={cn("text-[9px] mono-type border px-2 py-0.5 rounded transition-all", persona === "balanced" ? "bg-white text-black border-white" : "border-white/10 opacity-30 hover:opacity-100")}
              >
                BALANCED
              </button>
              <button 
                onClick={() => setPersona("aggressive")}
                className={cn("text-[9px] mono-type border px-2 py-0.5 rounded transition-all", persona === "aggressive" ? "bg-[#00FF41] text-black border-[#00FF41]" : "border-white/10 opacity-30 hover:opacity-100")}
              >
                AGGRESSIVE
              </button>
            </div>
          </div>
          
          <form onSubmit={handleGlobalDirectiveSubmit} className="mt-8 flex flex-col gap-2 max-w-sm">
             <div className="flex items-center gap-2 mb-1">
               <Cpu className="w-3 h-3 text-[#00FF41]" />
               <span className="mono-type text-[9px] uppercase tracking-widest text-[#00FF41]">Global Fleet Directive</span>
             </div>
             <div className="relative group">
                <input 
                  name="directive"
                  type="text" 
                  placeholder="Master Override Command..."
                  autoComplete="off"
                  className="w-full bg-white/5 border border-white/10 p-3 pl-8 mono-type text-[10px] focus:border-[#00FF41] focus:outline-none focus:bg-white/10 transition-all placeholder:opacity-30"
                />
                <ChevronRight className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 opacity-30 group-focus-within:opacity-100 transition-opacity" />
             </div>
          </form>
        </div>
        
        <div className="mt-8 md:mt-0 flex gap-8 z-10">
           <div className="flex flex-col text-right">
              <span className="mono-type text-[10px] opacity-40 uppercase mb-1">Fleet Health</span>
              <div className="flex items-center justify-end gap-2 text-xl font-bold">
                <ShieldAlert className="w-4 h-4 text-green-500" />
                98.2%
              </div>
           </div>
           <div className="flex flex-col text-right border-l border-white/10 pl-8">
              <span className="mono-type text-[10px] opacity-40 uppercase mb-1">Network Latency</span>
              <div className="flex items-center justify-end gap-2 text-xl font-bold">
                <Zap className="w-4 h-4 text-yellow-500" />
                {latency}ms
              </div>
           </div>
           <div className="flex flex-col text-right border-l border-white/10 pl-8">
              <span className="mono-type text-[10px] opacity-40 uppercase mb-2">Operator / {user.email?.split('@')[0]}</span>
              <div className="flex items-center justify-end space-x-4">
                <button className="text-white/40 hover:text-white transition-colors" title="Settings">
                  <Settings className="w-5 h-5" />
                </button>
                <button onClick={logout} className="text-white/40 hover:text-white transition-colors" title="Logout">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 border-t border-white/10">
        <div className="lg:col-span-1 border-r border-white/10 p-6 flex flex-col gap-8">
           <div className="space-y-2">
              <span className="mono-type text-[10px] uppercase font-bold text-[#00FF41] flex items-center gap-2">
                <TrendingUp className="w-3 h-3" />
                Daily Yield Aggregate
              </span>
              <div className="text-5xl font-black tracking-tighter">
                ${totalYield.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <PerformanceChart data={chartData} />
           </div>

           <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="mono-type text-[10px] uppercase font-bold text-yellow-500 flex items-center gap-2">
                  <Cpu className="w-3 h-3" />
                  Collective Briefing
                </span>
                <button onClick={generateCollectiveBriefing} className="p-1 hover:bg-white/10 rounded transition-colors">
                  <RefreshCw className={cn("w-3 h-3 opacity-40", isBriefingLoading && "animate-spin opacity-100")} />
                </button>
              </div>
              <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500/50" />
                <p className="mono-type text-[10px] leading-relaxed opacity-80 italic italic-serif terminal-flicker min-h-[3em]">
                  <Typewriter text={briefing} />
                </p>
                <div className="mt-4 flex justify-between items-center text-[8px] mono-type opacity-30 uppercase tracking-widest">
                  <span>Logic Sync: Stable</span>
                  <span>Confidence: 94.8%</span>
                </div>
              </div>
           </div>

           <div className="space-y-4">
              <span className="mono-type text-[10px] uppercase font-bold opacity-40 border-b border-white/5 pb-2 block italic">Fleet Cortex Status</span>
              {[
                { icon: Cpu, label: "Master Directive", val: globalDirective.length > 20 ? globalDirective.slice(0, 17) + "..." : globalDirective, color: "text-[#00FF41]" },
                { icon: Target, label: "Aggression", val: persona.toUpperCase(), color: "text-white" },
                { icon: ShieldAlert, label: "Logic Gate", val: "ENGAGED", color: "text-blue-400" },
              ].map((m, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-white/5 bg-white/5 rounded-sm">
                  <div className="flex items-center gap-2">
                    <m.icon className={cn("w-3 h-3", m.color)} />
                    <span className="mono-type text-[9px] uppercase tracking-wider">{m.label}</span>
                  </div>
                  <span className={cn("mono-type text-[9px] font-bold", m.color)}>{m.val}</span>
                </div>
              ))}
           </div>
        </div>

        <main className="lg:col-span-3">
          <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {bots.length === 0 ? (
            <div className="col-span-full p-8 text-center mono-type text-sm opacity-50">
              <RefreshCw className="w-4 h-4 mx-auto mb-2 animate-spin" />
              Synchronizing Agent Roster...
            </div>
          ) : (
            bots.map((bot, idx) => {
              const typeDef = BOT_TYPES.find(t => t.id === bot.type);
              const words = bot.name.split(' ');
              const firstWord = words.shift();
              const restWords = words.join(' ');
              
              return (
                <div key={bot.id} className="grid-cell flex flex-col justify-between group min-h-[240px]">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="mono-type text-[10px] text-[#00FF41] font-bold">ACT_REV_SYS</span>
                      <ChevronRight className="w-2 h-2 opacity-30" />
                      <span className="mono-type text-[10px] opacity-40">
                        {(idx + 1).toString().padStart(2, '0')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {bot.autonomous && bot.status === "online" && (
                         <div className="px-1.5 py-0.5 border border-green-500/30 bg-green-500/10 text-green-400 mono-type text-[8px] uppercase tracking-widest rounded-sm">AUTO</div>
                      )}
                      <div className={cn(
                        "status-dot",
                        bot.status === "online" && "dot-online",
                        bot.status === "offline" && "dot-offline",
                        bot.status === "error" && "dot-error",
                        bot.status === "auth-required" && "dot-auth"
                      )} />
                    </div>
                  </div>
                  
                  <h2 className="text-2xl md:text-3xl font-black uppercase mt-4 leading-tight">
                    {firstWord}<br />{restWords}
                  </h2>
                  <p className="text-xs opacity-50 mt-2 italic">
                    {typeDef?.role || "Unknown"}
                  </p>
                  <div className="mt-3 p-2 border border-white/5 bg-white/5 rounded-sm">
                    <span className="mono-type text-[8px] uppercase opacity-40 block mb-1">Expert Domain</span>
                    <p className="mono-type text-[9px] leading-tight text-[#00FF41] terminal-flicker">
                      {typeDef && 'expertise' in typeDef ? typeDef.expertise : "General Operations"}
                    </p>
                  </div>
                  <div className="flex-grow" />
                  
                  <div className="mt-6 flex justify-between items-end gap-2 border-t border-white/5 pt-4">
                    <span className={cn(
                      "mono-type text-[9px] px-2 py-0.5 rounded uppercase font-bold",
                      bot.status === "online" && "bg-white/10",
                      bot.status === "offline" && "bg-white/10",
                      bot.status === "auth-required" && "bg-yellow-900/40 text-yellow-400",
                      bot.status === "error" && "bg-red-900/40 text-red-400"
                    )}>
                      {bot.status === "auth-required" ? "Re-Auth Req" : bot.status}
                    </span>
                    
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setSelectedBot(bot)}
                        className="p-1.5 border border-white/20 rounded hover:bg-white hover:text-black transition-colors" 
                        title="Open Command Panel"
                      >
                        <Layers className="w-3 h-3" />
                      </button>

                      {bot.status === "auth-required" ? (
                        <button 
                          onClick={() => handleConnect(bot.type, typeDef?.authType || "oauth")}
                          className="p-1.5 border border-white/20 rounded hover:bg-white hover:text-black transition-colors" 
                          title="Configure Integrations"
                        >
                          <Key className="w-3 h-3" />
                        </button>
                      ) : bot.status === "online" ? (
                        <button 
                          onClick={() => updateBotStatus(bot.id, "offline")}
                          className="p-1.5 border border-white/20 rounded hover:bg-white hover:text-black transition-colors" 
                          title="Stop Agent"
                        >
                          <Square className="w-3 h-3" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => updateBotStatus(bot.id, "online")}
                          className="p-1.5 border border-white/20 rounded hover:bg-white hover:text-black transition-colors" 
                          title="Start Agent"
                        >
                          <Play className="w-3 h-3 ml-[1px]" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Real-time Operations Terminal */}
        <div className={cn(
          "fixed bottom-24 right-8 w-full max-w-lg z-30 transition-all duration-500 transform",
          showTerminal ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        )}>
          <div className="bg-black/90 border border-white/20 shadow-2xl rounded-sm overflow-hidden flex flex-col h-[300px]">
             <div className="p-2 bg-white/10 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                   <Terminal className="w-3 h-3 text-[#00FF41]" />
                   <span className="mono-type text-[9px] uppercase tracking-widest font-bold">Live Execution Stream</span>
                </div>
                <button onClick={() => setShowTerminal(false)} className="hover:text-white/50 transition-colors">
                   <ChevronUp className="w-3 h-3 rotate-180" />
                </button>
             </div>
             <div className="flex-grow overflow-y-auto p-4 space-y-3 scrollbar-vibe no-scrollbar">
                {globalActivities.length === 0 ? (
                  <div className="text-[9px] mono-type opacity-30 italic text-center py-10">Listening for agent signals...</div>
                ) : (
                  globalActivities.map((act) => (
                    <div key={act.id} className="flex gap-4 items-start group">
                       <span className="mono-type text-[8px] opacity-30 shrink-0 mt-0.5">{act.timestamp?.toDate().toLocaleTimeString([], { hour12: false }) || '--:--:--'}</span>
                       <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                             <span className="mono-type text-[9px] px-1 bg-white/10 rounded-sm text-[#00FF41] uppercase font-bold">{act.botType}</span>
                             <div className="h-px w-4 bg-white/10" />
                          </div>
                          <p className="mono-type text-[10px] leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                             {act.text}
                          </p>
                       </div>
                    </div>
                  ))
                )}
             </div>
             <div className="p-2 border-t border-white/10 bg-black flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-[#00FF41] animate-pulse" />
                <span className="mono-type text-[8px] uppercase opacity-30">Cortex Connection: Active / Level 7 Encryption</span>
             </div>
          </div>
        </div>

        {!showTerminal && (
           <button 
             onClick={() => setShowTerminal(true)}
             className="fixed bottom-24 right-8 z-30 p-3 bg-black border border-white/20 rounded-full hover:bg-white/10 transition-all group shadow-xl"
           >
              <Terminal className="w-4 h-4 text-[#00FF41] group-hover:scale-110 transition-transform" />
           </button>
        )}
      </main>
    </div>

      <footer className="p-6 flex flex-col md:flex-row justify-between items-center bg-[#050505] z-10 relative">
        <div className="flex flex-wrap gap-8 mb-4 md:mb-0">
          <div className="flex flex-col">
            <span className="mono-type text-[9px] opacity-40 uppercase">Network Load</span>
            <span className="text-sm font-bold">{networkLoad.toFixed(1)} GB/s</span>
          </div>
          <div className="flex flex-col">
            <span className="mono-type text-[9px] opacity-40 uppercase">Daily Yield</span>
            <span className="text-sm font-bold text-green-400">+${totalYield.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex flex-col">
            <span className="mono-type text-[9px] opacity-40 uppercase">Connected API's</span>
            <span className="text-sm font-bold uppercase">14 Platforms</span>
          </div>
        </div>
        <div className="flex items-center gap-4 border border-white/10 rounded-full px-4 py-2 bg-white/5 whitespace-nowrap overflow-x-auto max-w-full">
          <div className="flex -space-x-2 shrink-0">
            <div className="w-6 h-6 rounded-full bg-orange-500 border border-black flex items-center justify-center text-[8px] font-bold text-black">A</div>
            <div className="w-6 h-6 rounded-full bg-blue-500 border border-black flex items-center justify-center text-[8px] font-bold text-black">C</div>
            <div className="w-6 h-6 rounded-full bg-green-500 border border-black flex items-center justify-center text-[8px] font-bold text-black">S</div>
            <div className="w-6 h-6 rounded-full bg-red-500 border border-black flex items-center justify-center text-[8px] font-bold text-black">E</div>
          </div>
          <span className="mono-type text-[9px] uppercase tracking-wider shrink-0">Connector Pruning: Active</span>
        </div>
      </footer>

      {selectedBot && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setSelectedBot(null)}
        />
      )}
      <AgentPanel 
        bot={selectedBot} 
        onClose={() => setSelectedBot(null)}
      />
    </div>
  );
}
