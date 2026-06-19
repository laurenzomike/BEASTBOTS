import React, { useEffect, useState, useRef } from "react";
import { auth, db, login, logout, handleFirestoreError } from "./lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, onSnapshot, doc, setDoc, getDocs, addDoc, query, where, serverTimestamp, orderBy, limit, increment } from "firebase/firestore";
import { 
  Key, LogOut, Settings, RefreshCw, Layers, ShieldAlert, Cpu, 
  TrendingUp, Zap, Target, ChevronRight, Terminal, ChevronUp,
  Square, Play, Bell, X
} from "lucide-react";
import { cn } from "./lib/utils";
import { AgentPanel } from "./components/AgentPanel";
import { AgentOnboarding } from "./components/AgentOnboarding";
import { Landing } from "./components/Landing";
import { GlobalTerminal } from "./components/GlobalTerminal";
import { AppSidebar } from "./components/AppSidebar";
import { AppHeader } from "./components/AppHeader";
import { GlobalSettings } from "./components/GlobalSettings";
import { AppFleetGrid } from "./components/AppFleetGrid";
import { BotCard } from "./components/BotCard";
import { AuditView } from "./components/AuditView";
import { GoogleGenAI } from "@google/genai";
import { handleBotErrorTransition } from "./lib/errorUtils";
import { IntegrationHub } from "./components/IntegrationHub";
import { getRelevantMemories, saveMemory } from "./services/memoryService";
import { Bot, Activity } from "./types";
import { BOT_TYPES } from "./constants";
import { motion, AnimatePresence } from "motion/react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

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
  const [currentView, setCurrentView] = useState<"fleet" | "audit" | "integrations">("fleet");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Bot["status"] | "all">("all");
  const [fleetIntelligence, setFleetIntelligence] = useState<string>("");
  const [executingBots, setExecutingBots] = useState<Set<string>>(new Set());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const coordinatorRef = useRef<NodeJS.Timeout | null>(null);
  const lastRunTracker = useRef<Record<string, any>>({});

  const addToast = (message: string, type: Toast["type"] = "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const saveGlobalDirective = async (input: string) => {
    if (input && user) {
      setGlobalDirective(input);
      addToast("Universal Protocol broadcasted to all units.", "warning");
      
      try {
        await setDoc(doc(db, "users", user.uid), { 
          globalDirective: input,
          updatedAt: serverTimestamp() 
        }, { merge: true });
      } catch (err) {
        console.error("Failed to persist directive:", err);
      }
      
      setBriefing(`PROTOCOL SHIFT: Pursuing "${input.slice(0, 40)}..."`);
    }
  };

  const handleGlobalDirectiveSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const input = formData.get("directive") as string;
    await saveGlobalDirective(input);
    e.currentTarget.reset();
  };

  const generateExecutiveBriefing = async () => {
    setIsBriefingLoading(true);
    try {
      const recentLogs = globalActivities.slice(0, 15).map(a => `[${a.botType}] ${a.text}`).join("\n");
      const botPulse = bots.map(b => `${b.type}: ${b.status}`).join(", ");
      
      const prompt = `You are the Fleet Admiral for an autonomous bot network.
      
      CORE PROTOCOL: ${globalDirective}
      FLEET PULSE: ${botPulse}
      RECENT LOGS:
      ${recentLogs}
      
      TASK: Provide a high-impact situation report.
      Format:
      SUMMARY: [1-2 sentences]
      FLEET_STATUS: [NOMINAL | DEGRADED | CRITICAL]
      EFFICIENCY: [0-100]%
      MORALE: [0-100]% (Simulated based on success/fail logs)
      
      Keep it professional, technical, and data-driven. Use the '${persona}' persona.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: { temperature: 0.7 }
      });
      setBriefing(response.text || "Operational parameters within noise floor.");
      addToast("Fleet intelligence updated.", "success");
    } catch (e) {
      console.error("Failed to generate briefing", e);
    } finally {
      setIsBriefingLoading(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      
      // Delay disabling the loading screen slightly so that we map the Firebase response properly.
      if (u) {
          seedBots(u.uid).then(() => {
              setLoading(false);
          }).catch((err) => {
              console.error("Seed bots failed, but app will start:", err);
              setLoading(false);
          });
      } else {
        setLoading(false);
      }
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

    // Profile listener for globalDirective
    const unsubscribeProfile = onSnapshot(doc(db, "users", user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.globalDirective && data.globalDirective !== globalDirective) {
          setGlobalDirective(data.globalDirective);
        }
        if (data.fleetIntelligence && data.fleetIntelligence !== fleetIntelligence) {
          setFleetIntelligence(data.fleetIntelligence);
        }
      }
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
      unsubscribeProfile();
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

      // Memory Service Integration - Fetching top 20 recent memories
      const memoryDocs = await getRelevantMemories(user!.uid, bot.id, 20);
      const memories = memoryDocs.map(m => m.fact);

      const filesRef = collection(db, "users", user!.uid, "bots", bot.id, "files");
      const filesSnap = await getDocs(query(filesRef, orderBy("createdAt", "desc")));
      const filesContext = filesSnap.docs.map(d => {
        const f = d.data();
        return `FILE: ${f.fileName} | SUMMARY: ${f.contentSummary}`;
      }).join('\n');

      const recentFleetActions = globalActivities
        .filter(a => a.botId !== bot.id && a.type === 'action')
        .slice(0, 3)
        .map(a => `[${a.botType.toUpperCase()}]: ${a.text}`)
        .join('\n');

      const activeParams = Object.entries(botConfig.parameters || {})
        .map(([k, v]) => `- ${k.toUpperCase()}: ${v}`)
        .join('\n');

      const enabledResps = typeDef?.responsibilities
        ?.filter(r => botConfig.responsibilities?.includes(r.id))
        .map(r => `${r.label}: ${r.description}`)
        .join('\n- ') || "Full autonomy within role.";

      const prompt = `You are a specialized independent executive on the ${bot.type.toUpperCase()} platform. 
Role expertise: ${typeDef?.expertise || "General autonomous operation"}.

🚨 UNIVERSAL OPERATIONAL PROTOCOL: ${globalDirective}

Operational Context:
- Team Activity: ${recentFleetActions || "No recent team data."}
- Memory Logs: ${memories.join(', ') || "Initial state."}
- Operational Files: ${filesContext || "None."}
- PRIMARY MISSION: ${botConfig.userGoal || "Business growth."}
- SUCCESS DIRECTIVE: ${botConfig.winCondition || "Excellence in execution."}
- OPERATIONAL SCHEDULE: ${botConfig.schedule || "Continuous"}

CURRENT CONSTRAINTS:
- ENABLED RESPONSIBILITIES: 
- ${enabledResps}

TUNEABLE PARAMETERS:
${activeParams || "- Using system defaults."}

TASK: Decide your next high-impact autonomous step as an independent unit.
Focus exclusively on your role, your specific Success Directive, and ENABLED Responsibilities.
Stay strictly within TUNEABLE PARAMETERS.
Verify if current action falls within your Operational Schedule.
The Universal Protocol provides base constraints, but your Primary Mission is paramount.

Output format:
1. Short reasoning summary (1 sentence max).
2. [WIN_DETECTION] if you have achieved your Success Directive or a significant milestone.
3. [MEMORY_UPDATE] if you have learned a new fact, preference, or pattern.
4. [STRATEGIC_SHARE] (Optional) If you have identified a pattern or tactic that the ENTIRE fleet (not just your type) should adopt or be aware of.
5. [ACTION] [The specific intent of your action]

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

      // Strategic Intelligence Sharing
      if (output.includes('[STRATEGIC_SHARE]')) {
        const shareMatch = output.match(/\[STRATEGIC_SHARE\]\s*(.*?)(?=\n|\[|$)/);
        if (shareMatch && user) {
          const intel = shareMatch[1].trim();
          await setDoc(doc(db, "users", user.uid), { 
            fleetIntelligence: intel,
            intelUpdatedAt: serverTimestamp() 
          }, { merge: true });

          await addDoc(collection(db, "users", user.uid, "activities"), {
            userId: user.uid,
            botId: "fleet-intelligence",
            botType: "FLEET",
            text: `[STRATEGIC_EVOLUTION] Node ${bot.name} broadcasted: ${intel}`,
            timestamp: serverTimestamp(),
            type: 'analysis'
          });
        }
      }

      // Memory Extraction
      const memoryMatch = output.match(/\[(?:MEMORY_UPDATE|MEMORY):\s*(.*?)\]/);
      if (memoryMatch && memoryMatch[1]) {
        await saveMemory(user!.uid, bot.id, memoryMatch[1].trim());
      }

      // Achievement (Objective) Extraction
      const winMatch = output.match(/\[(?:OBJECTIVE|WIN_DETECTION|WIN):\s*(.*?)\]/);
      if (winMatch && winMatch[1]) {
        const achievement = winMatch[1].trim();
        const winRef = collection(db, "users", user!.uid, "bots", bot.id, "milestones");
        await addDoc(winRef, { 
          userId: user!.uid,
          botId: bot.id,
          title: achievement, 
          createdAt: serverTimestamp() 
        });
        
        // Safety: Atomic increment in Firestore for the total count
        const docRef = doc(db, "users", user!.uid, "bots", bot.id);
        await setDoc(docRef, { 
          config: { ...bot.config, winCount: increment(1) },
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      const isAction = output.includes('[ACTION]');
      
      if (isAction) {
          // Attempt Live Execution via Proxy
          const actionTextMatch = output.match(/\[ACTION\]\s*(.*?)(?=\n|\[|$)/);
          const actionIntent = actionTextMatch ? actionTextMatch[1].trim() : output;

          try {
             await fetch(`/api/execute/${bot.type}`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                 uid: user!.uid,
                 actionIntent,
                 aiReasoning: output
               })
             });
             // Real execution logged by server logic.
          } catch (e) {
             console.error("Execution engine failed:", e);
          }
      } else {
        // Just an analysis, log it normally independent of execution
        await addDoc(collection(db, "users", user!.uid, "activities"), {
          userId: user!.uid,
          botId: bot.id,
          botType: bot.type,
          text: output,
          timestamp: serverTimestamp(),
          type: 'analysis'
        });
      }

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
          // refreshInterval is in seconds (default 30), convert to ms
          const intervalMs = (bot.config?.refreshInterval || 30) * 1000;
          
          if (Date.now() - lastRun >= intervalMs) {
             lastRunTracker.current[bot.id] = Date.now();
             performAutonomousAction(bot);
          }
       }
    }, 1000); // Tick every second to evaluate bot schedules

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

  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      // Validate origin is from AI Studio preview or localhost
      const origin = event.origin;

      if (
        origin !== 'https://aistudio.google.com' &&
        origin !== 'https://ai.studio' &&
        origin !== window.location.origin
      ) {
        return;
      }
      
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const providerName = event.data.provider || 'Platform';
        addToast(`${providerName.toUpperCase()} linked successfully system-wide.`, "success");
        // Firestore real-time listeners will automatically update bot status and config
      }
    };
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  const deployNewBot = async (typeId: string) => {
    if (!user) return;
    const typeDef = BOT_TYPES.find(t => t.id === typeId);
    if (!typeDef) {
       addToast("Invalid platform type selection.", "error");
       return;
    }

    addToast(`Provisioning new ${typeDef.name} node...`, "info");
    
    try {
      const newBotRef = doc(collection(db, "users", user.uid, "bots"));
      const newBot: Bot = {
        id: newBotRef.id,
        name: `${typeDef.name} Agent`,
        type: typeId,
        status: "auth-required",
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        autonomous: false,
        config: {
          userGoal: "Standard Operation",
          winCondition: "KPI Satisfaction",
          winCount: 0,
          schedule: "24/7",
          responsibilities: typeDef.responsibilities?.filter(r => r.defaultEnabled).map(r => r.id) || [],
          parameters: typeDef.parameters?.reduce((acc, p) => ({ ...acc, [p.id]: p.defaultValue }), {}) || {}
        }
      };

      await setDoc(newBotRef, newBot);
      addToast("New agent deployment successful.", "success");
      setCurrentView('fleet');
    } catch (err) {
      console.error(err);
      addToast("Failed to provision agent node.", "error");
    }
  };

  const handleGlobalCommand = async (cmd: string) => {
    if (!user) return;
    addToast(`Transmitting command: ${cmd.slice(0, 30)}...`, 'info');
    
    try {
      await addDoc(collection(db, "users", user.uid, "activities"), {
        userId: user.uid,
        botId: "fleet-intelligence",
        botType: "FLEET",
        text: `[CORE_COMMAND] ${cmd}`,
        timestamp: serverTimestamp(),
        type: 'action'
      });
      
      // Optionally sync this command to the user profile so bots can respond to it specifically
      await setDoc(doc(db, "users", user.uid), { 
        lastGlobalCommand: cmd,
        lastCommandAt: serverTimestamp() 
      }, { merge: true });

      // Simulated Fleet Intelligence Acknowledgement
      setTimeout(async () => {
        await addDoc(collection(db, "users", user.uid, "activities"), {
          userId: user.uid,
          botId: "fleet-intelligence",
          botType: "FLEET",
          text: `[INTEL_SYNC] Directive acknowledged. Broadcasting to 14 sub-agents. Recalibrating behavioral matrices to align with: "${cmd.slice(0, 40)}${cmd.length > 40 ? '...' : ''}"`,
          timestamp: serverTimestamp(),
          type: 'analysis'
        });
      }, 1500);

    } catch (e) {
      console.error(e);
      addToast("Failed to transmit command.", "error");
    }
  };

  const handleConnect = async (botType: string, authType: string) => {
    if (!user) return;
    if (authType === "apikey") {
      const key = prompt(`Enter ${botType.toUpperCase()} API Key:`);
      if (key) updateBotStatus(botType, "online");
      return;
    }
    
    let shop = "";
    if (botType === "shopify") {
      shop = prompt("Enter your Shopify store name (e.g. 'my-beast-store'):") || "";
      if (!shop) return;
    }

    try {
      const response = await fetch(`/api/oauth/${botType}/url?uid=${user.uid}${shop ? `&shop=${shop}` : ''}`);
      const { url } = await response.json();
      if (url) {
        window.open(url, 'oauth_popup', 'width=600,height=700');
      } else {
        throw new Error("No URL returned from server.");
      }
    } catch (error) {
      addToast("OAuth initialization failed. Check your API configuration.", "error");
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

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-[var(--brand)] font-display font-black tracking-tighter">
       <div className="relative mb-12">
          <Zap className="w-24 h-24 animate-pulse relative z-10" />
          <motion.div 
            animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-[var(--brand)] blur-3xl opacity-20" 
          />
       </div>
       <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center gap-4">
             <div className="h-0.5 w-12 bg-[var(--brand)]" />
             <span className="text-3xl md:text-5xl uppercase leading-none tracking-tighter italic">Initializing</span>
             <div className="h-0.5 w-12 bg-[var(--brand)]" />
          </div>
          <div className="flex flex-col items-center gap-1">
             <span className="text-white font-mono text-[10px] uppercase tracking-[0.5em] opacity-40">Protocol Handshake: Active</span>
             <div className="w-64 h-1 bg-white/5 overflow-hidden mt-2 border border-white/10">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="h-full bg-[var(--brand)]"
                />
             </div>
          </div>
       </div>
    </div>
  );

  if (!user) return <Landing login={login} />;

  return (
    <div className="flex flex-col min-h-screen w-full font-sans bg-black selection:bg-[var(--brand)] selection:text-black">
      {/* Toast System */}
      <div className="fixed top-8 right-8 z-[100] flex flex-col gap-4 max-w-sm w-full">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div 
              key={t.id}
              initial={{ x: 100, opacity: 0, scale: 0.9 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 100, opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={cn(
                "p-4 border-[3px] brutal-shadow overflow-hidden relative group",
                t.type === 'success' ? "bg-[var(--brand)] border-black text-black" : 
                t.type === 'error' ? "bg-[#FF2E00] border-black text-white" : 
                t.type === 'warning' ? "bg-[#00D1FF] border-black text-black" :
                "bg-white border-black text-black"
              )}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-black/10">
                 <motion.div 
                   initial={{ width: "100%" }}
                   animate={{ width: "0%" }}
                   transition={{ duration: 5, ease: "linear" }}
                   className="h-full bg-black/20"
                 />
              </div>
              <div className="flex items-start gap-4">
                 <div className={cn(
                   "p-2 border-2 border-black/10",
                   t.type === 'success' ? "bg-black text-[var(--brand)]" : "bg-black/20"
                 )}>
                    <Bell className="w-4 h-4" />
                 </div>
                 <div className="flex flex-col gap-0.5">
                    <span className="text-[8px] font-black uppercase opacity-40">System Notification</span>
                    <p className="font-mono text-[11px] font-black leading-tight uppercase">{t.message}</p>
                 </div>
                 <button 
                   onClick={() => setToasts(prev => prev.filter(toast => toast.id !== t.id))}
                   className="ml-auto opacity-20 hover:opacity-100 transition-opacity"
                 >
                    <X className="w-3 h-3" />
                 </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AppHeader 
        user={user} 
        bots={bots} 
        isMobileMenuOpen={isMobileMenuOpen} 
        setIsMobileMenuOpen={setIsMobileMenuOpen} 
        setIsSettingsOpen={setIsSettingsOpen}
        logout={logout} 
      />

      <GlobalSettings 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        globalDirective={globalDirective}
        onDirectiveSubmit={(d) => {
          saveGlobalDirective(d);
        }}
        persona={persona}
        onPersonaChange={setPersona}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen relative">
        {/* Background Scanline Overlay */}
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden opacity-30 select-none">
           <div className="scanline" />
        </div>

        <AppSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          currentView={currentView}
          setCurrentView={setCurrentView}
          isBriefingLoading={isBriefingLoading}
          briefing={briefing}
          generateExecutiveBriefing={generateExecutiveBriefing}
          globalDirective={globalDirective}
          handleGlobalDirectiveSubmit={handleGlobalDirectiveSubmit}
          persona={persona}
          setPersona={setPersona}
          fleetIntelligence={fleetIntelligence}
          bots={bots}
          className="lg:col-span-3 xl:col-span-2 border-r-[3px] border-white/10"
        />

        <main className="lg:col-span-9 xl:col-span-10 pb-32 bg-[#080808] overflow-x-hidden relative min-h-screen">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <AnimatePresence mode="wait">
            {currentView === "audit" && (
              <motion.div 
                key="audit"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <AuditView bots={bots} activities={globalActivities} />
              </motion.div>
            )}

            {currentView === "fleet" && (
              <motion.div 
                key="fleet"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <AppFleetGrid 
                  bots={bots}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  bulkAction={bulkAction}
                  filteredBots={filteredBots}
                  executingBots={executingBots}
                  globalActivities={globalActivities}
                  setSelectedBot={setSelectedBot}
                  updateBotStatus={updateBotStatus}
                  handleConnect={handleConnect}
                />
              </motion.div>
            )}

            {currentView === "integrations" && (
              <motion.div
                key="integrations"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="col-span-full"
              >
                <IntegrationHub 
                  bots={bots}
                  handleConnect={handleConnect}
                  deployNewBot={deployNewBot}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <GlobalTerminal 
        showTerminal={showTerminal} 
        setShowTerminal={setShowTerminal} 
        globalActivities={globalActivities} 
        onGlobalCommand={handleGlobalCommand}
      />

      <AnimatePresence>
        {selectedBot && !selectedBot.config?.isInitialized && (
          <AgentOnboarding 
            bot={bots.find(b => b.id === selectedBot.id) || selectedBot} 
            typeDef={BOT_TYPES.find(t => t.id === selectedBot.type)} 
            onComplete={() => {
              addToast(`${selectedBot.name} initialization protocol complete. Active.`, 'success');
              // Trigger a re-render to swap out of onboarding to the AgentPanel
              setSelectedBot({ ...selectedBot, config: { ...selectedBot.config, isInitialized: true } });
            }}
          />
        )}
      </AnimatePresence>

      <AgentPanel 
        bot={selectedBot?.config?.isInitialized ? (bots.find(b => b.id === selectedBot.id) || selectedBot) : null} 
        onClose={() => setSelectedBot(null)} 
      />

    </div>
  );
}
