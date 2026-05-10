import { X, Play, Loader2, Gauge, Power, Plus, Trash2, Save, ExternalLink, CheckCircle, AlertCircle, TrendingUp, Sparkles, Calendar, Clock, Database, FileText, Brain, Upload, Zap, Lightbulb, Trophy, ChevronDown, ChevronUp, ChevronRight, ShieldAlert, Settings, Terminal, Cpu, Package, BarChart3, Mail, Activity, Activity as ActivityIcon } from "lucide-react";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { doc, setDoc, serverTimestamp, collection, addDoc, query, where, onSnapshot, limit, orderBy, getDocs, deleteDoc } from "firebase/firestore";
import { db, handleFirestoreError, auth } from "../lib/firebase";
import { cn } from "../lib/utils";
import { generateAIContent } from "../lib/aiProxy";
import { BOT_TYPES, PLATFORM_WORKFLOWS } from "../constants";
import { BEHAVIORAL_TEMPLATES } from "../constants/prompts";
import { Bot, BotFile } from "../types";
import { handleBotErrorTransition } from "../lib/errorUtils";
import { suggestWorkflows } from "../services/suggestionService";

interface AgentPanelProps {
  bot: Bot | null;
  onClose: () => void;
}


export function AgentPanel({ bot, onClose }: AgentPanelProps) {
  const [workflows, setWorkflows] = useState<any[]>(bot?.config?.workflows || []);
  const [parameters, setParameters] = useState<{key: string, value: string}[]>([]);
  const [logs, setLogs] = useState<{ time: string; text: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [strategy, setStrategy] = useState<string>("standard");
  const [memories, setMemories] = useState<string[]>([]);
  const [files, setFiles] = useState<BotFile[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [workflowSuggestions, setWorkflowSuggestions] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [platformInfo, setPlatformInfo] = useState<any>(null);
  const [command, setCommand] = useState("");
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const [systemDirective, setSystemDirective] = useState<string>(bot?.config?.systemDirective || "");

  const botDef = BOT_TYPES.find(t => t.id === bot?.type);

  useEffect(() => {
    if (!bot) return;
    setWorkflows(bot.config?.workflows || []);
    setStrategy(bot.config?.strategy || "standard");
    setSystemDirective(bot.config?.systemDirective || "");
    
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
      
      const responseText = await generateAIContent(prompt, "gemini-3.1-pro-preview");
      
      const output = responseText || `[ANALYSIS] Manual command acknowledged but no action taken.`;
      
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

  const handleSaveDirective = async () => {
    if (!bot || !auth.currentUser) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid, "bots", bot.id), {
        config: { ...bot.config, systemDirective },
        updatedAt: serverTimestamp()
      }, { merge: true });
      addLog(`System Directive updated to custom configuration.`);
    } catch (e) {
      console.error("Failed to save directive:", e);
    } finally {
      setIsSaving(false);
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
      const responseText = await generateAIContent(prompt, "gemini-3.1-pro-preview");
      
      const output = responseText || `[ANALYSIS] Maintaining standby status.`;
      
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

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | null = null;
    
    // Support both direct input and drag events
    if ('target' in e && (e.target as HTMLInputElement).files?.length) {
      file = (e.target as HTMLInputElement).files![0];
    } else if ('dataTransfer' in e && e.dataTransfer.files?.length) {
      file = e.dataTransfer.files[0];
      e.preventDefault();
    }

    if (!file) return;
    setIsUploading(true);
    
    addLog(`Initiating secure ingestion for ${file.name}...`);
    
    try {
      const textProcessing = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve((event.target?.result as string) || "");
        reader.onerror = () => resolve("");
        reader.readAsText(file!);
      });

      const rawText = await textProcessing;
      addLog(`Neural processing initiated... Ingesting ${rawText.length} characters.`);

      let summary = "Processing failure: No content extracted.";
      if (rawText.trim()) {
        try {
          const prompt = `Synthesize a highly tactical, 1-sentence summary of this document for a BEAST BOT knowledge base. Focus on mission-critical utility. Document: ${rawText.substring(0, 8000)}`;
          const responseText = await generateAIContent(prompt, "gemini-3.1-pro-preview");
          summary = responseText || "AI Synthesis failed. Partial fragment stored.";
        } catch (aiErr) {
          console.error("AI Summary failed", aiErr);
          summary = rawText.substring(0, 300) + "... [RAW_FRAGMENT]";
        }
      }

      const filesRef = collection(db, "users", auth.currentUser!.uid, "bots", bot.id, "files");
      await addDoc(filesRef, {
        userId: auth.currentUser!.uid,
        botId: bot.id,
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type || "unknown/data",
        contentSummary: summary,
        createdAt: serverTimestamp()
      });
      addLog(`Knowledge asset "${file.name}" summarized and committed to node memory.`);
    } catch (e) {
      console.error("Ingestion failed", e);
      addLog(`[INGESTION_ERROR] System failed to process ${file.name}. Integrity check required.`);
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
    setWorkflowSuggestions([]);
    addLog("Consulting AI for specialized workflow suggestions...");
    try {
      const suggestions = await suggestWorkflows(bot.type, bot.config?.userGoal || "Business Growth", workflows);
      if (suggestions.length > 0) {
        setWorkflowSuggestions(suggestions.map((s: any) => ({
          id: Date.now() + Math.random(),
          ...s,
          active: true
        })));
        addLog(`Received ${suggestions.length} AI workflow suggestions.`);
      } else {
        addLog(`No new workflow suggestions generated.`);
      }
    } catch (e) {
      addLog("Failed to fetch AI suggestions.");
    } finally {
      setIsSuggesting(false);
    }
  };

  const acceptSuggestion = (suggestion: any) => {
    setWorkflows([...workflows, suggestion]);
    setWorkflowSuggestions(workflowSuggestions.filter(s => s.id !== suggestion.id));
    addLog(`Imported AI-recommended pipeline action.`);
  };

  const rejectSuggestion = (suggestionId: number) => {
    setWorkflowSuggestions(workflowSuggestions.filter(s => s.id !== suggestionId));
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
          className="fixed inset-y-0 right-0 w-full lg:w-[600px] xl:w-[700px] bg-[#020202] border-l-2 border-white/10 z-50 overflow-y-auto selection:bg-[var(--brand)] selection:text-black shadow-[-40px_0_100px_rgba(0,0,0,0.9)] custom-scrollbar"
        >
          <div className="absolute inset-x-0 top-0 h-[2px] bg-[var(--brand)]/20 blur-sm animate-[scan_3s_linear_infinite] z-50 pointer-events-none" />
          
          <motion.div 
            className="p-10 lg:p-14 text-white relative"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
          }}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={sectionVariants} className="flex justify-between items-start mb-16">
            <div className="flex gap-8 items-center">
              <div className="relative group">
                <div className="w-24 h-24 bg-black border border-white/20 overflow-hidden flex items-center justify-center shrink-0 relative">
                  <div className="absolute inset-0 bg-[var(--brand)]/5 group-hover:bg-[var(--brand)]/10 transition-colors" />
                  {bot.avatar ? (
                    <img src={bot.avatar} alt="Avatar" className="w-full h-full object-cover relative z-10" referrerPolicy="no-referrer" />
                  ) : (
                    <Cpu className="w-12 h-12 text-white/20" />
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-white text-black hover:bg-[var(--brand)] border-2 border-black cursor-pointer transition-all flex items-center justify-center shadow-lg hover:scale-110 active:scale-95">
                  <Upload className="w-4 h-4" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleUploadAvatar} />
                </label>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 bg-[var(--brand)] animate-pulse" />
                   <span className="mono-type text-[9px] font-black uppercase text-[var(--brand)] tracking-[0.5em] italic">Neural Node ID // {bot.id.slice(0, 12)}</span>
                </div>
                <input 
                   className="display-type text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-none bg-transparent border-none outline-none focus:bg-white/5 w-full transition-all cursor-text text-white italic hover:not-italic"
                   defaultValue={bot.name}
                   onBlur={(e) => setDoc(doc(db, "users", auth.currentUser!.uid, "bots", bot.id), { name: e.target.value, updatedAt: serverTimestamp() }, { merge: true })}
                />
              </div>
            </div>
            <button onClick={onClose} className="w-16 h-16 border-2 border-white/10 text-white hover:bg-white hover:text-black transition-all flex items-center justify-center group relative overflow-hidden">
              <X className="w-7 h-7 relative z-10 group-hover:rotate-90 transition-transform duration-500" />
              <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
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

          <motion.div variants={sectionVariants} className="grid grid-cols-3 gap-px bg-white/10 border border-white/10 mb-16 overflow-hidden">
            {platformInfo?.stats && Object.entries(platformInfo.stats).map(([k, v]) => (
              <div key={k} className="bg-[#050505] p-8 group hover:bg-[#0A0A0A] transition-colors relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 rotate-12 group-hover:rotate-45 transition-transform duration-700">
                  <ActivityIcon className="w-16 h-16" />
                </div>
                <span className="block mono-type text-[9px] font-black uppercase text-white/30 tracking-[0.3em] mb-4 group-hover:text-[var(--brand)] transition-colors">{k}</span>
                <span className="display-type text-xl font-black italic text-white tracking-tighter group-hover:not-italic transition-all duration-500">{String(v)}</span>
              </div>
            ))}
          </motion.div>

          <motion.section variants={sectionVariants} className="space-y-10 mb-16 bg-[#050505] p-12 border-2 border-white/5 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 scale-150 group-hover:rotate-0 transition-transform duration-1000">
               <Settings className="w-48 h-48" />
             </div>
             
             <div className="flex items-center justify-between border-b-2 border-white/10 pb-8 relative z-10">
                <h3 className="display-type text-2xl font-black uppercase flex items-center gap-6 italic">
                   <Settings className="w-10 h-10 text-[var(--brand)]" /> 
                   Grid Parameters
                </h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                <div className="space-y-8">
                   <div className="space-y-3">
                      <label className="mono-type text-[10px] font-black uppercase text-white/30 tracking-[0.4em]">Node Nomenclature</label>
                      <input 
                        className="w-full bg-black border-2 border-white/10 p-5 font-display font-black uppercase text-xl focus:border-white focus:bg-white focus:text-black transition-all outline-none italic"
                        defaultValue={bot.name}
                        onBlur={(e) => setDoc(doc(db, "users", auth.currentUser!.uid, "bots", bot.id), { name: e.target.value, updatedAt: serverTimestamp() }, { merge: true })}
                      />
                   </div>

                   <div className="space-y-4">
                      <label className="mono-type text-[10px] font-black uppercase text-white/30 tracking-[0.4em]">Neural Sync Interval</label>
                      <div className="flex items-center gap-8 bg-black p-6 border-2 border-white/5 group/slider">
                         <input 
                           type="range"
                           min="10"
                           max="600"
                           step="10"
                           defaultValue={bot.config?.refreshInterval || 30}
                           onChange={(e) => setDoc(doc(db, "users", auth.currentUser!.uid, "bots", bot.id), { config: { ...bot.config, refreshInterval: parseInt(e.target.value) }, updatedAt: serverTimestamp() }, { merge: true })}
                           className="flex-grow h-[2px] bg-white/10 appearance-none cursor-pointer accent-[var(--brand)]"
                         />
                         <span className="display-type font-black text-2xl text-[var(--brand)] w-16 text-right tabular-nums">{bot.config?.refreshInterval || 30}s</span>
                      </div>
                   </div>
                </div>

                <div className="space-y-4 flex flex-col justify-end">
                   <div className="flex flex-col gap-4">
                      <label className="mono-type text-[10px] font-black uppercase text-white/30 tracking-[0.4em]">Autonomy Protocol</label>
                      <button 
                        onClick={() => setDoc(doc(db, "users", auth.currentUser!.uid, "bots", bot.id), { 
                           autonomous: !bot.autonomous,
                           updatedAt: serverTimestamp() 
                        }, { merge: true })}
                        className={cn(
                          "w-full h-24 border-2 flex items-center justify-between px-8 text-left transition-all duration-500",
                          bot.autonomous 
                            ? "bg-white text-black border-white italic" 
                            : "bg-transparent text-white/20 border-white/10"
                        )}
                      >
                         <div className="flex items-center gap-4">
                            <Cpu className={cn("w-8 h-8", bot.autonomous && "animate-pulse")} />
                            <div className="flex flex-col">
                               <span className="display-type font-black uppercase text-2xl">Autonomous</span>
                               <span className="mono-type text-[9px] font-black uppercase tracking-widest opacity-60">Status: {bot.autonomous ? 'ACTIVE' : 'STANDBY'}</span>
                            </div>
                         </div>
                         <div className={cn(
                            "w-12 h-6 border-2 relative transition-all",
                            bot.autonomous ? "border-black bg-black" : "border-white/20 bg-transparent"
                         )}>
                            <motion.div 
                               animate={{ x: bot.autonomous ? 24 : 0 }}
                               className={cn("absolute top-0.5 left-0.5 w-4 h-4", bot.autonomous ? "bg-white" : "bg-white/20")}
                            />
                         </div>
                      </button>
                   </div>
                </div>
             </div>
          </motion.section>

          <div className="space-y-12">
             <motion.section variants={sectionVariants} className="space-y-6">
                <div className="flex items-center justify-between border-b-[4px] border-white/10 pb-2">
                  <h3 className="font-sans text-xl font-black uppercase flex items-center gap-3"><Trophy className="w-8 h-8 text-[var(--brand)]" />Objective Milestones</h3>
                </div>
                <div className="space-y-3">
                  {milestones.length === 0 ? (
                    <div className="bg-white/5 p-8 border-2 border-dashed border-white/10 text-center rounded-sm">
                      <p className="mono-type text-[10px] uppercase font-bold opacity-40 italic text-white/50">Waiting for bot to satisfy its first objective...</p>
                    </div>
                  ) : (
                    milestones.map((m, i) => (
                      <div key={m.id} className="bg-white border-[3px] border-black p-4 brutal-shadow flex gap-4 items-center">
                         <div className="bg-[var(--brand)] p-2 border-2 border-black">
                            <Sparkles className="w-4 h-4 text-black" />
                         </div>
                         <div className="flex-grow">
                            <span className="block mono-type text-[8px] uppercase font-black opacity-40 mb-1">{m.createdAt?.toDate().toLocaleDateString()}</span>
                            <p className="text-xs font-black uppercase tracking-tight">{m.title}</p>
                         </div>
                      </div>
                    ))
                  )}
                </div>
             </motion.section>

              <motion.section variants={sectionVariants} className="space-y-6">
                <div className="flex items-center justify-between border-b-[4px] border-white/10 pb-2">
                  <h3 className="font-sans text-xl font-black uppercase flex items-center gap-3"><Brain className="w-8 h-8 text-[var(--brand)]" />Bot Memory</h3>
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

             <motion.section 
               variants={sectionVariants} 
               className="space-y-8 text-white bg-[#050505] p-10 border-[4px] border-white/10 group"
               onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
               onDrop={handleUploadFile}
             >
                <div className="flex items-center justify-between mb-2">
                  <div className="space-y-1">
                    <h3 className="font-sans text-2xl font-black uppercase flex items-center gap-4 italic">
                      <Database className="w-10 h-10 text-[var(--brand)]" />
                      Neural Knowledge Base
                    </h3>
                    <p className="mono-type text-[9px] font-black uppercase opacity-40 italic tracking-widest pl-14">Sector Context & Tactical Documents</p>
                  </div>
                  <label className={cn(
                    "cursor-pointer bg-white text-black p-4 border-2 border-white hover:bg-[var(--brand)] hover:border-[var(--brand)] transition-all flex items-center justify-center brutal-shadow hover:translate-x-1 hover:-translate-y-1",
                    isUploading && "animate-pulse opacity-50 pointer-events-none"
                  )}>
                    {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                    <input type="file" className="hidden" onChange={handleUploadFile} disabled={isUploading} />
                  </label>
                </div>

                <div className="space-y-4">
                  {files.length === 0 ? (
                    <div className="border-[3px] border-dashed border-white/10 p-12 text-center bg-white/[0.02]">
                       <div className="w-12 h-12 border-2 border-white/10 mx-auto mb-4 flex items-center justify-center opacity-20">
                          <Plus className="w-6 h-6" />
                       </div>
                       <p className="mono-type text-[10px] uppercase font-black opacity-30 italic tracking-[0.2em]">Drop tactical files here for neural ingestion</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar-black">
                      {files.map(f => (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={f.id} 
                          className="p-6 bg-white border-[3px] border-black brutal-shadow hover:translate-x-1 hover:-translate-y-1 transition-all group/file relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 rotate-12 group-hover/file:rotate-0 transition-transform">
                             <FileText className="w-12 h-12" />
                          </div>
                          <div className="flex items-start justify-between relative z-10 gap-6">
                            <div className="flex gap-4 items-start flex-1 min-w-0">
                               <div className="w-10 h-10 bg-black text-white flex items-center justify-center shrink-0 border-2 border-black">
                                  <FileText className="w-5 h-5" />
                               </div>
                               <div className="space-y-2 flex-1 min-w-0">
                                 <div className="flex items-center gap-3">
                                   <span className="font-display font-black uppercase text-sm truncate">{f.fileName}</span>
                                   <span className="mono-type text-[8px] font-black uppercase bg-black text-white px-2 py-0.5 italic">{(f.fileSize / 1024).toFixed(1)} KB</span>
                                 </div>
                                 <div className="bg-black/5 p-3 border-l-4 border-[var(--brand)]">
                                    <p className="mono-type text-[11px] font-bold text-black/70 leading-relaxed italic line-clamp-3">
                                      {f.contentSummary || "Analyzing file contents..."}
                                    </p>
                                 </div>
                               </div>
                            </div>
                            <button 
                              onClick={() => handleDeleteFile(f.id)} 
                              className="w-10 h-10 bg-black/5 hover:bg-red-600 hover:text-white border-2 border-black flex items-center justify-center transition-all brutal-shadow shrink-0"
                              title="Purge context"
                            >
                               <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
             </motion.section>

            <motion.section variants={sectionVariants} className="space-y-6">
              <h3 className="font-sans text-xl font-black uppercase border-b-[4px] border-white/10 pb-2 flex items-center gap-2">
                <ShieldAlert className="w-8 h-8 text-[var(--brand)]" /> 
                Protocol Config
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* Responsibilities */}
                 <div className="space-y-4">
                    <label className="mono-type text-[10px] font-black uppercase text-[var(--brand)] border-l-4 border-[var(--brand)] pl-2 block">Operational Scopes</label>
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
                    <label className="mono-type text-[10px] font-black uppercase text-[var(--brand)] border-l-4 border-[var(--brand)] pl-2 block">Fine-Tune Parameters</label>
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
                      className="w-full h-20 bg-[var(--brand)] text-black border-2 border-[var(--brand)] font-display font-black uppercase text-lg hover:bg-white hover:border-white transition-all duration-500 italic hover:not-italic"
                    >
                      {isSaving ? "Neural Path Synced..." : "Commit Parameter Shifts"}
                    </button>
                    <p className="text-[8px] opacity-40 font-mono text-center">Changes are synced to the active agent cluster immediately.</p>
                 </div>
              </div>
            </motion.section>

            <motion.section variants={sectionVariants} className="space-y-6">
              <h3 className="font-sans text-xl font-black uppercase border-b-[4px] border-white/10 pb-2 flex items-center gap-2">
                <Terminal className="w-8 h-8 text-[var(--brand)]" /> Command Directives
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="mono-type text-[10px] font-black uppercase text-[var(--brand)]">Strategic Schedule</label>
                  <input 
                    className="w-full bg-black text-white border-[4px] border-black p-3 font-mono font-bold text-xs brutal-shadow outline-none"
                    placeholder="e.g. 24/7, Mon-Fri 9-5..."
                    defaultValue={bot.config?.schedule || ""}
                    onBlur={(e) => setDoc(doc(db, "users", auth.currentUser!.uid, "bots", bot.id), { config: { ...bot.config, schedule: e.target.value }, updatedAt: serverTimestamp() }, { merge: true })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="mono-type text-[10px] font-black uppercase text-[var(--brand)]">Global Goal Override</label>
                  <input 
                    className="w-full bg-black text-white border-[4px] border-black p-3 font-mono font-bold text-xs brutal-shadow outline-none"
                    placeholder="Override mission objective..."
                    defaultValue={bot.config?.userGoal || ""}
                    onBlur={(e) => setDoc(doc(db, "users", auth.currentUser!.uid, "bots", bot.id), { config: { ...bot.config, userGoal: e.target.value }, updatedAt: serverTimestamp() }, { merge: true })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="mono-type text-[10px] font-black uppercase text-[var(--brand)]">System Template Browser</label>
                <div className="space-y-2">
                  {BEHAVIORAL_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setDoc(doc(db, "users", auth.currentUser!.uid, "bots", bot.id), { 
                          config: { ...bot.config, systemDirective: t.prompt }, 
                          updatedAt: serverTimestamp() 
                        }, { merge: true });
                        setSystemDirective(t.prompt);
                      }}
                      className="w-full text-left p-4 bg-white border-2 border-black hover:bg-[var(--brand)] transition-colors group"
                    >
                      <div className="font-sans font-black uppercase text-sm">{t.name}</div>
                      <div className="font-mono text-[9px] opacity-70 mt-1">{t.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="mono-type text-[10px] font-black uppercase">Operation Personality & Behavior Logic</label>
                  <button 
                    onClick={handleSaveDirective}
                    disabled={isSaving || systemDirective === (bot.config?.systemDirective || "")}
                    className="px-4 py-2 bg-[var(--brand)] text-black font-black uppercase text-[10px] hover:-translate-y-1 active:translate-y-0 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
                <textarea 
                  rows={4}
                  className="w-full bg-black text-[var(--brand)] border-[4px] border-black p-4 font-mono text-[11px] font-bold brutal-shadow outline-none focus:ring-2 focus:ring-[var(--brand)] transition-colors"
                  placeholder="e.g. Always respond with technical brevity. Prioritize scalability over speed..."
                  value={systemDirective}
                  onChange={(e) => setSystemDirective(e.target.value)}
                />
                <p className="text-[9px] font-black uppercase opacity-60">Inject custom behavioral logic into the elite agent's decision engine.</p>
              </div>
            </motion.section>

            <motion.section variants={sectionVariants} className="space-y-6">
              <h3 className="font-sans text-xl font-black uppercase border-b-[4px] border-white/10 pb-2 flex items-center gap-2">
                <Settings className="w-8 h-8 text-[var(--brand)]" /> Bot Settings
              </h3>
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
              <div className="flex items-center justify-between border-b-[4px] border-white/10 pb-2">
                <h3 className="font-sans text-xl font-black uppercase flex items-center gap-3"><Zap className="w-8 h-8 text-[var(--brand)]" />Auto-Reply</h3>
                <div className="flex items-center gap-3">
                  <span className="mono-type text-[10px] font-black uppercase">{bot.config?.autoResponseEnabled ? 'ENABLED' : 'DISABLED'}</span>
                  <button 
                    onClick={() => setDoc(doc(db, "users", auth.currentUser!.uid, "bots", bot.id), { config: { ...bot.config, autoResponseEnabled: !bot.config?.autoResponseEnabled }, updatedAt: serverTimestamp() }, { merge: true })}
                    className={cn(
                      "w-12 h-6 border-2 border-white relative transition-all brutal-shadow",
                      bot.config?.autoResponseEnabled ? "bg-white" : "bg-black"
                    )}
                  >
                    <div className={cn(
                      "absolute top-0.5 w-4 h-4 transition-all",
                      bot.config?.autoResponseEnabled ? "right-1 bg-black" : "left-1 bg-white"
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
                <div className="flex items-center justify-between border-b-[4px] border-white/10 pb-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="font-sans text-xl font-black uppercase flex items-center gap-3">
                      <Zap className="w-8 h-8 text-[var(--brand)]" />
                      Automation Pipeline
                    </h3>
                    <p className="mono-type text-[9px] font-black uppercase opacity-40">Define conditional trigger-action sequences for deployment.</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSuggestWorkflows}
                      disabled={isSuggesting}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 bg-[var(--brand)] text-black border-2 border-black font-black uppercase text-[10px] brutal-shadow-mini hover:-translate-y-1 transition-all disabled:opacity-50",
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
                        className="w-full py-12 border-4 border-dashed border-black/20 bg-black/5 hover:bg-[var(--brand)]/10 hover:border-[var(--brand)]/40 transition-all flex flex-col items-center justify-center gap-4 group"
                     >
                        <div className="p-4 bg-black brutal-shadow-mini group-hover:bg-[var(--brand)] transition-colors">
                           <Sparkles className="w-8 h-8 text-[var(--brand)] group-hover:text-black" />
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
                  
                  {workflows.length === 0 && workflowSuggestions.length === 0 ? (
                    <div className="bg-black/5 p-12 border-2 border-dashed border-black/20 text-center group hover:bg-[var(--brand)]/5 transition-colors cursor-pointer" onClick={addWorkflow}>
                       <Zap className="w-12 h-12 mx-auto mb-4 opacity-10 group-hover:opacity-100 group-hover:text-[var(--brand)] transition-all" />
                       <p className="mono-type text-[10px] uppercase font-black opacity-30 group-hover:opacity-100 transition-all">Pipeline empty. Initialize first sequence.</p>
                    </div>
                  ) : (
                    <>
                      {workflowSuggestions.map((wf, idx) => (
                        <motion.div 
                          key={wf.id}
                          layout
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-[#101010] border-[4px] border-dashed border-[var(--brand)]/50 brutal-shadow p-6 flex flex-col gap-6 relative group"
                        >
                          <div className="absolute top-6 right-6 flex gap-2">
                             <button 
                               onClick={() => acceptSuggestion(wf)} 
                               className="px-4 py-2 bg-[var(--brand)] text-black font-black uppercase text-[10px] hover:bg-white transition-colors"
                             >
                               Accept
                             </button>
                             <button 
                               onClick={() => rejectSuggestion(wf.id)} 
                               className="p-2 border border-white/20 text-white/40 hover:text-white hover:border-white transition-colors"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
  
                          <div className="flex items-center gap-6">
                             <div className="display-type text-2xl font-black italic text-[var(--brand)]">
                                AI_SUGGESTION
                             </div>
                             <div className="h-[1px] flex-grow bg-[var(--brand)]/20" />
                          </div>
  
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 py-4">
                             <div className="space-y-4 opacity-70">
                                <label className="mono-type text-[10px] font-black uppercase text-white/30 tracking-[0.4em] italic">Neural Trigger Event</label>
                                <div className="w-full bg-[#050505] border-2 border-white/10 p-5 font-display font-black uppercase text-base text-[var(--brand)]">
                                  {wf.trigger || "-- BLANK_SIG --"}
                                </div>
                             </div>
                             <div className="space-y-4 opacity-70">
                                <label className="mono-type text-[10px] font-black uppercase text-white/30 tracking-[0.4em] italic">Execution Routine</label>
                                <div className="w-full bg-[#050505] border-2 border-white/10 p-5 font-display font-black uppercase text-base text-[var(--brand)]">
                                  {wf.action || "-- NULL_OP --"}
                                </div>
                             </div>
                          </div>
  
                          <div className="space-y-2 border-t border-[var(--brand)]/20 pt-4">
                             <label className="mono-type text-[8px] font-black uppercase text-[var(--brand)] opacity-80">Agent Logic Supplement</label>
                             <div className="w-full bg-white/5 border-2 border-white/10 p-3 text-[10px] font-mono font-bold text-white">
                                {wf.prompt}
                             </div>
                          </div>
                        </motion.div>
                      ))}
                      {workflows.map((wf, idx) => (
                      <motion.div 
                        key={wf.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-[#0A0A0A] border-[4px] border-white/10 brutal-shadow p-6 flex flex-col gap-6 relative group hover:border-[var(--brand)]/50 transition-colors"
                      >
                        <div className="absolute top-6 right-6">
                           <button 
                             onClick={() => removeWorkflow(wf.id)} 
                             className="p-3 text-white/20 hover:text-[var(--accent)] transition-all duration-500 border border-white/5 hover:border-[var(--accent)]"
                             title="Purge Sequence"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>

                        <div className="flex items-center gap-6">
                           <div className="display-type text-2xl font-black italic text-white/10 group-hover:text-[var(--brand)] transition-colors">
                              {String(idx + 1).padStart(2, '0')}
                           </div>
                           <div className="h-[1px] flex-grow bg-white/5" />
                           <div className={cn(
                             "px-5 py-2 text-[10px] font-black uppercase italic border transition-all duration-500",
                             wf.active ? "bg-[var(--brand)] border-[var(--brand)] text-black" : "bg-transparent border-white/10 text-white/20"
                           )}>
                              {wf.active ? "ACTIVE_PATH" : "OFFLINE"}
                           </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 py-4">
                           <div className="space-y-4">
                              <label className="mono-type text-[10px] font-black uppercase text-white/30 tracking-[0.4em] italic">Neural Trigger Event</label>
                              <select 
                                value={wf.trigger}
                                onChange={(e) => updateWorkflow(wf.id, "trigger", e.target.value)}
                                className="w-full bg-[#050505] border-2 border-white/10 p-5 font-display font-black uppercase text-base text-white focus:border-[var(--brand)] focus:text-white transition-all outline-none appearance-none cursor-pointer"
                              >
                                <option value="">-- BLANK_SIG --</option>
                                {PLATFORM_WORKFLOWS[bot.type]?.triggers?.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                           </div>

                           <div className="space-y-4">
                              <label className="mono-type text-[10px] font-black uppercase text-white/30 tracking-[0.4em] italic">Execution Protocol</label>
                              <select 
                                value={wf.action}
                                onChange={(e) => updateWorkflow(wf.id, "action", e.target.value)}
                                className="w-full bg-[#050505] border-2 border-white/10 p-5 font-display font-black uppercase text-base text-white focus:border-[var(--brand)] focus:text-white transition-all outline-none appearance-none cursor-pointer"
                              >
                                <option value="">-- NULL_OP --</option>
                                {PLATFORM_WORKFLOWS[bot.type]?.actions?.map(a => <option key={a} value={a}>{a}</option>)}
                              </select>
                           </div>
                        </div>

                        <div className="space-y-2 border-t border-white/5 pt-4">
                           <label className="mono-type text-[8px] font-black uppercase opacity-40">Agent Logic Supplement</label>
                           <textarea 
                             placeholder="Inject specific contextual parameters for this automation branch..."
                             rows={2}
                             value={wf.prompt}
                             onChange={(e) => updateWorkflow(wf.id, "prompt", e.target.value)}
                             className="w-full bg-white/5 border-2 border-white/10 p-3 text-[10px] font-mono font-bold text-white focus:border-white focus:outline-none transition-all placeholder:text-white/20"
                           />
                        </div>
                      </motion.div>
                    ))}
                    </>
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
                 <div className="flex items-center justify-between border-b-[4px] border-white/10 pb-2">
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
                 <div className="flex items-center justify-between border-b-[4px] border-white/10 pb-2">
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
                            <span className="text-[8px] opacity-50 mono-type">{m.createdAt?.toDate().toLocaleString()}</span>
                         </div>
                      </div>
                    ))}
                 </div>
              </motion.div>

              <motion.div variants={sectionVariants} className="space-y-4">
                 <div className="flex items-center justify-between border-b-[4px] border-white/10 pb-2">
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
                            <span className="opacity-30 italic">[{log.timestamp?.toDate().toLocaleTimeString()}]</span>
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
              
              <motion.section variants={sectionVariants} className="pt-10 border-t-4 border-white/10 pb-32">
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
