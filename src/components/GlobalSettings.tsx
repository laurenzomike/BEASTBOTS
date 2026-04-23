import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, User, Zap, Terminal, Save, Lock, Cpu } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { cn } from '../lib/utils';

interface GlobalSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  user: FirebaseUser;
  globalDirective: string;
  onDirectiveSubmit: (directive: string) => void;
  persona: "aggressive" | "passive" | "balanced";
  onPersonaChange: (p: "aggressive" | "passive" | "balanced") => void;
}

export const GlobalSettings: React.FC<GlobalSettingsProps> = ({
  isOpen,
  onClose,
  user,
  globalDirective,
  onDirectiveSubmit,
  persona,
  onPersonaChange
}) => {
  const [localDirective, setLocalDirective] = React.useState(globalDirective);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onDirectiveSubmit(localDirective);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 40 }}
            className="relative w-full max-w-2xl bg-[#f0f0f0] border-[4px] border-black brutal-shadow overflow-hidden"
          >
            {/* Header */}
            <div className="bg-black p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Shield className="text-[#D4FF00] w-5 h-5" />
                <span className="mono-type text-xs font-black uppercase text-white tracking-widest">Global Systems Config // V1.0.4</span>
              </div>
              <button 
                onClick={onClose}
                className="p-1 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 max-h-[80vh] overflow-y-auto">
              {/* Profile Section */}
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5" />
                  <h3 className="font-sans text-xl font-black uppercase">Identity Profile</h3>
                </div>
                <div className="bg-white border-2 border-black p-4 brutal-shadow-mini flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="mono-type text-[10px] uppercase font-black opacity-40 block">Authenticated As</span>
                    <span className="font-sans font-black">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] mono-type font-black uppercase bg-[#D4FF00] px-2 py-1 border-[1px] border-black italic">
                    <Lock className="w-3 h-3" /> Encrypted Session
                  </div>
                </div>
              </div>

              {/* Protocol Section */}
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <Terminal className="w-5 h-5" />
                  <h3 className="font-sans text-xl font-black uppercase">Universal Protocol</h3>
                </div>
                <p className="text-[11px] mb-4 opacity-70 leading-relaxed font-medium">
                  This directive is broadcasted to all fleet agents. It serves as their primary ethical and operational boundary.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <textarea 
                    value={localDirective}
                    onChange={(e) => setLocalDirective(e.target.value)}
                    className="w-full h-32 bg-white border-4 border-black p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#D4FF00] resize-none"
                    placeholder="Enter universal mission parameters..."
                  />
                  <button 
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 bg-[#D4FF00] text-black border-4 border-black font-black uppercase text-xs brutal-shadow hover:-translate-y-1 active:translate-y-0 transition-transform"
                  >
                    <Save className="w-4 h-4" /> Broadcast Protocol
                  </button>
                </form>
              </div>

              {/* Persona Selector */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5" />
                  <h3 className="font-sans text-xl font-black uppercase">Fleet Persona</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {(["passive", "balanced", "aggressive"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => onPersonaChange(p)}
                      className={cn(
                        "p-4 border-4 border-black text-[10px] font-black uppercase brutal-shadow-mini transition-all",
                        persona === p ? "bg-black text-[#D4FF00] -translate-y-1" : "bg-white hover:bg-gray-100"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <p className="mt-4 text-[9px] mono-type opacity-50 italic">
                  * Affects how agents prioritize risk vs. growth in autonomous decision cycles.
                </p>
              </div>

              {/* Hardware Stats */}
              <div className="mt-12 pt-8 border-t-2 border-black/10 grid grid-cols-2 gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
                  <div className="flex items-center gap-3">
                    <Cpu className="w-8 h-8" />
                    <div>
                        <span className="block text-[8px] mono-type font-black">CORE_LOAD</span>
                        <div className="w-24 h-1 bg-black/20">
                            <div className="w-[12%] h-full bg-black" />
                        </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Terminal className="w-8 h-8" />
                    <div>
                        <span className="block text-[8px] mono-type font-black">ENCRYPTION_LEVEL</span>
                        <span className="text-xs font-black uppercase">AES-256-GCM</span>
                    </div>
                  </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
