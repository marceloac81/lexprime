import React, { useState } from 'react';
import { useStore } from '../context/Store';
import { Scale, Mail, Lock, User as UserIcon, ArrowRight } from '../components/Icons';

export const Login: React.FC = () => {
  const { login, signUp, isLoading } = useStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        await signUp(email, password, fullName);
      } else {
        await login(email, password);
      }
    } catch (err) {
      // Errors are handled by notifications in the store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-950 p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-10 animate-fade-in">
          <div className="w-20 h-20 bg-primary-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-xl shadow-primary-600/40 transform hover:rotate-12 transition-transform duration-300">
            <Scale className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">LexPrime</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-3 text-lg">
            {isSignUp ? 'Crie sua conta no escritório' : 'Bem-vindo de volta ao seu escritório'}
          </p>
        </div>

        <div className="bg-white dark:bg-dark-800 p-8 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 relative overflow-hidden animate-slide-up">
          {/* Subtle Gradient Background */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 via-primary-600 to-primary-400" />

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="animate-fade-in">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Nome Completo</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white placeholder-slate-400"
                    placeholder="Dr(a). Nome Sobrenome"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white placeholder-slate-400"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white placeholder-slate-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-70 text-white py-4 rounded-xl font-bold shadow-lg shadow-primary-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Criar Conta' : 'Acessar Sistema'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {isSignUp ? 'Já possui uma conta?' : 'Ainda não tem acesso?'}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="ml-2 text-primary-600 dark:text-primary-400 font-bold hover:underline"
              >
                {isSignUp ? 'Fazer Login' : 'Cadastre-se'}
              </button>
            </p>
          </div>
        </div>

        {!isSignUp && (
          <div className="mt-6 text-center">
            <a href="#" className="text-sm text-slate-500 hover:text-primary-600 transition-colors">Esqueceu sua senha?</a>
          </div>
        )}
      </div>
    </div>
  );
};