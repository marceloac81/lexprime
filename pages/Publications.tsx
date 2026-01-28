import React, { useState } from 'react';
import { Search, Loader2, AlertCircle, FileText, Calendar as CalendarIcon, ExternalLink, ChevronLeft, ChevronRight, User, Hash } from 'lucide-react';
import { fetchPublications } from '../utils/djen';
import { DJENItem } from '../types';

export const Publications: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<DJENItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);

    // Filters
    const [oab, setOab] = useState('');
    const [uf, setUf] = useState('SP'); // Default UF
    const [processo, setProcesso] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Pagination
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    const handleSearch = async (newPage = 1) => {
        // Basic validation
        if (!oab && !processo && (!startDate || !endDate)) {
            setError('Preencha pelo menos um critério de busca (OAB, Processo ou Período).');
            return;
        }

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 30) {
                setError('O intervalo de datas não pode ser superior a 30 dias.');
                return;
            }
        }

        setLoading(true);
        setError(null);
        setResults([]); // Clear previous results while loading

        try {
            const response = await fetchPublications({
                numeroOab: oab || undefined,
                ufOab: oab ? uf : undefined,
                numeroProcesso: processo || undefined,
                dataDisponibilizacaoInicio: startDate || undefined,
                dataDisponibilizacaoFim: endDate || undefined,
                pagina: newPage,
                itensPorPagina: itemsPerPage
            });

            setResults(response.items || []);
            setTotalCount(response.count || 0);
            setPage(newPage);
        } catch (err: any) {
            setError(err.message || 'Erro ao buscar publicações.');
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        handleSearch(newPage);
    };

    // Helper to format date
    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return (
        <div className="p-6 md:p-8 space-y-8 animate-fade-in max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                        Publicações DJEN
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Consulte publicações do Diário de Justiça Eletrônico Nacional
                    </p>
                </div>
            </div>

            {/* Filters Card */}
            <div className="bg-white dark:bg-dark-900 rounded-xl p-6 border border-slate-200 dark:border-dark-800 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                    {/* OAB + UF */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            OAB
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Nº OAB"
                                value={oab}
                                onChange={(e) => setOab(e.target.value)}
                                className="flex-1 rounded-lg border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-slate-100"
                            />
                            <select
                                value={uf}
                                onChange={(e) => setUf(e.target.value)}
                                className="w-20 rounded-lg border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-slate-100"
                            >
                                {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(state => (
                                    <option key={state} value={state}>{state}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Processo */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Hash className="h-4 w-4" />
                            Processo
                        </label>
                        <input
                            type="text"
                            placeholder="Número do Processo"
                            value={processo}
                            onChange={(e) => setProcesso(e.target.value)}
                            className="w-full rounded-lg border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-slate-100"
                        />
                    </div>

                    {/* Data Inicio */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            Data Início
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full rounded-lg border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-slate-100"
                        />
                    </div>

                    {/* Data Fim */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            Data Fim
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full rounded-lg border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-slate-100"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        onClick={() => handleSearch(1)}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-sm shadow-blue-500/20 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                        Buscar Publicações
                    </button>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-center gap-3 border border-red-100 dark:border-red-900/50">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}
            </div>

            {/* Results List */}
            <div className="space-y-4">
                {results.length > 0 ? (
                    <>
                        <div className="flex justify-between items-center px-2">
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                                Total de {totalCount} resultado(s) encontrado(s)
                            </span>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(page - 1)}
                                        disabled={page === 1 || loading}
                                        className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-dark-700 disabled:opacity-30 disabled:hover:bg-transparent"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <span className="text-sm font-medium">{page} / {totalPages}</span>
                                    <button
                                        onClick={() => handlePageChange(page + 1)}
                                        disabled={page === totalPages || loading}
                                        className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-dark-700 disabled:opacity-30 disabled:hover:bg-transparent"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {results.map((item) => (
                            <div
                                key={item.id}
                                className="group bg-white dark:bg-dark-900 rounded-xl p-6 border border-slate-200 dark:border-dark-800 shadow-sm hover:shadow-md transition-all hover:border-slate-300 dark:hover:border-dark-700"
                            >
                                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                                                {item.siglaTribunal}
                                            </span>
                                            <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                <CalendarIcon className="h-3 w-3" />
                                                {formatDate(item.data_disponibilizacao)}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                            {item.nomeOrgao}
                                        </h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 font-mono mt-1">
                                            {item.numero_processo}
                                        </p>
                                    </div>

                                    {item.link && (
                                        <a
                                            href={item.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                                        >
                                            <FileText className="h-4 w-4" />
                                            Ver Original
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    )}
                                </div>

                                <div className="bg-slate-50 dark:bg-dark-950/50 p-4 rounded-lg border border-slate-100 dark:border-dark-800 mb-4">
                                    <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed line-clamp-6 group-hover:line-clamp-none transition-all">
                                        {item.texto}
                                    </p>
                                </div>

                                {item.destinatarioadvogados && item.destinatarioadvogados.length > 0 && (
                                    <div className="border-t border-slate-100 dark:border-dark-800 pt-3">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Advogados Intimados</p>
                                        <div className="flex flex-wrap gap-2">
                                            {item.destinatarioadvogados.map((adv) => (
                                                <span key={adv.id} className="text-xs px-2 py-1 bg-slate-100 dark:bg-dark-800 rounded text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-dark-700">
                                                    {adv.advogado.nome} ({adv.advogado.numero_oab}/{adv.advogado.uf_oab})
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Pagination Bottom */}
                        {totalPages > 1 && (
                            <div className="flex justify-center mt-6">
                                <div className="flex items-center gap-2 bg-white dark:bg-dark-900 p-2 rounded-lg border border-slate-200 dark:border-dark-800 shadow-sm">
                                    <button
                                        onClick={() => handlePageChange(page - 1)}
                                        disabled={page === 1 || loading}
                                        className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-dark-700 disabled:opacity-30 disabled:hover:bg-transparent"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <span className="text-sm font-medium px-4">{page} de {totalPages}</span>
                                    <button
                                        onClick={() => handlePageChange(page + 1)}
                                        disabled={page === totalPages || loading}
                                        className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-dark-700 disabled:opacity-30 disabled:hover:bg-transparent"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    !loading && <div className="text-center py-20 text-slate-400">
                        <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p className="text-lg">Nenhuma publicação encontrada</p>
                        <p className="text-sm">Utilize os filtros acima para realizar uma busca.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
