import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, 
  Target, 
  Clock, 
  ClipboardList, 
  Zap, 
  ChevronRight, 
  BrainCircuit,
  ShieldCheck,
  Wand2,
  Info
} from 'lucide-react';
import { Bot, BotType } from '../types';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { PLATFORM_WORKFLOWS } from '../constants';
import { cn } from '../lib/utils';

interface Props {
  bot: Bot;
  typeDef?: BotType;
  onComplete: () => void;
}

export const AgentOnboarding: React.FC<Props> = ({ bot, typeDef, onComplete }) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    winCondition: bot.config?.winCondition || '',
    systemDirective: bot.config?.systemDirective || '',
    schedule: bot.config?.schedule || '24/7 Continuous',
    responsibilities: bot.config?.responsibilities || typeDef?.responsibilities?.filter(r => r.defaultEnabled).map(r => r.id) || [],
    parameters: bot.config?.parameters || typeDef?.parameters?.reduce((acc, p) => ({ ...acc, [p.id]: p.defaultValue }), {}) || {}
  });

  const generateSuggestions = (fieldId: string) => {
    const platformClass = bot.type;
    switch (fieldId) {
      case 'winCondition':
        if (['alpaca', 'coinbase'].includes(platformClass)) return ['Daily ROI > 2%', '5 profitable trades closed', 'Zero liquidations'];
        if (['kalshi', 'polymarket'].includes(platformClass)) return ['Predict 3 events correctly', 'Yield > 5% on active hedges', 'Maintain completely market-neutral book'];
        if (['shopify', 'amazon', 'etsy', 'ebay'].includes(platformClass)) return ['Increase weekly sales by 10%', 'Maintain 5-star review average', 'Zero unresolved support tickets by EOD'];
        if (['gmail', 'discord'].includes(platformClass)) return ['Inbox zero by 5PM', 'Average response time < 2 mins', 'Zero unread @mentions'];
        if (['youtube', 'facebook', 'pinterest'].includes(platformClass)) return ['Reach 10k impressions', 'Achieve 5%+ Ad CTR', '100 new followers gained this week'];
        if (platformClass === 'botboss') return ['100% Fleet Uptime', 'Zero unhandled errors in system logs'];
        return ['High positive engagement', 'Complete daily processing with zero errors'];
      case 'systemDirective':
        return [
          'ACT AGGRESSIVELY: Prioritize speed, volume, and scale over edge-case precision.',
          'ACT PRESERVINGLY: Prioritize capital, brand safety, and extreme precision above all else.',
          'ACT EMPATHETICALLY: Be a highly-professional, polite, and accommodating representative.'
        ];
      case 'schedule':
        return ['24/7 Continuous Monitoring', 'Mon-Fri 9AM to 5PM EST', 'Nightly Batch at Midnight', 'Weekends Only'];
      case 'scope':
        const actions = PLATFORM_WORKFLOWS[platformClass]?.actions || [];
        return actions.length > 0 ? [actions.join(', ')] : ['Monitor, Analyze, Execute'];
      default:
        return [];
    }
  };

  const steps = [
    {
      id: 'vision',
      title: 'Success Directive',
      icon: Target,
      label: `What counts as a "Win" for your ${typeDef?.name || 'Agent'}?`,
      description: `Given their expertise (${typeDef?.expertise || 'general operations'}), what target should they aim for?`,
      field: 'winCondition',
      placeholder: 'e.g. Sales > $500, Resolved ticket without escalation...',
      helpText: "Impact: Defines the objective completion criteria. The agent uses this to monitor its own performance and signal when goals are achieved."
    },
    {
      id: 'protocol',
      title: 'Executive Protocol',
      icon: ClipboardList,
      label: 'Operational Scopes',
      description: `Select the specialized duties this assistant is authorized to manage.`,
      field: 'responsibilities',
      helpText: "Impact: Restricts the agent's API access to only these modules. Actions outside selected scopes will be automatically blocked by the system core."
    },
    {
      id: 'behavior',
      title: 'Action Engine',
      icon: Terminal,
      label: 'Operational Personality',
      description: 'Inject custom logic, tone, and boundaries into the decision engine.',
      field: 'systemDirective',
      placeholder: 'e.g. Be technical and precise. Refuse low-margin requests...',
      helpText: "Impact: Directly modifies the agent's core system prompt. This shapes how the agent reasons, speaks, and prioritizes conflicting goals."
    },
    {
      id: 'schedule',
      title: 'Operational Schedule',
      icon: Clock,
      label: 'When is this agent authorized to act?',
      description: 'Set maintenance windows, active duty cycles, or continuous monitoring.',
      field: 'schedule',
      placeholder: 'e.g. Mon-Fri 9-5, Daily at Midnight, 24/7...',
      helpText: "Impact: Governs the activity windows. The agent will remain in 'Standby' mode outside of these specific hours to conserve neural resources."
    }
  ];

  const handleComplete = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "users", auth.currentUser!.uid, "bots", bot.id);
      await setDoc(docRef, {
        config: {
          ...bot.config,
          ...config,
          isInitialized: true
        },
        updatedAt: serverTimestamp()
      }, { merge: true });
      onComplete();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const currentStep = steps[step];
  const suggestions = generateSuggestions(currentStep.id);

  return (
    <div className="min-h-[600px] h-full bg-black text-white p-4 sm:p-8 md:p-16 flex flex-col justify-center items-center relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 border-[1px] border-white rotate-45" />
        <div className="absolute bottom-10 right-10 w-96 h-96 border-[1px] border-white -rotate-12" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border-[1px] border-white/20 rounded-full" />
      </div>

      <div className="w-full max-w-3xl relative z-10">
        <header className="mb-8 md:mb-12 text-center">
            <div className="inline-flex items-center gap-2 bg-[var(--brand)] text-black px-4 py-1 font-black uppercase text-[10px] mb-4 brutal-shadow">
                <BrainCircuit className="w-4 h-4 text-black" />
                Initialization Mode
            </div>
            <h2 className="display-type text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-2">
                Train your {typeDef?.name || 'Agent'}
            </h2>
            <p className="text-[var(--brand)] font-mono text-xs uppercase tracking-widest bg-black/50 p-2 inline-block">
                 Role: {typeDef?.role || 'Specialist'}
            </p>
        </header>

        <AnimatePresence mode="wait">
          <motion.div 
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-[#1A1A1A] border-4 border-white p-6 sm:p-8 brutal-shadow relative overflow-hidden"
          >
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <currentStep.icon size={160} />
              </div>

              <div className="relative z-10 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="p-3 bg-white text-black brutal-shadow self-start sm:self-auto">
                          <currentStep.icon className="w-8 h-8" />
                      </div>
                      <div>
                          <h3 className="text-2xl font-black uppercase tracking-tight text-[var(--brand)]">{currentStep.title}</h3>
                          <p className="text-xs font-mono uppercase opacity-70 mt-1">{currentStep.description}</p>
                      </div>
                  </div>

                  <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <label className="block font-mono text-sm font-black uppercase text-white">{currentStep.label}</label>
                        <div className="group/tooltip relative">
                           <Info className="w-4 h-4 text-[var(--brand)] opacity-50 hover:opacity-100 cursor-help transition-opacity" />
                           <div className="absolute left-0 bottom-full mb-4 w-64 p-3 bg-white text-black text-[10px] font-mono uppercase font-black brutal-shadow opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity z-50">
                              <div className="absolute left-4 -bottom-2 w-4 h-4 bg-white border-b-2 border-r-2 border-black rotate-45" />
                              {currentStep.helpText}
                           </div>
                        </div>
                      </div>
                      
                      {currentStep.id === 'protocol' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           {typeDef?.responsibilities?.map(resp => (
                             <button
                               key={resp.id}
                               onClick={() => {
                                 const current = config.responsibilities;
                                 const exists = current.includes(resp.id);
                                 setConfig({
                                   ...config,
                                   responsibilities: exists 
                                     ? current.filter((id: string) => id !== resp.id)
                                     : [...current, resp.id]
                                 });
                               }}
                               className={cn(
                                 "p-4 border-4 text-left transition-all brutal-shadow",
                                 config.responsibilities.includes(resp.id)
                                   ? "bg-[var(--brand)] border-black text-black"
                                   : "bg-black border-white/20 text-white opacity-60 hover:opacity-100"
                               )}
                             >
                               <div className="text-[11px] font-black uppercase">{resp.label}</div>
                               <div className="text-[8px] mono-type mt-1 opacity-70">{resp.description}</div>
                             </button>
                           ))}
                        </div>
                      ) : (
                        <textarea
                            autoFocus
                            value={config[currentStep.field as keyof typeof config] as string}
                            onChange={(e) => setConfig({ ...config, [currentStep.field]: e.target.value })}
                            placeholder={currentStep.placeholder}
                            className="w-full bg-black border-4 border-white p-4 font-mono text-sm text-white focus:border-[var(--brand)] outline-none min-h-[120px] transition-colors resize-none brutal-shadow"
                        />
                      )}
                      
                      {currentStep.id === 'behavior' && typeDef?.parameters?.length ? (
                        <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
                            <div className="flex items-center gap-2">
                               <label className="block font-mono text-sm font-black uppercase text-[var(--brand)]">Initial Tuning</label>
                               <div className="group/tuning relative">
                                  <Info className="w-3 h-3 text-[var(--brand)] opacity-50 hover:opacity-100 cursor-help transition-opacity" />
                                  <div className="absolute left-0 bottom-full mb-4 w-64 p-3 bg-white text-black text-[10px] font-mono uppercase font-black brutal-shadow opacity-0 group-hover/tuning:opacity-100 pointer-events-none transition-opacity z-50">
                                     <div className="absolute left-4 -bottom-2 w-4 h-4 bg-white border-b-2 border-r-2 border-black rotate-45" />
                                     Impact: Calibrates the agent's internal thresholds for risk, speed, and resource allocation.
                                  </div>
                               </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                               {typeDef.parameters.map(param => (
                                 <div key={param.id} className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter group/param relative">
                                       <div className="flex items-center gap-1">
                                          <span>{param.label}</span>
                                          <Info className="w-2.5 h-2.5 opacity-30 group-hover/param:opacity-100" />
                                       </div>
                                       <span className="text-[var(--brand)]">{config.parameters[param.id]}</span>
                                       
                                       <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-[var(--brand)] text-black text-[9px] font-mono uppercase font-black brutal-shadow opacity-0 group-hover/param:opacity-100 pointer-events-none transition-opacity z-50">
                                          {param.description}
                                       </div>
                                    </div>
                                    <input 
                                       type={param.type === 'number' ? 'range' : 'text'}
                                       min={param.type === 'number' ? 0 : undefined}
                                       max={param.type === 'number' ? 1000 : undefined}
                                       value={config.parameters[param.id] || param.defaultValue}
                                       onChange={(e) => setConfig({
                                         ...config,
                                         parameters: { ...config.parameters, [param.id]: e.target.value }
                                       })}
                                       className={cn(
                                         "w-full bg-black border-2 border-white/20 p-2 text-xs font-mono text-white outline-none focus:border-[var(--brand)]",
                                         param.type === 'number' && "h-1 appearance-none bg-white/10 accent-[var(--brand)]"
                                       )}
                                    />
                                 </div>
                               ))}
                            </div>
                        </div>
                      ) : null}
                      
                      {suggestions.length > 0 && currentStep.id !== 'protocol' && (
                        <div className="space-y-2 mt-4">
                           <div className="flex items-center gap-2 text-[var(--brand)]">
                             <Wand2 className="w-3 h-3" />
                             <span className="font-mono text-[9px] uppercase font-black">AI Suggestions:</span>
                           </div>
                           <div className="flex flex-wrap gap-2">
                             {suggestions.map((s, idx) => (
                               <button
                                 key={idx}
                                 onClick={() => setConfig({ ...config, [currentStep.field]: s })}
                                 className="px-3 py-1.5 bg-white/10 border border-white/20 hover:bg-[var(--brand)] hover:text-black hover:border-black font-mono text-[10px] transition-all text-left"
                               >
                                 {s}
                               </button>
                             ))}
                           </div>
                        </div>
                      )}
                  </div>

                  <div className="pt-8 flex flex-col-reverse sm:flex-row justify-between items-center gap-6">
                      <div className="flex gap-3">
                          {steps.map((_, i) => (
                              <div 
                                  key={i} 
                                  className={`w-3 h-3 border-2 border-white transition-all ${step === i ? 'bg-[var(--brand)] scale-125' : i < step ? 'bg-white' : 'bg-transparent'}`} 
                              />
                          ))}
                      </div>

                      <div className="flex w-full sm:w-auto gap-4">
                          {step > 0 && (
                              <button 
                                  onClick={() => setStep(step - 1)}
                                  className="flex-1 sm:flex-none px-6 py-3 border-4 border-white font-black uppercase text-sm hover:bg-white hover:text-black transition-all"
                              >
                                  Back
                              </button>
                          )}
                          <button 
                              disabled={loading}
                              onClick={step === steps.length - 1 ? handleComplete : () => setStep(step + 1)}
                              className="flex-1 sm:flex-none px-6 py-3 bg-[var(--brand)] text-black font-black uppercase text-sm brutal-shadow hover:translate-x-1 hover:-translate-y-1 transition-all flex justify-center items-center gap-2"
                          >
                              {step === steps.length - 1 ? (loading ? 'Initializing...' : 'Engage Protocol') : 'Next'}
                              <ChevronRight className="w-5 h-5" />
                          </button>
                      </div>
                  </div>
              </div>
          </motion.div>
        </AnimatePresence>

        <footer className="mt-8 text-center">
            <div className="flex justify-center gap-8 opacity-40">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="mono-type text-[10px] uppercase font-bold">Secure Protocol</span>
                </div>
                <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span className="mono-type text-[10px] uppercase font-bold">Real-Time</span>
                </div>
            </div>
        </footer>
      </div>
    </div>
  );
};
