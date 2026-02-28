import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IconSearch, IconX, IconGripVertical, IconCheck, IconSettings, IconFilter, IconPlus } from '@tabler/icons-react';
import { ReactSortable } from 'react-sortablejs';

const OFFICIAL_TAXONOMY = {
    Metrics: {
        "Popular metrics": [
            "Amount spent", "Impressions", "Reach", "Results", "Cost per result", "Delivery", "Frequency", "Link clicks", "CPC (cost per link click)", "CPM (cost per 1,000 impressions)", "CTR (all)"
        ],
        "Performance": [
            "Results", "Result rate", "Reach", "Frequency", "Impressions", "Views", "Delivery", "Amount spent", "Clicks (all)", "CPC (all)", "CTR (all)", "Gross impressions (includes invalid impressions from non-human traffic)", "Auto-refresh impressions", "Attribution setting", "Messages delivered", "Marketing messages CTR", "Marketing messages read", "Average purchases conversion value", "Results rate per link clicks", "Purchases rate per landing page views", "Purchases rate per link clicks", "Landing page views rate per link clicks", "Results value", "Results ROAS", "Cost per result", "Cost per 1,000 Accounts Center accounts reached", "CPM (cost per 1,000 impressions)", "Cost per message delivered", "Ad Delivery", "Ad set delivery", "Campaign Delivery"
        ],
        "Diagnostics": [
            "Quality ranking", "Engagement rate ranking", "Conversion rate ranking", "20-second phone calls", "60-second phone calls", "20-second Messenger calls", "60-second Messenger calls", "Blocks", "Video average play time", "Video plays at 25%", "Video plays at 50%", "Video plays at 75%", "Video plays at 95%", "Video plays at 100%", "Engagement", "Page engagement", "Facebook likes", "Instagram follows", "Post comments", "Post engagements", "Post reactions", "Post saves", "Post shares", "Photo views", "Event responses", "Check-ins", "Effect share", "Interactions", "Cost per Page engagement", "Cost per like", "Cost per post engagement", "Cost per event response", "Cost per interaction", "New messaging contacts", "Messaging conversations started", "Messaging subscriptions", "Welcome message views", "Messaging conversations replied", "Cost per new messaging contact", "Cost per messaging conversation started", "Cost per messaging subscription", "Phone calls placed", "Callback requests submitted", "Messenger calls placed", "Unique 2-second continuous video plays", "2-second continuous video plays", "3-second video plays", "ThruPlays", "Video plays", "Instant experience view time", "Instant experience view percentage", "Cost per 2-second continuous video play", "Cost per 3-second video play", "Cost per ThruPlay", "Link clicks", "Business AI clicks", "Unique link clicks", "Outbound clicks", "Unique outbound clicks", "CTR (link click-through rate)", "Unique CTR (link click-through rate)", "Outbound CTR (click-through rate)", "Unique outbound CTR (click-through rate)", "Unique clicks (all)", "Unique CTR (all)", "Instant experience clicks to open", "Instant experience clicks to start", "Instant experience outbound clicks", "Instagram profile visits", "CPC (cost per link click)", "Cost per unique link click", "Cost per outbound click", "Cost per unique outbound click", "Cost per unique click (all)", "Ad recall lift", "Ad recall lift rate", "Cost per ad recall lift"
        ],
        "Conversions": [
            "Achievements unlocked", "Cost per achievement unlocked", "Achievements unlocked conversion value", "Adds of payment info", "Cost per add of payment info", "Adds of payment info conversion value", "Adds to cart", "Cost per add to cart", "Adds to cart conversion value", "Adds to wishlist", "Cost per add to wishlist", "Adds to wishlist conversion value", "App activations", "Cost per app activation", "App activations conversion value", "App installs", "Cost per app install", "Applications submitted", "Cost per application submitted", "Submit application conversion value", "Appointments scheduled", "Cost per appointment scheduled", "Appointments scheduled conversion value", "Checkouts initiated", "Cost per checkout initiated", "Checkouts initiated conversion value", "Contacts", "Cost per contact", "Contact conversion value", "Content views", "Cost per content view", "Content views conversion value", "Credit spends", "Cost per credit spend", "Credit spends conversion value", "Custom events", "Cost per custom event", "Desktop app engagements", "Cost per desktop app engagement", "Desktop app story engagements", "Cost per desktop app story engagement", "Desktop app uses", "Cost per desktop app use", "Direct website purchases", "Direct website purchases conversion value", "Donation ROAS (return on ad spend)", "Donations", "Cost per donation", "Donate conversion value", "Game plays", "Cost per game play", "Get directions clicks", "In-app ad clicks", "Cost per in-app ad click", "In-app ad impressions", "Cost per 1,000 in-app ad impressions", "In-app ad impressions value", "Landing page views", "Cost per landing page view", "Leads", "Cost per lead", "Leads conversion value", "Levels achieved", "Cost per level achieved", "Levels achieved conversion value", "Location searches", "Cost per location search", "Location search conversion value", "Meta workflow completions", "Cost per Meta workflow completion", "Meta workflow completions value", "Mobile app D2 retention", "Cost per mobile app D2 retention", "Mobile app D7 retention", "Cost per mobile app D7 retention", "Offline other conversions", "Cost per offline other conversion", "Offline other conversion value", "Meta message to buy", "Cost per Meta message to buy", "Orders created", "Orders shipped", "Phone number clicks", "Products customized", "Cost per product customized", "Customize product conversion value", "Purchase ROAS (return on ad spend)", "Purchases", "Cost per purchase", "Purchases conversion value", "Ratings submitted", "Cost per rating submitted", "Ratings submitted conversion value", "Registrations completed", "Cost per registration completed", "Registrations completed conversion value", "Searches", "Cost per search", "Searches conversion value", "Shops-assisted purchases", "Shops-assisted purchases conversion value", "Subscriptions", "Cost per subscription", "Subscribe conversion value", "Trials started", "Cost per trial started", "Trials started conversion value", "Tutorials completed", "Cost per tutorial completed", "Tutorials completed conversion value"
        ],
        "Settings": [
            "Reporting starts", "Reporting ends", "Objective", "Performance goal", "Buying type", "Bid", "Schedule", "Account ID", "Account name", "Ad ID", "Ad name", "Ad Set Budget", "Ad set ID", "Ad set name", "Campaign Budget", "Campaign ID", "Campaign name", "Body (ad settings)", "Preview link", "Link (ad settings)", "Currency", "Timezone", "Page ID", "Description", "Headline (ad settings)", "Website URL", "Call to action", "Image hash", "Video ID", "Image name", "Video name", "URL parameters", "Included custom audiences", "Excluded custom audiences"
        ]
    },
    Breakdowns: {
        "Popular breakdowns": [
            "Campaign name", "Ad set name", "Ad name", "Page name", "Ad creative", "Age", "Gender", "Country", "Region", "Platform", "Placement", "Objective", "Day", "Month"
        ],
        "Level": [
            "Campaign name", "Ad set name", "Ad name", "Page name", "Campaign ID", "Ad set ID", "Ad ID", "Page ID", "Ad creative"
        ],
        "Time": [
            "Day", "Week", "2 weeks", "Month"
        ],
        "Delivery": [
            "Age", "Gender", "Business locations", "Country", "Region", "DMA region", "Comscore Markets", "Reels trending topic", "Impression device", "Media type", "Platform", "Placement", "Device platform", "Product ID", "Audience segments", "Time of day (ad account time zone)", "Time of day (viewer’s time zone)"
        ],
        "Action": [
            "Messaging outcome destination", "Messaging purchase source", "Conversion device", "Post reaction type", "Destination", "Video view type", "Business AI", "Ad play type", "Video sound", "Carousel card", "Instant experience component", "Category (Onsite)", "Brand (Onsite)"
        ],
        "Settings": [
            "Objective"
        ],
        "Dynamic creative asset": [
            "Image, video and slideshow", "Call to action", "Description", "Headline (ad settings)", "Text", "Website URL"
        ]
    }
};

