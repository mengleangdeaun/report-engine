import React, { useState, useMemo } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { IconSettings, IconCheck, IconX, IconSearch } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface ColumnSelectorProps {
    availableColumns: string[];
    visibleColumns: string[];
    onChange: (columns: string[]) => void;
    defaultColumns: string[];
}

// Map technical slugs to human readable groups
const COLUMN_GROUPS = [
    {
        name: 'Breakdowns & identifiers',
        keywords: ['campaign', 'ad_set', 'ad', 'name', 'id', 'age', 'gender', 'country', 'platform', 'placement', 'device', 'date', 'objective', 'status'],
        color: 'blue'
    },
    {
        name: 'Performance & Delivery',
        keywords: ['impressions', 'reach', 'frequency', 'spend', 'amount', 'cpm', 'budget', 'delivery'],
        color: 'purple'
    },
    {
        name: 'Clicks & Engagement',
        keywords: ['click', 'ctr', 'cpc', 'like', 'comment', 'share', 'engagement', 'view', 'play', 'reaction'],
        color: 'orange'
    },
    {
        name: 'Conversions & Results',
        keywords: ['conversion', 'result', 'roas', 'purchase', 'lead', 'cart', 'checkout', 'registration', 'cost_per'],
        color: 'emerald'
    }
];

