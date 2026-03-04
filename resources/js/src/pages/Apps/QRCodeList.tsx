import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setPageTitle } from '../../store/themeConfigSlice';
import QRCodeStyling from 'qr-code-styling';
import jsPDF from 'jspdf';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import DeleteModal from '../../components/DeleteModal';
import QRCodeListSkeleton from '../../components/Skeletons/QRCodeListSkeleton';
import {
    IconQrcode,
    IconDownload,
    IconFileTypePdf,
    IconTrash,
    IconChartBar,
    IconPlus,
    IconSearch,
    IconEye,
    IconX,
    IconLink,
    IconWifi,
    IconMail,
    IconPhone,
    IconMessage,
    IconLetterCase,
    IconArrowLeft,
    IconDevices,
    IconWorld,
    IconClock,
    IconChartLine,
    IconFilter,
    IconLayoutGrid,
    IconList,
    IconUser,
    IconChevronLeft,
    IconChevronRight,
    IconChevronDown,
    IconCheck,
    IconDots,
    IconEdit,
    IconSettings,
} from '@tabler/icons-react';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '../../components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import ReactApexChart from 'react-apexcharts';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import DateRangePicker from '../../components/ui/date-range-picker';
import { IRootState } from '../../store';

// ============================================================================
// TYPES
// ============================================================================
interface User {
    id: number;
    name: string;
    avatar?: string;
}

interface QRCodeRecord {
    id: number;
    name: string;
    type: string;
    content: string;
    short_code: string;
    total_scans: number;
    settings: Record<string, any> | null;
    created_at: string;
    user?: User;
}

interface ScanStats {
    total_scans: number;
    daily_scans: { date: string; count: number }[];
    device_breakdown: { device_type: string; count: number }[];
    country_breakdown: { country: string; count: number }[];
    recent_scans: {
        id: number;
        device_type: string;
        ip_address: string;
        country?: string;
        scanned_at: string;
    }[];
}

interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================
const TYPE_ICONS: Record<string, any> = {
    url: IconLink,
    text: IconLetterCase,
    wifi: IconWifi,
    email: IconMail,
    phone: IconPhone,
    sms: IconMessage,
};

const TRACKABLE_TYPES = ['url'];

const TYPE_LABELS: Record<string, string> = {
    url: 'URL',
    text: 'Text',
    wifi: 'WiFi',
    email: 'Email',
    phone: 'Phone',
    sms: 'SMS',
};

// ============================================================================
// UTILS
// ============================================================================
const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
const getTrackUrl = (code: string) => `${apiBase.replace('/api', '')}/api/qr/s/${code}`;
const isTrackable = (type: string) => TRACKABLE_TYPES.includes(type);

const formatNumber = (num: number): string => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return num.toString();
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface QRCodeFiltersProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    filterType: string;
    onTypeChange: (type: string) => void;
    filterUser: string;
    onUserChange: (userId: string) => void;
    onUserClear: () => void;
    teamMembers: User[];
    selectedUserName: string;
}