const formatDisplay = (slug: string) => {
    return slug.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const matchSlugToLabel = (slug: string, label: string) => {
    const s = slug.toLowerCase();
    const l = label.toLowerCase();

    // Explicit hardcode mappings to resolve major facebook output discrepancies
    if (s === 'purchase_roas_return_on_ad_spend' && l.includes('purchase roas')) return true;
    if (s === 'results_roas' && l === 'results roas') return true;
    if (s === 'cpm_cost_per_1000_impressions' && l.includes('cpm')) return true;
    if (s === 'cpc_cost_per_link_click' && l.includes('cpc')) return true;
    if (s.includes('link_click_through_rate') && l.includes('ctr (link click')) return true;
    if (s.includes('outbound_ctr') && l.includes('outbound ctr')) return true;
    if ((s === 'amount_spent_usd' || s === 'amount_spent') && l === 'amount spent') return true;
    if (s === 'last_significant_edit' && l === 'last significant edit') return true;
    if (s === 'cost_per_messaging_conversation_started_usd' && l === 'cost per messaging conversation started') return true;

    // Remove noise before strict equality check
    const cleanSlug = s.replace(/_usd$/i, '').replace(/_all$/i, '').replace(/_/g, '');
    const cleanLabel = l.replace(/\([^)]+\)/g, '').replace(/[^a-z0-9]/g, '');

    return cleanSlug === cleanLabel;
};

