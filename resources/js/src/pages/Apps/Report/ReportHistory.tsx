import { useEffect, useState, useMemo, Fragment } from 'react';
import usePermission from '../../../hooks/usePermission';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import toast, { Toaster } from 'react-hot-toast';
import Tippy from '@tippyjs/react';
import { useTranslation } from 'react-i18next';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';
import 'tippy.js/animations/shift-away.css';
import 'tippy.js/animations/shift-toward.css';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  PaginationState,
  SortingState,
} from '@tanstack/react-table';
import {
  IconSearch,
  IconPointer,
  IconBookmark,
  IconBrandFacebook,
  IconBrandTiktok,
  IconFileAnalytics,
  IconX,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconCheck,
  IconCalendar,
  IconChevronsLeft,
  IconChevronsRight,
  IconUser,
  IconChevronDown,
  IconArrowUpRight,
  IconArrowDownRight,
  IconDownload,
  IconTrendingUp,
  IconWorld,
  IconTrophy,
  IconUsers,
  IconFlame,
  IconChartBarPopular,
  IconChartBarOff,
  IconFilter,
  IconFilterOff
} from '@tabler/icons-react';
import DeleteModal from '../../../components/DeleteModal';

// --- SHADCN UI ---
import { DateRangePicker } from '../../../components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { Card, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { Checkbox } from '../../../components/ui/checkbox';
import { Separator } from '../../../components/ui/separator';
import { Label } from '../../../components/ui/label';
import { Search, X, SlidersHorizontal } from 'lucide-react';