export const ColumnSelector: React.FC<ColumnSelectorProps> = ({
    availableColumns,
    visibleColumns,
    onChange,
    defaultColumns
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Group columns visually
    const groupedColumns = useMemo(() => {
        const groups: Record<string, string[]> = {
            'Breakdowns & identifiers': [],
            'Performance & Delivery': [],
            'Clicks & Engagement': [],
            'Conversions & Results': [],
            'Other Metrics': []
        };

        availableColumns.forEach(col => {
            let placed = false;
            for (const group of COLUMN_GROUPS) {
                if (group.keywords.some(kw => col.toLowerCase().includes(kw))) {
                    groups[group.name].push(col);
                    placed = true;
                    break;
                }
            }
            if (!placed) groups['Other Metrics'].push(col);
        });

        // Remove empty groups
        Object.keys(groups).forEach(k => {
            if (groups[k].length === 0) delete groups[k];
        });

        return groups;
    }, [availableColumns]);

    // Format slug strictly for display (e.g. "cost_per_purchase" -> "Cost Per Purchase")
    const formatDisplay = (slug: string) => {
        return slug.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    const handleToggle = (col: string) => {
        if (visibleColumns.includes(col)) {
            // Don't let them hide everything
            if (visibleColumns.length > 1) {
                onChange(visibleColumns.filter(c => c !== col));
            }
        } else {
            onChange([...visibleColumns, col]);
        }
    };

    const toggleGroup = (groupCols: string[]) => {
        const allInGroupVisible = groupCols.every(c => visibleColumns.includes(c));
        if (allInGroupVisible) {
            // Remove group
            const newVisible = visibleColumns.filter(c => !groupCols.includes(c));
            if (newVisible.length > 0) onChange(newVisible);
        } else {
            // Add group
            const toAdd = groupCols.filter(c => !visibleColumns.includes(c));
            onChange([...visibleColumns, ...toAdd]);
        }
    };

    return (
        <Menu as="div" className="relative inline-block text-left">
            {({ open }) => (
                <>
                    <Menu.Button className="flex items-center gap-1.5 ">
                        <Button className='bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all border shadow-sm' >
                        <IconSettings size={16} className={`mr-2 transition-transform duration-300 ${open ? 'rotate-90' : ''}`} />
                        <span className="hidden sm:inline font-medium">Columns</span>
                        <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
                            {visibleColumns.length}
                        </span>
                        </Button>
                    </Menu.Button>

                    <Transition
                        show={open}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                    >
                        <Menu.Items className="absolute right-0 z-50 mt-2 w-80 sm:w-96 origin-top-right rounded-lg bg-white dark:bg-gray-900 shadow-2xl border border-gray-100 dark:border-gray-700 focus:outline-none flex flex-col max-h-[70vh]">

                            {/* Header & Search */}
                            <div className="p-3 border-b border-gray-100 dark:border-gray-700 shrink-0">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Customize Columns</h3>
                                    <button
                                        onClick={(e) => { e.preventDefault(); onChange(defaultColumns); }}
                                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium"
                                    >
                                        Reset to Default
                                    </button>
                                </div>
                                <div className="relative">
                                    <IconSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search metrics..."
                                        className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        onClick={e => e.stopPropagation()}
                                        onKeyDown={e => e.stopPropagation()}
                                    />
                                    {searchTerm && (
                                        <button onClick={(e) => { e.stopPropagation(); setSearchTerm(''); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            <IconX size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Column List */}
                            <div className="flex-1 min-h-[50px] overflow-hidden">
                                <ScrollArea className="h-[50vh] w-full p-2 pointer-events-auto">
                                    <div className="pb-4">
                                        {Object.entries(groupedColumns).map(([groupName, cols]) => {
                                            const filteredCols = cols.filter(c => c.toLowerCase().includes(searchTerm.toLowerCase()) || formatDisplay(c).toLowerCase().includes(searchTerm.toLowerCase()));
                                            if (filteredCols.length === 0) return null;

                                            const allSelected = filteredCols.length > 0 && filteredCols.every(c => visibleColumns.includes(c));
                                            const someSelected = filteredCols.some(c => visibleColumns.includes(c));

                                            const groupDef = COLUMN_GROUPS.find(g => g.name === groupName);
                                            const colorClass = groupDef ? `text-${groupDef.color}-600 dark:text-${groupDef.color}-400` : 'text-gray-600';

                                            return (
                                                <div key={groupName} className="mb-4 last:mb-0">
                                                    <div
                                                        className="flex items-center justify-between px-3 py-2 mb-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded group transition-colors"
                                                        onClick={(e) => { e.stopPropagation(); toggleGroup(filteredCols); }}
                                                    >
                                                        <h4 className={`text-xs font-bold uppercase tracking-wider ${colorClass}`}>
                                                            {groupName}
                                                        </h4>
                                                        <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors ${allSelected
                                                            ? 'bg-blue-500 border-blue-500 text-white'
                                                            : someSelected
                                                                ? 'bg-blue-500/20 border-blue-500/20 text-blue-500'
                                                                : 'border-gray-300 dark:border-gray-600 bg-transparent'
                                                            }`}>
                                                            {(allSelected || someSelected) && <IconCheck size={10} stroke={3} />}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-0.5">
                                                        {filteredCols.map(col => {
                                                            const isSelected = visibleColumns.includes(col);
                                                            return (
                                                                <Menu.Item key={col}>
                                                                    {({ active }) => (
                                                                        <button
                                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggle(col); }}
                                                                            className={`w-full flex items-center justify-between px-3 py-1.5 text-sm rounded transition-colors ${active ? 'bg-gray-50 dark:bg-gray-700/50' : ''
                                                                                }`}
                                                                        >
                                                                            <span className={`truncate max-w-[250px] mr-3 ${isSelected ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                                                                {formatDisplay(col)}
                                                                            </span>
                                                                            {isSelected && (
                                                                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-blue-500 shrink-0">
                                                                                    <IconCheck size={14} stroke={3} />
                                                                                </motion.div>
                                                                            )}
                                                                        </button>
                                                                    )}
                                                                </Menu.Item>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {Object.values(groupedColumns).flat().filter(c => c.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                                            <div className="py-8 text-center text-sm text-gray-500">
                                                No metrics found matching "{searchTerm}"
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* Footer */}
                            <div className="p-3 border-t border-gray-100 dark:border-gray-700 rounded-b-lg shrink-0 flex items-center justify-between">
                                <span className="text-xs text-gray-500">{visibleColumns.length} columns selected</span>
                                <Menu.Item>
                                    {({ close }) => (
                                        <Button
                                            size="sm"
                                            onClick={(e) => { e.preventDefault(); close(); }}
                                            className="text-xs font-semibold transition-colors"
                                        >
                                            Apply View
                                        </Button>
                                    )}
                                </Menu.Item>
                            </div>
                        </Menu.Items>
                    </Transition>
                </>
            )}
        </Menu>
    );
};
