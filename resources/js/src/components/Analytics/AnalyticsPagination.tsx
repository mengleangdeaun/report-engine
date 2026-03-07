import React from 'react';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";

interface AnalyticsPaginationProps {
    currentPage: number;
    totalPages: number;
    rowsPerPage: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onRowsPerPageChange?: (rows: number) => void;
    label?: string;
    className?: string;
}

const AnalyticsPagination = ({
    currentPage,
    totalPages,
    rowsPerPage,
    totalItems,
    onPageChange,
    onRowsPerPageChange,
    label = "items",
    className = ""
}: AnalyticsPaginationProps) => {
    if (totalItems === 0) return null;

    const renderPageButtons = () => {
        const buttons = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            buttons.push(
                <button
                    key={i}
                    onClick={() => onPageChange(i)}
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl text-xs sm:text-sm font-black transition-all ${currentPage === i
                        ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110 z-10'
                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400'
                        }`}
                >
                    {i}
                </button>
            );
        }
        return buttons;
    };

    return (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 py-4 ${className}`}>
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 order-2 sm:order-1 w-full sm:w-auto">
                {onRowsPerPageChange && (
                    <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto bg-gray-50/50 dark:bg-gray-800/30 p-2 sm:p-0 rounded-xl sm:rounded-none">
                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1 sm:ml-0">Density</span>
                        <Select value={rowsPerPage.toString()} onValueChange={(val) => onRowsPerPageChange(Number(val))}>
                            <SelectTrigger className="h-8 sm:h-9 w-16 sm:w-20 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-lg text-[11px] sm:text-xs font-black shadow-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[5, 10, 20, 50].map(size => (
                                    <SelectItem key={size} value={size.toString()} className="text-xs font-bold">
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                <div className="text-[10px] sm:text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] sm:tracking-[0.2em] text-center sm:text-left">
                    Showing <span className="text-gray-900 dark:text-white">{(currentPage - 1) * rowsPerPage + 1}</span>–
                    <span className="text-gray-900 dark:text-white">{Math.min(currentPage * rowsPerPage, totalItems)}</span> of {totalItems} {label}
                </div>
            </div>

            <div className="flex items-center justify-center gap-1 sm:gap-1.5 order-1 sm:order-2 w-full sm:w-auto">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-gray-400 hover:text-primary active:scale-90"
                >
                    <IconChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                <div className="flex items-center gap-1 mx-0.5 sm:mx-1">
                    {renderPageButtons()}
                </div>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-gray-400 hover:text-primary active:scale-90"
                >
                    <IconChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
            </div>
        </div>
    );
};

export default AnalyticsPagination;
