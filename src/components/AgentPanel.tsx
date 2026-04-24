import { X, Play, Loader2, Gauge, Power, Plus, Trash2, Save, ExternalLink, CheckCircle, AlertCircle, TrendingUp, Sparkles, Calendar, Clock, Database, FileText, Brain, Upload, Zap, Lightbulb, Trophy, ChevronDown, ChevronUp, ChevronRight, ShieldAlert, Settings, Cpu } from "lucide-react";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { doc, setDoc, serverTimestamp, collection, addDoc, query, where, onSnapshot, limit, orderBy, getDocs, deleteDoc, Timestamp } from "firebase/firestore";
import { db, handleFirestoreError, auth } from "../lib/firebase";
import { cn } from "../lib/utils";
import { GoogleGenAI } from "@google/genai";
import { BOT_TYPES, PLATFORM_WORKFLOWS } from "../constants";
import { BEHAVIORAL_TEMPLATES } from "../constants/prompts";
import { Bot, Workflow, BotFile, Milestone, Activity, PlatformInfo } from "../types";
import { handleBotErrorTransition } from "../lib/errorUtils";
import { suggestWorkflows } from "../services/suggestionService";

interface AgentPanelProps {
  bot: Bot | null;
  onClose: () => void;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function AgentPanel({ bot, onClose }: AgentPanelProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>(bot?.config?.workflows || []);
  const [parameters, setParameters] = useState<{key: string, value: string}[]>([]);
  const [logs, setLogs] = useState<{ time: string; text: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [strategy, setStrategy] = useState<string>("standard");
  const [memories, setMemories] = useState<string[]>([]);
  const [files, setFiles] = useState<BotFile[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo | null>(null);
  const [command, setCommand] = useState("");
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);

  const botDef = BOT_TYPES.find(t => t.id === bot?.type);

  useEffect(() => {
    if (!bot) return;
    setWorkflows(bot.config?.workflows || []);
    setStrategy(bot.config?.strategy || "standard");
    
    const params = bot.config?.parameters || {};
    setParameters(Object.entries(params).map(([key, value]) => ({ key, value: String(value) })));

    // Real-time stats simulation
    const interval = setInterval(() => {
       setPlatformInfo((prev: any) => {
         if (!prev) return prev;
         return {
           ...prev,
           stats: {
             "Uptime": "99.9%",
             "Latency": `${(Math.random() * 10 + 5).toFixed(1)}ms`,
             "Efficiency": `${(Math.random() * 5 + 92).toFixed(1)}%`
           }
         };
       });
    }, 2000);

    // Real-time memory
    const memoryRef = collection(db, "users", auth.currentUser!.uid, "bots", bot.id, "memories");
    const unsubMemory = onSnapshot(query(memoryRef, orderBy("createdAt", "desc"), limit(20)), (snap) => {
      setMemories(snap.docs.map(doc => doc.data().fact || ""));
    });

    // Real-time files
    const filesRef = collection(db, "users", auth.currentUser!.uid, "bots", bot.id, "files");
    const unsubFiles = onSnapshot(query(filesRef, orderBy("createdAt", "desc")), (snap) => {
      setFiles(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Real-time milestones (wins)
    const milestonesRef = collection(db, "users", auth.currentUser!.uid, "bots", bot.id, "milestones");
    const unsubMilestones = onSnapshot(query(milestonesRef, orderBy("createdAt", "desc"), limit(5)), (snap) => {
      setMilestones(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Real-time activities
    const activitiesRef = collection(db, "users", auth.currentUser!.uid, "activities");
    const unsubActivities = onSnapshot(query(activitiesRef, where("botId", "==", bot.id), orderBy("timestamp", "desc"), limit(20)), (snap) => {
      setActivities(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Simulate platform info
    setPlatformInfo({
      connected: bot.status === "online",
      accountName: `${bot.type.toUpperCase()}_ADMIN`,
      status: bot.status,
      stats: { "Uptime": "99.9%", "Latency": "12ms", "Efficiency": "94%" }
    });

    return () => {
      clearInterval(interval);
      unsubMemory();
      unsubFiles();
      unsubMilestones();
      unsubActivities();
    };
  }, [bot?.id]);

  if (!bot) return null;

  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isProcessingCommand) return;
    
    setIsProcessingCommand(true);
    addLog(`Broadcasting command to ${bot.name}: ${command}`);
    
    try {
      const prompt = `User Override Command: ${command}
      Context: You are ${bot.type}. Your current strategy is ${strategy}.
      Instructions: Execute this manual command. Format output with [ACTION] or [ANALYSIS]. If you take an action, it will be executed on the server.`;
      
      const result = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt
      });
      
      const output = result.text || `[ANALYSIS] Manual command acknowledged but no action taken.`;
      
      await addDoc(collection(db, "users", auth.currentUser!.uid, "activities"), {
        userId: auth.currentUser!.uid,
        botId: bot.id,
        botType: bot.type,
        text: output,
        timestamp: serverTimestamp(),
        type: output.startsWith('[ACTION]') ? 'action' : 'analysis'
      });
      
      addLog(`[COMMAND_SENT] Bot response received and logged.`);
      setCommand("");
    } catch (e) {
      addLog(`[COMMAND_ERROR] ${e instanceof Error ? e.message : 'Unknown'}`);
    } finally {
      setIsProcessingCommand(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const config = {
        ...bot.config,
        workflows,
        strategy,
        parameters: parameters.reduce((acc, p) => ({ ...acc, [p.key]: p.value }), {}),
      };
      await setDoc(doc(db, "users", auth.currentUser!.uid, "bots", bot.id), { 
        config, 
        updatedAt: serverTimestamp() 
      }, { merge: true });
      addLog("System configuration updated and synced.");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleResponsibility = async (respId: string) => {
    const currentResps = bot.config?.responsibilities || [];
    const newResps = currentResps.includes(respId)
      ? currentResps.filter((id: string) => id !== respId)
      : [...currentResps, respId];
    
    try {
      await setDoc(doc(db, "users", auth.currentUser!.uid, "bots", bot.id), {
        config: { ...bot.config, responsibilities: newResps },
        updatedAt: serverTimestamp()
      }, { merge: true });
      addLog(`Operational responsibility ${newResps.includes(respId) ? 'delegated' : 'revoked'}: ${respId}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateParameter = (key: string, value: any) => {
    setParameters(prev => {
      const exists = prev.find(p => p.key === key);
      if (exists) {
        return prev.map(p => p.key === key ? { ...p, value: String(value) } : p);
      }
      return [...prev, { key, value: String(value) }];
    });
  };

  const addLog = (text: string) => {
    setLogs(prev => [{ time: new Date().toLocaleTimeString(), text }, ...prev].slice(0, 50));
  };

  const handleTestRun = async () => {
    setIsGenerating(true);
    addLog(`Initiating AI Simulation Cycle for ${bot.name}...`);
    try {
      const prompt = `Simulate an execution step for ${bot.type}. Current strategy: ${strategy}. Global goals: ${bot.config.userGoal || "Dominance"}. Provide a short report formatted starting with [ACTION] or [ANALYSIS] like a standard operation.`;
      const result = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt
      });
      
      const output = result.text || `[ANALYSIS] Maintaining standby status.`;
      
      await addDoc(collection(db, "users", auth.currentUser!.uid, "activities"), {
        userId: auth.currentUser!.uid,
        botId: bot.id,
        botType: bot.type,
        text: output,
        timestamp: serverTimestamp(),
        type: output.startsWith('[ACTION]') ? 'action' : 'analysis'
      });
      
      addLog(`[AI_REPORT] Output synchronized to global activity log.`);
    } catch (e) {
      addLog(`[ERROR] ${e instanceof Error ? e.message : 'Unknown failure'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const addWorkflow = () => {
    setWorkflows([...workflows, { 
      id: Date.now(), 
      trigger: "When Signal Detected", 
      action: "", 
      prompt: "Synthesize target data and execute highest-impact maneuver.", 
      active: true 
    }]);
  };

  const removeWorkflow = (id: number) => {
    setWorkflows(workflows.filter(w => w.id !== id));
  };

  const updateWorkflow = (id: number, field: string, value: any) => {
    setWorkflows(workflows.map(w => w.id === id ? { ...w, [field]: value } : w));
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setIsUploading(true);
    const file = e.target.files[0];
    
    addLog(`Initiating secure upload sequence for ${file.name}...`);
    
    try {
      const textProcessing = new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          let text = (event.target?.result as string) || "";
          // Truncate to 4500 chars to respect Firestore document rule limits
          resolve(text.substring(0, 4500)); 
        };
        reader.onerror = () => resolve("Binary or unreadable format. File referenced only.");
        reader.readAsText(file);
      });

      const extractedText = await textProcessing;

      const filesRef = collection(db, "users", auth.currentUser!.uid, "bots", bot.id, "files");
      await addDoc(filesRef, {
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type || "unknown",
        contentSummary: extractedText || "Empty file content.",
        createdAt: serverTimestamp()
      });
      addLog(`Knowledge asset "${file.name}" uploaded and parsed into memory context.`);
    } catch (e) {
      console.error(e);
      addLog(`[ERROR] Failed to ingest file: ${e instanceof Error ? e.message : 'Unknown'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await deleteDoc(doc(db, "users", auth.currentUser!.uid, "bots", bot.id, "files", fileId));
      addLog("Knowledge asset removed from archive.");
    } catch (e) {
      console.error(e);
    }
  };

  const handleSuggestWorkflows = async () => {
    if (isSuggesting) return;
    setIsSuggesting(true);
    addLog("Consulting AI for specialized workflow suggestions...");
    try {
      const suggestions = await suggestWorkflows(bot.type, bot.config?.userGoal || "Business Growth", workflows);
      if (suggestions.length > 0) {
        const newWorkflows = suggestions.map((s: any) => ({
          id: Date.now() + Math.random(),
          ...s,
          active: true
        }));
        setWorkflows([...workflows, ...newWorkflows]);
        addLog(`Imported ${suggestions.length} AI-recommended pipeline actions.`);
      }
    } catch (e) {
      addLog("Failed to fetch AI suggestions.");
    } finally {
      setIsSuggesting(false);
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, x: 20 },
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        await setDoc(doc(db, "users", auth.currentUser!.uid, "bots", bot.id), { 
          avatar: base64, 
          updatedAt: serverTimestamp() 
        }, { merge: true });
        addLog("Custom avatar successfully uploaded and synchronized.");
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsDataURL(file);
  };

  const selectGalleryAvatar = async (url: string) => {
    try {
      await setDoc(doc(db, "users", auth.currentUser!.uid, "bots", bot.id), { 
        avatar: url, 
        updatedAt: serverTimestamp() 
      }, { merge: true });
      addLog("Node visual profile updated from system gallery.");
    } catch (err) {
      console.error(err);
    }
  };

  const AVATAR_GALLERY = [
    "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Circuit",
    "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Byte",
    "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Logic",
    "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Sync",
    "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Ghost",
    "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Vector"
  ];

  if (!bot) return null;

  return (
    <AnimatePresence>
        <motion.div 
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300, mass: 1 }}
          className="fixed inset-y-0 right-0 w-full lg:w-[500px] xl:w-[640px] bg-[#0A0A0A] border-l-[8px] border-black z-50 overflow-y-auto selection:bg-[var(--brand)] selection:text-black shadow-[-20px_0_60px_0_rgba(0,0,0,0.8)]"
        >
          <motion.div 
            className="p-6 lg:p-10 text-white"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
          }}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={sectionVariants} className="flex justify-between items-start mb-12">
            <div className="flex gap-6 items-center">
              <div className="relative group">
                <div className="w-20 h-20 bg-black border-4 border-black brutal-shadow-mini overflow-hidden flex items-center justify-center shrink-0">
                  {bot.avatar ? (
                    <img src={bot.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Cpu className="w-10 h-10 text-white opacity-20" />
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 p-1.5 bg-black text-white hover:bg-white hover:text-black border-2 border-black cursor-pointer transition-colors shadow-[2px_2px_0_0_#000]">
                  <Upload className="w-4 h-4" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleUploadAvatar} />
                </label>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                   <div className="w-4 h-4 bg-black border-2 border-white animate-pulse" />
                   <span className="mono-type text-[10px] font-black uppercase bg-black text-white px-2 py-1">Node Identity // ID_{bot.id.slice(0, 8)}</span>
                </div>
                <input 
                   className="display-type text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-none bg-transparent border-none outline-none focus:bg-white/5 w-full transition-colors cursor-text text-white"
                   defaultValue={bot.name}
                   onBlur={(e) => setDoc(doc(db, "users", auth.currentUser!.uid, "bots", bot.id), { name: e.target.value, updatedAt: serverTimestamp() }, { merge: true })}
                />
              </div>
            </div>
            <button onClick={onClose} className="p-3 bg-black text-white hover:bg-white hover:text-black transition-all border-4 border-black brutal-shadow hover:scale-110 active:scale-95 duration-200">
              <X className="w-8 h-8" />
            </button>
          </motion.div>

          {/* Quick Avatar Gallery */}
          <motion.div variants={sectionVariants} className="mb-12">
            <label className="mono-type text-[10px] uppercase font-black opacity-40 mb-3 block">Visual Profile Selection</label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_GALLERY.map((url, i) => (
                <button 
                  key={i}
                  onClick={() => selectGalleryAvatar(url)}
                  className={cn(
                    "w-10 h-10 bg-white/5 border-2 border-white/10 hover:border-[var(--brand)] transition-all overflow-hidden p-1 rounded-none",
                    bot.avatar === url && "bg-[var(--brand)] border-2 border-[var(--brand)] scale-110"
                  )}
                >
                  <img src={url} alt={`Gallery ${i}`} className={cn("w-full h-full object-contain", bot.avatar === url ? "invert-0" : "invert opacity-50")} />
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div variants={sectionVariants} className="grid grid-cols-2 gap-4 mb-12">
            {platformInfo?.stats && Object.entries(platformInfo.stats).map(([k, v]) => (
              <div key={k} className="bg-black text-white p-4 brutal-border brutal-shadow-red hover:translate-y-1 transition-transform cursor-default">
                <span className="block mono-type text-[9px] uppercase opacity-60">{k}</span>
                <span className="text-4xl font-sans font-black tracking-tighter hover:text-[#D4FF00] transition-colors">{String(v)}</span>
              </div>
            ))}
          </motion.div>

          {/* Specialized Trading Block */}
          {['kalshi', 'polymarket', 'alpaca', 'coinbase'].includes(bot.type) && (
            <motion.div variants={sectionVariants} className="mb-12 p-6 bg-[#D4FF00] border-[4px] border-black brutal-shadow text-black">
               <div className="flex items-center justify-between mb-4">
                  <h4 className="font-sans font-black uppercase text-xl flex items-center gap-2">
                    <TrendingUp className="w-6 h-6" />
                    Live Market Feed
                  </h4>
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 bg-black animate-ping" />
                     <span className="mono-type text-[8px] font-black uppercase">Real-Time Data Active</span>
                  </div>
               </div>
               <div className="grid grid-cols-3 gap-2">
                  <div className="bg-black/5 p-3 border border-black/20">
                     <span className="block text-[8px] font-black uppercase opacity-60">Volatility</span>
                     <span className="font-mono text-sm font-black">HIGH (2.4x)</span>
                  </div>
                  <div className="bg-black/5 p-3 border border-black/20">
                     <span className="block text-[8px] font-black uppercase opacity-60">Spread</span>
                     <span className="font-mono text-sm font-black">0.02%</span>
                  </div>
                  <div className="bg-black/5 p-3 border border-black/20">
                     <span className="block text-[8px] font-black uppercase opacity-60">Liquidity</span>
                     <span className="font-mono text-sm font-black">DEEP</span>
                  </div>
               </div>
               <div className="mt-6 pt-4 border-t border-black/10 flex gap-4">
                  <button 
                    onClick={() => handleSendCommand("SIMULATE_SIGNAL: MARKET_SPIKE")}
                    className="flex-1 bg-black text-[#D4FF00] px-4 py-2 font-black uppercase text-[10px] hover:bg-white hover:text-black transition-all brutal-shadow-mini"
                  >
                    Inject Signal: Spike
                  </button>
                  <button 
                    onClick={() => handleSendCommand("SIMULATE_SIGNAL: SENTIMENT_SHIFT")}
                    className="flex-1 bg-black text-[#D4FF00] px-4 py-2 font-black uppercase text-[10px] hover:bg-white hover:text-black transition-all brutal-shadow-mini"
                  >
                    Inject Signal: Shift
                  </button>
               </div>
               <p className="mt-4 text-[9px] font-bold uppercase leading-tight italic opacity-70">
                 System is currently analyzing event shards and technical indicators for high-confidence entries aligned with your protocol.
               </p>
            </motion.div>
          )}

          <motion.section variants={sectionVariants} className="space-y-6 mb-12 bg-black/5 p-8 border-[4px] border-black brutal-shadow">
             <div className="flex items-center justify-between border-b-[4px] border-black pb-2 mb-6">
                <h3 className="font-sans text-3xl font-black uppercase flex items-center gap-3">
                   <Settings className="w-8 h-8" /> 
                   Core Configuration
                </h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="mono-type text-[10px] font-black uppercase opacity-60">Unit Identity</label>
                      <input 
                        className="w-full bg-white border-[3px] border-black p-3 font-mono font-bold text-sm brutal-shadow focus:translate-x-1 focus:-translate-y-1 transition-all outline-none"
                        defaultValue={bot.name}
                        onBlur={(e) => setDoc(doc(db, "users", auth.currentUser!.uid, "bots", bot.id), { name: e.target.value, updatedAt: serverTimestamp() }, { merge: true })}
                      />
                   </div>

                   <div className="space-y-1">
                      <label className="mono-type text-[10px] font-black uppercase opacity-60">Sync Frequency (Seconds)</label>
                      <div className="flex items-center gap-4">
                         <input 
                           type="range"
                           min="10"
                           max="600"
                           step="10"
                           defaultValue={bot.config?.refreshInterval || 30}
                           onChange={(e) => setDoc(doc(db, "users", auth.currentUser!.uid, "bots", bot.id), { config: { ...bot.config, refreshInterval: parseInt(e.target.value) }, updatedAt: serverTimestamp() }, { merge: true })}
                           className="flex-grow h-2 bg-black/20 appearance-none cursor-pointer accent-black"
                         />
                         <span className="mono-type font-black text-sm w-12 text-right">{bot.config?.refreshInterval || 30}s</span>
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex flex-col gap-3">
                      <label className="mono-type text-[10px] font-black uppercase opacity-60">Deployment Protocol</label>
                      <button 
                        onClick={() => setDoc(doc(db, "users", auth.currentUser!.uid, "bots", bot.id), { 
                           autonomous: !bot.autonomous,
                           updatedAt: serverTimestamp() 
                        }, { merge: true })}
                        className={cn(
                          "w-full p-4 border-[4px] flex items-center justify-between transition-all brutal-shadow",
                          bot.autonomous 
                            ? "bg-black text-[#D4FF00] border-black" 
                            : "bg-white text-black/40 border-black/10"
                        )}
                      >
                         <div className="flex items-center gap-3">
                            <Cpu className={cn("w-6 h-6", bot.autonomous && "animate-pulse")} />
                            <span className="font-sans font-black uppercase text-sm">Autonomous Mode</span>
                         </div>
                         <div className={cn(
                            "w-12 h-6 border-2 border-current relative transition-all",
                            bot.autonomous ? "bg-[#D4FF00]" : "bg-black/5"
                         )}>
                            <motion.div 
                               animate={{ x: bot.autonomous ? 24 : 0 }}
                               className={cn("absolute top-0.5 left-0.5 w-4 h-4", bot.autonomous ? "bg-black" : "bg-black/20")}
                            />
                         </div>
                      </button>
                      <p className="text-[9px] font-bold opacity-40 uppercase leading-tight">
                         Enable for independent decision making and mission execution without manual trigger.
                      </p>
                   </div>
                </div>
             </div>
          </motion.section>

          <div className="space-y-12">
             <motion.section variants={sectionVariants} className="space-y-6">
                <div className="flex items-center justify-between border-b-[4px] border-black pb-2">
                  <h3 className="font-sans text-3xl font-black uppercase flex items-center gap-3"><Trophy className="w-8 h-8" />Objective Milestones</h3>
                </div>
                <div className="space-y-3">
                  {milestones.length === 0 ? (
                    <div className="bg-black/5 p-8 border-2 border-dashed border-black/20 text-center rounded-sm">
                      <p className="mono-type text-[10px] uppercase font-bold opacity-40 italic">Waiting for bot to satisfy its first objective...</p>
                    </div>
                  ) : (
                    milestones.map((m, i) => (
                      <div key={m.id} className="bg-white border-[3px] border-black p-4 brutal-shadow flex gap-4 items-center">
                         <div className="bg-[var(--brand)] p-2 border-2 border-black">
                            <Sparkles className="w-4 h-4 text-black" />
                         </div>
                         <div className="flex-grow">
                            <span className="block mono-type text-[8px] uppercase font-black opacity-40 mb-1">{(m.createdAt && "toDate" in m.createdAt ? (m.createdAt as Timestamp).toDate().toLocaleDateString() : "")}</span>
                            <p className="text-xs font-black uppercase tracking-tight">{m.title}</p>
                         </div>
                      </div>
                    ))
                  )}
                </div>
             </motion.section>

             <motion.section variants={sectionVariants} className="space-y-6">
                <div className="flex items-center justify-between border-b-[4px] border-black pb-2">
                  <h3 className="font-sans text-3xl font-black uppercase flex items-center gap-3"><Brain className="w-8 h-8" />Bot Memory</h3>
                  <button 
                    onClick={async () => {
                      if (confirm("Reset bot memory? This cannot be undone.")) {
                        const mRef = collection(db, "users", auth.currentUser!.uid, "bots", bot.id, "memories");
                        const mSnap = await getDocs(mRef);
                        await Promise.all(mSnap.docs.map(d => deleteDoc(doc(db, "users", auth.currentUser!.uid, "bots", bot.id, "memories", d.id))));
                      }
                    }}
                    className="p-1 text-[8px] mono-type font-black uppercase bg-black text-white px-2 hover:bg-[#FF2E00] transition-colors"
                  >
                    Clear Memory
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <label className="mono-type text-[10px] uppercase font-black">Things this bot has learned</label>
                     <span className="bg-black text-white px-2 py-0.5 text-[8px] mono-type font-black">{memories.length} ENTRIES</span>
                  </div>
                  <div className="bg-white border-[4px] border-black p-4 min-h-[100px] max-h-[200px] overflow-y-auto space-y-2 brutal-shadow text-xs">
                    {memories.length === 0 ? (
                      <div className="text-[10px] font-mono opacity-50 italic">Memory empty. Waiting for cycles...</div>
                    ) : (
                      memories.map((m, i) => (
                        <div key={i} className="flex gap-3 text-[10px] font-bold border-l-2 border-black pl-3 py-1">
                           <span className="opacity-30 self-start">{i + 1}</span>
                           <p>{m}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
             </motion.section>

             <motion.section variants={sectionVariants} className="space-y-6 text-black bg-white p-8 border-[4px] border-black brutal-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-sans text-3xl font-black uppercase flex items-center gap-3"><FileText className="w-8 h-8" />Files & Docs</h3>
                  <label className="cursor-pointer bg-black text-white p-2 border-2 border-black hover:bg-white hover:text-black transition-all">
                    <Upload className="w-5 h-5" />
                    <input type="file" className="hidden" onChange={handleUploadFile} disabled={isUploading} />
                  </label>
                </div>
                <div className="space-y-3">
                  {files.length === 0 ? (
                    <div className="text-[10px] font-mono opacity-30 uppercase text-center py-6">No files uploaded.</div>
                  ) : (
                    files.map(f => (
                      <div key={f.id} className="flex items-center justify-between border-b border-black/10 py-3 group">
                        <div className="flex items-center gap-3">
                           <FileText className="w-4 h-4" />
                           <div>
                             <span className="block text-[11px] font-black truncate max-w-[200px]">{f.fileName}</span>
                             <span className="block text-[9px] italic opacity-60">{(f.fileSize / 1024).toFixed(1)} KB</span>
                           </div>
                        </div>
                        <button onClick={() => handleDeleteFile(f.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 transition-all">
                           <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
             </motion.section>

            <motion.section variants={sectionVariants} className="space-y-6">
              <h3 className="font-sans text-3xl font-black uppercase border-b-[4px] border-black pb-2 flex items-center gap-2">
                <ShieldAlert className="w-8 h-8" /> 
                Protocol Config
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* Responsibilities */}
                 <div className="space-y-4">
                    <label className="mono-type text-[10px] font-black uppercase text-[#D4FF00] border-l-4 border-[#D4FF00] pl-2 block">Operational Scopes</label>
                    <div className="space-y-2">
                       {botDef?.responsibilities?.map(resp => (
                         <button 
                           key={resp.id}
                           onClick={() => handleToggleResponsibility(resp.id)}
                           className={cn(
                             "w-full p-4 border-[3px] flex items-center justify-between text-left transition-all brutal-shadow",
                             bot.config?.responsibilities?.includes(resp.id)
                               ? "bg-[var(--brand)] border-black text-black translate-x-1 -translate-y-1"
                               : "bg-black border-white/20 text-white opacity-40 hover:opacity-100"
                           )}
                         >
                            <div className="flex flex-col">
                               <span className="text-[11px] font-black uppercase leading-tight">{resp.label}</span>
                               <span className="text-[8px] mono-type mt-1 opacity-60 group-hover:opacity-100">{resp.description}</span>
                            </div>
                            <div className={cn(
                              "w-4 h-4 border-2 transition-colors",
                              bot.config?.responsibilities?.includes(resp.id) ? "bg-black border-black" : "border-white"
                            )} />
                         </button>
                       ))}
                    </div>
                 </div>

                 {/* Parameters */}
                 <div className="space-y-4">
                    <label className="mono-type text-[10px] font-black uppercase text-[#D4FF00] border-l-4 border-[#D4FF00] pl-2 block">Fine-Tune Parameters</label>
                    <div className="space-y-3 bg-white/5 p-6 border-[3px] border-white/10 brutal-shadow">
                       {botDef?.parameters?.map(param => {
                         const currentVal = parameters.find(p => p.key === param.id)?.value || param.defaultValue;
                         return (
                           <div key={param.id} className="space-y-2">
                              <div className="flex justify-between items-center">
                                 <label className="text-[9px] font-black uppercase text-white tracking-widest">{param.label}</label>
                                 <span className="text-[9px] font-mono text-[var(--brand)]">{currentVal}</span>
                              </div>
                              {param.type === 'number' && (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-4">
                                    <input 
                                      type="range"
                                      min={param.min ?? 0}
                                      max={param.max ?? 1000}
                                      step={param.max && param.max <= 1 ? "0.01" : "1"}
                                      value={Number(currentVal)}
                                      onChange={(e) => handleUpdateParameter(param.id, e.target.value)}
                                      className="flex-grow h-1.5 bg-white/10 appearance-none cursor-pointer accent-[var(--brand)] rounded-full transition-all hover:bg-white/20"
                                    />
                                    <input 
                                      type="text"
                                      value={currentVal}
                                      onChange={(e) => handleUpdateParameter(param.id, e.target.value)}
                                      className="w-16 bg-black border-2 border-white/10 p-1 text-[10px] font-mono text-white text-center focus:border-[var(--brand)] outline-none"
                                    />
                                  </div>
                                  <div className="flex justify-between text-[7px] mono-type opacity-30 font-black px-1">
                                    <span>MIN: {param.min ?? 0}</span>
                                    <span>MAX: {param.max ?? 1000}</span>
                                  </div>
                                </div>
                              )}
                              {param.type === 'string' && (
                                <input 
                                  type="text"
                                  value={currentVal}
                                  onChange={(e) => handleUpdateParameter(param.id, e.target.value)}
                                  className="w-full bg-black/40 border-2 border-white/10 p-2 text-[10px] font-mono text-white outline-none focus:border-[var(--brand)]"
                                />
                              )}
                              <p className="text-[8px] opacity-40 italic">{param.description}</p>
                           </div>
                         );
                       })}
                       {!botDef?.parameters?.length && (
                         <div className="text-center py-4 opacity-40 text-[9px] uppercase font-black">No tuneable parameters defined.</div>
                       )}
                    </div>
                    <button 
                      onClick={handleSaveConfig}
                      disabled={isSaving}
                      className="w-full bg-[var(--brand)] text-black border-[4px] border-black p-3 font-sans text-xs font-black uppercase brutal-shadow hover:translate-x-1 hover:-translate-y-1 transition-all disabled:opacity-50"
                    >
                      {isSaving ? "Syncing..." : "Commit Parameter Shifts"}
                    </button>
                    <p className="text-[8px] opacity-40 font-mono text-center">Changes are synced to the active agent cluster immediately.</p>
                 </div>
              </div>
            </motion.section>

            <motion.section variants={sectionVariants} className="space-y-6">
              <h3 className="font-sans text-3xl font-black uppercase border-b-[4px] border-black pb-2">Command Directives</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="mono-type text-[10px] font-black uppercase text-[#D4FF00]">Strategic Schedule</label>
                  <input 
                    className="w-full bg-black text-white border-[4px] border-black p-3 font-mono font-bold text-xs brutal-shadow outline-none"
                    placeholder="e.g. 24/7, Mon-Fri 9-5..."
                    defaultValue={bot.config?.schedule || ""}
                    onBlur={(e) => setDoc(doc(db, "users", auth.currentUser!.uid, "bots", bot.id), { config: { ...bot.config, schedule: e.target.value }, updatedAt: serverTimestamp() }, { merge: true })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="mono-type text-[10px] font-black uppercase text-[#D4FF00]">Global Goal Override</label>
                  <input 
                    className="w-full bg-black text-white border-[4px] border-black p-3 font-mono font-bold text-xs brutal-shadow outline-none"
                    placeholder="Override mission objective..."
                    defaultValue={bot.config?.userGoal || ""}
                    onBlur={(e) => setDoc(doc(db, "users", auth.currentUser!.uid, "bots", bot.id), { config: { ...bot.config, userGoal: e.target.value }, updatedAt: serverTimestamp() }, { merge: true })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="mono-type text-[10px] font-black uppercase text-[#D4FF00]">System Template Browser</label>
                <div className="space-y-2">
                  {BEHAVIORAL_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setDoc(doc(db, "users", auth.currentUser!.uid, "bots", bot.id), { 
                        config: { ...bot.config, systemDirective: t.prompt }, 
                        updatedAt: serverTimestamp() 
                      }, { merge: true })}
                      className="w-full text-left p-4 bg-white border-2 border-black hover:bg-[#D4FF00] transition-colors group"
                    >
                      <div className="font-sans font-black uppercase text-sm">{t.name}</div>
                      <div className="font-mono text-[9px] opacity-70 mt-1">{t.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="mono-type text-[10px] font-black uppercase">Operation Personality & Behavior Logic</label>
                <textarea 
                  rows={4}
                  className="w-full bg-black text-[#D4FF00] border-[4px] border-black p-4 font-mono text-[11px] font-bold brutal-shadow outline-none focus:ring-2 focus:ring-[#D4FF00] transition-colors"
                  placeholder="e.g. Always respond with technical brevity. Prioritize scalability over speed..."
                  defaultValue={bot.config?.systemDirective || ""}
                  onBlur={(e) => setDoc(doc(db, "users", auth.currentUser!.uid, "bots", bot.id), { config: { ...bot.config, systemDirective: e.target.value }, updatedAt: serverTimestamp() }, { merge: true })}
                />
                <p className="text-[9px] font-black uppercase opacity-60">Inject custom behavioral logic into the elite agent's decision engine.</p>
              </div>
            </motion.section>

            <motion.section variants={sectionVariants} className="space-y-6">
              <h3 className="font-sans text-3xl font-black uppercase border-b-[4px] border-black pb-2">Bot Settings</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="mono-type text-[10px] font-black uppercase">Bot Strategy</label>
                  <select 
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value)}
                    className="w-full bg-white border-[4px] border-black p-3 font-sans font-black uppercase text-sm brutal-shadow focus:translate-x-1 focus:-translate-y-1 transition-all outline-none"
                  >
                    <option value="standard">Standard</option>
                    <option value="aggressive">Aggressive</option>
                    <option value="efficiency">Balanced</option>
                    <option value="stealth">Careful</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="mono-type text-[10px] font-black uppercase">Refresh Interval (Sec)</label>
                  <input 
                    type="number"
                    min="5"
                    max="300"
                    className="w-full bg-white border-[4px] border-black p-3 font-mono font-bold text-xs brutal-shadow outline-none"
                    placeholder="e.g. 30"
                    defaultValue={bot.config?.refreshInterval || 30}
                    onBlur={(e) => setDoc(doc(db, "users", auth.currentUser!.uid, "bots", bot.id), { config: { ...bot.config, refreshInterval: parseInt(e.target.value) || 30 }, updatedAt: serverTimestamp() }, { merge: true })}
                  />
                </div>
              </div>
            </motion.section>

            <motion.section variants={sectionVariants} className="space-y-6">
              <div className="flex items-center justify-between border-b-[4px] border-black pb-2">
                <h3 className="font-sans text-3xl font-black uppercase flex items-center gap-3"><Zap className="w-8 h-8" />Auto-Reply</h3>
                <div className="flex items-center gap-3">
                  <span className="mono-type text-[10px] font-black uppercase">{bot.config?.autoResponseEnabled ? 'ENABLED' : 'DISABLED'}</span>
                  <button 
                    onClick={() => setDoc(doc(db, "users", auth.currentUser!.uid, "bots", bot.id), { config: { ...bot.config, autoResponseEnabled: !bot.config?.autoResponseEnabled }, updatedAt: serverTimestamp() }, { merge: true })}
                    className={cn(
                      "w-12 h-6 border-2 border-black relative transition-all brutal-shadow",
                      bot.config?.autoResponseEnabled ? "bg-black" : "bg-white"
                    )}
                  >
                    <div className={cn(
                      "absolute top-0.5 w-4 h-4 transition-all",
                      bot.config?.autoResponseEnabled ? "right-1 bg-white" : "left-1 bg-black"
                    )} />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="mono-type text-[10px] font-black uppercase">Reply Tone</label>
                    <select 
                      value={bot.config?.responseTone || "Professional"}
                      onChange={(e) => setDoc(doc(db, "users", auth.currentUser!.uid, "bots", bot.id), { config: { ...bot.config, responseTone: e.target.value }, updatedAt: serverTimestamp() }, { merge: true })}
                      className="w-full bg-white border-[3px] border-black p-2 font-mono text-[10px] font-black uppercase"
                    >
                      <option>Professional</option>
                      <option>Friendly</option>
                      <option>Short & Direct</option>
                      <option>Helpful</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="mono-type text-[10px] font-black uppercase">Bot Signature</label>
                    <input 
                       className="w-full bg-white border-[3px] border-black p-2 font-mono text-[10px] font-black"
                       defaultValue={bot.config?.responseSignature || "Bot Boss Assistant"}
                       onBlur={(e) => setDoc(doc(db, "users", auth.currentUser!.uid, "bots", bot.id), { config: { ...bot.config, responseSignature: e.target.value }, updatedAt: serverTimestamp() }, { merge: true })}
                    />
                 </div>
              </div>
            </motion.section>

             <motion.section variants={sectionVariants} className="space-y-6">
                <div className="flex items-center justify-between border-b-[4px] border-black pb-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="font-sans text-3xl font-black uppercase flex items-center gap-3">
                      <Zap className="w-8 h-8 text-[#D4FF00]" />
                      Automation Pipeline
                    </h3>
                    <p className="mono-type text-[9px] font-black uppercase opacity-40">Define conditional trigger-action sequences for deployment.</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSuggestWorkflows}
                      disabled={isSuggesting}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 bg-[#D4FF00] text-black border-2 border-black font-black uppercase text-[10px] brutal-shadow-mini hover:-translate-y-1 transition-all disabled:opacity-50",
                        isSuggesting && "animate-pulse"
                      )}
                    >
                      {isSuggesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      Magic AI Generate
                    </button>
                    <button 
                      onClick={addWorkflow} 
                      className="p-3 bg-black text-white hover:bg-white hover:text-black transition-all border-2 border-black brutal-shadow-mini hover:-translate-y-1 group"
                      title="Add Custom Sequence"
                    >
                      <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    </button>
                  </div>
                </div>

                {workflows.length === 0 && !isSuggesting && (
                  <div className="mb-8">
                     <button 
                        onClick={handleSuggestWorkflows}
                        className="w-full py-12 border-4 border-dashed border-black/20 bg-black/5 hover:bg-[#D4FF00]/10 hover:border-[#D4FF00]/40 transition-all flex flex-col items-center justify-center gap-4 group"
                     >
                        <div className="p-4 bg-black brutal-shadow-mini group-hover:bg-[#D4FF00] transition-colors">
                           <Sparkles className="w-8 h-8 text-[#D4FF00] group-hover:text-black" />
                        </div>
                        <div className="text-center">
                           <span className="block font-sans font-black uppercase text-lg">Initialize with AI Intelligence</span>
                           <span className="block mono-type text-[9px] opacity-40 uppercase">Let our experts analyze ${bot.type} and suggest top 3 strategies</span>
                        </div>
                     </button>
                  </div>
                )}

                <div className="space-y-6 relative">
                  {workflows.length > 0 && (
                    <div className="absolute left-6 top-4 bottom-4 w-1 bg-black/10 -z-10" />
                  )}
                  
                  {workflows.length === 0 ? (
                    <div className="bg-black/5 p-12 border-2 border-dashed border-black/20 text-center group hover:bg-[#D4FF00]/5 transition-colors cursor-pointer" onClick={addWorkflow}>
                       <Zap className="w-12 h-12 mx-auto mb-4 opacity-10 group-hover:opacity-100 group-hover:text-[#D4FF00] transition-all" />
                       <p className="mono-type text-[10px] uppercase font-black opacity-30 group-hover:opacity-100 transition-all">Pipeline empty. Initialize first sequence.</p>
                    </div>
                  ) : (
                    workflows.map((wf, idx) => (
                      <motion.div 
                        key={wf.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white border-[4px] border-black brutal-shadow p-6 flex flex-col gap-6 relative group"
                      >
                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                             onClick={() => removeWorkflow(wf.id)} 
                             className="p-1 text-black hover:text-[#FF2E00] transition-colors"
                             title="Purge Sequence"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>

                        <div className="flex items-center gap-4">
                           <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black text-white text-[10px] font-black shrink-0">
                              {idx + 1}
                           </div>
                           <div className="h-0.5 flex-grow bg-black/5" />
                           <div className={cn(
                             "px-2 py-0.5 text-[8px] font-black uppercase text-white transition-colors",
                             wf.active ? "bg-[#D4FF00] text-black" : "bg-black/20"
                           )}>
                              {wf.active ? "Pipeline Active" : "Standby"}
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                          <div className="space-y-3">
                             <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#D4FF00]" />
                                 <label className="mono-type text-[9px] font-black uppercase opacity-60 italic">Strategic Signal Trigger:</label>
                             </div>
                             <select 
                               value={wf.trigger}
                               onChange={(e) => updateWorkflow(wf.id, "trigger", e.target.value)}
                               className="w-full bg-black text-white border-[3px] border-black p-3 font-mono font-bold text-[11px] focus:bg-white focus:text-black transition-all outline-none"
                             >
                               <option value="">-- NO SIGNAL SELECTED --</option>
                               {PLATFORM_WORKFLOWS[bot.type]?.triggers?.map(t => <option key={t} value={t}>{t}</option>)}
                             </select>
                          </div>

                          <div className="space-y-3">
                             <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
                                <label className="mono-type text-[9px] font-black uppercase opacity-60 italic">Deploy Response:</label>
                             </div>
                             <select 
                               value={wf.action}
                               onChange={(e) => updateWorkflow(wf.id, "action", e.target.value)}
                               className="w-full bg-[#00D1FF] text-black border-[3px] border-black p-3 font-mono font-bold text-[11px] focus:bg-white transition-all outline-none"
                             >
                               <option value="">-- NO ACTION DEFINED --</option>
                               {PLATFORM_WORKFLOWS[bot.type]?.actions?.map(a => <option key={a} value={a}>{a}</option>)}
                             </select>
                          </div>
                        </div>

                        <div className="space-y-2 border-t border-black/5 pt-4">
                           <label className="mono-type text-[8px] font-black uppercase opacity-40">Agent Logic Supplement</label>
                           <textarea 
                             placeholder="Inject specific contextual parameters for this automation branch..."
                             rows={2}
                             value={wf.prompt}
                             onChange={(e) => updateWorkflow(wf.id, "prompt", e.target.value)}
                             className="w-full bg-black/5 border-2 border-black/10 p-3 text-[10px] font-mono font-bold focus:bg-white focus:border-black focus:outline-none transition-all placeholder:text-black/20"
                           />
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.section>

              <motion.div variants={sectionVariants} className="pt-10 flex gap-4">
                 <button 
                   onClick={handleSaveConfig}
                   disabled={isSaving}
                   className="flex-grow hardware-button !bg-black !text-white hover:!bg-white hover:!text-black flex items-center justify-center gap-3"
                 >
                   {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                     <>
                        <Save className="w-5 h-5" />
                        Commit System Config
                     </>
                   )}
                 </button>
                 <button 
                  onClick={handleTestRun}
                  disabled={isGenerating}
                  className="p-5 bg-white border-4 border-black brutal-shadow hover:-translate-y-1 transition-all disabled:opacity-50"
                  title="Execute Manual Simulation"
                 >
                   <Play className={cn("w-8 h-8", isGenerating && "animate-pulse")} />
                 </button>
              </motion.div>

              <motion.div variants={sectionVariants} className="space-y-4">
                 <div className="flex items-center justify-between border-b-[4px] border-black pb-2">
                    <h3 className="font-sans text-xl font-black uppercase flex items-center gap-2">
                       <Zap className="w-5 h-5 text-[var(--accent)]" />
                       Command Override
                    </h3>
                    <span className="bg-black text-[var(--brand)] px-2 py-0.5 text-[8px] font-black mono-type uppercase">Direct Link</span>
                 </div>
                 <form onSubmit={handleSendCommand} className="relative group">
                    <input 
                      type="text"
                      placeholder="Send a direct instruction (e.g. 'Generate a report', 'Stop current task')..."
                      value={command}
                      onChange={(e) => setCommand(e.target.value)}
                      disabled={isProcessingCommand}
                      className="w-full bg-white border-[4px] border-black p-4 pr-12 mono-type text-[12px] font-bold text-black focus:outline-none transition-all brutal-shadow hover:translate-x-1 hover:-translate-y-1"
                    />
                    <button 
                      type="submit"
                      disabled={!command.trim() || isProcessingCommand}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black text-white hover:bg-[var(--brand)] hover:text-black transition-colors disabled:opacity-20"
                    >
                      {isProcessingCommand ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                 </form>
              </motion.div>

              <motion.div variants={sectionVariants} className="space-y-4">
                 <div className="flex items-center justify-between border-b-[4px] border-black pb-2">
                    <h3 className="font-sans text-xl font-black uppercase flex items-center gap-2">
                       <Trophy className="w-5 h-5 text-yellow-500" />
                       Strategic Milestones
                    </h3>
                 </div>
                 <div className="grid grid-cols-1 gap-2">
                    {milestones.length === 0 ? (
                      <div className="p-4 border-2 border-black/10 text-center mono-type text-[10px] opacity-30 italic">No achievements recorded yet.</div>
                    ) : milestones.map((m, i) => (
                      <div key={m.id} className="bg-white p-3 border-[3px] border-black flex items-center gap-3 brutal-shadow-red animate-in fade-in slide-in-from-left duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                         <div className="bg-black text-white p-1">
                            <CheckCircle className="w-4 h-4" />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase leading-tight">{m.title}</span>
                            <span className="text-[8px] opacity-50 mono-type">{(m.createdAt && "toDate" in m.createdAt ? (m.createdAt as Timestamp).toDate().toLocaleString() : "")}</span>
                         </div>
                      </div>
                    ))}
                 </div>
              </motion.div>

              <motion.div variants={sectionVariants} className="space-y-4">
                 <div className="flex items-center justify-between border-b-[4px] border-black pb-2">
                    <h3 className="font-sans text-xl font-black uppercase flex items-center gap-2">
                       <Database className="w-5 h-5" />
                       Recent Bot Activity
                    </h3>
                    <span className="bg-black text-[var(--brand)] px-2 py-0.5 text-[8px] font-black mono-type uppercase">Live Feed</span>
                 </div>
                 <div className="w-full h-48 bg-white border-[4px] border-black p-4 font-mono text-[10px] overflow-y-auto space-y-2 custom-scrollbar">
                     {activities.length === 0 ? <div className="text-center opacity-30 py-10 uppercase">Waiting for activity...</div> : activities.map((log) => {
                       const isLive = log.text.includes("[LIVE EXECUTION]");
                       const cleanText = log.text.replace("[LIVE EXECUTION]", "").trim();
                       return (
                         <div key={log.id} className="flex gap-4 border-l-2 border-black/10 pl-2">
                            <span className="opacity-30 italic">[{(log.timestamp && "toDate" in log.timestamp ? (log.timestamp as Timestamp).toDate().toLocaleTimeString() : "")}]</span>
                            <div className="flex flex-col">
                                {isLive && <span className="bg-[#FF2E00] text-white px-1 py-0.5 text-[8px] animate-pulse w-max mb-1">LIVE EXECUTED</span>}
                                <p className={cn(
                                  "font-bold",
                                  log.type === 'error' ? "text-red-500" : (log.type === 'action' || isLive ? "text-black" : "text-blue-600")
                                )}>
                                  {cleanText}
                                </p>
                            </div>
                         </div>
                       );
                     })}
                 </div>
              </motion.div>
              
              <motion.section variants={sectionVariants} className="pt-10 border-t-4 border-black pb-32">
                 <button 
                   onClick={async () => {
                     if (confirm("Are you sure you want to decommission this bot? All its memory and files will be permanently erased.")) {
                       await deleteDoc(doc(db, "users", auth.currentUser!.uid, "bots", bot.id));
                       onClose();
                    }
                  }}
                  className="w-full p-4 bg-[#FF2E00] text-white font-black uppercase tracking-widest text-sm brutal-shadow hover:bg-black transition-all border-4 border-black"
                >
                  Decommission Bot
                </button>
             </motion.section>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