const QRCodeFilters: React.FC<QRCodeFiltersProps> = ({
    searchQuery,
    onSearchChange,
    filterType,
    onTypeChange,
    filterUser,
    onUserChange,
    onUserClear,
    teamMembers,
    selectedUserName,
}) => {
    const [searchInput, setSearchInput] = useState(searchQuery);
    const [teamMemberSearch, setTeamMemberSearch] = useState('');

    const filteredTeamMembers = useMemo(() => {
        return teamMembers.filter(member =>
            member.name.toLowerCase().includes(teamMemberSearch.toLowerCase())
        );
    }, [teamMembers, teamMemberSearch]);

    // Sync internal state with external searchQuery (e.g., when cleared externally)
    useEffect(() => {
        setSearchInput(searchQuery);
    }, [searchQuery]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            onSearchChange(searchInput);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput, onSearchChange]);

    return (
        <Card className="border-border/60 shadow-sm mb-6">
            <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row gap-5 items-end">
                    {/* User filter */}
                    <div className="w-full lg:w-64">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                            <IconUser size={13} />
                            Generated By
                        </Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full justify-between h-10 font-normal text-sm bg-background border-input"
                                >
                                    <span className="truncate text-left">{selectedUserName}</span>
                                    <IconChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[255px] p-0" align="start">
                                <div className="flex items-center justify-between px-3 py-2.5 border-b">
                                    <span className="text-xs font-semibold text-muted-foreground">Select member</span>
                                    {(filterUser !== 'all' || teamMemberSearch) && (
                                        <button
                                            onClick={() => {
                                                if (filterUser !== 'all') onUserClear();
                                                setTeamMemberSearch('');
                                            }}
                                            className="text-xs text-primary hover:text-primary/80 font-medium"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                                <div className="p-2 border-b">
                                    <div className="relative">
                                        <IconSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            value={teamMemberSearch}
                                            onChange={(e) => setTeamMemberSearch(e.target.value)}
                                            placeholder="Search members..."
                                            className="h-8 pl-8 text-xs bg-muted/50 border-transparent focus-visible:bg-background focus-visible:border-primary/50"
                                        />
                                        {teamMemberSearch && (
                                            <button
                                                onClick={() => setTeamMemberSearch('')}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                <IconX size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="max-h-56 overflow-y-auto p-1">
                                    {filteredTeamMembers.length > 0 || teamMemberSearch === '' ? (
                                        <>
                                            {teamMemberSearch === '' && (
                                                <div
                                                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
                                                    onClick={() => onUserChange('all')}
                                                >
                                                    <div className="flex items-center justify-center w-4 h-4">
                                                        {filterUser === 'all' && <IconCheck size={14} className="text-primary" strokeWidth={3} />}
                                                    </div>
                                                    <span className={`text-sm truncate ${filterUser === 'all' ? 'font-medium' : ''}`}>
                                                        All Members
                                                    </span>
                                                </div>
                                            )}
                                            {filteredTeamMembers.map((member) => (
                                                <div
                                                    key={member.id}
                                                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
                                                    onClick={() => onUserChange(String(member.id))}
                                                >
                                                    <div className="flex items-center justify-center w-4 h-4">
                                                        {String(filterUser) === String(member.id) && (
                                                            <IconCheck size={14} className="text-primary" strokeWidth={3} />
                                                        )}
                                                    </div>
                                                    <span
                                                        className={`text-sm truncate ${String(filterUser) === String(member.id) ? 'font-medium' : ''
                                                            }`}
                                                    >
                                                        {member.name}
                                                    </span>
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        <div className="py-4 text-center text-xs text-muted-foreground">
                                            No members found.
                                        </div>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Search */}
                    <div className="relative flex-1 space-y-1">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                            <IconSearch size={13} /> Search
                        </Label>
                        <div className="relative">
                            <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search QR codes..."
                                className="pl-9 pr-9 h-10 text-sm"
                            />
                            {searchInput && (
                                <button
                                    onClick={() => setSearchInput('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <IconX size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Type tabs */}
                    <div className="space-y-1 flex-2 overflow-hidden">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                            <IconFilter size={13} /> Type
                        </Label>
                        <div
                            className="flex gap-4 overflow-x-auto pb-1 lg:pb-0 no-scrollbar h-10 items-center"
                            role="tablist"
                        >
                            <button
                                role="tab"
                                aria-selected={filterType === 'all'}
                                onClick={() => onTypeChange('all')}
                                className={`whitespace-nowrap px-3 py-2 h-10 rounded-lg text-xs font-medium border transition-all ${filterType === 'all'
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border text-muted-foreground hover:border-primary/40'
                                    }`}
                            >
                                All
                            </button>
                            {Object.entries(TYPE_LABELS).map(([val, label]) => (
                                <button
                                    key={val}
                                    role="tab"
                                    aria-selected={filterType === val}
                                    onClick={() => onTypeChange(val)}
                                    className={`whitespace-nowrap px-3 py-2 h-10 rounded-lg text-xs font-medium border transition-all ${filterType === val
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-border text-muted-foreground hover:border-primary/40'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// ----------------------------------------------------------------------------
// QR Code Card (Grid Item) - with styled QR code matching preview
// ----------------------------------------------------------------------------
interface QRCodeCardProps {
    qr: QRCodeRecord;
    onPreview: (qr: QRCodeRecord) => void;
    onStats: (qr: QRCodeRecord) => void;
    onEdit: (qr: QRCodeRecord) => void;
    onDelete: (id: number) => void;
}

const QRCodeCard: React.FC<QRCodeCardProps> = ({ qr, onPreview, onStats, onEdit, onDelete }) => {
    const TypeIcon = TYPE_ICONS[qr.type] || IconQrcode;
    const trackable = isTrackable(qr.type);
    const settings = qr.settings || {};
    const qrRef = useRef<HTMLDivElement>(null);
    const qrInstance = useRef<QRCodeStyling | null>(null);

    // Generate styled QR code on mount and when settings change
    useEffect(() => {
        if (!qrRef.current) return;
        qrRef.current.innerHTML = ''; // Clear previous

        // Adjust dimensions for card view
        const size = 160;

        qrInstance.current = new QRCodeStyling({
            width: size,
            height: size,
            data: trackable && qr.short_code ? getTrackUrl(qr.short_code) : qr.content || ' ',
            dotsOptions: { type: settings.dotStyle || 'square', color: settings.fgColor || '#000000' },
            backgroundOptions: { color: settings.bgColor || '#ffffff' },
            cornersSquareOptions: { type: settings.cornerSquareStyle || 'square', color: settings.fgColor || '#000000' },
            cornersDotOptions: { type: settings.cornerDotStyle || 'square', color: settings.fgColor || '#000000' },
            imageOptions: { crossOrigin: 'anonymous', margin: 6, imageSize: 0.35 },
            image: settings.logo || undefined, // Use logo from settings
            qrOptions: { errorCorrectionLevel: settings.logo ? 'H' : 'M' }, // Higher EC if logo exists
        });
        qrInstance.current.append(qrRef.current);
    }, [qr, trackable, settings]);

    const handlePreview = useCallback(() => onPreview(qr), [onPreview, qr]);
    const handleStats = useCallback(() => onStats(qr), [onStats, qr]);
    const handleEdit = useCallback(() => onEdit(qr), [onEdit, qr]);
    const handleDelete = useCallback(() => onDelete(qr.id), [onDelete, qr.id]);

    // Label Font Size Scaling for Card
    const baseFontSize = settings.labelFontSize || 16;
    const scaledFontSize = Math.max(10, baseFontSize * 0.6);

    return (
        <Card
            className="group relative overflow-hidden border border-border/50 bg-card shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
        >
            {/* QR Preview Area */}
            <div
                className="relative aspect-square cursor-pointer overflow-hidden bg-muted/30 p-4 sm:p-6"
                onClick={handlePreview}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handlePreview()}
                aria-label={`Preview QR code for ${qr.name}`}
            >
                <div
                    className="flex h-full w-full items-center justify-center rounded-xl shadow-sm ring-1 ring-black/5 overflow-hidden"
                    style={{ backgroundColor: settings.bgColor || '#ffffff' }}
                >
                    <div className="flex flex-col items-center justify-center p-2 w-full h-full">
                        {settings.label && (settings.labelPosition === 'above' || !settings.labelPosition) && (
                            <p style={{
                                marginBottom: '4px',
                                fontSize: `${scaledFontSize}px`,
                                fontWeight: 600,
                                color: settings.fgColor || '#000000',
                                textAlign: 'center',
                                fontFamily: 'Inter, sans-serif',
                                lineHeight: 1.2,
                                wordBreak: 'break-word',
                                maxWidth: '100%'
                            }}>
                                {settings.label}
                            </p>
                        )}

                        <div ref={qrRef} className="shrink-0" />

                        {settings.label && settings.labelPosition === 'below' && (
                            <p style={{
                                marginTop: '4px',
                                fontSize: `${scaledFontSize}px`,
                                fontWeight: 600,
                                color: settings.fgColor || '#000000',
                                textAlign: 'center',
                                fontFamily: 'Inter, sans-serif',
                                lineHeight: 1.2,
                                wordBreak: 'break-word',
                                maxWidth: '100%'
                            }}>
                                {settings.label}
                            </p>
                        )}
                    </div>
                </div>

                {/* Type badge */}
                <Badge
                    variant={trackable ? 'success' : 'secondary'}
                    className={`absolute left-3 top-3 shadow-sm`}
                >
                    <TypeIcon size={12} className="mr-1" />
                    <span className="text-xs font-medium">{TYPE_LABELS[qr.type] || qr.type}</span>
                </Badge>

                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="translate-y-2 transform shadow-lg transition-transform duration-200 group-hover:translate-y-0"
                    >
                        <IconEye size={16} className="mr-2" />
                        Preview
                    </Button>
                </div>
            </div>

            <CardContent className="p-4">
                {/* Title and dropdown */}
                <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-semibold text-foreground" title={qr.name}>
                            {qr.name}
                        </h3>
                        {trackable && qr.short_code ? (
                            <a
                                href={getTrackUrl(qr.short_code)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-0.5 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <IconLink size={12} />
                                {qr.short_code}
                            </a>
                        ) : (
                            <div className="h-4" /> // Placeholder for alignment
                        )}
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 -mt-1 -mr-2 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label="More options"
                            >
                                <IconDots size={18} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onSelect={handlePreview}>
                                <IconEye size={14} className="mr-2 text-muted-foreground" />
                                Preview
                            </DropdownMenuItem>
                            {trackable && (
                                <DropdownMenuItem onSelect={handleStats}>
                                    <IconChartBar size={14} className="mr-2 text-muted-foreground" />
                                    Stats
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onSelect={handleEdit}>
                                <IconEdit size={14} className="mr-2 text-muted-foreground" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                onSelect={handleDelete}
                            >
                                <IconTrash size={14} className="mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Content preview */}
                {qr.content && (
                    <p className="mb-4 line-clamp-1 text-xs text-muted-foreground" title={qr.content}>
                        {qr.content}
                    </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border/50 pt-3">
                    <div className="flex min-w-0 items-center gap-2">
                        <Avatar className="h-6 w-6 border border-border/50">
                            <AvatarImage src={qr.user?.avatar} alt={qr.user?.name} />
                            <AvatarFallback className="bg-primary/10 text-xs text-primary">
                                {qr.user?.name?.charAt(0) || '?'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <p className="text-[10px] leading-tight text-muted-foreground">Created by</p>
                            <p className="truncate text-xs font-medium text-foreground" title={qr.user?.name}>
                                {qr.user?.name || 'Unknown'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        {trackable && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                                onClick={handleStats}
                                aria-label="View statistics"
                            >
                                <IconChartBar size={16} />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                            onClick={handleDelete}
                            aria-label="Delete QR code"
                        >
                            <IconTrash size={16} />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// ----------------------------------------------------------------------------
// QR Code Grid
// ----------------------------------------------------------------------------
interface QRCodeGridProps {
    codes: QRCodeRecord[];
    onPreview: (qr: QRCodeRecord) => void;
    onStats: (qr: QRCodeRecord) => void;
    onEdit: (qr: QRCodeRecord) => void;
    onDelete: (id: number) => void;
}

const QRCodeGrid: React.FC<QRCodeGridProps> = ({ codes, onPreview, onStats, onEdit, onDelete }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {codes.map((qr) => (
            <QRCodeCard key={qr.id} qr={qr} onPreview={onPreview} onStats={onStats} onEdit={onEdit} onDelete={onDelete} />
        ))}
    </div>
);

// ----------------------------------------------------------------------------
// QR Code List (Table)
// ----------------------------------------------------------------------------
interface QRCodeListTableProps {
    codes: QRCodeRecord[];
    onPreview: (qr: QRCodeRecord) => void;
    onStats: (qr: QRCodeRecord) => void;
    onEdit: (qr: QRCodeRecord) => void;
    onDelete: (id: number) => void;
}

const QRCodeListTable: React.FC<QRCodeListTableProps> = ({ codes, onPreview, onStats, onEdit, onDelete }) => (
    <Card className="border-border/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b bg-muted/30 text-left">
                        <th className="px-4 py-3 font-semibold text-muted-foreground pl-6">Name</th>
                        <th className="px-4 py-3 font-semibold text-muted-foreground">Generated By</th>
                        <th className="px-4 py-3 font-semibold text-muted-foreground">Type</th>
                        <th className="px-4 py-3 font-semibold text-muted-foreground">Scans</th>
                        <th className="px-4 py-3 font-semibold text-muted-foreground">Created</th>
                        <th className="px-4 py-3 font-semibold text-muted-foreground text-right pr-6">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {codes.map((qr) => {
                        const TypeIcon = TYPE_ICONS[qr.type] || IconQrcode;
                        const trackable = isTrackable(qr.type);
                        return (
                            <tr key={qr.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                                <td className="px-4 py-3 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                            <TypeIcon size={18} className="text-primary" />
                                        </div>
                                        <div className="min-w-0 max-w-[300px]">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-foreground truncate">{qr.name}</p>
                                                {trackable && qr.short_code && (
                                                    <a
                                                        href={getTrackUrl(qr.short_code)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 text-blue-600 hover:underline border border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-400"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <IconLink size={10} />
                                                        {qr.short_code}
                                                    </a>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">{qr.content}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        {qr.user?.avatar ? (
                                            <img src={qr.user.avatar} alt={qr.user.name} className="w-6 h-6 rounded-full" />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                {qr.user?.name?.charAt(0) || '?'}
                                            </div>
                                        )}
                                        <span className="text-xs font-medium text-muted-foreground">{qr.user?.name || 'Unknown'}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${trackable
                                            ? 'bg-green-500/10 text-green-600'
                                            : 'bg-gray-500/10 text-gray-600'
                                            }`}
                                    >
                                        {TYPE_LABELS[qr.type] || qr.type}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {trackable ? <span className="font-bold">{formatNumber(qr.total_scans)}</span> : <span className="opacity-50">—</span>}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground text-xs">
                                    {format(new Date(qr.created_at), 'PP')}
                                </td>
                                <td className="px-4 py-3 text-right pr-6">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0"
                                            onClick={() => onPreview(qr)}
                                            aria-label="Preview"
                                        >
                                            <IconEye size={16} />
                                        </Button>
                                        {trackable && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0"
                                                onClick={() => onStats(qr)}
                                                aria-label="Statistics"
                                            >
                                                <IconChartBar size={16} />
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0"
                                            onClick={() => onEdit(qr)}
                                            aria-label="Edit"
                                        >
                                            <IconEdit size={16} />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-400/10"
                                            onClick={() => onDelete(qr.id)}
                                            aria-label="Delete"
                                        >
                                            <IconTrash size={16} />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    </Card>
);

// ----------------------------------------------------------------------------
// Empty State
// ----------------------------------------------------------------------------
const EmptyState: React.FC = () => (
    <Card className="border-border/60 shadow-sm py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <IconQrcode size={32} className="text-muted-foreground/50" />
        </div>
        <p className="text-lg font-semibold text-foreground mb-1">No QR codes found</p>
        <p className="text-sm text-muted-foreground">Try adjusting your filters or create a new one.</p>
    </Card>
);

// ----------------------------------------------------------------------------
// Pagination Controls
// ----------------------------------------------------------------------------
interface PaginationControlsProps {
    pagination: PaginationMeta;
    onPageChange: (page: number) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({ pagination, onPageChange }) => {
    if (pagination.last_page <= 1) return null;

    return (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
                Showing {pagination.from}–{pagination.to} of {pagination.total} results
            </div>
            <div className="flex items-center gap-2 bg-card p-2 rounded-xl border border-border/60 shadow-sm">
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={pagination.current_page === 1}
                    onClick={() => onPageChange(pagination.current_page - 1)}
                    className="w-9 h-9 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                >
                    <IconChevronLeft size={18} />
                </Button>
                <div className="flex items-center px-2 gap-1 text-sm font-medium">
                    <span className="text-foreground">{pagination.current_page}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-muted-foreground">{pagination.last_page}</span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={pagination.current_page === pagination.last_page}
                    onClick={() => onPageChange(pagination.current_page + 1)}
                    className="w-9 h-9 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                >
                    <IconChevronRight size={18} />
                </Button>
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------------
// Stats View
// ----------------------------------------------------------------------------
interface StatsViewProps {
    qr: QRCodeRecord;
    stats: ScanStats | null;
    loading: boolean;
    dateRange: DateRange | undefined;
    onDateRangeChange: (range: DateRange | undefined) => void;
    onBack: () => void;
}

const StatsView: React.FC<StatsViewProps> = ({
    qr,
    stats,
    loading,
    dateRange,
    onDateRangeChange,
    onBack,
}) => {
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);

    const chartData = useMemo(() => {
        if (!stats?.daily_scans) return { series: [], options: {} };
        const dates = stats.daily_scans.map((d) => d.date);
        const counts = stats.daily_scans.map((d) => d.count);
        return {
            series: [{ name: 'Scans', data: counts }],
            options: {
                chart: {
                    height: 300,
                    type: 'area',
                    fontFamily: 'Nunito, sans-serif',
                    toolbar: { show: false },
                    zoom: { enabled: false },
                    background: 'transparent',
                },
                dataLabels: { enabled: false },
                stroke: { curve: 'smooth', width: 2 },
                xaxis: {
                    categories: dates,
                    axisBorder: { show: false },
                    axisTicks: { show: false },
                    crosshairs: { show: true },
                    labels: { style: { colors: isDark ? '#888ea8' : '#888ea8' } },
                },
                yaxis: {
                    show: true,
                    labels: {
                        style: { colors: isDark ? '#888ea8' : '#888ea8' },
                        formatter: (val: number) => Math.floor(val).toString(),
                    },
                },
                grid: {
                    borderColor: isDark ? '#191E3A' : '#E0E6ED',
                    strokeDashArray: 4,
                    yaxis: { lines: { show: true } },
                    xaxis: { lines: { show: false } },
                    padding: { top: 0, right: 0, bottom: 0, left: 10 },
                },
                tooltip: { theme: isDark ? 'dark' : 'light' },
                colors: ['#4361ee'],
                fill: {
                    type: 'gradient',
                    gradient: {
                        shadeIntensity: 1,
                        inverseColors: false,
                        opacityFrom: 0.45,
                        opacityTo: 0.05,
                        stops: [20, 100],
                    },
                },
            },
        };
    }, [stats, isDark]);

    return (
        <div>
            <div className="mb-6">
                <Button variant="outline" onClick={onBack} className="gap-2 mb-3 text-muted-foreground hover:text-foreground">
                    <IconArrowLeft size={16} /> Back to list
                </Button>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center">
                            <IconChartBar size={24} className="text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{qr.name}</h1>
                            <p className="text-sm text-gray-500">
                                {TYPE_LABELS[qr.type] || qr.type} • Created {format(new Date(qr.created_at), 'PP')}
                            </p>
                        </div>
                    </div>
                    <div className="w-full lg:w-auto">
                        <DateRangePicker value={dateRange} onChange={onDateRangeChange} className="w-full lg:w-[260px]" align="end" />
                    </div>
                </div>
            </div>

            {loading ? (
                // Skeleton loading state
                <div className="space-y-5">
                    {/* KPI Cards Skeleton */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <Card key={i} className="border-border/60 shadow-sm">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
                                        <div className="space-y-2">
                                            <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                                            <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Chart Skeleton */}
                    <Card className="border-border/60 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-2.5">
                            <div className="w-4 h-4 bg-muted animate-pulse rounded" />
                            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                        </div>
                        <CardContent className="p-5">
                            <div className="h-[300px] bg-muted animate-pulse rounded-lg" />
                        </CardContent>
                    </Card>
                </div>
            ) : stats ? (
                // Actual data display
                <div className="space-y-5">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border-border/60 shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                        <IconChartLine size={20} className="text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{formatNumber(stats.total_scans)}</p>
                                        <p className="text-xs text-muted-foreground">Total Scans</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-border/60 shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                                        <IconDevices size={20} className="text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{stats.device_breakdown?.length || 0}</p>
                                        <p className="text-xs text-muted-foreground">Device Types</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-border/60 shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                        <IconWorld size={20} className="text-purple-500" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{stats.country_breakdown?.length || 0}</p>
                                        <p className="text-xs text-muted-foreground">Countries</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-border/60 shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                        <IconClock size={20} className="text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{stats.recent_scans?.length || 0}</p>
                                        <p className="text-xs text-muted-foreground">Recent Scans</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Chart */}
                    {stats.daily_scans?.length > 0 && (
                        <Card className="border-border/60 shadow-sm overflow-hidden">
                            <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-2.5">
                                <IconChartLine size={16} className="text-muted-foreground" />
                                <span className="text-sm font-semibold">Scans Over Time</span>
                            </div>
                            <CardContent className="p-5">
                                <div className="relative rounded-lg bg-white dark:bg-transparent overflow-hidden">
                                    <ReactApexChart series={chartData.series} options={chartData.options} type="area" height={300} />
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            ) : (
                // Empty state
                <div className="flex items-center justify-center py-16">
                    <Card className="border-border/60 shadow-sm w-full max-w-md">
                        <CardContent className="flex flex-col items-center text-center p-8">
                            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                                <IconChartLine size={32} className="text-muted-foreground/50" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No data available</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                There are no statistics to display for this QR code in the selected date range.
                            </p>
                            {/* Optional: Add a refresh or retry button if you have a refetch function */}
                            {/* <Button variant="outline" size="sm" onClick={refetch}>Refresh</Button> */}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

// ----------------------------------------------------------------------------
// Preview Modal
// ----------------------------------------------------------------------------
interface PreviewModalProps {
    qr: QRCodeRecord | null;
    onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ qr, onClose }) => {
    const previewRef = useRef<HTMLDivElement>(null);
    const qrInstance = useRef<QRCodeStyling | null>(null);

    useEffect(() => {
        if (!qr || !previewRef.current) return;
        previewRef.current.innerHTML = '';
        const settings = qr.settings || {};
        qrInstance.current = new QRCodeStyling({
            width: settings.qrSize || 260,
            height: settings.qrSize || 260,
            data: isTrackable(qr.type) && qr.short_code ? getTrackUrl(qr.short_code) : qr.content || ' ',
            dotsOptions: { type: settings.dotStyle || 'square', color: settings.fgColor || '#000' },
            backgroundOptions: { color: settings.bgColor || '#FFF' },
            cornersSquareOptions: { type: settings.cornerSquareStyle || 'square', color: settings.fgColor || '#000' },
            cornersDotOptions: { type: settings.cornerDotStyle || 'square', color: settings.fgColor || '#000' },
            imageOptions: { crossOrigin: 'anonymous', margin: 6, imageSize: 0.35 },
            image: settings.logo || undefined,
            qrOptions: { errorCorrectionLevel: settings.logo ? 'H' : 'M' },
        });
        qrInstance.current.append(previewRef.current);
    }, [qr]);

    const downloadPNG = async () => {
        if (!qrInstance.current) return;
        const blob = await qrInstance.current.getRawData('png');
        if (!blob) return;
        const link = document.createElement('a');
        link.download = `${qr?.name || 'qr-code'}.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const downloadPDF = async () => {
        if (!qrInstance.current) return;
        const blob = await qrInstance.current.getRawData('png');
        if (!blob) return;
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        await new Promise((r) => (img.onload = r));
        const pdf = new jsPDF('portrait', 'mm', 'a4');
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const ratio = Math.min(pageW / img.width, pageH / img.height) * 0.6;
        const w = img.width * ratio,
            h = img.height * ratio;
        pdf.addImage(img.src, 'PNG', (pageW - w) / 2, (pageH - h) / 3, w, h);
        pdf.save(`${qr?.name || 'qr-code'}.pdf`);
        URL.revokeObjectURL(img.src);
    };

    if (!qr) return null;

    const settings = qr.settings || {};

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label="Close preview"
                >
                    <IconX size={18} />
                </button>
                <h3 className="text-lg font-bold mb-1">{qr.name}</h3>
                <p className="text-xs text-muted-foreground mb-4">
                    {TYPE_LABELS[qr.type] || qr.type} • {format(new Date(qr.created_at), 'PP')}
                </p>

                <div className="flex justify-center p-4 rounded-xl bg-muted/30 border border-border/50 mb-4 overflow-hidden">
                    <div
                        className="flex flex-col items-center max-w-full shadow-sm ring-1 ring-black/5 [&_canvas]:max-w-full [&_canvas]:h-auto"
                        style={{ backgroundColor: settings.bgColor || '#FFF', padding: '16px', borderRadius: '12px' }}
                    >
                        {settings.label && (settings.labelPosition === 'above' || !settings.labelPosition) && (
                            <p style={{
                                marginBottom: '8px',
                                fontSize: `${settings.labelFontSize || 16}px`,
                                fontWeight: 600,
                                color: settings.fgColor || '#000',
                                textAlign: 'center',
                                fontFamily: 'Inter, sans-serif',
                                maxWidth: '100%',
                                wordBreak: 'break-word'
                            }}>
                                {settings.label}
                            </p>
                        )}

                        <div ref={previewRef} className="shrink-0 max-w-full" />

                        {settings.label && settings.labelPosition === 'below' && (
                            <p style={{
                                marginTop: '8px',
                                fontSize: `${settings.labelFontSize || 16}px`,
                                fontWeight: 600,
                                color: settings.fgColor || '#000',
                                textAlign: 'center',
                                fontFamily: 'Inter, sans-serif'
                            }}>
                                {settings.label}
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Button onClick={downloadPNG} variant="outline" className="h-11 font-semibold rounded-xl border-2 gap-2">
                        <IconDownload size={16} /> PNG
                    </Button>
                    <Button onClick={downloadPDF} variant="outline" className="h-11 font-semibold rounded-xl border-2 gap-2">
                        <IconFileTypePdf size={16} className="text-red-500" /> PDF
                    </Button>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const QRCodeList = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // State
    const [myQRCodes, setMyQRCodes] = useState<QRCodeRecord[]>([]);
    const [loadingCodes, setLoadingCodes] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterUser, setFilterUser] = useState<string>('all');
    const [teamMembers, setTeamMembers] = useState<User[]>([]);
    const [pagination, setPagination] = useState<PaginationMeta>({
        current_page: 1,
        last_page: 1,
        per_page: 12,
        total: 0,
        from: 0,
        to: 0,
    });
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    // Load view mode preference
    useEffect(() => {
        const savedMode = localStorage.getItem('qr_view_mode');
        if (savedMode === 'grid' || savedMode === 'list') {
            setViewMode(savedMode);
        }
    }, []);

    const handleViewModeChange = (mode: 'grid' | 'list') => {
        setViewMode(mode);
        localStorage.setItem('qr_view_mode', mode); // Save preference
    };

    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingQRId, setDeletingQRId] = useState<number | null>(null);
    const [selectedQR, setSelectedQR] = useState<QRCodeRecord | null>(null);
    const [scanStats, setScanStats] = useState<ScanStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: addDays(new Date(), -29),
        to: new Date(),
    });
    const [previewQR, setPreviewQR] = useState<QRCodeRecord | null>(null);

    useEffect(() => {
        dispatch(setPageTitle('My QR Codes'));
    }, [dispatch]);

    // Load team members on mount
    useEffect(() => {
        const loadTeamMembers = async () => {
            try {
                const { data } = await api.get('/team/my-team');
                setTeamMembers(data.members || []);
            } catch (error) {
                console.error('Failed to load team members', error);
            }
        };
        loadTeamMembers();
    }, []);

    // Load codes when filters change
    useEffect(() => {
        loadCodes(1);
    }, [filterUser, searchQuery]);

    const loadCodes = async (page = 1) => {
        setLoadingCodes(true);
        try {
            const params: any = { page, limit: pagination.per_page };
            if (searchQuery) params.search = searchQuery; // Ensure backend accepts 'search'
            if (filterUser !== 'all') params.user_id = filterUser;

            const { data } = await api.get('/qr-codes', { params });
            setMyQRCodes(data.data || []);
            setPagination({
                current_page: data.current_page || 1,
                last_page: data.last_page || 1,
                per_page: data.per_page || 12,
                total: data.total || 0,
                from: data.from || 0,
                to: data.to || 0,
            });
        } catch {
            toast.error('Failed to load QR codes');
        } finally {
            setLoadingCodes(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.last_page) {
            loadCodes(newPage);
        }
    };

    // Client-side filtering by type
    const displayedCodes = useMemo(() => {
        return myQRCodes.filter((qr) => {
            if (filterType === 'all') return true;
            return qr.type === filterType;
        });
    }, [myQRCodes, filterType]);

    const getSelectedUserName = useCallback(() => {
        if (filterUser === 'all') return 'All team members';
        const user = teamMembers.find((u) => String(u.id) === String(filterUser));
        return user ? user.name : 'Unknown User';
    }, [filterUser, teamMembers]);

    const clearUserFilter = useCallback(() => setFilterUser('all'), []);

    // Stats loading
    const loadStats = useCallback(
        async (qr: QRCodeRecord) => {
            setSelectedQR(qr);
            setLoadingStats(true);
            try {
                const params: any = {};
                if (dateRange?.from) params.start_date = dateRange.from.toISOString();
                if (dateRange?.to) params.end_date = dateRange.to.toISOString();
                const { data } = await api.get(`/qr-codes/${qr.id}`, { params });
                setScanStats(data.stats);
            } catch {
                toast.error('Failed to load stats');
            } finally {
                setLoadingStats(false);
            }
        },
        [dateRange]
    );

    // Reload stats when date range changes
    useEffect(() => {
        if (selectedQR) {
            loadStats(selectedQR);
        }
    }, [dateRange, selectedQR, loadStats]);

    const goBackToList = useCallback(() => {
        setSelectedQR(null);
        setScanStats(null);
    }, []);

    const handleEdit = useCallback((qr: QRCodeRecord) => {
        navigate(`/apps/qr-code/edit/${qr.id}`);
    }, [navigate]);

    // Delete handlers
    const confirmDeleteQR = useCallback((id: number) => {
        setDeleteTargetId(id);
        setDeleteModalOpen(true);
    }, []);

    const deleteQR = async () => {
        if (!deleteTargetId || deletingQRId) return;
        const id = deleteTargetId;
        setDeletingQRId(id);
        try {
            await api.delete(`/qr-codes/${id}`);
            toast.success('Deleted');
            setMyQRCodes((prev) => prev.filter((q) => q.id !== id));
            // If current page becomes empty, go to previous page
            if (myQRCodes.length === 1 && pagination.current_page > 1) {
                loadCodes(pagination.current_page - 1);
            } else if (myQRCodes.length === 1) {
                loadCodes(1);
            }
            if (selectedQR?.id === id) goBackToList();
            if (previewQR?.id === id) setPreviewQR(null);
            setDeleteModalOpen(false);
        } catch {
            toast.error('Failed to delete');
        } finally {
            setDeletingQRId(null);
            setDeleteTargetId(null);
        }
    };

    // If stats view is active, render StatsView
    if (selectedQR) {
        return (
            <StatsView
                qr={selectedQR}
                stats={scanStats}
                loading={loadingStats}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                onBack={goBackToList}
            />
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-sm">
                        <IconQrcode size={24} className="text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">My QR Codes</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {pagination.total} saved QR codes
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {/* Settings Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-10 w-10">
                                <IconSettings size={20} className="text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                Default View
                            </div>
                            <DropdownMenuItem onClick={() => {
                                localStorage.setItem('qr_view_mode', 'list');
                                toast.success('Default view set to List');
                            }}>
                                <IconList size={14} className="mr-2" />
                                Always use List View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                                localStorage.setItem('qr_view_mode', 'grid');
                                toast.success('Default view set to Grid');
                            }}>
                                <IconLayoutGrid size={14} className="mr-2" />
                                Always use Grid View
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Tabs defaultValue={viewMode} value={viewMode} onValueChange={(v) => handleViewModeChange(v as 'grid' | 'list')} className="w-auto">
                        <TabsList className="grid w-full grid-cols-2 h-10 border bg-background">
                            <TabsTrigger value="list" aria-label="List view" className='data-[state=active]:bg-primary data-[state=active]:text-primary-foreground' >
                                <IconList size={18} />
                            </TabsTrigger>
                            <TabsTrigger value="grid" aria-label="Grid view" className='data-[state=active]:bg-primary data-[state=active]:text-primary-foreground' >
                                <IconLayoutGrid size={18} />
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <Button onClick={() => navigate('/apps/qr-code/create')} className="gap-2">
                        <IconPlus size={16} /> <span className="hidden sm:inline">Create QR</span>
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <QRCodeFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filterType={filterType}
                onTypeChange={setFilterType}
                filterUser={filterUser}
                onUserChange={setFilterUser}
                onUserClear={clearUserFilter}
                teamMembers={teamMembers}
                selectedUserName={getSelectedUserName()}
            />

            {/* Content */}
            {loadingCodes ? (
                <QRCodeListSkeleton viewMode={viewMode} />
            ) : displayedCodes.length === 0 ? (
                <EmptyState />
            ) : viewMode === 'list' ? (
                <QRCodeListTable
                    codes={displayedCodes}
                    onPreview={setPreviewQR}
                    onStats={loadStats}
                    onEdit={handleEdit}
                    onDelete={confirmDeleteQR}
                />
            ) : (
                <QRCodeGrid
                    codes={displayedCodes}
                    onPreview={setPreviewQR}
                    onStats={loadStats}
                    onEdit={handleEdit}
                    onDelete={confirmDeleteQR}
                />
            )}

            {/* Pagination */}
            <PaginationControls pagination={pagination} onPageChange={handlePageChange} />

            {/* Preview Modal */}
            <PreviewModal qr={previewQR} onClose={() => setPreviewQR(null)} />

            {/* Delete Modal */}
            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                onConfirm={deleteQR}
                title="Delete QR Code"
                message="Are you sure you want to delete this QR code? This action cannot be undone."
                isLoading={!!deletingQRId}
            />
        </div>
    );
};

export default QRCodeList;