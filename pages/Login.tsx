import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scale } from 'lucide-react';
import { useStore } from '../context/Store';

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';

const DecodeText = ({ text, start = false, className = "" }: { text: string, start: boolean, className?: string }) => {
  const [displayed, setDisplayed] = useState(text.split('').map(() => ''));

  useEffect(() => {
    if (!start) return;

    let iterations = 0;
    const interval = setInterval(() => {
      setDisplayed((prev) =>
        prev.map((char, index) => {
          if (index < iterations) {
            return text[index];
          }
          return characters[Math.floor(Math.random() * characters.length)];
        })
      );

      if (iterations >= text.length) {
        clearInterval(interval);
      }

      iterations += 1 / 3;
    }, 30);

    return () => clearInterval(interval);
  }, [text, start]);

  return <span className={className}>{displayed.join('')}</span>;
};

export const Login: React.FC = () => {
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);

  const { login, isLoading } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err) {
      // Errors are handled by notifications in the store
    }
  };

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 400);  // Dot appears
    const t2 = setTimeout(() => setStage(2), 1000); // Line expands
    const t3 = setTimeout(() => setStage(3), 1600); // Box forms
    const t4 = setTimeout(() => setStage(4), 2200); // Icon & Text decode
    const t5 = setTimeout(() => setStage(5), 3500); // Final UI
    const t6 = setTimeout(() => setStage(6), 4200); // Login Form

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
    };
  }, []);

  // Fake progress counter
  useEffect(() => {
    if (stage >= 1 && stage < 5) {
      const interval = setInterval(() => {
        setProgress(p => Math.min(p + Math.floor(Math.random() * 15), 100));
      }, 100);
      return () => clearInterval(interval);
    } else if (stage >= 5) {
      setProgress(100);
    }
  }, [stage]);

  return (
    <div className="min-h-screen bg-[#16202A] flex flex-col items-center justify-center overflow-hidden relative font-sans text-white selection:bg-[#00a884]/30">
      
      {/* Background Grid HUD Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Screen Corners */}
      <div className="absolute w-[60px] h-[60px] border border-white/40 top-10 left-10 border-r-0 border-b-0 hidden sm:block" />
      <div className="absolute w-[60px] h-[60px] border border-white/40 top-10 right-10 border-l-0 border-b-0 hidden sm:block" />
      <div className="absolute w-[60px] h-[60px] border border-white/40 bottom-10 left-10 border-r-0 border-t-0 hidden sm:block" />
      <div className="absolute w-[60px] h-[60px] border border-white/40 bottom-10 right-10 border-l-0 border-t-0 hidden sm:block" />

      {/* HUD Status Elements */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 text-center font-mono text-[10px] uppercase tracking-[2px] text-white/40 hidden sm:block">
        SECURE CONNECTION ESTABLISHED // ENCRYPTION AES-256
      </div>
      
      <div className="absolute left-10 top-1/2 font-mono text-[10px] uppercase tracking-[2px] text-white/40 whitespace-nowrap hidden sm:block" style={{ transform: 'translateY(-50%) rotate(-90deg)' }}>
        LATENCY: 14MS // USER_ID: LP_77291
      </div>

      <div className="absolute right-10 top-1/2 font-mono text-[10px] uppercase tracking-[2px] text-white/40 whitespace-nowrap hidden sm:block" style={{ transform: 'translateY(-50%) rotate(90deg)' }}>
        GEO_LOC: -22.4689, -44.4486 // RESENDE, RJ
      </div>

      {/* Data Points */}
      <div className="absolute top-[120px] left-[120px] flex flex-col gap-1 hidden lg:flex">
        <span className="text-[9px] text-white/40 font-mono">DATABASE STATE</span>
        <span className="text-[12px] font-bold">SYNCHRONIZED</span>
      </div>

      <div className="absolute bottom-[120px] right-[120px] flex flex-col gap-1 text-right hidden lg:flex">
        <span className="text-[9px] text-white/40 font-mono">Uptime</span>
        <span className="text-[12px] font-bold">99.98%</span>
      </div>

      {/* Floating HUD UI Scan Line */}
      <div className="absolute w-full h-[1px] top-[65%] opacity-30" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }} />

      {/* Tech UI Elements - Scanlines */}
      <AnimatePresence>
        {stage >= 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.05 }}
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              backgroundImage: 'linear-gradient(transparent 50%, rgba(0, 0, 0, 1) 50%)',
              backgroundSize: '100% 4px',
            }}
          />
        )}
      </AnimatePresence>

      {/* Main Content Container */}
      <motion.div 
        className="relative z-10 flex flex-col items-center justify-center w-full max-w-4xl p-8 min-h-[500px]"
        animate={{
          x: stage === 4 ? [-2, 2, -2, 2, 0] : 0,
          y: stage === 4 ? [1, -1, 1, -1, 0] : 0,
        }}
        transition={{ duration: 0.2 }}
      >
        
        {/* HUD Elements (Inner) */}
        <AnimatePresence>
          {stage >= 2 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 pointer-events-none text-white/40 font-mono text-[10px] tracking-widest hidden sm:block"
            >
              {/* Top Left */}
              <div className="absolute top-0 left-0 flex flex-col gap-1">
                <span>SYS.INIT // {new Date().getFullYear()}</span>
                <span>COORD: 22.4689° S, 44.4486° W</span>
              </div>
              {/* Top Right */}
              <div className="absolute top-0 right-0 text-right flex flex-col gap-1">
                <span>MEM: 0x00F4A2</span>
                <span>{progress}% LOADED</span>
              </div>
              {/* Bottom Left */}
              <div className="absolute bottom-0 left-0 flex flex-col gap-1">
                <span>SECURE_CONNECTION: ESTABLISHED</span>
              </div>
              {/* Bottom Right */}
              <div className="absolute bottom-0 right-0 text-right flex flex-col gap-1">
                <span>NODE: ALPHA-7</span>
              </div>
              
              {/* Crosshairs */}
              <div className="absolute top-1/4 left-4 w-2 h-2 border-t border-l border-[#00a884]/50" />
              <div className="absolute top-1/4 right-4 w-2 h-2 border-t border-r border-[#00a884]/50" />
              <div className="absolute bottom-1/4 left-4 w-2 h-2 border-b border-l border-[#00a884]/50" />
              <div className="absolute bottom-1/4 right-4 w-2 h-2 border-b border-r border-[#00a884]/50" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Central Animation Area */}
        <div className="relative flex flex-col items-center justify-center w-full">
          
          {/* Icon Container */}
          <div className="relative w-24 h-24 mb-12 flex items-center justify-center">
            
            {/* Stage 1: Dot */}
            <AnimatePresence>
              {stage === 1 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="w-2 h-2 bg-[#2563eb] rounded-full shadow-[0_0_15px_#2563eb]"
                />
              )}
            </AnimatePresence>

            {/* Stage 2: Horizontal Line */}
            <AnimatePresence>
              {stage === 2 && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: '100%', opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute h-[2px] bg-[#2563eb] shadow-[0_0_15px_#2563eb]"
                />
              )}
            </AnimatePresence>

            {/* Stage 3+: Box and Icon */}
            {stage >= 3 && (
              <motion.div
                initial={{ height: 2, width: '100%', opacity: 1, borderRadius: '0px' }}
                animate={{ 
                  height: '100%', 
                  borderRadius: stage >= 4 ? '16px' : '0px',
                  backgroundColor: stage >= 4 ? 'rgba(37, 99, 235, 1)' : 'rgba(37, 99, 235, 0.1)'
                }}
                transition={{ duration: 0.4, ease: "circOut" }}
                className="absolute inset-0 border-2 border-[#2563eb] flex items-center justify-center overflow-hidden shadow-xl shadow-[#2563eb]/20"
                style={{
                  background: stage >= 4 ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 'transparent'
                }}
              >
                {/* Glitch overlay */}
                {stage === 4 && (
                  <motion.div 
                    animate={{ x: [-10, 10, -5, 5, 0], opacity: [0.8, 1, 0.5, 1, 0] }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 bg-white mix-blend-overlay"
                  />
                )}
                
                {/* Icon */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, filter: 'blur(10px)' }}
                  animate={{ 
                    opacity: stage >= 4 ? 1 : 0, 
                    scale: stage >= 4 ? 1 : 0.5,
                    filter: stage >= 4 ? 'blur(0px)' : 'blur(10px)'
                  }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Scale className="w-12 h-12 text-white" strokeWidth={1.5} />
                </motion.div>
              </motion.div>
            )}

            {/* Corner Brackets */}
            {stage >= 3 && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-[#00a884]/50 rounded-tl-lg" />
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-[#00a884]/50 rounded-tr-lg" />
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-[#00a884]/50 rounded-bl-lg" />
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-[#00a884]/50 rounded-br-lg" />
              </>
            )}
          </div>

          {/* Text Area */}
          <div className="text-center relative flex flex-col items-center w-full">
            <motion.h1 
              className="text-5xl sm:text-7xl md:text-[90px] font-extrabold tracking-tighter text-white mb-2 relative z-10 uppercase leading-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: stage >= 4 ? 1 : 0 }}
            >
              <DecodeText text="ADVOCACIA" start={stage >= 4} />
              
              {/* Glitch artifact for text */}
              {stage === 4 && (
                <motion.span
                  animate={{ opacity: [0, 0.5, 0], x: [0, -5, 5, 0] }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="absolute top-0 left-0 text-[#00a884] mix-blend-screen pointer-events-none"
                >
                  ADVOCACIA
                </motion.span>
              )}
            </motion.h1>

            {/* Bottom Line & Subtext */}
            <div className="relative mt-4 flex flex-col items-center w-full max-w-lg">
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: stage >= 5 ? '100%' : 0, opacity: stage >= 5 ? 1 : 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-[3px] bg-[#00a884] mb-6 relative overflow-hidden shadow-[0_0_15px_#00a884]"
              >
                {/* Scanning highlight on the line */}
                <motion.div 
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute top-0 left-0 w-1/3 h-full bg-white/80 blur-[1px]"
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: stage >= 5 ? 1 : 0, y: stage >= 5 ? 0 : -5 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="font-mono text-[12px] sm:text-[14px] tracking-[6px] sm:tracking-[8px] text-[#00a884] uppercase"
              >
                LEXPRIME SYSTEM
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: stage >= 5 ? 1 : 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="absolute -bottom-10 right-0 font-mono text-[9px] text-white/40"
              >
                BUILD REV 2024.0.8
              </motion.div>
            </div>

            {/* Login Form */}
            <AnimatePresence>
              {stage >= 6 && (
                <motion.form
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="w-full max-w-xs mt-16 flex flex-col gap-4 relative z-20"
                >
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="font-mono text-[10px] text-[#00a884] uppercase tracking-[2px]">E-mail de Acesso</label>
                    <input 
                      type="email" 
                      value={email}
                      required
                      onChange={e => setEmail(e.target.value)}
                      className="bg-[#050505]/50 border border-white/10 focus:border-[#00a884] outline-none text-white placeholder:text-white/20 px-4 py-2.5 font-sans text-sm transition-all focus:shadow-[0_0_10px_rgba(0,168,132,0.3)]"
                      placeholder="usuario@lexprime.com"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="font-mono text-[10px] text-[#00a884] uppercase tracking-[2px]">Senha de Autenticação</label>
                    <input 
                      type="password" 
                      value={password}
                      required
                      onChange={e => setPassword(e.target.value)}
                      className="bg-[#050505]/50 border border-white/10 focus:border-[#00a884] outline-none text-white placeholder:text-white/20 px-4 py-2.5 font-sans text-sm transition-all focus:shadow-[0_0_10px_rgba(0,168,132,0.3)]"
                      placeholder="••••••••"
                    />
                  </div>
                  <button type="submit" disabled={isLoading} className="mt-2 bg-transparent border border-[#00a884] text-[#00a884] hover:bg-[#00a884] hover:text-[#16202A] hover:shadow-[0_0_15px_rgba(0,168,132,0.4)] transition-all duration-300 py-3 font-mono text-xs tracking-[4px] uppercase font-bold disabled:opacity-50">
                    {isLoading ? '...' : 'Iniciar Sessão'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

        </div>
      </motion.div>
    </div>
  );
}