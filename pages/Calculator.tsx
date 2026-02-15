
import React, { useState } from 'react';
import { calculateDeadline, formatDate } from '../utils/dateUtils';
import { Clock, CalendarIcon, AlertCircle } from '../components/Icons';
import { useStore } from '../context/Store';

export const Calculator: React.FC = () => {
  const { addDeadline, holidays } = useStore();
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [days, setDays] = useState<number>(15);
  const [type, setType] = useState<'business' | 'calendar'>('business');
  const [result, setResult] = useState<{ date: Date, logs: string[] } | null>(null);
  const [deadlineName, setDeadlineName] = useState('');

  const handleCalculate = () => {
    // Pass holidays from store
    const calc = calculateDeadline(startDate, days, type, holidays);
    setResult(calc);
  };

  const handleSave = () => {
    if (result && deadlineName) {
      addDeadline({
        id: Date.now().toString(),
        title: deadlineName,
        dueDate: result.date.toISOString().split('T')[0],
        isDone: false,
        priority: 'Medium',
        type: 'Prazo Processual'
      });
      alert('Prazo salvo com sucesso!');
    }
  };

  return (
    <div className="p-6 animate-fade-in max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="text-primary-500" /> Calculadora de Prazos
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Cálculo automatizado considerando feriados nacionais (e importados), finais de semana e regras do CPC (exclusão do dia de início).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inputs */}
        <div className="bg-white dark:bg-dark-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-fit">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Data da Publicação/Intimação</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 outline-none dark:text-white transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Prazo (dias)</label>
                <input 
                  type="number" 
                  value={days} 
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tipo de Contagem</label>
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                >
                  <option value="business">Dias Úteis (CPC)</option>
                  <option value="calendar">Dias Corridos</option>
                </select>
              </div>
            </div>

            <button 
              onClick={handleCalculate}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-semibold shadow-lg shadow-primary-500/30 transition-all transform active:scale-95"
            >
              Calcular Prazo Final
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white dark:bg-dark-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 min-h-[400px] flex flex-col">
          {result ? (
            <div className="flex flex-col h-full animate-slide-in">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">
                <span className="text-sm text-slate-500 uppercase tracking-wider font-bold">Vencimento</span>
                <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                  {formatDate(result.date.toISOString())}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-4 space-y-2">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <CalendarIcon size={16} /> Memória de Cálculo
                </h4>
                {result.logs.map((log, idx) => (
                  <div key={idx} className="text-sm p-2 rounded bg-slate-50 dark:bg-dark-900 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                    {log}
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Salvar como prazo</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Nome do prazo (ex: Contestação)" 
                    value={deadlineName}
                    onChange={e => setDeadlineName(e.target.value)}
                    className="flex-1 p-2 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                  />
                  <button 
                    onClick={handleSave}
                    disabled={!deadlineName}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Clock size={48} className="mb-4 opacity-20" />
              <p>Preencha os dados ao lado e clique em calcular.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
