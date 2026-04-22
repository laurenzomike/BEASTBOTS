import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Terminal, 
  Target, 
  Clock, 
  ClipboardList, 
  Zap, 
  ChevronRight, 
  BrainCircuit,
  ShieldCheck
} from 'lucide-react';
import { Bot, BotType } from '../types';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

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
    schedule: bot.config?.schedule || '24/7 Monitoring',
    responsibilities: bot.config?.responsibilities?.join(', ') || ''
  });

  const steps = [
    {
      id: 'vision',
      title: 'Success Directive',
      icon: Target,
      label: 'What counts as a "Win" for this agent?',
      description: 'Defined victory conditions ensure the agent stays focused on high-yield outcomes.',
      field: 'winCondition',
      placeholder: 'e.g. Sales > $500, Resolved ticket without escalation...'
    },
    {
      id: 'behavior',
      title: 'Command Protocol',
      icon: Terminal,
      label: 'How should this executive behave?',
      description: 'Inject custom operational logic, tone, and refusal criteria.',
      field: 'systemDirective',
      placeholder: 'e.g. Be technical and precise. Refuse low-margin requests...'
    },
    {
      id: 'schedule',
      title: 'Operational Schedule',
      icon: Clock,
      label: 'When is this agent on duty?',
      description: 'Set maintenance windows or active duty cycles.',
      field: 'schedule',
      placeholder: 'e.g. Mon-Fri 9-5, Daily at Midnight...'
    },
    {
      id: 'scope',
      title: 'Executive Scope',
      icon: ClipboardList,
      label: 'List core responsibilities',
      description: 'Separate with commas. These are the pillars of the agent\'s autonomy.',
      field: 'responsibilities',
      placeholder: 'e.g. Inventory check, Customer outreach, Trend analysis...'
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
          responsibilities: config.responsibilities.split(',').map(s => s.trim()).filter(Boolean),
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

  return (
    <div className="min-h-[600px] bg-black text-white p-8 md:p-16 flex flex-col justify-center items-center relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 border-[1px] border-white rotate-45" />
        <div className="absolute bottom-10 right-10 w-96 h-96 border-[1px] border-white -rotate-12" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border-[1px] border-white/20 rounded-full" />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <header className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 bg-[#D4FF00] text-black px-4 py-1 font-black uppercase text-[10px] mb-4 brutal-shadow">
                <BrainCircuit className="w-4 h-4 text-black" />
                Initialization Mode
            </div>
            <h2 className="display-type text-5xl font-black uppercase tracking-tighter leading-none mb-2">
                Train your {typeDef?.name || 'Agent'}
            </h2>
            <p className="text-white/60 font-mono text-xs uppercase tracking-widest">
                Executive Onboarding | Protocol {step + 1} of {steps.length}
            </p>
        </header>

        <motion.div 
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#1A1A1A] border-[4px] border-white p-8 brutal-shadow relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <currentStep.icon size={120} />
            </div>

            <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white text-black brutal-shadow">
                        <currentStep.icon className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black uppercase tracking-tight text-[#D4FF00]">{currentStep.title}</h3>
                        <p className="text-[10px] mono-type uppercase opacity-60 max-w-md">{currentStep.description}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="block mono-type text-[11px] font-black uppercase text-white/80">{currentStep.label}</label>
                    <textarea
                        autoFocus
                        value={config[currentStep.field as keyof typeof config]}
                        onChange={(e) => setConfig({ ...config, [currentStep.field]: e.target.value })}
                        placeholder={currentStep.placeholder}
                        className="w-full bg-black border-[3px] border-white p-4 font-mono text-xs text-white focus:border-[#D4FF00] outline-none min-h-[120px] transition-colors"
                    />
                </div>

                <div className="pt-6 flex justify-between items-center">
                    <div className="flex gap-2">
                        {steps.map((_, i) => (
                            <div 
                                key={i} 
                                className={`w-3 h-3 border-2 border-white ${step === i ? 'bg-[#D4FF00]' : i < step ? 'bg-white' : 'bg-transparent'}`} 
                            />
                        ))}
                    </div>

                    <div className="flex gap-4">
                        {step > 0 && (
                            <button 
                                onClick={() => setStep(step - 1)}
                                className="px-6 py-2 border-2 border-white font-black uppercase text-xs hover:bg-white hover:text-black transition-all"
                            >
                                Back
                            </button>
                        )}
                        <button 
                            disabled={loading}
                            onClick={step === steps.length - 1 ? handleComplete : () => setStep(step + 1)}
                            className="px-6 py-2 bg-[#D4FF00] text-black font-black uppercase text-xs brutal-shadow hover:translate-x-1 hover:-translate-y-1 transition-all flex items-center gap-2"
                        >
                            {step === steps.length - 1 ? (loading ? 'Initializing...' : 'Complete Setup') : 'Next Protocol'}
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>

        <footer className="mt-12 text-center space-y-4">
            <div className="flex justify-center gap-8 opacity-40">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="mono-type text-[9px] uppercase">Secure Training</span>
                </div>
                <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span className="mono-type text-[9px] uppercase">Instant Activation</span>
                </div>
            </div>
        </footer>
      </div>
    </div>
  );
};