type CanProps = {
  when: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

const Can = ({ when, children, fallback = null }: CanProps) => {
  if (!when) return <>{fallback}</>;
  return <>{children}</>;
};

const ReportHistory = () => {
  const { t, i18n } = useTranslation();
  const { t: tTime } = useTranslation(undefined, { keyPrefix: 'time' });
  const { t: tToast } = useTranslation(undefined, { keyPrefix: 'toast' });
  const { t: tLink } = useTranslation(undefined, { keyPrefix: 'link' });
  const { t: tButton } = useTranslation(undefined, { keyPrefix: 'button' });
  const { t: tSpan } = useTranslation(undefined, { keyPrefix: 'span' });
  const { t: tTitle } = useTranslation(undefined, { keyPrefix: 'title' });
  const { can } = usePermission();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // --- SERVER SIDE STATE ---
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const [search, setSearch] = useState('');

  // ✅ NEW STATE for User Filter
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isAdminOrOwner, setIsAdminOrOwner] = useState(false);

  // Table State
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // --- DATE FILTER STATE ---
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Utils
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal State
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<'all' | 'facebook' | 'tiktok'>('all');
  const [hasFetchedTeam, setHasFetchedTeam] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | number | null>(null);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [showTopPerformers, setShowTopPerformers] = useState(false);
  // const [isTeamMembersLoading, setIsTeamMembersLoading] = useState(true);


  const [isFilterPanelVisible, setIsFilterPanelVisible] = useState(() => {
    // Initialize from localStorage, default to true
    const saved = localStorage.getItem('pageHistory_filterPanelVisible');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('pageHistory_filterPanelVisible', JSON.stringify(isFilterPanelVisible));
  }, [isFilterPanelVisible]);


  const getActiveFilterCount = () => {
    let count = 0;

    if (selectedUsers.length > 0) count++;
    if (platformFilter !== 'all') count++;
    if (dateRange?.from) count++;
    if (search.trim() !== '') count++;

    return count;
  };

  useEffect(() => {
    dispatch(setPageTitle('Report History'));
  }, [dispatch]);

  const isTeamMembersLoading = teamMembers.length === 0;




  useEffect(() => {
    const fetchTeamAndPermissions = async () => {
      try {
        const res = await api.get('/team/my-team');
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

        // Check permissions for Dara or Thida
        if (res.data.is_owner || res.data.is_admin || can('view all team reports')) {
          setIsAdminOrOwner(true);

          // Filter out current user from members to avoid duplicate "Me"
          const otherMembers = (res.data.members || []).filter((m: any) => m.id !== currentUser.id);

          setTeamMembers([
            { id: 'me', name: 'My Reports (Me)' }, // The clean "Me" option
            ...otherMembers.map((m: any) => ({ id: m.id, name: m.name }))
          ]);
        }
      } catch (e) {
        console.error("Failed to load team data", e);
      }
    };

    fetchTeamAndPermissions();
  }, []);

  const [loadingTop, setLoadingTop] = useState<boolean>(true);

  useEffect(() => {
    const fetchTopPerformers = async () => {
      try {
        setLoadingTop(true);
        const response = await api.get('/reports/top-performers');

        // ✅ Safety Check: Ensure we are setting an array
        const data = Array.isArray(response.data) ? response.data : [];
        setTopPerformers(data);

      } catch (error) {
        console.error("Failed to fetch top performers:", error);
        setTopPerformers([]); // Fallback to empty array on error
      } finally {
        setLoadingTop(false);
      }
    };

    fetchTopPerformers();
  }, []);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const sortField = sorting.length > 0 ? sorting[0].id : 'created_at';
        const sortDirection = sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : 'desc';

        let startStr = '';
        let endStr = '';
        if (dateRange?.from) {
          const d1 = dateRange.from;
          const d2 = dateRange.to || dateRange.from;
          startStr = `${d1.getFullYear()}-${String(d1.getMonth() + 1).padStart(2, '0')}-${String(d1.getDate()).padStart(2, '0')}`;
          endStr = `${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, '0')}-${String(d2.getDate()).padStart(2, '0')}`;
        }

        // Map selectedUsers objects to a comma-separated string
        const userIdsParam = selectedUsers && selectedUsers.length > 0
          ? selectedUsers.map(u => u.id).join(',')
          : undefined;

        const response = await api.get('/reports/history', {
          params: {
            page: pagination.pageIndex + 1,
            per_page: pagination.pageSize,
            search: globalFilter,
            sort_by: sortField,
            sort_dir: sortDirection,
            start_date: startStr || undefined,
            end_date: endStr || undefined,
            platform: platformFilter !== 'all' ? platformFilter : undefined,
            user_ids: userIdsParam // ✅ Corrected plural parameter
          },
          headers: { Authorization: `Bearer ${token}` }
        });

        setData(response.data.data || []);
        setRowCount(response.data.total || 0);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load history.');
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchReports();
    }, 300);

    return () => clearTimeout(timeoutId);

  }, [pagination.pageIndex, pagination.pageSize, sorting, globalFilter, refreshKey, dateRange, platformFilter, selectedUsers]); // ✅ Proper dependency

  // --- ACTIONS ---
  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };


  const executeDelete = async () => {
    if (!deleteId) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/reports/${deleteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Report deleted successfully');
      setRefreshKey(prev => prev + 1);
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    } catch (error) {
      toast.error('Failed to delete report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateToGenerator = (report: any) => {
    const targetPath = report.platform === 'facebook'
      ? '/apps/report/facebook-report-generator'
      : '/apps/report/tiktok-report-generator';

    navigate(targetPath, {
      state: {
        preloadedData: report.report_data,
        pageName: report.page?.name || 'Unknown Page',
        backPath: '/apps/report/history',
        currentReportId: report.id
      }
    });
  };

  // --- HELPER: FORMAT DATE ---
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).replace(/ /g, '-');
    } catch (e) {
      return dateString;
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        platform: platformFilter || 'all',
        search: globalFilter || '',
        page_id: selectedPageId?.toString() || '',
        start_date: dateRange?.start || '',
        end_date: dateRange?.end || ''
      });

      // Use axios/api instance to include your Bearer Token automatically
      const response = await api.get(`/reports/export?${params.toString()}`, {
        responseType: 'blob',
      });

      // Create a local URL for the downloaded blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reports-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Export failed", error);
    }
  };

  // --- COLUMNS ---
  const columnHelper = createColumnHelper<any>();
  const columns = useMemo(() => [
    columnHelper.display({
      id: 'rowNumber',
      header: '#',
      cell: info => <span className="text-gray-500 font-semibold text-xs">{(pagination.pageIndex * pagination.pageSize) + info.row.index + 1}</span>,
    }),
    columnHelper.accessor('page.name', {
      id: 'page_name',
      header: 'Page / Client',
      enableSorting: true,
      cell: info => (
        <div className="flex flex-col">
          <span className="font-bold text-gray-800 dark:text-gray-200">
            {info.getValue() || 'Unknown Page'}
          </span>
          <span className="text-[11px] text-gray-400 mt-0.5">
            Created: {formatDate(info.row.original.created_at)}
          </span>
          {isAdminOrOwner && info.row.original.user && (
            <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300 flex items-center gap-1 w-fit mt-1">
              <IconUser size={10} />
              {info.row.original.user.name}
            </span>
          )}
        </div>
      ),
    }),
    columnHelper.accessor('platform', {
      header: 'Platform',
      enableSorting: true,
      cell: info => {
        const val = info.getValue();
        const isFb = val === 'facebook';
        return (
          <span className={`badge flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-md border ${isFb
            ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
            : 'bg-black text-white border-gray-900 dark:bg-gray-800 dark:border-gray-600'
            }`}>
            <span className="capitalize font-semibold text-xs">{val}</span>
          </span>
        );
      },
    }),
    columnHelper.accessor('total_views', {
      id: 'total_views', // ✅ Matches database column for sorting
      header: 'Total Views',
      enableSorting: true,
      cell: info => (
        <span className="font-bold text-base text-gray-800 dark:text-white">
          {Number(info.getValue() || 0).toLocaleString()}
        </span>
      ),
    }),
    columnHelper.accessor('engagement_rate', {
      header: 'Eng. Rate / Trend',
      enableSorting: true,
      cell: info => {
        const er = parseFloat(info.getValue() || 0);
        const row = info.row.original;
        const platform = row.platform;
        const isFb = platform === 'facebook';

        // 1. Benchmarks & Formulas
        const formula = isFb
          ? "(Reactions + Comments + Shares) / Reach"
          : "(Likes + Comments + Shares + Saves) / Views";

        const benchmarks = isFb
          ? "Excellent: >3% | Good: 1-3% | Low: <1%"
          : "Excellent: >6% | Good: 3-6% | Low: <3%";

        // 1. Calculations with TypeScript safety
        const rawHistoricalAvg = row.historical_avg;
        const historicalAvg = rawHistoricalAvg !== null ? parseFloat(rawHistoricalAvg) : null;

        // Initialize variables as null
        let diff: number | null = null;
        let growthRate: number = 0;

        // ✅ Check if historicalAvg is a valid number before doing math
        if (historicalAvg !== null) {
          diff = parseFloat((er - historicalAvg).toFixed(2));
          growthRate = historicalAvg > 0 ? ((er - historicalAvg) / historicalAvg) * 100 : 0;
        }

        // 3. Conditional Color Logic
        const colorClass = isFb
          ? (er >= 3 ? 'text-emerald-700 bg-emerald-100 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20' : er >= 1 ? 'text-amber-700 bg-amber-100 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20' : 'text-rose-700 bg-rose-100 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20')
          : (er >= 6 ? 'text-emerald-700 bg-emerald-100 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20' : er >= 3 ? 'text-amber-700 bg-amber-100 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20' : 'text-rose-700 bg-rose-100 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20');

        return (
          <Tippy
            content={
              <div className="p-2 text-[11px] leading-relaxed min-w-[200px]
            rounded-md shadow-lg border
            bg-white text-gray-800 border-gray-200
            dark:bg-[#0f172a] dark:text-gray-200 dark:border-white/10">
                <p className="font-bold border-b border-gray-200 dark:border-white/10 pb-1 mb-2">Performance Insights</p>
                <p className="mb-1"><span className="text-gray-400">Formula:</span> {formula}</p>
                <p className="mb-2"><span className="text-gray-400">Benchmarks:</span> {benchmarks}</p>

                {diff !== null && diff !== 0 ? (
                  <div className={`mt-2 pt-2 border-t border-white/10 space-y-1.5 ${diff > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    <p className="flex justify-between items-center">
                      <span className="text-gray-400">Baseline:</span>
                      <span className="font-medium text-gray-400">Last 5 Reports (Avg)</span>
                    </p>
                    <p className="flex justify-between items-center">
                      <span className="text-gray-400">Trend:</span>
                      <span className="font-bold uppercase tracking-wider">{diff > 0 ? 'Improving ↑' : 'Declining ↓'}</span>
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="bg-gray-100 dark:bg-white/5 p-1.5 rounded text-center">
                        <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase">Point Diff</p>
                        <p className="text-xs font-bold">{diff > 0 ? '+' : ''}{diff}%</p>
                      </div>
                      <div className="bg-gray-100 dark:bg-white/5 p-1.5 rounded text-center">
                        <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase">Growth Rate</p>
                        <p className="text-xs font-bold">{growthRate > 0 ? '+' : ''}{growthRate.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                ) : (<p className="text-gray-400 italic mt-1">No historical data for comparison yet.</p>)}
              </div>
            }
            animation="scale"
            duration={300}
            placement='left'
            className="!bg-transparent !p-0"
            interactive
            hideOnClick
            delay={[100, 50]}
          >
            <div className="flex flex-col gap-1 cursor-help group">
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded border text-xs font-bold w-fit ${colorClass}`}>
                  {er.toFixed(2)}%
                </span>

                {diff !== null && diff !== 0 && (
                  <span className={diff > 0 ? 'text-emerald-500 animate-pulse' : 'text-rose-500'}>
                    {diff > 0 ? <IconArrowUpRight size={14} /> : <IconArrowDownRight size={14} />}
                  </span>
                )}
              </div>
              <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider group-hover:text-primary transition-colors">
                {isFb ? 'vs Reach' : 'vs Views'}
              </span>
            </div>
          </Tippy>
        );
      }
    }),
    columnHelper.display({
      id: 'platform_metrics',
      header: 'Specific Metrics',
      cell: info => {
        const row = info.row.original;
        const isFb = row.platform === 'facebook';
        // Use total_link_clicks for FB and total_saves for TikTok
        const val = isFb ? row.total_link_clicks : row.total_saves;
        const label = isFb ? 'Link Clicks' : 'Saves';
        const icon = isFb ? <IconPointer size={12} /> : <IconBookmark size={12} />;

        return (
          <div className="flex flex-col text-xs">
            <div className="flex items-center gap-1 text-gray-400 uppercase font-bold text-[10px]">
              {icon} {label}
            </div>
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {Number(val || 0).toLocaleString()}
            </span>
          </div>
        );
      }
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: info => (
        <div className="flex items-center justify-center gap-2">
          <Tippy content={<span className="text-xs"  >{tButton('preview')}</span>}
            animation="shift-away"
            duration={200}

          >
            <button
              className="block p-2 rounded-full text-amber-600 bg-white-light/20 dark:bg-dark/10 hover:bg-white-light/90 dark:hover:bg-dark/20"
              onClick={() => { setSelectedReport(info.row.original); setIsModalOpen(true); }}

            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g opacity="0.5">
                  <path d="M14 2.75C15.9068 2.75 17.2615 2.75159 18.2892 2.88976C19.2952 3.02503 19.8749 3.27869 20.2981 3.7019C20.7852 4.18904 20.9973 4.56666 21.1147 5.23984C21.2471 5.9986 21.25 7.08092 21.25 9C21.25 9.41422 21.5858 9.75 22 9.75C22.4142 9.75 22.75 9.41422 22.75 9L22.75 8.90369C22.7501 7.1045 22.7501 5.88571 22.5924 4.98199C22.417 3.97665 22.0432 3.32568 21.3588 2.64124C20.6104 1.89288 19.6615 1.56076 18.489 1.40314C17.3498 1.24997 15.8942 1.24998 14.0564 1.25H14C13.5858 1.25 13.25 1.58579 13.25 2C13.25 2.41421 13.5858 2.75 14 2.75Z" fill="currentColor" />
                  <path d="M2.00001 14.25C2.41422 14.25 2.75001 14.5858 2.75001 15C2.75001 16.9191 2.75289 18.0014 2.88529 18.7602C3.00275 19.4333 3.21477 19.811 3.70191 20.2981C4.12512 20.7213 4.70476 20.975 5.71085 21.1102C6.73852 21.2484 8.09318 21.25 10 21.25C10.4142 21.25 10.75 21.5858 10.75 22C10.75 22.4142 10.4142 22.75 10 22.75H9.94359C8.10583 22.75 6.6502 22.75 5.51098 22.5969C4.33856 22.4392 3.38961 22.1071 2.64125 21.3588C1.95681 20.6743 1.58304 20.0233 1.40762 19.018C1.24992 18.1143 1.24995 16.8955 1.25 15.0964L1.25001 15C1.25001 14.5858 1.58579 14.25 2.00001 14.25Z" fill="currentColor" />
                  <path d="M22 14.25C22.4142 14.25 22.75 14.5858 22.75 15L22.75 15.0963C22.7501 16.8955 22.7501 18.1143 22.5924 19.018C22.417 20.0233 22.0432 20.6743 21.3588 21.3588C20.6104 22.1071 19.6615 22.4392 18.489 22.5969C17.3498 22.75 15.8942 22.75 14.0564 22.75H14C13.5858 22.75 13.25 22.4142 13.25 22C13.25 21.5858 13.5858 21.25 14 21.25C15.9068 21.25 17.2615 21.2484 18.2892 21.1102C19.2952 20.975 19.8749 20.7213 20.2981 20.2981C20.7852 19.811 20.9973 19.4333 21.1147 18.7602C21.2471 18.0014 21.25 16.9191 21.25 15C21.25 14.5858 21.5858 14.25 22 14.25Z" fill="currentColor" />
                  <path d="M9.94359 1.25H10C10.4142 1.25 10.75 1.58579 10.75 2C10.75 2.41421 10.4142 2.75 10 2.75C8.09319 2.75 6.73852 2.75159 5.71085 2.88976C4.70476 3.02503 4.12512 3.27869 3.70191 3.7019C3.21477 4.18904 3.00275 4.56666 2.88529 5.23984C2.75289 5.9986 2.75001 7.08092 2.75001 9C2.75001 9.41422 2.41422 9.75 2.00001 9.75C1.58579 9.75 1.25001 9.41422 1.25001 9L1.25 8.90369C1.24995 7.10453 1.24992 5.8857 1.40762 4.98199C1.58304 3.97665 1.95681 3.32568 2.64125 2.64124C3.38961 1.89288 4.33856 1.56076 5.51098 1.40314C6.65019 1.24997 8.10584 1.24998 9.94359 1.25Z" fill="currentColor" />
                </g>
                <path d="M12 10.75C11.3096 10.75 10.75 11.3096 10.75 12C10.75 12.6904 11.3096 13.25 12 13.25C12.6904 13.25 13.25 12.6904 13.25 12C13.25 11.3096 12.6904 10.75 12 10.75Z" fill="currentColor" />
                <path fill-rule="evenodd" clip-rule="evenodd" d="M5.89243 14.0598C5.29747 13.3697 5 13.0246 5 12C5 10.9754 5.29748 10.6303 5.89242 9.94021C7.08037 8.56222 9.07268 7 12 7C14.9273 7 16.9196 8.56222 18.1076 9.94021C18.7025 10.6303 19 10.9754 19 12C19 13.0246 18.7025 13.3697 18.1076 14.0598C16.9196 15.4378 14.9273 17 12 17C9.07268 17 7.08038 15.4378 5.89243 14.0598ZM9.25 12C9.25 10.4812 10.4812 9.25 12 9.25C13.5188 9.25 14.75 10.4812 14.75 12C14.75 13.5188 13.5188 14.75 12 14.75C10.4812 14.75 9.25 13.5188 9.25 12Z" fill="currentColor" />
              </svg>

            </button>
          </Tippy>
          <Tippy content={<span className="text-xs">{tButton('view_full_report')}</span>}
            animation="shift-away"
            duration={200}>
            <button
              className="block p-2 rounded-full text-sky-600 bg-white-light/20 dark:bg-dark/10 hover:bg-white-light/90 dark:hover:bg-dark/20"
              onClick={() => navigateToGenerator(info.row.original)}>

              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.29289 9.29289C3 9.58579 3 10.0572 3 11V17C3 17.9428 3 18.4142 3.29289 18.7071C3.58579 19 4.05719 19 5 19C5.94281 19 6.41421 19 6.70711 18.7071C7 18.4142 7 17.9428 7 17V11C7 10.0572 7 9.58579 6.70711 9.29289C6.41421 9 5.94281 9 5 9C4.05719 9 3.58579 9 3.29289 9.29289Z" fill="currentColor" />
                <path opacity="0.4" d="M17.2929 2.29289C17 2.58579 17 3.05719 17 4V17C17 17.9428 17 18.4142 17.2929 18.7071C17.5858 19 18.0572 19 19 19C19.9428 19 20.4142 19 20.7071 18.7071C21 18.4142 21 17.9428 21 17V4C21 3.05719 21 2.58579 20.7071 2.29289C20.4142 2 19.9428 2 19 2C18.0572 2 17.5858 2 17.2929 2.29289Z" fill="currentColor" />
                <path opacity="0.7" d="M10 7C10 6.05719 10 5.58579 10.2929 5.29289C10.5858 5 11.0572 5 12 5C12.9428 5 13.4142 5 13.7071 5.29289C14 5.58579 14 6.05719 14 7V17C14 17.9428 14 18.4142 13.7071 18.7071C13.4142 19 12.9428 19 12 19C11.0572 19 10.5858 19 10.2929 18.7071C10 18.4142 10 17.9428 10 17V7Z" fill="currentColor" />
                <path d="M3 21.25C2.58579 21.25 2.25 21.5858 2.25 22C2.25 22.4142 2.58579 22.75 3 22.75H21C21.4142 22.75 21.75 22.4142 21.75 22C21.75 21.5858 21.4142 21.25 21 21.25H3Z" fill="currentColor" />
              </svg>

            </button>
          </Tippy>

          <Tippy content={<span className="text-xs">{tButton('delete_report')}</span>}
            animation="shift-away"
            duration={200}>
            <button
              className="block p-2 rounded-full text-red-600 bg-white-light/20 dark:bg-dark/10 hover:bg-white-light/90 dark:hover:bg-dark/20"
              onClick={() => handleDeleteClick(info.row.original.id)}
              title="Delete Report"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path opacity="0.5" d="M9.17065 4C9.58249 2.83481 10.6937 2 11.9999 2C13.3062 2 14.4174 2.83481 14.8292 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><path d="M20.5001 6H3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><path d="M18.8334 8.5L18.3735 15.3991C18.1965 18.054 18.108 19.3815 17.243 20.1907C16.378 21 15.0476 21 12.3868 21H11.6134C8.9526 21 7.6222 21 6.75719 20.1907C5.89218 19.3815 5.80368 18.054 5.62669 15.3991L5.16675 8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><path opacity="0.5" d="M9.5 11L10 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><path opacity="0.5" d="M14.5 11L14 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path></svg>
            </button>
          </Tippy>
        </div>
      ),
    }),
  ], [pagination.pageIndex, pagination.pageSize, isAdminOrOwner, sorting]);

  const table = useReactTable({
    data,
    columns,
    state: { pagination, sorting, globalFilter },
    pageCount: Math.ceil(rowCount / pagination.pageSize),
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      {/* --- HEADER TOOLBAR --- */}
      {/* --- REPORT HISTORY HEADER --- */}
      <div className="mb-8 space-y-6">
        {/* Main Header Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Left: Title Section */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <IconFileAnalytics size={22} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Report History</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track, filter, and manage all generated reports</p>
            </div>
          </div>

          {/* Right: View Toggle and Actions */}
          <div className="flex items-center gap-2">
            {/* Top Performers Toggle */}
            <div className="flex items-center gap-2">

              <button
                onClick={() => setIsFilterPanelVisible(!isFilterPanelVisible)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${isFilterPanelVisible
                  ? 'bg-primary/10 text-primary hover:bg-primary/20'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                title={isFilterPanelVisible ? "Hide filters" : "Show filters"}
              >
                {isFilterPanelVisible ? (
                  <>
                    <IconFilterOff size={18} />
                    <span className="text-sm font-medium hidden sm:inline">Hide Filters</span>
                  </>
                ) : (
                  <>
                    <IconFilter size={18} />
                    <span className="text-sm font-medium hidden sm:inline">Show Filters</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowTopPerformers(!showTopPerformers)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${showTopPerformers
                  ? 'bg-primary/10 text-primary hover:bg-primary/20'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                title={showTopPerformers ? "Hide filters" : "Show filters"}
              >
                {showTopPerformers ? (
                  <>
                    <IconChartBarOff size={18} />
                    <span className="text-sm font-medium hidden sm:inline">Hide Top Performers</span>
                  </>
                ) : (
                  <>
                    <IconChartBarPopular size={18} />
                    <span className="text-sm font-medium hidden sm:inline">Show Top Perfomers</span>
                  </>
                )}
              </button>


            </div>

            {/* Export Button */}
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <IconDownload size={18} />
              {tButton('export_csv')}
            </button>
          </div>
        </div>

        {/* Unified Filter Bar */}
        {isFilterPanelVisible && (
          <Card className="overflow-hidden border-border/60 shadow-sm">
            <CardContent className="p-0">
              {/* Filter Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30">
                <div className="flex items-center gap-2.5">
                  <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">Filters</span>
                  {getActiveFilterCount() > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-semibold">
                      {getActiveFilterCount()} active
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                  onClick={() => {
                    setSelectedUsers([]);
                    setPlatformFilter('all');
                    setDateRange(undefined);
                    setGlobalFilter('');
                    setPagination(p => ({ ...p, pageIndex: 0 }));
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                  Clear all
                </Button>
              </div>

              {/* Filter Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 p-5">

                <Can when={isAdminOrOwner || can('view all team reports')}>
                  {/* Skeleton */}
                  {isTeamMembersLoading && (
                    <div className="space-y-2">
                      <div className="h-4 w-28 rounded bg-muted animate-pulse" />
                      <div className="w-full h-10 rounded-md border bg-muted animate-pulse" />
                    </div>
                  )}
                  {/* Team Members Filter - Popover + Checkbox */}
                  {!isTeamMembersLoading && teamMembers.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <IconUsers size={13} />
                        Team Members
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between h-10 font-normal text-sm"
                          >
                            <span className="truncate text-left">
                              {selectedUsers.length === 0
                                ? 'All team members'
                                : selectedUsers.length === 1
                                  ? selectedUsers[0].name
                                  : `${selectedUsers.length} members selected`
                              }
                            </span>
                            <IconChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[240px] p-0" align="start">
                          <div className="flex items-center justify-between px-3 py-2.5 border-b">
                            <span className="text-xs font-semibold text-muted-foreground">Select members</span>
                            {selectedUsers.length > 0 && (
                              <button
                                onClick={() => setSelectedUsers([])}
                                className="text-xs text-primary hover:text-primary/80 font-medium"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                          <div className="max-h-56 overflow-y-auto p-1">
                            {teamMembers.map((member) => {
                              const isSelected = selectedUsers.some((u: any) => u.id === member.id);
                              return (
                                <div
                                  key={member.id}
                                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
                                  onClick={() => {
                                    const newSelection = isSelected
                                      ? selectedUsers.filter((u: any) => u.id !== member.id)
                                      : [...selectedUsers, member];
                                    setSelectedUsers(newSelection);
                                    setPagination(p => ({ ...p, pageIndex: 0 }));
                                  }}
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    className="pointer-events-none"
                                  />
                                  <span className={`text-sm truncate ${isSelected ? 'font-medium' : ''}`}>
                                    {member.name}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </Can>


                {/* Platform Filter */}
                {can('generate facebook report') && can('generate tiktok report') && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <IconWorld size={13} />
                      Platform
                    </Label>
                    <div className="inline-flex w-full rounded-lg border bg-muted/40 p-1">
                      <Button
                        variant={platformFilter === 'all' ? 'secondary' : 'ghost'}
                        size="sm"
                        className={`flex-1 h-8 gap-1.5 text-xs font-medium transition-all ${platformFilter === 'all'
                            ? 'shadow-sm bg-background text-primary hover:bg-background'
                            : 'text-muted-foreground hover:text-foreground'
                          }`}
                        onClick={() => { setPlatformFilter('all'); setPagination(p => ({ ...p, pageIndex: 0 })); }}
                      >
                        <IconWorld size={13} />
                        All
                      </Button>
                      <Button
                        variant={platformFilter === 'facebook' ? 'secondary' : 'ghost'}
                        size="sm"
                        className={`flex-1 h-8 gap-1.5 text-xs font-medium transition-all ${platformFilter === 'facebook'
                            ? 'shadow-sm bg-background text-[#1877F2] hover:bg-background'
                            : 'text-muted-foreground hover:text-[#1877F2]'
                          }`}
                        onClick={() => { setPlatformFilter('facebook'); setPagination(p => ({ ...p, pageIndex: 0 })); }}
                      >
                        <IconBrandFacebook size={13} />
                        FB
                      </Button>
                      <Button
                        variant={platformFilter === 'tiktok' ? 'secondary' : 'ghost'}
                        size="sm"
                        className={`flex-1 h-8 gap-1.5 text-xs font-medium transition-all ${platformFilter === 'tiktok'
                            ? 'shadow-sm bg-background text-foreground hover:bg-background'
                            : 'text-muted-foreground hover:text-foreground'
                          }`}
                        onClick={() => { setPlatformFilter('tiktok'); setPagination(p => ({ ...p, pageIndex: 0 })); }}
                      >
                        <IconBrandTiktok size={13} />
                        TT
                      </Button>
                    </div>
                  </div>
                )}

                {/* Date Range */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <IconCalendar size={13} />
                    Date Range
                  </Label>
                  <DateRangePicker
                    value={dateRange}
                    onChange={(range) => { setDateRange(range); setPagination(p => ({ ...p, pageIndex: 0 })); }}
                    placeholder="Select date range"
                    showClear
                    align="start"
                  />
                </div>

                {/* Search */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Search className="h-3.5 w-3.5" />
                    Search
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="text"
                      placeholder="Search reports..."
                      className="pl-9 pr-9 h-10"
                      value={globalFilter ?? ''}
                      onChange={e => setGlobalFilter(e.target.value)}
                    />
                    {globalFilter && (
                      <button
                        onClick={() => setGlobalFilter('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* Top Performers Section - Only shown when toggle is ON */}
      {showTopPerformers && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-500/10 flex items-center justify-center">
                <IconTrophy size={18} className="text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Performers</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Best performing reports in the last 30 days</p>
              </div>
            </div>

            <div className="text-xs font-medium px-3 py-1.5 bg-primary/10 text-primary rounded-full">
              {loadingTop ? 'Loading...' : `${topPerformers?.length || 0} results`}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loadingTop ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              ))
            ) : Array.isArray(topPerformers) && topPerformers.length > 0 ? (
              topPerformers.map((report) => (
                <div key={report.id} className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-all duration-200 group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {report.platform === 'facebook' ? (
                          <IconBrandFacebook size={16} className="text-[#1877F2]" />
                        ) : (
                          <IconBrandTiktok size={16} className="text-black dark:text-white" />
                        )}
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          {report.page?.name || 'Unknown Page'}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                          {parseFloat(report.engagement_rate).toFixed(2)}%
                        </span>
                        <span className="text-sm font-medium text-gray-500">Engagement Rate</span>
                      </div>
                    </div>

                    <div className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-semibold ${report.growth_rate >= 50
                      ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400'
                      : 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}>
                      {report.growth_rate >= 50 && <IconFlame size={14} />}
                      <IconTrendingUp size={14} />
                      +{report.growth_rate.toFixed(1)}%
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconUser size={14} className="text-gray-400" />
                        <span className="text-xs text-gray-500">{report.created_by?.name || 'Unknown'}</span>
                      </div>
                      <div className="text-xs font-medium text-gray-500">
                        Benchmark: {parseFloat(report.historical_avg).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 py-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <IconTrophy size={24} className="text-gray-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No top performers yet</h4>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  Reports that show exceptional performance will appear here. Generate more reports to see top performers.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TABLE --- */}
      <div className="panel p-0 border-0 overflow-hidden shadow-lg rounded-lg">
        <div className="table-responsive">
          <table className="table table-hover w-full text-left">
            <thead >
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className=" !bg-white  dark:bg-[#1a2941] text-gray-800 dark:text-white-light uppercase text-xs font-bold tracking-wider border-b dark:border-gray-700 ">
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className={`p-4 ${header.column.getCanSort() ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: <IconChevronUp size={14} className="text-primary" />,
                          desc: <IconChevronUp size={14} className="text-primary rotate-180" />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="p-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <span className="animate-spin border-4 border-primary border-l-transparent rounded-full w-10 h-10"></span>
                      <span className="text-gray-500 font-medium">Loading records...</span>
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                (() => {
                  // ✅ LOGIC FIX: Check if ANY filter is active
                  const isAnyFilterActive =
                    globalFilter ||
                    (dateRange && dateRange.length > 0) ||
                    platformFilter !== 'all';

                  return isAnyFilterActive ? (
                    // CASE 2: FILTERED RESULT IS EMPTY (Date, Search, or Platform found nothing)
                    <tr>
                      <td colSpan={columns.length} className="p-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-full mb-4">
                            <IconSearch size={48} className="text-orange-500" />
                          </div>
                          <h5 className="font-bold text-xl text-gray-800 dark:text-gray-200 mb-2">No Results Found</h5>
                          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                            We couldn't find any reports matching your current filters.
                            <br />Try adjusting the date range or platform.
                          </p>
                          <button
                            onClick={() => {
                              setPlatformFilter('all');
                              setDateRange(null);
                              setGlobalFilter('');
                              setPagination(p => ({ ...p, pageIndex: 0 }));
                            }}
                            className="btn btn-outline-danger btn-sm px-6"
                          >
                            <IconX size={16} className="mr-2" />
                            Clear All Filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    // CASE 1: TRULY EMPTY (User has 0 reports total)
                    <tr>
                      <td colSpan={columns.length} className="p-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="bg-gray-50 dark:bg-[#1b2e4b] p-6 rounded-full mb-4 animate-pulse">
                            <IconFileAnalytics size={48} className="text-gray-400 dark:text-gray-500" />
                          </div>
                          <h5 className="font-bold text-xl text-gray-800 dark:text-gray-200 mb-2">No Reports Generated Yet</h5>
                          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                            It looks like you haven't generated any reports. Start by analyzing a Facebook or TikTok file.
                          </p>
                          <div className="flex flex-row gap-4">
                            <button
                              onClick={() => navigate('/apps/report/facebook-report-generator')}
                              className="btn btn-sm btn-outline-primary"
                            >
                              Generate Facebook Report
                            </button>
                            <button
                              onClick={() => navigate('/apps/report/tiktok-report-generator')}
                              className="btn btn-sm btn-outline-primary"
                            >
                              Generate TikTok Report
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })()
              ) : (
                // DATA ROWS
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-[#1b2e4b] transition-colors group">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="p-4 group-hover:text-primary transition-colors">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- FOOTER PAGINATION --- */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-6 py-5 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/50 dark:to-gray-900/50 rounded-b-xl">

          {/* Left section: Rows per page + Info */}
          <div className="flex items-center gap-6">
            {/* Rows per page selector */}
            <div className="flex items-center gap-3">
              <div className="relative w-20">
                <Listbox value={table.getState().pagination.pageSize} onChange={(value) => table.setPageSize(Number(value))}>
                  <div className="relative">
                    <Listbox.Button className="relative w-full cursor-pointer rounded-md bg-white dark:bg-gray-700 py-1.5 pl-3 pr-8 text-left shadow-sm border border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                      <span className="block truncate font-semibold text-gray-900 dark:text-white">{table.getState().pagination.pageSize}</span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <IconChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </span>
                    </Listbox.Button>
                    <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                      <Listbox.Options className="absolute bottom-full mb-2 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 focus:outline-none z-50">
                        {[5, 10, 20, 50, 100].map((pageSize) => (
                          <Listbox.Option
                            key={pageSize}
                            className={({ active }) =>
                              `relative cursor-pointer select-none py-2 pl-8 pr-4 transition-colors duration-150 ${active
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                : 'text-gray-900 dark:text-gray-100'
                              }`
                            }
                            value={pageSize}
                          >
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                  {pageSize}
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-blue-600 dark:text-blue-400">
                                    <IconCheck className="h-5 w-5" />
                                  </span>
                                )}
                              </>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </div>
                </Listbox>
              </div>
            </div>

            {/* Divider */}
            <div className="sm:block h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

            {/* Showing entries info */}
            <span className=" sm:inline text-sm text-gray-600 dark:text-gray-400">
              Showing{' '}
              <span className="font-bold text-gray-900 dark:text-white">
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
              </span>
              {' '}-{' '}
              <span className="font-bold text-gray-900 dark:text-white">
                {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, rowCount)}
              </span>
              {' '}of{' '}
              <span className="font-bold text-gray-900 dark:text-white">
                {rowCount}
              </span>
            </span>
          </div>

          {/* Right section: Navigation */}
          <div className="flex items-center gap-2">
            {/* First page */}
            <Tippy content={<span className="text-xs">First Page</span>}>
              <button
                type="button"
                className="p-2 rounded-md w-8 h-8 flex items-center justify-center transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent text-gray-700 dark:text-gray-300"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <IconChevronsLeft size={18} />
              </button>
            </Tippy>

            {/* Previous page */}
            <Tippy content={<span className="text-xs">Previous Page</span>}>
              <button
                type="button"
                className="p-2 rounded-md w-8 h-8 flex items-center justify-center transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent text-gray-700 dark:text-gray-300"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <IconChevronLeft size={18} />
              </button>
            </Tippy>

            {/* Page indicator */}
            <div className="px-4 py-1.5 min-w-[120px] text-center bg-white dark:bg-gray-700 rounded-md shadow-sm border border-gray-200 dark:border-gray-600">
              <span className="text-sm">
                <span className="font-semibold text-gray-900 dark:text-white">{table.getState().pagination.pageIndex + 1}</span>
                <span className="text-gray-500 dark:text-gray-400"> / {table.getPageCount()}</span>
              </span>
            </div>

            {/* Next page */}
            <Tippy
              content={<span className="text-xs">Next Page</span>}>
              <button
                type="button"
                className="p-2 rounded-md w-8 h-8 flex items-center justify-center transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent text-gray-700 dark:text-gray-300"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <IconChevronRight size={18} />
              </button>
            </Tippy>

            {/* Last page */}
            <Tippy
              content={<span className="text-xs">Last Page</span>}>
              <button
                type="button"
                className="p-2 rounded-md w-8 h-8 flex items-center justify-center transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent text-gray-700 dark:text-gray-300"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <IconChevronsRight size={18} />
              </button>
            </Tippy>

          </div>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" open={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <div className="fixed inset-0 z-[999] overflow-y-auto">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />

            {/* Modal Container */}
            <div className="flex min-h-screen items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="relative w-full max-w-4xl transform transition-all">
                  <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">

                    {/* Header with Gradient */}
                    <div className={`relative px-6 py-6 text-white overflow-hidden ${selectedReport?.platform === 'facebook'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                      : selectedReport?.platform === 'tiktok'
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600'
                        : 'bg-gradient-to-r from-gray-500 to-gray-600'
                      }`}>
                      <div className="absolute inset-0 bg-black/10"></div>
                      <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                      <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

                      <div className="relative z-10">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm border transition-all duration-300 ${selectedReport?.platform === 'facebook'
                                ? 'bg-white/90 text-blue-700 border-white/30 shadow-lg shadow-blue-500/20'
                                : selectedReport?.platform === 'tiktok'
                                  ? 'bg-white/90 text-purple-700 border-white/30 shadow-lg shadow-purple-500/20'
                                  : selectedReport?.platform === 'instagram'
                                    ? 'bg-white/90 text-pink-700 border-white/30 shadow-lg shadow-pink-500/20'
                                    : selectedReport?.platform === 'youtube'
                                      ? 'bg-white/90 text-red-700 border-white/30 shadow-lg shadow-red-500/20'
                                      : 'bg-white/90 text-gray-700 border-white/30 shadow-lg'
                                }`}>
                                <span className={`h-2 w-2 rounded-full me-1 ${selectedReport?.platform === 'facebook' ? 'bg-blue-600' :
                                  selectedReport?.platform === 'tiktok' ? 'bg-purple-600' :
                                    selectedReport?.platform === 'instagram' ? 'bg-pink-600' :
                                      selectedReport?.platform === 'youtube' ? 'bg-red-600' :
                                        'bg-gray-600'
                                  }`}></span>
                                {selectedReport?.platform}
                              </span>
                            </div>
                            <h2 className="text-3xl font-bold mb-1 drop-shadow-lg">
                              {selectedReport?.page?.name || 'Unknown Page'}
                            </h2>
                            <p className="text-white/80 text-sm">Performance Overview</p>
                          </div>
                          <button
                            onClick={() => setIsModalOpen(false)}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                          >
                            <IconX className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      {selectedReport && (
                        <div className="space-y-6">

                          {/* Main Metrics Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {/* Views */}
                            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-gray-200 dark:border-gray-700">
                              <div className="relative z-10 space-y-2">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Views</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                  {(selectedReport.report_data?.kpi?.views || selectedReport.report_data?.total_views || 0).toLocaleString()}
                                </p>
                              </div>
                              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500 opacity-5 dark:opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                            </div>

                            {/* Reactions/Likes */}
                            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-gray-200 dark:border-gray-700">
                              <div className="relative z-10 space-y-2">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  {selectedReport.platform === 'facebook' ? 'Reactions' : 'Likes'}
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                  {(selectedReport.report_data?.kpi?.reactions || selectedReport.report_data?.kpi?.likes || 0).toLocaleString()}
                                </p>
                              </div>
                              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-pink-500 opacity-5 dark:opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                            </div>

                            {/* Comments */}
                            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-gray-200 dark:border-gray-700">
                              <div className="relative z-10 space-y-2">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Comments</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                  {(selectedReport.report_data?.kpi?.comments || selectedReport.report_data?.total_comments || 0).toLocaleString()}
                                </p>
                              </div>
                              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-500 opacity-5 dark:opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                            </div>

                            {/* Shares */}
                            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-gray-200 dark:border-gray-700">
                              <div className="relative z-10 space-y-2">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Shares</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                  {(selectedReport.report_data?.kpi?.shares || selectedReport.report_data?.total_shares || 0).toLocaleString()}
                                </p>
                              </div>
                              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-green-500 opacity-5 dark:opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                            </div>
                          </div>

                          {/* Secondary Metrics */}
                          <div className="grid grid-cols-2 gap-4">
                            {/* Reach (Facebook only) */}
                            {selectedReport.platform === 'facebook' && selectedReport.report_data?.kpi?.reach > 0 && (
                              <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-gray-200 dark:border-gray-700">
                                <div className="relative z-10 space-y-2">
                                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Reach</p>
                                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {selectedReport.report_data.kpi.reach.toLocaleString()}
                                  </p>
                                </div>
                                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500 opacity-5 dark:opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                              </div>
                            )}

                            {/* Link Clicks / Saves */}
                            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-gray-200 dark:border-gray-700">
                              <div className="relative z-10 space-y-2">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  {selectedReport.platform === 'tiktok' ? 'Saves' : 'Link Clicks'}
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                  {(selectedReport.report_data?.kpi?.link_clicks || selectedReport.report_data?.kpi?.saves || 0).toLocaleString()}
                                </p>
                              </div>
                              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-orange-500 opacity-5 dark:opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                            </div>

                            {/* Engagement Rate */}
                            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-gray-200 dark:border-gray-700">
                              <div className="relative z-10 space-y-2">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Engagement Rate</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                  {selectedReport.report_data?.kpi?.engagement_rate || 0}%
                                </p>
                              </div>
                              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500 opacity-5 dark:opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                              onClick={() => setIsModalOpen(false)}
                              className="px-6 py-2.5 rounded-lg font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                              Close
                            </button>
                            <button
                              onClick={() => {
                                setIsModalOpen(false);
                                navigateToGenerator(selectedReport);
                              }}
                              className={`px-6 py-2.5 rounded-lg font-medium text-white  ${selectedReport.platform === 'facebook'
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                                : selectedReport.platform === 'tiktok'
                                  ? 'bg-gradient-to-r from-pink-500 to-purple-600'
                                  : 'bg-gradient-to-r from-gray-500 to-gray-600'
                                }`}
                            >
                              View Full Report
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <DeleteModal isOpen={isDeleteModalOpen} setIsOpen={setIsDeleteModalOpen} onConfirm={executeDelete} isLoading={isSubmitting} title="Delete Report?" message="This will permanently erase the analytics data." />
    </div>
  );
};

export default ReportHistory;