import React from 'react';
import { ChevronLeft, ChevronRight } from './Icons';

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    itemLabel?: string;
    theme?: string;
}

// Builds a compact list of page numbers with ellipsis, e.g. 1 … 4 5 6 … 12
const buildPages = (current: number, total: number): (number | '...')[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    if (start > 2) pages.push('...');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total - 1) pages.push('...');
    pages.push(total);
    return pages;
};

export const Pagination: React.FC<PaginationProps> = ({
    currentPage, totalItems, pageSize, onPageChange, onPageSizeChange, itemLabel = 'itens', theme
}) => {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    if (totalItems === 0) return null;

    const from = (currentPage - 1) * pageSize + 1;
    const to = Math.min(currentPage * pageSize, totalItems);
    const isHybrid = theme === 'hybrid';

    const goTo = (p: number) => {
        const page = Math.min(Math.max(1, p), totalPages);
        if (page !== currentPage) {
            onPageChange(page);
            // Scroll the main app container back to the top of the list
            document.querySelector('main .overflow-y-auto')?.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const baseBtn = `min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors border`;
    const idleBtn = isHybrid
        ? 'bg-[#2a3942] border-[#354751] text-[#e9edef] hover:bg-[#354751]'
        : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-700';
    const activeBtn = isHybrid
        ? 'bg-[#00a884] border-[#00a884] text-white'
        : 'bg-primary-600 border-primary-600 text-white';
    const disabledBtn = 'opacity-40 cursor-not-allowed';

    return (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 py-3 px-1 text-xs no-print ${isHybrid ? 'text-[#aebac1]' : 'text-slate-500 dark:text-slate-400'}`}>
            <div className="flex items-center gap-3">
                <span>
                    Exibindo <strong>{from}–{to}</strong> de <strong>{totalItems}</strong> {itemLabel}
                </span>
                {onPageSizeChange && (
                    <select
                        value={pageSize}
                        onChange={e => onPageSizeChange(Number(e.target.value))}
                        className={`h-8 px-2 rounded-lg border text-xs outline-none ${isHybrid ? 'bg-[#2a3942] border-[#354751] text-[#e9edef]' : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                        title="Itens por página"
                    >
                        {[25, 50, 100].map(s => <option key={s} value={s}>{s} por página</option>)}
                    </select>
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => goTo(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`${baseBtn} ${idleBtn} ${currentPage === 1 ? disabledBtn : ''}`}
                        title="Página anterior"
                    >
                        <ChevronLeft size={14} />
                    </button>
                    {buildPages(currentPage, totalPages).map((p, i) =>
                        p === '...' ? (
                            <span key={`e${i}`} className="px-1">…</span>
                        ) : (
                            <button
                                key={p}
                                type="button"
                                onClick={() => goTo(p)}
                                className={`${baseBtn} ${p === currentPage ? activeBtn : idleBtn}`}
                            >
                                {p}
                            </button>
                        )
                    )}
                    <button
                        type="button"
                        onClick={() => goTo(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`${baseBtn} ${idleBtn} ${currentPage === totalPages ? disabledBtn : ''}`}
                        title="Próxima página"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};