interface MetricSelectorModalProps {
    title: string;
    triggerIcon: React.ReactNode;
    triggerText: string;
    triggerVariant?: 'default' | 'outline' | 'ghost';
    availableItems: string[];
    selectedItems: string[];
    onChange: (items: string[]) => void;
    lockedItems?: string[]; // e.g. "objective" for KPIs
    className?: string;
}

export const MetricSelectorModal: React.FC<MetricSelectorModalProps> = ({
    title,
    triggerIcon,
    triggerText,
    triggerVariant = 'outline',
    availableItems,
    selectedItems,
    onChange,
    lockedItems = [],
    className = ''
}) => {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'Metrics' | 'Breakdowns'>('Metrics');

    const [draftSelected, setDraftSelected] = useState<{ id: string }[]>([]);

    useEffect(() => {
        if (open) {
            setSearchTerm('');
            setActiveTab('Metrics');
            setDraftSelected(selectedItems.map(i => ({ id: i })));
        }
    }, [open, selectedItems]);

    const groupedAvailable = useMemo(() => {
        const tree = { Metrics: [] as any[], Breakdowns: [] as any[] };
        const mappedSlugs = new Set<string>();

        Object.entries(OFFICIAL_TAXONOMY).forEach(([tabName, categories]) => {
            Object.entries(categories).forEach(([catName, labels]) => {
                const items: any[] = [];
                labels.forEach(label => {
                    // Find all slugs that match this label
                    let matchedSlugs = availableItems.filter(slug => matchSlugToLabel(slug, label));

                    if (matchedSlugs.length > 0) {
                        // Deduplication: prioritize the shortest one.
                        const unmapped = matchedSlugs.filter(s => !mappedSlugs.has(s));
                        if (unmapped.length > 0) {
                            unmapped.sort((a, b) => a.length - b.length);
                            matchedSlugs = [unmapped[0]]; // Keep the cleanest representation
                        } else {
                            matchedSlugs = [matchedSlugs[0]];
                        }

                        // We render the UI Label instead of the raw slug for clarity, but store the slug payload dynamically
                        matchedSlugs.forEach(s => mappedSlugs.add(s));
                        items.push({ id: matchedSlugs[0], label });
                    }
                });

                if (items.length > 0) {
                    (tree as any)[tabName].push({ name: catName, items });
                }
            });
        });

        const otherItems = availableItems.filter(slug => !mappedSlugs.has(slug));

        return { tree, otherItems };
    }, [availableItems]);

    const visibleGroups = useMemo(() => {
        const result = [] as any[];
        const currentTabGroups = (groupedAvailable.tree as any)[activeTab] || [];

        currentTabGroups.forEach((cat: any) => {
            const filteredItems = cat.items.filter((item: any) =>
                item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.label.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (filteredItems.length > 0) {
                result.push({ ...cat, items: filteredItems });
            }
        });

        return result;
    }, [groupedAvailable.tree, activeTab, searchTerm]);

    const visibleOther = useMemo(() => {
        if (activeTab !== 'Metrics') return []; // Only show uncategorized artifacts inside Metrics Tab
        return groupedAvailable.otherItems.filter(i =>
            i.toLowerCase().includes(searchTerm.toLowerCase()) ||
            formatDisplay(i).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [groupedAvailable.otherItems, activeTab, searchTerm]);

    const handleToggle = (item: string) => {
        if (lockedItems.includes(item)) return; // prevent toggling locked items

        setDraftSelected(prev => {
            if (prev.some(p => p.id === item)) {
                return prev.filter(p => p.id !== item);
            } else {
                return [...prev, { id: item }];
            }
        });
    };

    const handleSave = () => {
        onChange(draftSelected.map(d => d.id));
        setOpen(false);
    };

    const getLabelForSlug = (slug: string) => {
        for (const tabName of Object.keys(groupedAvailable.tree)) {
            for (const cat of (groupedAvailable.tree as any)[tabName]) {
                const found = cat.items.find((i: any) => i.id === slug);
                if (found) return found.label;
            }
        }
        return formatDisplay(slug);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant={triggerVariant as any} size="sm" className={`gap-2 shrink-0 border-gray-200 dark:border-gray-700 h-8 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${className}`}>
                    {triggerIcon} {triggerText}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] md:max-w-4xl p-0 overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <DialogHeader className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 shrink-0">
                    <DialogTitle className="text-xl flex items-center gap-2">
                        {triggerIcon} {title}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col md:flex-row h-[60vh] md:h-[600px] max-h-[80vh] divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-800">
                    {/* LEFT PANEL: Available Items library */}
                    <div className="w-full md:w-1/2 flex flex-col bg-white dark:bg-gray-900 h-1/2 md:h-full">
                        <div className="p-4 shrink-0 border-b border-gray-100 dark:border-gray-800">
                            <div className="relative">
                                <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Search metrics to add..."
                                    className="pl-9 h-10 w-full rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        <IconX size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <ScrollArea className="flex-1 px-4">
                            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 mb-4 mt-4 rounded-xl">
                                <button className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'Metrics' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`} onClick={() => setActiveTab('Metrics')}>Metrics</button>
                                <button className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'Breakdowns' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`} onClick={() => setActiveTab('Breakdowns')}>Breakdowns</button>
                            </div>

                            {visibleGroups.map((cat: any) => (
                                <div key={cat.name} className="mb-6">
                                    <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 mb-3 border-b border-gray-200 dark:border-gray-700 pb-1">
                                        {cat.name}
                                    </h3>
                                    <div className="space-y-1 pl-2">
                                        {cat.items.map((item: any) => {
                                            const isSelected = draftSelected.some(d => d.id === item.id);
                                            const isLocked = lockedItems.includes(item.id);
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => handleToggle(item.id)}
                                                    disabled={isLocked}
                                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors
                                                        ${isLocked ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800' : ''}
                                                        ${isSelected
                                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                                                        }
                                                    `}
                                                >
                                                    <span className="max-w-[280px] break-words pr-4">{item.label}</span>
                                                    {isSelected ? (
                                                        <IconCheck size={16} className="text-blue-500 shrink-0" />
                                                    ) : (
                                                        <IconPlus size={16} className="text-gray-400 shrink-0" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {visibleOther.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 mb-3 border-b border-gray-200 dark:border-gray-700 pb-1">
                                        Other Tracking / Custom Metrics
                                    </h3>
                                    <div className="space-y-1 pl-2">
                                        {visibleOther.map(item => {
                                            const isSelected = draftSelected.some(d => d.id === item);
                                            const isLocked = lockedItems.includes(item);
                                            return (
                                                <button
                                                    key={item}
                                                    onClick={() => handleToggle(item)}
                                                    disabled={isLocked}
                                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors
                                                        ${isLocked ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800' : ''}
                                                        ${isSelected
                                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                                                        }
                                                    `}
                                                >
                                                    <span className="max-w-[280px] break-words pr-4">{formatDisplay(item)}</span>
                                                    {isSelected ? <IconCheck size={16} className="text-blue-500 shrink-0" /> : <IconPlus size={16} className="text-gray-400 shrink-0" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {visibleGroups.length === 0 && visibleOther.length === 0 && (
                                <div className="text-center py-10 text-gray-500 text-sm">
                                    No metrics found matching "{searchTerm}".
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    {/* RIGHT PANEL: Selected & Sortable Items */}
                    <div className="w-full md:w-1/2 flex flex-col bg-gray-50 dark:bg-gray-800/20 h-1/2 md:h-full relative">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 shrink-0 flex justify-between items-center bg-gray-50 dark:bg-gray-800/20">
                            <h3 className="font-semibold text-gray-700 dark:text-gray-200">
                                Active Layout <span className="text-gray-400 font-normal ml-1">({draftSelected.length})</span>
                            </h3>
                            <p className="text-xs text-gray-500 italic">Drag to reorder</p>
                        </div>

                        <ScrollArea className="flex-1 p-4 pb-[80px]">
                            {draftSelected.length > 0 ? (
                                <ReactSortable
                                    list={draftSelected}
                                    setList={setDraftSelected}
                                    animation={200}
                                    handle=".drag-handle"
                                    className="space-y-2 pb-10"
                                >
                                    {draftSelected.map((item) => {
                                        const isLocked = lockedItems.includes(item.id);

                                        return (
                                            <div
                                                key={item.id}
                                                className={`flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 shadow-sm
                                                    ${isLocked ? 'border-dashed bg-gray-50 dark:bg-gray-800/50' : ''}
                                                `}
                                            >
                                                <div className={`drag-handle mr-3 shrink-0 flex items-center ${isLocked ? 'opacity-30 cursor-not-allowed pointer-events-none' : 'cursor-grab hover:text-blue-500 text-gray-400'}`}>
                                                    <IconGripVertical size={18} />
                                                </div>
                                                <span className={`text-sm font-medium flex-1 wrap-break-word ${isLocked ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                                    {getLabelForSlug(item.id)}
                                                </span>
                                                {!isLocked && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleToggle(item.id); }}
                                                        className="p-1 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/20 text-gray-400 rounded transition-colors shrink-0 outline-none focus:ring-2 focus:ring-offset-1 focus:ring-rose-500"
                                                    >
                                                        <IconX size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        )
                                    })}
                                </ReactSortable>
                            ) : (
                                <div className="text-center py-10 my-4 text-gray-400 text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/10 h-full flex items-center justify-center">
                                    No items selected. Add items from the left panel.
                                </div>
                            )}
                        </ScrollArea>

                        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 dark:border-gray-800 shrink-0 bg-white dark:bg-gray-900 flex justify-end gap-3 rounded-br-lg md:rounded-bl-none rounded-bl-lg drop-shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
                            <Button variant="ghost" className="h-9" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button className="h-9" onClick={handleSave}>Save & Apply Layout</Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default MetricSelectorModal;
