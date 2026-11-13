import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useStore } from '../context/Store';

export const Login: React.FC = () => {
  const { login, isLoading } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLocalError('');
      await login(email, password);
    } catch (err: any) {
      setLocalError(err.message || 'Erro ao realizar login.');
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] flex flex-col items-center justify-between p-4 sm:p-6 md:p-8 overflow-hidden relative font-sans text-white selection:bg-blue-500/30">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes floatLogo {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes architecturalDraw {
          0% { stroke-dashoffset: 1200; opacity: 0.35; }
          50% { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: -1200; opacity: 0.35; }
        }
        @keyframes radialDriftBlue {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(35px, -25px) scale(1.08); }
        }
        @keyframes radialDriftAmber {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-30px, 25px) scale(1.06); }
        }
      `}} />

      {/* TAREFA 1: Fundo Monumental (Luzes Radiais em Movimento Lento) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 left-1/4 w-[520px] h-[520px] rounded-full bg-blue-600/15 blur-[130px]"
          style={{ animation: 'radialDriftBlue 14s ease-in-out infinite' }}
        />
        <div
          className="absolute -bottom-40 right-1/4 w-[560px] h-[560px] rounded-full bg-amber-500/10 blur-[150px]"
          style={{ animation: 'radialDriftAmber 18s ease-in-out infinite' }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-blue-900/10 blur-[140px]" />
      </div>

      {/* Composição Vetorial Arquitetônica Clássica Simétrica + Marca d'água da Balança */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <svg
          className="w-full h-full max-w-[1600px] max-h-[1000px] opacity-[0.06]"
          viewBox="0 0 1440 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="pillarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity="0" />
              <stop offset="25%" stopColor="#60A5FA" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.8" />
              <stop offset="75%" stopColor="#60A5FA" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#60A5FA" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="archGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0" />
              <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Colunas Clássicas Simétricas (Pilares do Direito) */}
          <g stroke="url(#pillarGrad)" strokeWidth="1.2">
            {/* Esquerda */}
            <line x1="180" y1="60" x2="180" y2="840" strokeDasharray="1200" style={{ animation: 'architecturalDraw 22s ease-in-out infinite' }} />
            <line x1="196" y1="90" x2="196" y2="810" strokeOpacity="0.5" />
            <line x1="212" y1="120" x2="212" y2="780" strokeOpacity="0.3" />
            <line x1="310" y1="120" x2="310" y2="780" strokeDasharray="1200" style={{ animation: 'architecturalDraw 26s ease-in-out infinite' }} />
            <line x1="324" y1="150" x2="324" y2="750" strokeOpacity="0.4" />

            {/* Direita (Simétrica) */}
            <line x1="1260" y1="60" x2="1260" y2="840" strokeDasharray="1200" style={{ animation: 'architecturalDraw 22s ease-in-out infinite' }} />
            <line x1="1244" y1="90" x2="1244" y2="810" strokeOpacity="0.5" />
            <line x1="1228" y1="120" x2="1228" y2="780" strokeOpacity="0.3" />
            <line x1="1130" y1="120" x2="1130" y2="780" strokeDasharray="1200" style={{ animation: 'architecturalDraw 26s ease-in-out infinite' }} />
            <line x1="1116" y1="150" x2="1116" y2="750" strokeOpacity="0.4" />
          </g>

          {/* Frontão Clássico & Linhas de Equilíbrio Geométrico */}
          <g stroke="url(#archGrad)" strokeWidth="1">
            <path d="M 140 130 L 720 45 L 1300 130" strokeDasharray="1200" style={{ animation: 'architecturalDraw 28s ease-in-out infinite' }} />
            <path d="M 220 145 L 720 72 L 1220 145" strokeOpacity="0.5" />
            <line x1="120" y1="155" x2="1320" y2="155" strokeOpacity="0.4" />
            <line x1="120" y1="765" x2="1320" y2="765" strokeOpacity="0.4" />
            <circle cx="720" cy="450" r="340" strokeOpacity="0.35" strokeDasharray="6 10" />
            <circle cx="720" cy="450" r="260" strokeOpacity="0.25" />
          </g>
        </svg>

        {/* Marca d'água Monumental da Balança da Justiça ao fundo */}
        <Scale
          className="absolute text-blue-300 opacity-[0.035] w-[560px] h-[560px] sm:w-[680px] sm:h-[680px] pointer-events-none select-none"
          strokeWidth={0.6}
        />
      </div>

      {/* Espaçador Superior para centralização vertical equilibrada */}
      <div className="hidden sm:block" />

      {/* TAREFA 2: Card Central em Glassmorphism de Alta Costura */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[440px] my-auto backdrop-blur-2xl bg-slate-900/60 border border-white/10 rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.85)] overflow-hidden"
      >
        {/* Filete luminoso superior em gradiente Azul Royal + Dourado */}
        <div className="relative h-[2px] w-full bg-gradient-to-r from-transparent via-blue-500/60 to-transparent">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
        </div>

        {/* Luz interna sutil no topo do Card */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-36 bg-blue-500/15 blur-3xl pointer-events-none" />

        <div className="px-7 py-9 sm:px-10 sm:py-11 flex flex-col items-center">
          {/* TAREFA 3: Evolução do Logo e Tipografia "ADVOCACIA" */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            className="mb-6"
          >
            <div
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800 ring-1 ring-blue-400/30 shadow-[0_0_35px_rgba(37,99,235,0.45)] flex items-center justify-center relative overflow-hidden"
              style={{ animation: 'floatLogo 3s ease-in-out infinite' }}
            >
              {/* Reflexo vítreo superior no quadrado azul */}
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
              <Scale className="w-10 h-10 text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.25)]" strokeWidth={1.6} />
            </div>
          </motion.div>

          {/* Título Principal & Divisor Animado */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="text-center w-full flex flex-col items-center"
          >
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[0.18em] text-white uppercase drop-shadow-[0_0_25px_rgba(59,130,246,0.25)] pl-[0.18em]">
              ADVOCACIA
            </h1>

            {/* Linha divisória animada em Ouro e Azul Royal */}
            <div className="relative w-48 h-[2px] my-4 rounded-full bg-gradient-to-r from-transparent via-blue-500/40 to-transparent overflow-hidden">
              <motion.div
                animate={{ x: ['-120%', '220%'] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-1/2 h-full bg-gradient-to-r from-transparent via-amber-400 to-transparent"
              />
            </div>

            <p className="tracking-[0.35em] text-xs font-semibold text-amber-400/90 uppercase pl-[0.35em]">
              SISTEMA JURÍDICO
            </p>
          </motion.div>

          {/* TAREFA 4: Inputs e Botão de Autenticação Executiva */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.32, ease: 'easeOut' }}
            className="w-full mt-8 flex flex-col gap-5"
          >
            {localError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs px-4 py-3 rounded-xl flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{localError}</span>
              </motion.div>
            )}

            {/* Campo E-mail de Acesso */}
            <div className="flex flex-col gap-2 text-left">
              <label className="text-xs font-medium tracking-wider text-slate-300 uppercase">
                E-mail de Acesso
              </label>
              <div className="relative group">
                <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-amber-400 transition-colors absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  required
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 text-sm bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="nome@escritorio.adv.br"
                />
              </div>
            </div>

            {/* Campo Senha de Autenticação */}
            <div className="flex flex-col gap-2 text-left">
              <label className="text-xs font-medium tracking-wider text-slate-300 uppercase">
                Senha de Autenticação
              </label>
              <div className="relative group">
                <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-amber-400 transition-colors absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  required
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 text-sm bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1 rounded-lg"
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botão INICIAR SESSÃO */}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative mt-2 w-full py-3.5 rounded-xl font-semibold text-xs sm:text-sm tracking-[0.2em] uppercase text-white bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 border border-blue-400/30 shadow-[0_10px_30px_-5px_rgba(37,99,235,0.5)] hover:shadow-[0_12px_35px_-5px_rgba(37,99,235,0.7)] transition-all duration-300 overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {/* Efeito Shimmer ao passar o mouse */}
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

              <span className="relative z-10 flex items-center justify-center gap-2.5 pl-[0.2em]">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <span>Iniciar Sessão</span>
                    <ArrowRight className="w-4 h-4 text-amber-300/90 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </button>
          </motion.form>

          {/* TAREFA 5: Rodapé do Card Central com Selos Institucionais */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="w-full mt-8 pt-5 border-t border-white/10 flex flex-col gap-2.5"
          >
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400/90 shrink-0" />
                <span>Acesso Exclusivo • Corpo Jurídico</span>
              </div>
              <span className="text-slate-400 font-medium">Resende • RJ</span>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400/80 pt-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
              </span>
              <span>Controle Processual &amp; Prazos Sincronizados</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Espaçador Inferior para centralização vertical equilibrada */}
      <div className="hidden sm:block" />
    </div>
  );
};
