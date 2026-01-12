
import React, { useState, useEffect } from 'react';
import { X, Copy, Check, FileText } from './Icons';
import { Holiday } from '../types';
import { ActType, Framework, generateTempestividadeText } from '../utils/tempestividadeUtils';

interface TempestividadeModalProps {
    onClose: () => void;
    startDate: string;
    notificationDate: string;
    days: number;
    countType: 'business' | 'calendar';
    deadlineDate: string;
    holidays: Holiday[];
    title: string;
}

export const TempestividadeModal: React.FC<TempestividadeModalProps> = ({
    onClose, startDate, notificationDate, days, countType, deadlineDate, holidays, title
}) => {
    // Determine initial act type based on title
    const getInitialActType = (t: string): ActType => {
        const lower = t.toLowerCase();
        if (lower.includes('contestação') || lower.includes('defesa')) return 'contestação';
        if (lower.includes('embargos') && lower.includes('declaração')) return 'embargos_declaracao';
        if (lower.includes('contrarrazões') || lower.includes('contraminuta')) {
            if (lower.includes('embargos')) return 'contrarrazoes_embargos';
            return 'contrarrazoes_recurso';
        }
        if (lower.includes('recurso') || lower.includes('apelação') || lower.includes('agravo') || lower.includes('ordinário') || lower.includes('revista')) return 'recurso';
        if (lower.includes('manifestação') || lower.includes('petição')) return 'manifestação';
        return 'outros';
    };

    const [actType, setActType] = useState<ActType>(getInitialActType(title));
    const [framework, setFramework] = useState<Framework>('CPC');
    const [reference, setReference] = useState('');
    const [currentDays, setCurrentDays] = useState(days);
    const [generatedText, setGeneratedText] = useState('');
    const [copied, setCopied] = useState(false);

    // Auto-adjust days and framework based on act type and title
    useEffect(() => {
        const lowerTitle = title.toLowerCase();
        let detectedFramework: Framework = 'CPC';

        // Framework auto-detection
        if (lowerTitle.includes('trabalhista') || lowerTitle.includes('clt')) detectedFramework = 'CLT';
        else if (lowerTitle.includes('juizado') || lowerTitle.includes('jec')) detectedFramework = 'JEC';

        setFramework(detectedFramework);

        // Days adjustment
        if (actType === 'embargos_declaracao' || actType === 'contrarrazoes_embargos') {
            setCurrentDays(5);
        } else if (actType === 'recurso' || actType === 'contrarrazoes_recurso' || actType === 'contestação') {
            if (detectedFramework === 'CLT' && actType !== 'contestação') {
                // In Labor law, Recursos are mostly 8 days
                setCurrentDays(8);
            } else {
                setCurrentDays(15);
            }
        } else {
            setCurrentDays(days);
        }
    }, [actType, days, title]);

    useEffect(() => {
        const text = generateTempestividadeText({
            actType,
            framework,
            startDate,
            notificationDate,
            days: currentDays,
            countType,
            deadlineDate,
            holidays,
            reference,
            customTitle: title
        });
        setGeneratedText(text);
    }, [actType, framework, startDate, notificationDate, currentDays, countType, deadlineDate, holidays, reference, title]);

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-dark-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-dark-900/50">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="text-primary-500" /> Gerador de Tópico de Tempestividade
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-dark-700 rounded-full text-slate-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tipo de Peça</label>
                            <select
                                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500"
                                value={actType}
                                onChange={(e) => setActType(e.target.value as ActType)}
                            >
                                <option value="contestação">Contestação</option>
                                <option value="recurso">Recurso</option>
                                <option value="embargos_declaracao">Embargos de Declaração</option>
                                <option value="contrarrazoes_recurso">Contrarrazões (Recurso)</option>
                                <option value="contrarrazoes_embargos">Contrarrazões (Embargos)</option>
                                <option value="manifestação">Manifestação</option>
                                <option value="outros">Outros</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Regramento</label>
                            <select
                                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500"
                                value={framework}
                                onChange={(e) => setFramework(e.target.value as Framework)}
                            >
                                <option value="CPC">CPC (Cível/Geral)</option>
                                <option value="CLT">CLT (Trabalhista)</option>
                                <option value="JEC">JEC (Juizado Especial)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Referência (Opcional)</label>
                            <input
                                type="text"
                                placeholder="Ex: Index 1137, fls. 45"
                                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Dias Prazo</label>
                            <input
                                type="number"
                                className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                value={currentDays}
                                onChange={(e) => setCurrentDays(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="relative group">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Texto Gerado</label>
                        <div className="bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 font-serif text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed shadow-inner min-h-[300px]">
                            {generatedText}
                        </div>
                        <button
                            onClick={handleCopy}
                            className={`absolute top-10 right-4 p-2 rounded-lg transition-all flex items-center gap-2 text-xs font-bold ${copied ? 'bg-green-500 text-white' : 'bg-white dark:bg-dark-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-dark-700 shadow-sm'
                                }`}
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            {copied ? 'Copiado!' : 'Copiar Texto'}
                        </button>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-dark-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold shadow-lg shadow-primary-500/20 transition-all active:scale-95"
                    >
                        Concluído
                    </button>
                </div>
            </div>
        </div>
    );
};
