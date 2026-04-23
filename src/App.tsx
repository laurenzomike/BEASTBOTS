import React, { useEffect, useState, useRef } from "react";
import { auth, db, login, logout, handleFirestoreError } from "./lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, onSnapshot, doc, setDoc, getDocs, addDoc, query, where, serverTimestamp, orderBy, limit, increment } from "firebase/firestore";
import { 
  Key, LogOut, Settings, RefreshCw, Layers, ShieldAlert, Cpu, 
  TrendingUp, Zap, Target, ChevronRight, Terminal, ChevronUp,
  Square, Play, Bell
} from "lucide-react";
import { cn } from "./lib/utils";
import { AgentPanel } from "./components/AgentPanel";
import { AgentOnboarding } from "./components/AgentOnboarding";
import { BotCard } from "./components/BotCard";
import { AuditView } from "./components/AuditView";
import { GoogleGenAI } from "@google/genai";
import { handleBotErrorTransition } from "./lib/errorUtils";
import { Bot, Activity } from "./types";
import { BOT_TYPES } from "./constants";
import { motion, AnimatePresence } from "motion/react";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Toast {
  id: string;
  message: string;
  type: "info" | "success" | "error" | "warning";
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [bots, setBots] = useState<Bot[]>([]);
  const [globalActivities, setGlobalActivities] = useState<Activity[]>([]);
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [persona, setPersona] = useState<"aggressive" | "passive" | "balanced">("balanced");
  const [globalDirective, setGlobalDirective] = useState<string>("Grow my business and keep things running smoothly.");
  const [briefing, setBriefing] = useState<string>("Checking on your bots... syncing up now.");
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);
  const [currentView, setCurrentView] = useState<"fleet" | "audit">("fleet");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Bot["status"] | "all">("all");
  const [executingBots, setExecutingBots] = useState<Set<string>>(new Set());
  
  const coordinatorRef = useRef<NodeJS.Timeout | null>(null);
  const lastRunTracker = useRef<Record<string, any>>({});

  const addToast = (message: string, type: Toast["type"] = "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const handleGlobalDirectiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = (e.currentTarget as any).directive.value;
    if (input) {
      setGlobalDirective(input);
      addToast("Executive protocol updated system-wide.", "warning");
      setBriefing(`NEW GOAL: ${input.slice(0, 50)}...`);
      (e.currentTarget as any).directive.value = "";
    }
  };

  const generateExecutiveBriefing = async () => {
    if (globalActivities.length < 3) return;
    setIsBriefingLoading(true);
    try {
      const recentLogs = globalActivities.slice(0, 10).map(a => `[${a.botType}] ${a.text}`).join("\n");
      const prompt = `You are a helpful manager in charge of a group of AI bots. 
      Analyze these recent activities and provide a simple, 2-sentence summary:
      ${recentLogs}
      
      Main Goal: ${globalDirective}
      Style: ${persona}
      
      Focus on what has been done and if it helps the main goal.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { temperature: 0.5 }
      });
      setBriefing(response.text || "Everything is running as expected.");
      addToast("Bot summary updated.", "success");
    } catch (e) {
      console.error("Failed to generate briefing", e);
    } finally {
      setIsBriefingLoading(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      if (u) seedBots(u.uid);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const botsQuery = query(collection(db, "users", user.uid, "bots"), where("userId", "==", user.uid));
    const unsubscribeBots = onSnapshot(botsQuery, (snapshot) => {
      const loadedBots: Bot[] = [];
      snapshot.forEach((doc) => {
        loadedBots.push({ id: doc.id, ...doc.data() } as Bot);
      });
      loadedBots.sort((a, b) => {
        const idxA = BOT_TYPES.findIndex(bt => bt.id === a.type);
        const idxB = BOT_TYPES.findIndex(bt => bt.id === b.type);
        return idxA - idxB;
      });
      setBots(loadedBots.filter(b => BOT_TYPES.some(bt => bt.id === b.type)));
    }, (error) => {
      handleFirestoreError(error, 'list', `users/${user.uid}/bots`);
    });

    const activitiesQuery = query(collection(db, "users", user.uid, "activities"), where("userId", "==", user.uid));
    const unsubscribeActivities = onSnapshot(activitiesQuery, (snapshot) => {
      const acts: Activity[] = [];
      snapshot.forEach((doc) => acts.push({ id: doc.id, ...doc.data() } as Activity));
      acts.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
      setGlobalActivities(acts.slice(0, 50)); 
    });

    return () => {
      unsubscribeBots();
      unsubscribeActivities();
    };
  }, [user]);

  useEffect(() => {
    if (globalActivities.length > 5) {
      generateExecutiveBriefing();
    }
  }, [Math.floor(globalActivities.length / 10)]);

  const performAutonomousAction = async (bot: Bot) => {
    if (!bot.autonomous || bot.status !== "online" || executingBots.has(bot.id)) return;

    setExecutingBots(prev => new Set(prev).add(bot.id));
    try {
      const botConfig = bot.config || {};
      const typeDef = BOT_TYPES.find(t => t.id === bot.type);

      const memoryRef = collection(db, "users", user!.uid, "bots", bot.id, "memories");
      const memorySnap = await getDocs(query(memoryRef, orderBy("updatedAt", "desc"), limit(1)));
      const memories: string[] = memorySnap.empty ? [] : (memorySnap.docs[0].data().memories || []);

      const filesRef = collection(db, "users", user!.uid, "bots", bot.id, "files");
      const filesSnap = await getDocs(query(filesRef, orderBy("createdAt", "desc")));
      const filesContext = filesSnap.docs.map(d => {
        const f = d.data();
        return `FILE: ${f.fileName} | SUMMARY: ${f.contentSummary}`;
      }).join('\n');

      const prompt = `You are a specialized independent executive on the ${bot.type.toUpperCase()} platform. 
Role expertise: ${typeDef?.expertise || "General autonomous operation"}.

🚨 UNIVERSAL OPERATIONAL PROTOCOL: ${globalDirective}

Context:
- Memory Logs: ${memories.join(', ') || "Initial state."}
- Operational Files: ${filesContext || "None."}
- PRIMARY MISSION: ${botConfig.userGoal || "Business growth."}
- SUCCESS DIRECTIVE: ${botConfig.winCondition || "Excellence in execution."}
- OPERATIONAL SCHEDULE: ${botConfig.schedule || "Continuous"}
- CORE RESPONSIBILITIES: ${botConfig.responsibilities?.join(', ') || "Full autonomy within role."}

TASK: Decide your next high-impact autonomous step as an independent unit.
Focus exclusively on your role, your specific Success Directive, and assigned Responsibilities.
Verify if current action falls within your Operational Schedule.
The Universal Protocol provides base constraints, but your Primary Mission is paramount.

Elite agents are decisive, technical, and data-driven.

Output format:
- [ACTION] descriptive step
- [ANALYSIS] technical insight
- [OBJECTIVE: description] ONLY if you satisfy the SUCCESS DIRECTIVE above.
- [MEMORY: fact] if you learned a new pattern.

Keep it to 1-2 authoritative sentences.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          systemInstruction: `You are the ${bot.type} elite Bot. Decisive and technical. 
          
          USER COMMAND DIRECTIVES:
          ${botConfig.systemDirective || "Maintain peak efficiency and data-driven objectivity."}`,
          temperature: 0.8,
          tools: [{ googleSearch: {} }]
        }
      });

      const output = response.text || `[ANALYSIS] Maintaining standby status for ${bot.type}.`;

      // Memory Extraction
      const memoryMatch = output.match(/\[MEMORY:\s*(.*?)\]/);
      if (memoryMatch && memoryMatch[1]) {
        const newFact = memoryMatch[1].trim();
        const mRef = collection(db, "users", user!.uid, "bots", bot.id, "memories");
        const mSnap = await getDocs(query(mRef, limit(1)));
        if (mSnap.empty) {
          await addDoc(mRef, { botId: bot.id, userId: user!.uid, memories: [newFact], updatedAt: serverTimestamp() });
        } else {
          const docRef = doc(db, "users", user!.uid, "bots", bot.id, "memories", mSnap.docs[0].id);
          const currentMemories = mSnap.docs[0].data().memories || [];
          if (!currentMemories.includes(newFact)) {
            await setDoc(docRef, { memories: [...currentMemories, newFact].slice(-20), updatedAt: serverTimestamp() }, { merge: true });
          }
        }
      }

      // Achievement (Objective) Extraction
      const winMatch = output.match(/\[(?:OBJECTIVE|WIN):\s*(.*?)\]/);
      if (winMatch && winMatch[1]) {
        const achievement = winMatch[1].trim();
        const winRef = collection(db, "users", user!.uid, "bots", bot.id, "milestones");
        await addDoc(winRef, { title: achievement, createdAt: serverTimestamp() });
        
        // Safety: Atomic increment in Firestore for the total count
        const docRef = doc(db, "users", user!.uid, "bots", bot.id);
        await setDoc(docRef, { 
          config: { ...bot.config, winCount: increment(1) },
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      await addDoc(collection(db, "users", user!.uid, "activities"), {
        userId: user!.uid,
        botId: bot.id,
        botType: bot.type,
        text: output,
        timestamp: serverTimestamp(),
        type: output.startsWith('[ACTION]') ? 'action' : 'analysis'
      });

    } catch (err) {
      console.error(`AI Error for ${bot.id}:`, err);
    } finally {
      setExecutingBots(prev => {
        const next = new Set(prev);
        next.delete(bot.id);
        return next;
      });
    }
  };

  useEffect(() => {
    if (!user || bots.length === 0) return;

    if (coordinatorRef.current) clearInterval(coordinatorRef.current);
    coordinatorRef.current = setInterval(async () => {
       const botsToRun = bots.filter(b => b.autonomous && b.status === "online");
       for (const bot of botsToRun) {
          const lastRun = lastRunTracker.current[bot.id] || 0;
          const schedule = bot.config?.scheduleType || "interval";
          const interval = bot.config?.intervalMs || 300000;
          
          if (Date.now() - lastRun >= interval) {
             lastRunTracker.current[bot.id] = Date.now();
             performAutonomousAction(bot);
          }
       }
    }, 30000);

    return () => {
      if (coordinatorRef.current) clearInterval(coordinatorRef.current);
    };
  }, [user, bots.length, globalDirective]);

  const bulkAction = async (status: Bot["status"]) => {
    if (!user) return;
    const targets = filteredBots.filter(b => b.status !== status);
    if (targets.length === 0) return;
    
    addToast(`Updating ${targets.length} bots to ${status}...`, "info");
    try {
      await Promise.all(targets.map(b => 
        setDoc(doc(db, "users", user.uid, "bots", b.id), { status, updatedAt: serverTimestamp() }, { merge: true })
      ));
      addToast(`Fleet updated.`, "success");
    } catch (e) {
      addToast("Bulk update failed.", "error");
    }
  };

  const updateBotStatus = async (botId: string, status: Bot["status"]) => {
    if (!user) return;
    try {
      const botRef = doc(db, "users", user.uid, "bots", botId);
      await setDoc(botRef, { status, updatedAt: serverTimestamp() }, { merge: true });
      addToast(`${botId.toUpperCase()} status updated to ${status}.`, "info");
    } catch (error) {
      handleFirestoreError(error, 'update', `users/${user.uid}/bots/${botId}`);
    }
  };

  const handleConnect = async (botType: string, authType: string) => {
    if (!user) return;
    if (authType === "apikey") {
      const key = prompt(`Enter ${botType.toUpperCase()} API Key:`);
      if (key) updateBotStatus(botType, "online");
      return;
    }
    try {
      const response = await fetch(`/api/oauth/${botType}/url?uid=${user.uid}`);
      const { url } = await response.json();
      window.open(url, 'oauth_popup', 'width=600,height=700');
    } catch (error) {
      addToast("OAuth initialization failed.", "error");
    }
  };

  const seedBots = async (userId: string) => {
    const botsRef = collection(db, "users", userId, "bots");
    for (const bt of BOT_TYPES) {
      const isTrading = ["kalshi", "polymarket", "alpaca", "coinbase"].includes(bt.id);
      const docRef = doc(botsRef, bt.id);
      const snap = await getDocs(query(botsRef, where("type", "==", bt.id)));
      if (snap.empty) {
        await setDoc(docRef, {
          userId, name: bt.name, type: bt.id, status: isTrading ? "online" : "auth-required",
          config: { 
            ...(isTrading ? { scheduleType: "interval", intervalMs: 300000 } : {}),
            userGoal: globalDirective
          },
          createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
        });
      }
    }
  };

  const filteredBots = bots.filter(bot => {
    const matchesSearch = bot.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         bot.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || bot.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-[var(--brand)] font-black text-4xl animate-pulse">STARTING BOT BOSS...</div>;
  if (!user) return <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6"><Zap className="w-24 h-24 text-[var(--brand)] mb-8" /><button onClick={login} className="hardware-button">Login to Manage Bots</button></div>;

  return (
    <div className="flex flex-col min-h-screen w-full font-sans bg-black selection:bg-[var(--brand)] selection:text-black">
      {/* Toast System */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div 
              key={t.id}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className={cn(
                "p-4 border-[3px] brutal-shadow border-black flex items-center gap-3 font-mono text-[10px] font-black uppercase text-black",
                t.type === 'success' ? "bg-[var(--brand)]" : t.type === 'error' ? "bg-[var(--accent)] text-white" : "bg-white"
              )}
            >
              <Bell className="w-4 h-4" />
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <header className="p-6 md:p-12 border-b-[4px] border-white z-10 bg-[var(--brand)] text-black relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rotate-45 translate-x-32 -translate-y-32 pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-end relative z-10">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 mb-2">
               <div className="w-4 h-4 bg-[#FF2E00] brutal-shadow-red animate-pulse border-2 border-black" />
               <span className="mono-type text-[10px] font-black uppercase bg-black px-2 py-1 text-white">System Online</span>
               <span className="mono-type text-[10px] font-black uppercase bg-[var(--accent)] px-2 py-1 text-white">
                  {bots.reduce((acc, curr) => acc + (curr.config?.winCount || 0), 0)} Objectives Met
               </span>
            </div>
            <h1 className="display-type text-7xl md:text-[8vw] font-black uppercase tracking-tighter leading-none text-black">Bot Boss</h1>
          </div>
          <div className="mt-8 md:mt-0 flex flex-col items-end gap-2">
             <span className="mono-type text-xs font-black uppercase bg-black text-white px-3 py-1">User: {user.email?.split('@')[0]}</span>
             <div className="flex gap-4">
                <button title="Settings" className="p-2 border-4 border-black hover:bg-black hover:text-white transition-all"><Settings className="w-8 h-8" /></button>
                <button onClick={logout} title="Logout" className="p-2 border-4 border-black text-red-600 hover:bg-red-600 hover:text-white transition-all"><LogOut className="w-8 h-8" /></button>
             </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 min-h-screen">
        <aside className="lg:col-span-1 border-r-[4px] border-white p-8 bg-[#0A0A0A] flex flex-col gap-12 relative">
           <nav className="flex flex-col gap-4">
              {[
                { id: 'fleet', label: 'Active Agents', icon: Layers },
                { id: 'audit', label: 'Universal Protocol', icon: ShieldAlert }
              ].map(v => (
                <button 
                  key={v.id}
                  onClick={() => setCurrentView(v.id as any)}
                  className={cn(
                    "w-full p-4 flex items-center gap-4 border-[4px] font-black uppercase text-sm transition-all brutal-shadow",
                    currentView === v.id ? "bg-[var(--brand)] text-black border-black -translate-y-1 translate-x-1 shadow-none" : "bg-black text-white border-white hover:border-[var(--brand)]"
                  )}
                >
                  <v.icon className="w-6 h-6" />
                  {v.label}
                </button>
              ))}
           </nav>

           <div className="space-y-6">
              <span className="font-display text-2xl uppercase font-black text-white border-b-2 border-white pb-2 flex items-center justify-between">
                Executive Overview
                <button onClick={generateExecutiveBriefing} className={cn("p-1", isBriefingLoading && "animate-spin")}><RefreshCw className="w-4 h-4" /></button>
              </span>
              <div className="p-6 bg-white border-[4px] border-black brutal-shadow text-black relative group text-xs overflow-hidden">
                {isBriefingLoading && <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center font-black uppercase text-[10px] animate-pulse">Syncing Agent Status...</div>}
                <p className="font-mono font-bold leading-relaxed">{briefing}</p>
                <div className="mt-4 flex justify-between text-[8px] mono-type font-black uppercase opacity-50">
                  <span>Status: {isBriefingLoading ? "Processing" : "Normal"}</span>
                  <span>95% Reliable</span>
                </div>
              </div>
           </div>

           <div className="mt-auto pt-10 border-t border-white/10">
              <form onSubmit={handleGlobalDirectiveSubmit} className="space-y-4">
                <label className="mono-type text-[9px] font-black text-white/50 uppercase">Operational Constraint</label>
                <div className="relative group brutal-shadow">
                   <input 
                     name="directive"
                     defaultValue={globalDirective}
                     placeholder="e.g. Prioritize data security..."
                     className="w-full bg-black border-2 border-white p-3 pl-8 mono-type text-[10px] text-white focus:border-[var(--brand)] focus:outline-none"
                   />
                   <ChevronRight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white group-focus-within:text-[var(--brand)]" />
                </div>
              </form>
           </div>
        </aside>

        <main className="lg:col-span-3 pb-32 bg-[#121212] overflow-x-hidden relative min-h-screen">
          <AnimatePresence mode="wait">
            {currentView === "audit" ? (
              <motion.div 
                key="audit"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <AuditView bots={bots} activities={globalActivities} />
              </motion.div>
            ) : selectedBot ? (
              <motion.div 
                key="onboarding-or-panel"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="min-h-screen"
              >
                {(() => {
                  if (!selectedBot.config?.isInitialized) {
                    return (
                      <AgentOnboarding 
                        bot={selectedBot}
                        typeDef={BOT_TYPES.find(t => t.id === selectedBot.type)}
                        onComplete={() => {
                          addToast(`${selectedBot.name} initialization protocol complete. Active.`, 'success');
                        }}
                      />
                    );
                  }
                  return (
                    <AgentPanel 
                      bot={selectedBot}
                      onClose={() => setSelectedBot(null)}
                    />
                  );
                })()}
              </motion.div>
            ) : (
              <motion.div 
                key="fleet"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col h-full"
              >
                {/* Search & Filter Bar */}
                <div className="p-8 lg:p-12 pb-0 flex flex-col md:flex-row gap-6 items-end">
                   <div className="flex-grow space-y-2 w-full">
                      <label className="mono-type text-[10px] font-black uppercase text-white/50">Search Your Bots</label>
                      <div className="relative group">
                         <input 
                           type="text"
                           placeholder="Find a bot by name..."
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           className="w-full bg-black border-2 border-white/20 p-3 pl-10 mono-type text-[12px] text-white focus:border-[var(--brand)] focus:outline-none transition-all brutal-shadow"
                         />
                         <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white opacity-30 group-focus-within:opacity-100 group-focus-within:text-[var(--brand)]" />
                      </div>
                   </div>
                   <div className="space-y-2 w-full md:w-auto">
                      <label className="mono-type text-[10px] font-black uppercase text-white/50">Filter by Status</label>
                      <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="w-full md:w-48 bg-black border-2 border-white/20 p-3 mono-type text-[10px] font-black uppercase text-white focus:border-[var(--brand)] outline-none brutal-shadow"
                      >
                         <option value="all">All Statuses</option>
                         <option value="online">Online</option>
                         <option value="offline">Offline</option>
                         <option value="auth-required">Needs Login</option>
                         <option value="error">Has Errors</option>
                      </select>
                   </div>
                   <div className="flex gap-2 w-full md:w-auto">
                      <button 
                        onClick={() => bulkAction('online')}
                        className="flex-grow md:flex-none px-4 py-3 bg-[var(--brand)] text-black border-2 border-black font-black uppercase text-[10px] brutal-shadow hover:bg-white active:translate-y-1 transition-all"
                      >
                        Wake Up All
                      </button>
                      <button 
                        onClick={() => bulkAction('offline')}
                        className="flex-grow md:flex-none px-4 py-3 bg-white text-black border-2 border-black font-black uppercase text-[10px] brutal-shadow hover:bg-red-500 active:translate-y-1 transition-all"
                      >
                        Nap Time
                      </button>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 p-8 lg:p-12">
                  {filteredBots.length === 0 ? (
                    <div className="col-span-full py-20 text-center opacity-30 animate-pulse text-4xl font-black uppercase border-4 border-dashed border-white/10">No agents match criteria.</div>
                  ) : (
                    filteredBots.map((bot, i) => (
                    <BotCard 
                      key={bot.id} 
                      bot={bot} 
                      index={i} 
                      isExecuting={executingBots.has(bot.id)}
                      onSelect={setSelectedBot} 
                      onUpdateStatus={updateBotStatus}
                      onConnect={handleConnect}
                    />
                  ))
                )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Terminal Toggle */}
      {!showTerminal && (
         <button onClick={() => setShowTerminal(true)} className="fixed bottom-8 left-8 z-30 p-4 bg-black border-[4px] border-white text-white hover:bg-[var(--brand)] hover:text-black transition-colors brutal-shadow">
            <Terminal className="w-8 h-8" />
         </button>
      )}

      <AnimatePresence>
        {showTerminal && (
          <motion.div 
            initial={{ y: 500 }}
            animate={{ y: 0 }}
            exit={{ y: 500 }}
            className="fixed bottom-8 left-8 right-8 lg:left-auto lg:right-8 lg:w-[600px] z-[50]"
          >
             <div className="bg-[#0A0A0A] border-[4px] border-white brutal-shadow flex flex-col h-[400px]">
                <div className="p-4 border-b-2 border-white flex justify-between items-center bg-black">
                   <div className="flex items-center gap-3"><Terminal className="w-5 h-5 text-[var(--brand)]" /><span className="text-[10px] font-black uppercase text-white">Live Activity Log</span></div>
                   <button onClick={() => setShowTerminal(false)} className="text-white hover:text-[var(--brand)]"><ChevronUp className="w-5 h-5 rotate-180" /></button>
                </div>
                <div className="flex-grow overflow-y-auto p-4 space-y-3 font-mono text-[10px]">
                   {globalActivities.length === 0 ? <div className="text-center opacity-20 py-20">No active signals...</div> : globalActivities.map(a => (
                      <div key={a.id} className="flex gap-4 border-l-2 border-white/10 pl-3">
                         <span className="opacity-30 italic">{a.timestamp?.toDate().toLocaleTimeString()}</span>
                         <div className="flex flex-col">
                            <span className="text-[var(--brand)] font-black uppercase">{a.botType}</span>
                            <p className="opacity-90">{a.text}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AgentPanel bot={selectedBot} onClose={() => setSelectedBot(null)} />
    </div>
  );
}
