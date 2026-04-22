import { X, Play, Loader2, Gauge, Power, Plus, Trash2, Save, ExternalLink, CheckCircle, AlertCircle, TrendingUp, Sparkles, Calendar, Clock, Database, FileText, Brain, Upload, Zap, Lightbulb, Trophy } from "lucide-react";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { doc, setDoc, serverTimestamp, collection, addDoc, query, where, onSnapshot, limit, orderBy, getDocs, deleteDoc } from "firebase/firestore";
import { db, handleFirestoreError, auth } from "../lib/firebase";
import { cn } from "../lib/utils";
import { GoogleGenAI } from "@google/genai";
import { BOT_TYPES, PLATFORM_WORKFLOWS } from "../constants";
import { Bot } from "../types";
import { handleBotErrorTransition } from "../lib/errorUtils";
import { suggestWorkflows } from "../services/suggestionService";

interface AgentPanelProps {
  bot: Bot | null;
  onClose: () => void;
}

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export function AgentPanel({ bot, onClose }: AgentPanelProps) {
  const [workflows, setWorkflows] = useState<any[]>(bot?.config?.workflows || []);
  const [parameters, setParameters] = useState<{key: string, value: string}[]>([]);
  const [logs, setLogs] = useState<{ time: string; text: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [strategy, setStrategy] = useState<string>("standard");
  const [memories, setMemories] = useState<string[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [platformInfo, setPlatformInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "config" | "knowledge" | "playground">("overview");
  const [systemInstructions, setSystemInstructions] = useState(bot?.config?.systemInstructions || "");
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'bot', text: string}[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!bot) return;
    setWorkflows(bot.config?.workflows || []);
    setStrategy(bot.config?.strategy || "standard");
    
    const params = bot.config?.parameters || {};
    setParameters(Object.entries(params).map(([key, value]) => ({ key, value: String(value) })));

    // Real-time memory
    const memoryRef = collection(db, "users", auth.currentUser!.uid, "bots", bot.id, "memories");
    const unsubMemory = onSnapshot(query(memoryRef, limit(1)), (snap) => {
      if (!snap.empty) setMemories(snap.docs[0].data().memories || []);
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
      unsubMemory();
      unsubFiles();
      unsubMilestones();
      unsubActivities();
    };
  }, [bot?.id]);

  if (!bot) return null;

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const config = {
        ...bot.config,
        workflows,
        strategy,
        systemInstructions,
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

  const addLog = (text: string) => {
    setLogs(prev => [{ time: new Date().toLocaleTimeString(), text }, ...prev].slice(0, 50));
  };

  const handlePlaygroundMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || !ai) return;

    const userText = currentMessage;
    setChatHistory(prev => [...prev, { role: 'user', text: userText }]);
    setCurrentMessage("");
    setIsTyping(true);

    try {
      const prompt = `System Instructions: ${systemInstructions || "You are a helpful assistant."}
Role: ${bot.type} Bot
Strategy: ${strategy}
Win Condition: ${bot.config?.winCondition || "None"}
Workflows Context: ${workflows.map(w => w.action).join(", ")}

User Input: ${userText}

Respond directly as the bot.`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });

      setChatHistory(prev => [...prev, { role: 'bot', text: result.text || "No response generated." }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'bot', text: "[SYSTEM ERROR] Communication failed. " + (e instanceof Error ? e.message : "") }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleTestRun = async () => {
    setIsGenerating(true);
    addLog(`Initiating AI Simulation Cycle for ${bot.name}...`);
    try {
      if (!ai) throw new Error("AI engine not configured (missing API key)");
      const prompt = `Simulate an execution step for ${bot.type}. Current strategy: ${strategy}. Global goals: ${bot.config.userGoal || "Dominance"}. Provide a short report.`;
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      addLog(`[AI_REPORT] ${result.text}`);
    } catch (e) {
      addLog(`[ERROR] ${e instanceof Error ? e.message : 'Unknown failure'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const addWorkflow = () => {
    setWorkflows([...workflows, { id: Date.now(), trigger: "", action: "", prompt: "", active: true }]);
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
    try {
      const filesRef = collection(db, "users", auth.currentUser!.uid, "bots", bot.id, "files");
      await addDoc(filesRef, {
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
        contentSummary: "Analyzing document patterns and core instructions...",
        createdAt: serverTimestamp()
      });
      addLog(`Knowledge asset "${file.name}" uploaded and indexed.`);
    } catch (e) {
      console.error(e);
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
      const suggestions = await suggestWorkflows(bot.type, bot.config?.userGoal || "Business Growth");
      if (suggestions.length > 0) {
        const newWorkflows = suggestions.map((s: any) => ({
          id: Date.now() + Math.random(),
          ...s,
          active: true
        }));
        setWorkflows([...workflows, ...newWorkflows]);
        addLog(`Imported ${suggestions.length} AI-recommended actions.`);
      }
    } catch (e) {
      addLog("Failed to fetch AI suggestions.");
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-[#D4FF00] border-l-[8px] border-black z-50 overflow-y-auto selection:bg-black selection:text-[#D4FF00]"
      >
        <div className="p-8 lg:p-12 text-black">
          <div className="flex justify-between items-start mb-12">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                 <div className="w-4 h-4 bg-black border-2 border-white animate-pulse" />
                 <span className="mono-type text-[10px] font-black uppercase bg-black text-white px-2 py-1">Bot Settings // ID_{bot.id.slice(0, 8)}</span>
              </div>
              <input 
                 className="display-type text-6xl md:text-7xl font-black uppercase tracking-tighter leading-none bg-transparent border-none outline-none focus:bg-white/10 w-full"
                 defaultValue={bot.name}
                 onBlur={(e) => setDoc(doc(db, "users", auth.currentUser!.uid, "bots", bot.id), { name: e.target.value, updatedAt: serverTimestamp() }, { merge: true })}
              />
            </div>
            <button onClick={onClose} className="p-3 bg-black text-white hover:bg-white hover:text-black transition-all border-4 border-black brutal-shadow">
              <X className="w-8 h-8" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-12">
            {platformInfo?.stats && Object.entries(platformInfo.stats).map(([k, v]) => (
              <div key={k} className="bg-black text-white p-4 brutal-border brutal-shadow-red">
                <span className="block mono-type text-[9px] uppercase opacity-60">{k}</span>
                <span className="text-4xl font-sans font-black tracking-tighter">{String(v)}</span>
              </div>
            ))}
          </div>

          <div className="flex border-b-[4px] border-black mb-8 overflow-x-auto">
             {["overview", "config", "knowledge", "playground"].map((tab) => (
               <button
                 key={tab}
                 onClick={() => setActiveTab(tab as any)}
                 className={cn(
                   "px-6 py-3 font-black uppercase text-sm border-r-[4px] border-black hover:bg-black hover:text-[#D4FF00] transition-colors whitespace-nowrap",
                   activeTab === tab ? "bg-black text-[#D4FF00]" : "bg-white text-black"
                 )}
               >
                 {tab}
               </button>
             ))}
          </div>

          {activeTab === "overview" && (
            <div className="space-y-12">
             <section className="space-y-6">
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
                            <span className="block mono-type text-[8px] uppercase font-black opacity-40 mb-1">{m.createdAt?.toDate().toLocaleDateString()}</span>
                            <p className="text-xs font-black uppercase tracking-tight">{m.title}</p>
                         </div>
                      </div>
                    ))
                  )}
                </div>
             </section>


              <div className="space-y-4">
                 <div className="flex items-center justify-between border-b-[4px] border-black pb-2">
                    <h3 className="font-sans text-xl font-black uppercase">Recent Bot Activity</h3>
                    <span className="bg-black text-[var(--brand)] px-2 py-0.5 text-[8px] font-black mono-type uppercase">Live Feed</span>
                 </div>
                 <div className="w-full h-48 bg-white border-[4px] border-black p-4 font-mono text-[10px] overflow-y-auto space-y-2">
                     {activities.length === 0 ? <div className="text-center opacity-30 py-10 uppercase">Waiting for activity...</div> : activities.map((log) => (
                       <div key={log.id} className="flex gap-4 border-l-2 border-black/10 pl-2">
                          <span className="opacity-30 italic">[{log.timestamp?.toDate().toLocaleTimeString()}]</span>
                          <p className={cn(
                            "font-bold",
                            log.type === 'error' ? "text-red-500" : (log.type === 'action' ? "text-black" : "text-blue-600")
                          )}>
                            {log.text}
                          </p>
                       </div>
                     ))}
                 </div>
              </div>
              <section className="pt-10 border-t-4 border-black">
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
              </section>
            </div>
          )}
          {activeTab === "knowledge" && (
            <div className="space-y-12">
             <section className="space-y-6 text-black bg-white p-8 border-[4px] border-black brutal-shadow">
                <div className="flex items-center justify-between border-b-[4px] border-black pb-2">
                  <h3 className="font-sans text-3xl font-black uppercase flex items-center gap-3"><Brain className="w-8 h-8" />Bot Memory</h3>
                  <button 
                    onClick={async () => {
                      if (confirm("Reset bot memory? This cannot be undone.")) {
                        const mRef = collection(db, "users", auth.currentUser!.uid, "bots", bot.id, "memories");
                        const mSnap = await getDocs(query(mRef, limit(1)));
                        if (!mSnap.empty) {
                          await deleteDoc(doc(db, "users", auth.currentUser!.uid, "bots", bot.id, "memories", mSnap.docs[0].id));
                        }
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
                  <div className="bg-black text-[#D4FF00] border-[4px] border-black p-4 min-h-[100px] max-h-[200px] overflow-y-auto space-y-2 brutal-shadow text-xs">
                    {memories.length === 0 ? (
                      <div className="text-[10px] font-mono opacity-50 italic text-[#D4FF00]">Memory empty. Waiting for cycles...</div>
                    ) : (
                      memories.map((m, i) => (
                        <div key={i} className="flex gap-3 text-[10px] font-bold border-l-2 border-white/20 pl-3 py-1">
                           <span className="opacity-30 self-start text-[#D4FF00]">{i + 1}</span>
                           <p>{m}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
             </section>

             <section className="space-y-6 text-black bg-white p-8 border-[4px] border-black brutal-shadow">
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
             </section>

            <section className="space-y-6">
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
                  <label className="mono-type text-[10px] font-black uppercase text-[#D4FF00]">Core Responsibilities</label>
                  <input 
                    className="w-full bg-black text-white border-[4px] border-black p-3 font-mono font-bold text-xs brutal-shadow outline-none"
                    placeholder="Duty 1, Duty 2, Duty 3..."
                    defaultValue={bot.config?.responsibilities?.join(', ') || ""}
                    onBlur={(e) => setDoc(doc(db, "users", auth.currentUser!.uid, "bots", bot.id), { config: { ...bot.config, responsibilities: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }, updatedAt: serverTimestamp() }, { merge: true })}
                  />
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
            </section>

            <section className="space-y-6">
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
                  <label className="mono-type text-[10px] font-black uppercase">Success Criteria (Winning Condition)</label>
                  <input 
                    className="w-full bg-black text-[#D4FF00] border-[4px] border-black p-3 font-mono font-bold text-xs brutal-shadow outline-none placeholder:text-white/30"
                    placeholder="e.g. ROI > 5%, Resolved Support Ticket"
                    defaultValue={bot.config?.winCondition || ""}
                    onBlur={(e) => setDoc(doc(db, "users", auth.currentUser!.uid, "bots", bot.id), { config: { ...bot.config, winCondition: e.target.value }, updatedAt: serverTimestamp() }, { merge: true })}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-6">
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
            </section>

            <section className="space-y-6">
              <div className="flex items-center justify-between border-b-[4px] border-black pb-2">
                <h3 className="font-sans text-3xl font-black uppercase flex items-center gap-2 underline decoration-4">Bot Actions</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={handleSuggestWorkflows}
                    disabled={isSuggesting}
                    className="p-2 bg-[var(--brand)] text-black border-2 border-black hover:bg-white transition-all disabled:opacity-50"
                    title="Get AI Suggestions"
                  >
                    {isSuggesting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lightbulb className="w-5 h-5" />}
                  </button>
                  <button onClick={addWorkflow} className="p-2 bg-black text-white hover:bg-white hover:text-black transition-all border-2 border-black"><Plus className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="space-y-4">
                {workflows.map((wf) => (
                  <div key={wf.id} className="bg-black text-white p-6 border-[4px] border-white/20 brutal-shadow relative">
                    <button onClick={() => removeWorkflow(wf.id)} className="absolute top-2 right-2 text-white/50 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="mono-type text-[8px] font-black uppercase text-white/50 block mb-1">When this happens...</label>
                        <select 
                          value={wf.trigger}
                          onChange={(e) => updateWorkflow(wf.id, "trigger", e.target.value)}
                          className="w-full bg-black border border-white/20 p-2 text-[10px] font-bold"
                        >
                          <option value="">Select Trigger</option>
                          {PLATFORM_WORKFLOWS[bot.type]?.triggers.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="mono-type text-[8px] font-black uppercase text-white/50 block mb-1">Do this action...</label>
                        <select 
                          value={wf.action}
                          onChange={(e) => updateWorkflow(wf.id, "action", e.target.value)}
                          className="w-full bg-black border border-white/20 p-2 text-[10px] font-bold"
                        >
                          <option value="">Select Action</option>
                          {PLATFORM_WORKFLOWS[bot.type]?.actions.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </div>
                    </div>
                    <textarea 
                      placeholder="Special instructions for this rule..."
                      rows={2}
                      value={wf.prompt}
                      onChange={(e) => updateWorkflow(wf.id, "prompt", e.target.value)}
                      className="w-full bg-black border border-white/20 p-3 text-[10px] font-mono focus:border-[var(--brand)] focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </section>

            </div>
          )}
          {activeTab === "config" && (
            <div className="space-y-12">
             <section className="space-y-6 bg-white p-8 border-[4px] border-black brutal-shadow">
               <h3 className="font-sans text-2xl font-black uppercase flex items-center gap-2 mb-4">System Instructions</h3>
               <textarea
                 className="w-full bg-black text-[#D4FF00] border-[4px] border-black p-4 font-mono text-xs brutal-shadow outline-none placeholder:text-white/30 h-32"
                 placeholder="e.g. You are a helpful assistant. Always verify data before responding."
                 value={systemInstructions}
                 onChange={(e) => setSystemInstructions(e.target.value)}
                 onBlur={(e) => setDoc(doc(db, "users", auth.currentUser!.uid, "bots", bot.id), { config: { ...bot.config, systemInstructions: e.target.value }, updatedAt: serverTimestamp() }, { merge: true })}
               />
               <div className="flex gap-4 mt-4">
                 {["Web Search", "Code Execution", "API Access"].map(tool => (
                    <label key={tool} className="flex items-center gap-2 mono-type text-[10px] font-black uppercase cursor-pointer">
                      <input type="checkbox" defaultChecked={true} className="w-4 h-4 accent-black" /> {tool}
                    </label>
                 ))}
               </div>
             </section>

              <section className="space-y-6">
                <div className="flex items-center justify-between border-b-[4px] border-black pb-2">
                  <h3 className="font-sans text-3xl font-black uppercase flex items-center gap-2 underline decoration-4">Bot Core Directives</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="mono-type text-[10px] font-black uppercase">Execution Strategy</label>
                    <select
                      value={strategy}
                      onChange={(e) => setStrategy(e.target.value)}
                      className="w-full bg-black border-[4px] border-black p-3 font-mono font-bold text-[#D4FF00] outline-none"
                    >
                      <option value="standard">Standard Operation</option>
                      <option value="aggressive">Aggressive / Fast</option>
                      <option value="conservative">Conservative / Safe</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="mono-type text-[10px] font-black uppercase">Success Criteria (Winning Condition)</label>
                    <input
                      className="w-full bg-black text-[#D4FF00] border-[4px] border-black p-3 font-mono font-bold text-xs brutal-shadow outline-none placeholder:text-white/30"
                      placeholder="e.g. ROI > 5%, Resolved Support Ticket"
                      defaultValue={bot.config?.winCondition || ""}
                      onBlur={(e) => setDoc(doc(db, "users", auth.currentUser!.uid, "bots", bot.id), { config: { ...bot.config, winCondition: e.target.value }, updatedAt: serverTimestamp() }, { merge: true })}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-6">
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
              </section>

              <section className="space-y-6">
                <div className="flex items-center justify-between border-b-[4px] border-black pb-2">
                  <h3 className="font-sans text-3xl font-black uppercase flex items-center gap-2 underline decoration-4">Bot Actions</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSuggestWorkflows}
                      disabled={isSuggesting}
                      className="p-2 bg-[var(--brand)] text-black border-2 border-black hover:bg-white transition-all disabled:opacity-50"
                      title="Get AI Suggestions"
                    >
                      {isSuggesting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lightbulb className="w-5 h-5" />}
                    </button>
                    <button onClick={addWorkflow} className="p-2 bg-black text-white hover:bg-white hover:text-black transition-all border-2 border-black"><Plus className="w-5 h-5" /></button>
                  </div>
                </div>
                <div className="space-y-4">
                  {workflows.map((wf) => (
                    <div key={wf.id} className="bg-black text-white p-6 border-[4px] border-white/20 brutal-shadow relative">
                      <button onClick={() => removeWorkflow(wf.id)} className="absolute top-2 right-2 text-white/50 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="mono-type text-[8px] font-black uppercase text-white/50 block mb-1">When this happens...</label>
                          <select
                            value={wf.trigger}
                            onChange={(e) => updateWorkflow(wf.id, "trigger", e.target.value)}
                            className="w-full bg-black border border-white/20 p-2 text-[10px] font-bold"
                          >
                            <option value="">Select Trigger</option>
                            {PLATFORM_WORKFLOWS[bot.type]?.triggers.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="mono-type text-[8px] font-black uppercase text-white/50 block mb-1">Do this action...</label>
                          <select
                            value={wf.action}
                            onChange={(e) => updateWorkflow(wf.id, "action", e.target.value)}
                            className="w-full bg-black border border-white/20 p-2 text-[10px] font-bold"
                          >
                            <option value="">Select Action</option>
                            {PLATFORM_WORKFLOWS[bot.type]?.actions.map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                        </div>
                      </div>
                      <textarea
                        placeholder="Special instructions for this rule..."
                        rows={2}
                        value={wf.prompt}
                        onChange={(e) => updateWorkflow(wf.id, "prompt", e.target.value)}
                        className="w-full bg-black border border-white/20 p-3 text-[10px] font-mono focus:border-[var(--brand)] focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === "playground" && (
            <div className="space-y-12 h-full">
              <section className="bg-white p-8 border-[4px] border-black brutal-shadow h-[500px] flex flex-col">
                 <h3 className="font-sans text-2xl font-black uppercase border-b-4 border-black pb-2 mb-4">Playground Interface</h3>
                 <div className="flex-grow bg-black p-4 font-mono text-xs overflow-y-auto border-4 border-black mb-4 space-y-4">
                   {chatHistory.length === 0 ? (
                     <div className="opacity-50 italic text-[#D4FF00] text-center mt-10">Simulation initialized with current bot configuration. Awaiting user input...</div>
                   ) : (
                     chatHistory.map((msg, i) => (
                       <div key={i} className={cn(
                         "p-3 max-w-[80%] border-2 brutal-shadow",
                         msg.role === 'user'
                          ? "bg-white text-black border-black ml-auto rounded-tl-xl rounded-bl-xl rounded-br-xl"
                          : "bg-[var(--brand)] text-black border-black mr-auto rounded-tr-xl rounded-br-xl rounded-bl-xl"
                       )}>
                         <span className="block text-[8px] font-black uppercase mb-1 opacity-50">{msg.role === 'user' ? 'You' : bot.name}</span>
                         <div className="whitespace-pre-wrap">{msg.text}</div>
                       </div>
                     ))
                   )}
                   {isTyping && (
                      <div className="p-3 max-w-[80%] bg-[var(--brand)] text-black border-2 border-black mr-auto rounded-tr-xl rounded-br-xl rounded-bl-xl brutal-shadow">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                   )}
                 </div>
                 <form onSubmit={handlePlaygroundMessage} className="flex gap-2">
                   <input
                     value={currentMessage}
                     onChange={(e) => setCurrentMessage(e.target.value)}
                     className="flex-grow bg-white border-[4px] border-black p-3 font-mono font-bold text-xs outline-none focus:border-[var(--brand)]"
                     placeholder="Send a test message..."
                     disabled={isTyping}
                   />
                   <button
                     type="submit"
                     disabled={isTyping || !currentMessage.trim()}
                     className="bg-black text-white px-6 font-black uppercase hover:bg-[var(--brand)] hover:text-black border-4 border-black transition-colors disabled:opacity-50"
                   >
                     Send
                   </button>
                 </form>
              </section>
            </div>
          )}

          {(activeTab === "config" || activeTab === "overview") && (
            <div className="pt-10 flex gap-4">
               <button 
                 onClick={handleSaveConfig}
                 disabled={isSaving}
                 className="flex-grow hardware-button !bg-black !text-white hover:!bg-white hover:!text-black"
               >
                 {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : "Save Bot Settings"}
               </button>
               <button 
                onClick={handleTestRun}
                disabled={isGenerating}
                className="p-4 bg-white border-4 border-black brutal-shadow hover:-translate-y-1 transition-all disabled:opacity-50"
               >
                 <Play className={cn("w-8 h-8", isGenerating && "animate-pulse")} />
               </button>
            </div>
          )}

        </div>
      </motion.div>
    </AnimatePresence>
  );
}