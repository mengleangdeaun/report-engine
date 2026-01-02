import { useEffect, useState, useMemo, Fragment } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import api from '../../utils/api'; // ✅ Use your configured API
import { getStoragePath } from '../../utils/config';
import toast, { Toaster } from 'react-hot-toast';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { useNavigate } from 'react-router-dom'; // ✅ 1. Import Navigate
import usePermission from '../../hooks/usePermission'; 
import Tippy from '@tippyjs/react';
import { useTranslation } from 'react-i18next';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/shift-away.css';
import { 
    IconBrandFacebook, IconBrandTiktok, IconEdit, IconTrash, IconWorld, IconFilterOff, IconX,
    IconUsers, IconSearch, IconLayoutGrid, IconList, IconInfoCircle,
    IconChevronLeft, IconChevronRight, IconChevronUp, IconCheck,
    IconFileAnalytics, IconStar, IconCamera, IconUpload, IconUser, IconNotes, IconLock, IconDeviceFloppy, IconChevronsRight, IconChevronsLeft, IconPower, IconFilter, IconChevronDown
} from '@tabler/icons-react';
import ReportHistoryDrawer from '../../pages/Apps/Report/ReportHistoryDrawer'; // Import it
import ReportLogDrawer from '../../pages/Apps/Report/ReportLogDrawer';
import DeleteModal from '../../components/DeleteModal';


const filterOptions = [
        { value: 'all', label: 'All Status' },
        { value: 'favorites', label: 'Favorites' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
    ];

type CanProps = {
  when: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

const Can = ({ when, children, fallback = null }: CanProps) => {
  if (!when) return <>{fallback}</>;
  return <>{children}</>;
};

// Reusable permission gate




const PageManager = () => {
    const { can } = usePermission();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { t: tTime } = useTranslation(undefined, { keyPrefix: 'time' });
    const { t: tToast } = useTranslation(undefined, { keyPrefix: 'toast' });
    const { t: tLink } = useTranslation(undefined, { keyPrefix: 'link' });
    const { t: tButton } = useTranslation(undefined, { keyPrefix: 'button' });
    const { t: tSpan } = useTranslation(undefined, { keyPrefix: 'span' });
    const { t: tTitle } = useTranslation(undefined, { keyPrefix: 'title' });
    
    // --- MAIN STATE ---
    const [pages, setPages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filterPlatform, setFilterPlatform] = useState('all');

    const [newUsername, setNewUsername] = useState('');
    const [newNotes, setNewNotes] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);

    // ✅ NEW: Admin Filter State
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
    const [isAdminOrOwner, setIsAdminOrOwner] = useState(false);

    // Pagination
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(8);

    // --- MODAL STATES ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPage, setEditingPage] = useState<any>(null);
    const [newName, setNewName] = useState('');
    
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingPage, setDeletingPage] = useState<any>(null);

    // ✅ NEW: Report List Drawer State
    const [isReportListOpen, setIsReportListOpen] = useState(false);
    const [isReportLogOpen, setIsReportLogOpen] = useState(false);
    const [selectedPageForReports, setSelectedPageForReports] = useState<any>(null);
    const [selectedPageForReportsLog, setSelectedPageForReportsLog] = useState<any>(null);
    const [pageReports, setPageReports] = useState<any[]>([]);
    const [loadingReports, setLoadingReports] = useState(false);

    // ✅ NEW: Report Detail Modal State
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedReportDetail, setSelectedReportDetail] = useState<any>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const canFacebook = can('generate facebook report');
    const canTiktok = can('generate tiktok report');
    const canBoth = canFacebook && canTiktok;



    // State for filter panel visibility with localStorage persistence
const [isFilterPanelVisible, setIsFilterPanelVisible] = useState(() => {
  // Initialize from localStorage, default to true
  const saved = localStorage.getItem('accountManager_filterPanelVisible');
  return saved !== null ? JSON.parse(saved) : true;
});

// Save to localStorage whenever visibility changes
useEffect(() => {
  localStorage.setItem('accountManager_filterPanelVisible', JSON.stringify(isFilterPanelVisible));
}, [isFilterPanelVisible]);

// Helper function to count active filters
const getActiveFilterCount = () => {
  let count = 0;
  
  if (selectedUsers.length > 0) count++;
  if (filterPlatform !== 'all') count++;
  if (filterStatus !== 'all') count++;
  if (search.trim() !== '') count++;
  
  return count;
};

    useEffect(() => {
        dispatch(setPageTitle('Account Manager'));
    }, [dispatch]);

const isTeamMembersLoading = teamMembers.length === 0;

useEffect(() => {
    const fetchTeamData = async () => {
        try {
            const res = await api.get('/team/my-team');
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
            if (res.data.is_owner || res.data.is_admin || can('view all team reports')) {
                setIsAdminOrOwner(true);
                
                // ✅ Fix: Filter out the current user from the members list to prevent duplication
                const otherMembers = res.data.members.filter((m: any) => m.id !== currentUser.id);
    
                setTeamMembers([
                    // ✅ This is your primary "Me" option
                    { id: 'me', name: 'My Pages (Me)' },
                    
                    // Map only the OTHER team members
                    ...otherMembers.map((m: any) => ({ id: m.id, name: m.name }))
                ]);
                
                setSelectedUsers([]); 
            }
        
        } catch (e) {
            console.error("Failed to load team info", e);
            // fetchPages();
        }
    };
    fetchTeamData();
    fetchPages();
},[]);

    // Accepts an ARRAY of IDs now
    const fetchPages = async (userIdsFilter?: string[]) => {
        setLoading(true);
        try {
            // If argument passed, use it. Else use state.
            const idsToUse = userIdsFilter !== undefined 
                ? userIdsFilter 
                : selectedUsers.map(u => u.id);

            const params: any = {};
            
            // Only send if array has items. Empty = All.
            if (idsToUse.length > 0) {
                params.user_ids = idsToUse;
            }

            const response = await api.get('/pages/overview', { params }); 
            setPages(response.data);
        } catch (error) {
            toast.error('Failed to load accounts.');
        } finally {
            setLoading(false);
        }
    };
    // --- API: FETCH REPORTS FOR PAGE ---
const fetchReportsForPage = async (page: any) => {
        setSelectedPageForReports(page);
        setSelectedPageForReportsLog(page);
        setIsReportListOpen(true);
        setIsReportLogOpen(true);
        setLoadingReports(true);
        setPageReports([]); 

        try {
            const response = await api.get('/reports/history', {
                params: {
                    // ✅ CHANGE: Use 'page_id' instead of 'search'
                    page_id: page.page_id || page.id, 
                    per_page: 50 
                }
            });
            setPageReports(response.data.data || []);
        } catch (error) {
            toast.error('Could not load reports.');
        } finally {
            setLoadingReports(false);
        }
    };


// ✅ 3. HANDLE MULTI-SELECT CHANGE
    const handleUserFilterChange = (newSelectedUsers: any[]) => {
        setSelectedUsers(newSelectedUsers);
        // Extract IDs for the API
        const ids = newSelectedUsers.map(u => u.id);
        fetchPages(ids);
        setPageIndex(0);
    };

// Helper to clear filter
const clearUserFilter = (e?: React.MouseEvent) => {
  if (e) {
    e.stopPropagation(); // Only stop propagation if event exists
  }
  setSelectedUsers([]);
  fetchPages([]);
  setPageIndex(0);
};

    // --- ACTIONS ---
const handleUpdate = async () => {
        if (!newName.trim()) return;
        setIsSubmitting(true);
        
        try {
            const formData = new FormData();
            formData.append('_method', 'PUT'); // Fake PUT for Laravel file upload
            formData.append('name', newName);
            if (newUsername) formData.append('username', newUsername);
            if (newNotes) formData.append('notes', newNotes);
            if (selectedFile) formData.append('avatar', selectedFile);

            await api.post(`/pages/${editingPage.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Account updated successfully');
            setIsEditModalOpen(false);
            fetchPages(); 
        } catch (error: any) {
            console.error(error);
            // ✅ Show the actual error message from Backend (e.g., "The avatar must not be greater than 2MB")
            if (error.response && error.response.data && error.response.data.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Failed to update account.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

// 3. Toggle Favorite
    const toggleFavorite = async (pageId: number) => {
        try {
            // 1. Optimistic UI Update (Update icon instantly)
            setPages(prev => prev.map(p => 
                p.id === pageId ? { ...p, is_favorite: !p.is_favorite } : p
            ));

            const response = await api.post(`/pages/${pageId}/favorite`);
            
            const isFav = response.data.is_favorite; 
            toast.success(isFav ? 'Added to favorites' : 'Removed from favorites');

        } catch (error) {
            console.error(error);
            toast.error('Failed to update favorite.');
            fetchPages(); // Revert UI on error
        }
    };

    const toggleActive = async (pageId: number) => {
        try {
            // Optimistic Update
            setPages(prev => prev.map(p => 
                p.id === pageId ? { ...p, is_active: !p.is_active } : p
            ));

            const response = await api.post(`/pages/${pageId}/active`);
            const isActive = response.data.is_active;
            
            toast.success(isActive ? 'Account Activated' : 'Account Deactivated');
        } catch (error) {
            toast.error('Failed to change status');
            fetchPages(); // Revert
        }
    };



    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewAvatar(URL.createObjectURL(file)); // Show preview immediately
        }
    };

    const handleDelete = async () => {
        if (!deletingPage) return;
        setIsSubmitting(true);
        try {
            await api.post('/pages/delete', {
                page_name: deletingPage.page_name,
                platform: deletingPage.platform
            });
            toast.success('Account and reports deleted.');
            setIsDeleteModalOpen(false);
            fetchPages(); 
        } catch (error) {
            toast.error('Failed to delete account.');
        } finally {
            setIsSubmitting(false);
        }
    };

const handleViewFullReport = (report: any) => {
        // Determine path...
        const targetPath = report.platform === 'facebook' 
            ? '/apps/report/facebook-report-generator' 
            : '/apps/report/tiktok-report-generator';

        navigate(targetPath, { 
            state: { 
                preloadedData: report.report_data,
                pageName: report.page?.name || report.page_name,
                pageId: report.page_id,
                backPath: '/apps/pagemanager',
                currentReportId: report.id
            } 
        });
    };

    // --- UTILS ---
const filteredPages = useMemo(() => {
        return pages.filter(p => {
            // 1. Search Logic
            const matchesSearch = (p.page_name || '').toLowerCase().includes(search.toLowerCase());
            
            // 2. Status Logic
            let matchesStatus = true;
            if (filterStatus === 'active') matchesStatus = p.is_active;
            if (filterStatus === 'inactive') matchesStatus = !p.is_active;
            if (filterStatus === 'favorites') matchesStatus = p.is_favorite;

            // 3. ✅ NEW: Platform Logic
            // If filter is 'all', match everything. Otherwise, match strictly (e.g., 'facebook' === 'facebook')
            const matchesPlatform = filterPlatform === 'all' || p.platform === filterPlatform;

            // Combine all conditions
            return matchesSearch && matchesStatus && matchesPlatform;
        });
    }, [pages, search, filterStatus, filterPlatform]); // 👈 Don't forget to add filterPlatform here!

    const paginatedPages = useMemo(() => {
        const start = pageIndex * pageSize;
        return filteredPages.slice(start, start + pageSize);
    }, [filteredPages, pageIndex, pageSize]);

    const totalPages = Math.ceil(filteredPages.length / pageSize);

    const formatDate = (date: string) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const getDisplayName = (name: string) => name || '(Untitled Profile)';

    return (
        <div>
            

{/* --- ACCOUNT MANAGER HEADER --- */}
<div className="mb-8 space-y-6">
  {/* Main Header Row */}
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    {/* Left: Title Section */}
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
        <IconUsers size={22} className="text-primary" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Account Manager</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage profiles & view history</p>
      </div>
    </div>

    {/* Right: Controls */}
    <div className="flex items-center gap-3">
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsFilterPanelVisible(!isFilterPanelVisible)}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
          isFilterPanelVisible 
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
      
      {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md bg-white dark:bg-gray-700 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all whitespace-nowrap
                ${viewMode === 'grid' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }
              `}
            >
              <IconLayoutGrid size={14} />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all whitespace-nowrap
                ${viewMode === 'list' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }
              `}
            >
              <IconList size={14} />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>
    </div>
  </div>

  {/* Collapsible Filter Bar */}
  {isFilterPanelVisible && (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 animate-in slide-in-from-top duration-300">
      {/* Filter Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <IconFilter size={18} className="text-primary" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">FILTERS</h3>
          <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
            {getActiveFilterCount()} active
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              clearUserFilter(); 
              setFilterPlatform('all');
              setFilterStatus('all');
              setSearch('');
              setPageIndex(0);
            }}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all"
          >
            <IconX size={14} />
            Clear all
          </button>
        </div>
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

{/* Team Members Filter */}

<Can when={isAdminOrOwner || can('view all team reports')}>
  {/* Skeleton */}
  {isTeamMembersLoading && (
    <div className="space-y-2">
    {/* Label Skeleton */}
    <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />

    {/* Select Skeleton */}
    <div className="relative">
        <div className="w-full h-[42px] rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center px-4">
        {/* Text */}
        <div className="h-3 w-32 bg-gray-200 dark:bg-gray-600 rounded" />
        <div className="ml-auto w-4 h-4 bg-gray-200 dark:bg-gray-600 rounded" />
        </div>
    </div>
    </div>
)}

  {/* Team Members Filter */}
  {!isTeamMembersLoading && teamMembers.length > 0 && (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
        <span className="flex items-center gap-1.5">
          <IconUsers size={14} />
          Team Members
        </span>
      </label>

      <Listbox value={selectedUsers} onChange={handleUserFilterChange} multiple>
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-pointer rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/50 py-2.5 pl-4 pr-10 text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm">
            <span className="truncate text-gray-700 dark:text-gray-300">
              {selectedUsers.length === 0
                ? 'All members'
                : selectedUsers.length === 1
                ? selectedUsers[0].name
                : `${selectedUsers.length} members selected`}
            </span>

            <span className="absolute inset-y-0 right-0 flex items-center pr-3">
              {selectedUsers.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearUserFilter(e);
                  }}
                  className="p-1 mr-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <IconX size={12} className="text-gray-400 hover:text-red-500" />
                </button>
              )}
              <IconChevronDown className="h-5 w-5 text-gray-400" />
            </span>
          </Listbox.Button>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-50 mt-1 w-full rounded-lg bg-white dark:bg-gray-800 py-2 shadow-lg border border-gray-200 dark:border-gray-700 max-h-64 overflow-auto">
              {teamMembers.map((member) => (
                <Listbox.Option
                  key={member.id}
                  value={member}
                  className={({ active }) =>
                    `relative cursor-pointer py-2.5 pl-10 pr-4 text-sm ${
                      active
                        ? 'bg-primary/5 text-primary'
                        : 'text-gray-700 dark:text-gray-300'
                    }`
                  }
                >
                  {({ selected }) => (
                    <>
                      <span className={`block truncate ${selected ? 'font-semibold' : ''}`}>
                        {member.name}
                      </span>
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center ${
                            selected
                              ? 'bg-primary border-primary'
                              : 'border-gray-300 dark:border-gray-500'
                          }`}
                        >
                          {selected && (
                            <IconCheck className="h-3 w-3 text-white" strokeWidth={3} />
                          )}
                        </div>
                      </span>
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  )}
</Can>




        {/* Platform Filter */}
        {(canFacebook && canTiktok) && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              <span className="flex items-center gap-1.5">
                <IconWorld size={14} />
                Platform
              </span>
            </label>
            <div className="inline-flex w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50 p-1 shadow-sm">
              <button
                onClick={() => setFilterPlatform('all')}
                className={`
                  inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all flex-1
                  ${filterPlatform === 'all' 
                    ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                `}
              >
                <IconWorld size={14} />
                <span>All</span>
              </button>
              <button
                onClick={() => setFilterPlatform('facebook')}
                className={`
                  inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all flex-1
                  ${filterPlatform === 'facebook' 
                    ? 'bg-white dark:bg-gray-700 text-[#1877F2] shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-[#1877F2]'
                  }
                `}
              >
                <IconBrandFacebook size={14} />
                <span>FB</span>
              </button>
              <button
                onClick={() => setFilterPlatform('tiktok')}
                className={`
                  inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all flex-1
                  ${filterPlatform === 'tiktok' 
                    ? 'bg-white dark:bg-gray-700 text-black dark:text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                  }
                `}
              >
                <IconBrandTiktok size={14} />
                <span>TT</span>
              </button>
            </div>
          </div>
        )}

        {/* Status Filter */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            <span className="flex items-center gap-1.5">
              <IconFilter size={14} />
              Status
            </span>
          </label>
          <Listbox value={filterStatus} onChange={(value) => { setFilterStatus(value); setPageIndex(0); }}>
            <div className="relative">
              <Listbox.Button className="relative w-full cursor-pointer rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/50 py-2.5 pl-4 pr-10 text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm">
                <span className="flex items-center gap-2 truncate">
                  <span className="truncate text-gray-700 dark:text-gray-300">
                    {filterOptions.find(opt => opt.value === filterStatus)?.label || 'Select status'}
                  </span>
                </span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <IconChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
              </Listbox.Button>

              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute z-50 mt-1 w-full rounded-lg bg-white dark:bg-gray-800 py-2 shadow-lg border border-gray-200 dark:border-gray-700 focus:outline-none max-h-64 overflow-auto">
                  {filterOptions.map((option, idx) => (
                    <Listbox.Option
                      key={idx}
                      className={({ active }) =>
                        `relative cursor-pointer py-2.5 pl-10 pr-4 text-sm ${
                          active ? 'bg-primary/5 text-primary' : 'text-gray-700 dark:text-gray-300'
                        }`
                      }
                      value={option.value}
                    >
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                            {option.label}
                          </span>
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                              selected 
                                ? 'bg-primary border-primary' 
                                : 'border-gray-300 dark:border-gray-500'
                            }`}>
                              {selected && <IconCheck className="h-3 w-3 text-white" strokeWidth={3} />}
                            </div>
                          </span>
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>
        </div>

        {/* Search */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            <span className="flex items-center gap-1.5">
              <IconSearch size={14} />
              Search
            </span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search accounts by name, email, or ID..."
              className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/50 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPageIndex(0); }}
            />
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <IconX size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )}

  {/* Show message when filters are hidden */}
  {!isFilterPanelVisible && (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
      <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
        <IconFilter size={16} />
        <span className="text-sm">Filters are hidden. Click "Show Filters" to reveal filter options.</span>
      </div>
      {getActiveFilterCount() > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
            <IconFilter size={12} />
            {getActiveFilterCount()} active filter{getActiveFilterCount() !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  )}
</div>

            {/* --- CONTENT AREA --- */}
{loading ? (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
        {[...Array(8)].map((_, index) => (
            <div 
                key={index}
                className="bg-white dark:bg-[#1b2e4b] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700/50"
            >
                {/* Card Header Skeleton */}
                <div className="h-32 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 p-5">
                    <div className="flex justify-between items-start">
                        {/* Platform Icon Skeleton */}
                        <div className="w-10 h-10 rounded-xl bg-white/30 dark:bg-black/30"></div>
                        {/* Action Buttons Skeleton */}
                        <div className="flex gap-2">
                            {[...Array(4)].map((_, i) => (
                                <div 
                                    key={i}
                                    className="w-8 h-8 rounded-xl bg-white/30 dark:bg-black/30"
                                ></div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Card Body Skeleton */}
                <div className="p-5 pt-14 relative">
                    {/* Avatar Skeleton */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                        <div className="w-24 h-24 rounded-2xl border-2 border-white dark:border-[#1b2e4b] bg-gray-200 dark:bg-gray-700"></div>
                    </div>
                    
                    {/* Page Name Skeleton */}
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 mx-auto w-3/4"></div>
                    
                    {/* Username Skeleton */}
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6 mx-auto w-1/2"></div>

                    {/* Stats Grid Skeleton */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-gray-100 dark:bg-[#0e1726] p-3 rounded-xl">
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4 mx-auto"></div>
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
                        </div>
                        <div className="bg-gray-100 dark:bg-[#0e1726] p-3 rounded-xl">
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4 mx-auto"></div>
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto"></div>
                        </div>
                    </div>
                    
                    {/* Notes Skeleton */}
                    <div className="mb-4">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                    </div>

                    {/* Button Skeleton */}
                    <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                </div>
            </div>
        ))}
    </div> ) : filteredPages.length === 0 ? (
                <div className="panel text-center py-20 text-gray-500">
                    <div className="flex justify-center mb-4"><IconUsers size={48} className="text-gray-300" /></div>
                    <h3 className="text-lg font-bold">No accounts found</h3>
                    <p>Generate a report to create a new account profile automatically.</p>
                </div>
            ) : (
                <>
                    {/* --- VIEW MODE: GRID --- */}
                    {viewMode === 'grid' && (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
        {paginatedPages.map((page, index) => {
            const isFav = Boolean(page.is_favorite);
            const isActive = Boolean(page.is_active);

            return (
                <div 
                    key={index} 
                    className="group relative bg-white dark:bg-[#1b2e4b] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700/50 hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-0.5"
                >
                    {/* Card Header with Platform Gradient */}
                    <div className={`relative h-32 ${
                        page.platform === 'facebook' 
                            ? 'bg-gradient-to-br from-blue-400 via-blue-600 to-blue-700'  
                            : 'bg-gradient-to-br from-gray-700 via-gray-800 to-black'
                    } p-5`}>
                        
                        {/* Decorative Pattern Overlay */}
                        <div className="absolute inset-0 opacity-10" style={{
                            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                            backgroundSize: '24px 24px'
                        }}></div>

                        <div className="relative flex justify-between items-start text-white">
                            {/* Platform Icon */}
                            <div className="bg-white/20 backdrop-blur-md p-2.5 rounded-xl shadow-lg border border-white/20 group-hover:scale-105 transition-transform duration-300">
                                {page.platform === 'facebook' 
                                    ? <IconBrandFacebook size={24} strokeWidth={1.5} /> 
                                    : <IconBrandTiktok size={24} strokeWidth={1.5} />
                                }
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                            <Tippy content={isActive ? tButton('deactivate') : tButton('activate')}
                                   theme={isActive ? "danger" : "success" }
                                    animation="shift-away"
                                    trigger="mouseenter"
                                    duration={200}
                                    hideOnClick={true} > 
                            <button 
                                    onClick={(e) => { e.stopPropagation(); toggleActive(page.id); }}
                                    className={`p-2 rounded-xl backdrop-blur-md transition-all duration-300 ${
                                    isActive  
                                                ? 'text-white/40 hover:text-white bg-black/20 hover:bg-white/20 hover:scale-110'
                                                : 'text-red-400 bg-red-500/20 scale-110' 
                                    }`}
                              
                                                    >
                                    <IconPower 
                                    size={18}
                                    stroke={isActive ? "currentColor" : "none"} 
                                    strokeWidth={2}  />
                            </button>  
                            </Tippy>

                                {/* Favorite Button */}
                                <Tippy content={isFav ? 
                                    "Unfavorite" : "Favorite"} 
                                    theme={isFav ? "warning":"warning"}
                                        animation="shift-away"
                                        trigger="mouseenter"
                                        duration={200}
                                        hideOnClick={true} >
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            toggleFavorite(page.id); 
                                        }}
                                        className={`p-2 rounded-xl backdrop-blur-md transition-all duration-300 ${
                                            isFav 
                                                ? 'text-yellow-400 bg-white/20 scale-110' 
                                                : 'text-white/40 hover:text-white bg-black/20 hover:bg-white/20 hover:scale-110'
                                        }`}
                                    >
                                        <IconStar 
                                            size={18} 
                                            fill={isFav ? "currentColor" : "none"} 
                                            strokeWidth={2} 
                                        />
                                    </button>
                                </Tippy>


                                {/* Edit Button */}
                                <Tippy content={tButton('edit')} theme='info'
                                        animation="shift-away"
                                        trigger="mouseenter"
                                        duration={200}
                                        hideOnClick={true} >
                                <button 
                                    className="p-2 rounded-xl backdrop-blur-md text-white/60 hover:text-white bg-black/20 hover:bg-white/20 transition-all duration-300 hover:scale-110 "
                                    onClick={() => { 
                                        setEditingPage(page); 
                                        setNewName(page.page_name || '');
                                        setNewUsername(page.username || ''); 
                                        setNewNotes(page.notes || '');       
                                        setPreviewAvatar(null);
                                        setSelectedFile(null);
                                        setIsEditModalOpen(true); 
                                    }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path opacity="0.5" d="M22 10.5V12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2H13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                    <path d="M17.3009 2.80624L16.652 3.45506L10.6872 9.41993C10.2832 9.82394 10.0812 10.0259 9.90743 10.2487C9.70249 10.5114 9.52679 10.7957 9.38344 11.0965C9.26191 11.3515 9.17157 11.6225 8.99089 12.1646L8.41242 13.9L8.03811 15.0229C7.9492 15.2897 8.01862 15.5837 8.21744 15.7826C8.41626 15.9814 8.71035 16.0508 8.97709 15.9619L10.1 15.5876L11.8354 15.0091C12.3775 14.8284 12.6485 14.7381 12.9035 14.6166C13.2043 14.4732 13.4886 14.2975 13.7513 14.0926C13.9741 13.9188 14.1761 13.7168 14.5801 13.3128L20.5449 7.34795L21.1938 6.69914C22.2687 5.62415 22.2687 3.88124 21.1938 2.80624C20.1188 1.73125 18.3759 1.73125 17.3009 2.80624Z" stroke="currentColor" stroke-width="1.5"/>
                                    <path opacity="0.5" d="M16.6522 3.45508C16.6522 3.45508 16.7333 4.83381 17.9499 6.05034C19.1664 7.26687 20.5451 7.34797 20.5451 7.34797M10.1002 15.5876L8.4126 13.9" stroke="currentColor" stroke-width="1.5"/>
                                    </svg>

                                </button>
                                </Tippy>

                                {/* Delete Button */}
                                <Tippy content={tButton('delete')} theme='danger'
                                        animation="shift-away"
                                        trigger="mouseenter"
                                        duration={200}
                                        hideOnClick={true} >
                                <button 
                                    className="p-2 rounded-xl backdrop-blur-md text-white/60 hover:text-red-400 bg-black/20 hover:bg-red-500/20 transition-all duration-300 hover:scale-110"
                                    onClick={() => { setDeletingPage(page); setIsDeleteModalOpen(true); }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path opacity="0.5" d="M9.17065 4C9.58249 2.83481 10.6937 2 11.9999 2C13.3062 2 14.4174 2.83481 14.8292 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><path d="M20.5001 6H3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><path d="M18.8334 8.5L18.3735 15.3991C18.1965 18.054 18.108 19.3815 17.243 20.1907C16.378 21 15.0476 21 12.3868 21H11.6134C8.9526 21 7.6222 21 6.75719 20.1907C5.89218 19.3815 5.80368 18.054 5.62669 15.3991L5.16675 8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><path opacity="0.5" d="M9.5 11L10 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><path opacity="0.5" d="M14.5 11L14 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path></svg>
                                </button>
                                </Tippy>
                            </div>
                        </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 pt-14 relative">
                        {/* Avatar */}
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-2xl border-2 border-white dark:border-[#1b2e4b] bg-white dark:bg-[#0e1726] flex items-center justify-center shadow-xl overflow-hidden group-hover:scale-105 transition-all duration-300 group-hover:border-primary">
                                    {page.avatar ? (
                                        <img 
                                            src={getStoragePath(page.avatar)} 
                                            alt={page.page_name} 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-3xl font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                                            {(page.page_name || 'U').charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                {/* Online Status Indicator */}
                                <div 
                                    className={`absolute -bottom-1 -right-1 w-6 h-6 border-4 border-white dark:border-[#1b2e4b] rounded-full shadow-lg ${
                                        page.is_active ? 'bg-green-500' : 'bg-red-500'
                                    }`}
                                    title={page.is_active ? "Status: Active" : "Status: Inactive"}></div>
                            </div>
                        </div>
                        
                        {/* Page Name */}
                        <h3 className="font-bold text-xl mb-1 text-center truncate text-gray-800 dark:text-white group-hover:text-primary transition-colors">
                            {getDisplayName(page.page_name)}
                        </h3>
                        
                        {/* Username */}
                        <p className="text-sm text-primary font-semibold mb-4 text-center">
                            {page.username || `@${page.platform}_user`}
                        </p>


                               {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                                        <div className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-1">
                                            {tTitle('total_reports')}
                                        </div>
                                        <div className="text-xl font-bold text-gray-800 dark:text-white">
                                            {page.total_reports}
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                                        <div className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-1">
                                            {tTitle('last_active')}
                                        </div>
                                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                            {formatDate(page.last_updated)}
                                        </div>
                                    </div>
                                </div>
                                                        {/* Notes Preview */}
                                {page.notes && (
                                    <div className="mb-4">
                                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                            <IconNotes size={12} className="inline mr-1 opacity-60" />
                                            {page.notes}
                                        </p>
                                    </div>
                                )}

                        {/* View Reports Button */}
<div className="flex items-center gap-3">
    {/* Info / Secondary Action */}
    <button
        onClick={() => {
            setSelectedPageForReportsLog(page);
            setIsReportLogOpen(true);
        }}
        type="button"
        className="flex items-center justify-center w-12 h-12 rounded-xl
                   bg-white dark:bg-[#0e1726]
                   border border-gray-200 dark:border-gray-700
                   text-primary
                   shadow-sm hover:shadow-md
                   transition-all duration-200
                   focus:outline-none focus:ring-2 focus:ring-primary/40"
        aria-label="View information"
    >
        <IconInfoCircle size={18} />
    </button>

    {/* Primary Action */}
    <button
        onClick={() => {
            setSelectedPageForReports(page);
            setIsReportListOpen(true);
        }}
        className="flex-1 flex items-center justify-between gap-3
                   px-5 py-3 rounded-xl
                   bg-gradient-to-r from-primary to-primary/80
                   hover:from-primary/90 hover:to-primary
                   text-white font-semibold text-sm
                   shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40
                   transition-all duration-300
                   focus:outline-none focus:ring-2 focus:ring-primary/40
                   group"
    >
        <div className="flex items-center gap-2">
            <IconFileAnalytics
                size={18}
                className="transition-transform duration-300 group-hover:rotate-6"
            />
            <span>{tSpan('view_report')}</span>
        </div>

        <IconChevronRight
            size={16}
            className="transition-transform duration-300 group-hover:translate-x-1"
        />
    </button>
</div>

                    </div>

                    {/* Hover Effect Border Glow */}
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" 
                         style={{
                             background: 'linear-gradient(90deg, transparent, rgba(var(--primary-rgb), 0.1), transparent)',
                             animation: 'shimmer 2s infinite'
                         }}>
                    </div>
                </div>
            );
        })}
    </div>
)}

                
                    {/* --- VIEW MODE: LIST --- */}
                    {viewMode === 'list' && (
                        <div className="panel p-0 overflow-hidden border border-gray-200 dark:border-gray-800 rounded-lg">
                            <div className="table-responsive">
                                <table className="table table-hover w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-[#1a2941] text-gray-500 uppercase text-xs font-bold">
                                            <th className="p-4">Account Name</th>
                                            <th className="p-4">Platform</th>
                                            <th className="p-4 text-center">Reports</th>
                                            <th className="p-4 text-right">Last Updated</th>
                                            <th className="p-4 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedPages.map((page, index) => (
                                            <tr key={index} className="border-b dark:border-gray-700 group hover:bg-gray-50 dark:hover:bg-[#1b2e4b]">
                                                <td className="p-4 font-bold text-gray-800 dark:text-gray-200">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center  overflow-hidden justify-center text-xs font-bold text-gray-500">
                                                            {page.avatar ? (
                                                            <img 
                                                                src={getStoragePath(page.avatar)} 
                                                                alt={page.page_name} 
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-3xl font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                                                                {(page.page_name || 'U').charAt(0).toUpperCase()}
                                                            </span>
                                                        )}
                                                        </div>
                                                        <span className={!page.page_name ? 'italic text-gray-400' : ''}>
                                                            {getDisplayName(page.page_name)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`badge flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-md ${page.platform === 'facebook' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-gray-50 text-gray-800 border border-gray-200'}`}>
                                                        {page.platform === 'facebook' ? <IconBrandFacebook size={14}/> : <IconBrandTiktok size={14}/>}
                                                        <span className="capitalize">{page.platform}</span>
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button 
                                                        onClick={() => fetchReportsForPage(page)}
                                                        className="text-primary font-bold hover:underline"
                                                    >
                                                        {page.total_reports}
                                                    </button>
                                                </td>
                                                <td className="p-4 text-right text-sm text-gray-500">{formatDate(page.last_updated)}</td>
                                                <td className="p-4 text-center">
                                                    <div className="flex justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                      <Tippy content={tButton('view')} theme='primary'
                                                        animation="shift-away"
                                                        trigger="mouseenter"
                                                        duration={200}
                                                        hideOnClick={true} >
                                                        <button 
                                                            className="btn btn-sm btn-outline-primary w-8 h-8 rounded-full p-0 flex items-center justify-center"
                                                            onClick={() => fetchReportsForPage(page)}
                                                            title="View Reports"
                                                        >
                                                            <IconFileAnalytics size={16}/>
                                                        </button>
                                                        </Tippy>

                                                      <Tippy content={tButton('edit')} theme='secondary'
                                                      animation="shift-away"
                                                      trigger="mouseenter"
                                                      duration={200}
                                                      hideOnClick={true} >             
                                                        <button 
                                                            className="btn btn-sm btn-outline-secondary w-8 h-8 rounded-full p-0 flex items-center justify-center"
                                                            onClick={() => { setEditingPage(page); setNewName(page.page_name || ''); setIsEditModalOpen(true); }}
                                                        >
                                                            <IconEdit size={16}/>
                                                        </button>
                                                      </Tippy>

                                                  <Tippy content={tButton('delete')} theme='danger'
                                                    animation="shift-away"
                                                    trigger="mouseenter"
                                                    duration={200}
                                                    hideOnClick={true} >
                                                        <button 
                                                            className="btn btn-sm btn-outline-danger w-8 h-8 rounded-full p-0 flex items-center justify-center"
                                                            onClick={() => { setDeletingPage(page); setIsDeleteModalOpen(true); }}
                                                        >
                                                            <IconTrash size={16}/>
                                                        </button>
                                                  </Tippy>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* --- PAGINATION --- */}

<div className="flex flex-col sm:flex-row items-center justify-between gap-6 mt-6 px-6 py-5 border-t bg-white-light dark:bg-[#0b1728]  border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/50 dark:to-gray-900/50 rounded-b-xl">
  
  {/* Left section: Rows per page + Info */}
  <div className="flex items-center gap-6">
    {/* Rows per page selector */}
    <div className="flex items-center gap-3">
      <div className="relative w-20">
        <Listbox value={pageSize} onChange={(value) => { setPageSize(Number(value)); setPageIndex(0); }}>
          <div className="relative">
            <Listbox.Button className="relative w-full cursor-pointer rounded-md bg-white dark:bg-gray-700 py-1.5 pl-3 pr-8 text-left shadow-sm border border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
              <span className="block truncate font-semibold text-gray-900 dark:text-white">{pageSize}</span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <IconChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </span>
            </Listbox.Button>
            <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
              <Listbox.Options className="absolute bottom-full mb-2 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 focus:outline-none z-50">
                {[8, 12, 24, 50].map((size) => (
                  <Listbox.Option
                    key={size}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2 pl-8 pr-4 transition-colors duration-150 ${
                        active
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'text-gray-900 dark:text-gray-100'
                      }`
                    }
                    value={size}
                  >
                    {({ selected }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                          {size}
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
    <div className=" sm:block h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

    {/* Showing entries info */}
    <span className=" sm:inline text-sm text-gray-600 dark:text-gray-400">
      Showing{' '}
      <span className="font-bold text-gray-900 dark:text-white">
        {pageIndex * pageSize + 1}
      </span>
      {' '}-{' '}
      <span className="font-bold text-gray-900 dark:text-white">
        {Math.min((pageIndex + 1) * pageSize, filteredPages.length)}
      </span>
      {' '}of{' '}
      <span className="font-bold text-gray-900 dark:text-white">
        {filteredPages.length}
      </span>
      {' '}accounts
    </span>
  </div>

  {/* Right section: Navigation */}
  <div className="flex items-center gap-2">
    {/* First page */}
    <button
      type="button"
      className="p-2 rounded-md w-8 h-8 flex items-center justify-center transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent text-gray-700 dark:text-gray-300"
      onClick={() => setPageIndex(0)}
      disabled={pageIndex === 0}
      title="First page"
    >
      <IconChevronsLeft size={18} />
    </button>

    {/* Previous page */}
    <button
      type="button"
      className="p-2 rounded-md w-8 h-8 flex items-center justify-center transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent text-gray-700 dark:text-gray-300"
      onClick={() => setPageIndex(p => Math.max(0, p - 1))}
      disabled={pageIndex === 0}
      title="Previous page"
    >
      <IconChevronLeft size={18} />
    </button>

    {/* Page indicator */}
    <div className="px-4 py-1.5 min-w-[120px] text-center bg-white dark:bg-gray-700 rounded-md shadow-sm border border-gray-200 dark:border-gray-600">
      <span className="text-sm">
        <span className="font-semibold text-gray-900 dark:text-white">{pageIndex + 1}</span>
        <span className="text-gray-500 dark:text-gray-400"> / {totalPages}</span>
      </span>
    </div>

    {/* Next page */}
    <button
      type="button"
      className="p-2 rounded-md w-8 h-8 flex items-center justify-center transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent text-gray-700 dark:text-gray-300"
      onClick={() => setPageIndex(p => Math.min(totalPages - 1, p + 1))}
      disabled={pageIndex >= totalPages - 1}
      title="Next page"
    >
      <IconChevronRight size={18} />
    </button>

    {/* Last page */}
    <button
      type="button"
      className="p-2 rounded-md w-8 h-8 flex items-center justify-center transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent text-gray-700 dark:text-gray-300"
      onClick={() => setPageIndex(totalPages - 1)}
      disabled={pageIndex >= totalPages - 1}
      title="Last page"
    >
      <IconChevronsRight size={18} />
    </button>
  </div>
</div>

                    
                </>
            )}

    <ReportHistoryDrawer 
    isOpen={isReportListOpen}
    onClose={() => setIsReportListOpen(false)}
    pageId={selectedPageForReports?.id} // OR selectedPageForReports?.page_id depending on your object
    pageName={getDisplayName(selectedPageForReports?.page_name)}
    onSelectReport={handleViewFullReport} // Reuse the navigation function!
/>

    <ReportLogDrawer 
    isOpen={isReportLogOpen}
    onClose={() => setIsReportLogOpen(false)}
    pageId={selectedPageForReportsLog?.id} // OR selectedPageForReportsLog?.page_id depending on your object
    pageName={getDisplayName(selectedPageForReportsLog?.page_name)}
    onSelectReport={handleViewFullReport} // Reuse the navigation function!
/>

{/* --- MODAL 2: FULL REPORT DETAILS --- */}
            <Transition appear show={isDetailModalOpen} as={Fragment}>
                <Dialog as="div" open={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)}>
                    <div className="fixed inset-0 z-[1000] overflow-y-auto bg-black/60 backdrop-blur-sm">
                        <div className="flex min-h-screen items-center justify-center px-4">
                            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <Dialog.Panel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg my-8 animate-zoom-in">
                                    <div className="flex items-center justify-between bg-[#fbfbfb] dark:bg-[#121c2c] px-5 py-3 border-b dark:border-[#1b2e4b]">
                                        <h5 className="font-bold text-lg">Report Summary</h5>
                                        <button onClick={() => setIsDetailModalOpen(false)}><IconX /></button>
                                    </div>
                                    <div className="p-5">
                                        {selectedReportDetail && (
                                            <div className="space-y-6">
                                                {/* Header Info */}
                                                <div className="text-center">
                                                    <div className="text-xl font-bold">{selectedReportDetail.page?.name || selectedReportDetail.page_name}</div>
                                                    <div className="text-xs text-gray-500">{formatDate(selectedReportDetail.created_at)}</div>
                                                    <span className={`badge mt-2 ${selectedReportDetail.platform === 'facebook' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-800'}`}>
                                                        {selectedReportDetail.platform}
                                                    </span>
                                                </div>

                                                {/* Key Metrics Preview */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl text-center border border-gray-100 dark:border-gray-700">
                                                        <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Views</div>
                                                        <div className="text-2xl font-black text-blue-600 mt-1">
                                                            {(selectedReportDetail.report_data?.kpi?.views || selectedReportDetail.report_data?.total_views || 0).toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl text-center border border-gray-100 dark:border-gray-700">
                                                        <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Engagement</div>
                                                        <div className="text-2xl font-black text-green-600 mt-1">
                                                            {selectedReportDetail.report_data?.champions?.highest_engagement?.engagement_rate || 0}%
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* ✅ THE BUTTON: VIEW FULL REPORT */}
                                                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                                    <button 
                                                        onClick={() => handleViewFullReport(selectedReportDetail)}
                                                        className="btn btn-primary w-full shadow-lg text-base py-3"
                                                    >
                                                        <IconFileAnalytics className="mr-2" />
                                                        Open Full Analysis
                                                    </button>
                                                    <p className="text-center text-xs text-gray-400 mt-2">
                                                        Opens the complete report in the generator view
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Rename & Delete Modals (Kept same as before) */}
<Transition appear show={isEditModalOpen} as={Fragment}>
    <Dialog as="div" open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <div className="fixed inset-0 z-[999] overflow-y-auto bg-black/70 backdrop-blur-md">
            <div className="flex min-h-screen items-center justify-center px-4 py-4">
                <Transition.Child 
                    as={Fragment} 
                    enter="ease-out duration-300" 
                    enterFrom="opacity-0 scale-95" 
                    enterTo="opacity-100 scale-100" 
                    leave="ease-in duration-200" 
                    leaveFrom="opacity-100 scale-100" 
                    leaveTo="opacity-0 scale-95"
                >
                    <Dialog.Panel className="relative w-full max-w-lg bg-white dark:bg-[#0e1726] rounded-xl shadow-xl overflow-hidden">
                        
                        {/* Header with Gradient */}
                        <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 border-b border-gray-200 dark:border-gray-700/50">
                            <div className="flex justify-between items-center">
                                <div>
                                    <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        Edit Account Details
                                    </Dialog.Title>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Update your account information
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                                >
                                    <IconX size={22} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                            
                            {/* AVATAR UPLOAD SECTION */}
                            <div className="flex flex-col items-center mb-8">
                                <div className="relative group">
                                    {/* Avatar Circle */}
                                    <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-4 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center cursor-pointer transition-all duration-300 group-hover:border-primary group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-primary/20">
                                        {previewAvatar ? (
                                            <img src={previewAvatar} className="w-full h-full object-cover" alt="Preview" />
                                        ) : editingPage?.avatar ? (
                                            <img src={getStoragePath(editingPage.avatar)} className="w-full h-full object-cover" alt="Avatar" />
                                        ) : (
                                            <IconCamera className="text-gray-400 group-hover:text-primary transition-colors" size={36} />
                                        )}
                                        
                                        {/* File Input */}
                                        <input 
                                            type="file" 
                                            className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                            onChange={handleFileChange}
                                            accept="image/*"
                                        />
                                        
                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white z-10">
                                            <IconUpload size={24} className="mb-1" />
                                            <span className="text-xs font-semibold">Upload Photo</span>
                                        </div>
                                    </div>

                                    {/* Camera Icon Badge */}
                                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg border-4 border-white dark:border-[#0e1726] group-hover:scale-110 transition-transform">
                                        <IconCamera className="text-white" size={18} />
                                    </div>
                                </div>
                                
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                                    Click to upload a new profile picture
                                </p>
                            </div>

                            {/* FORM FIELDS */}
                            <div className="space-y-5">
                                
                                {/* Account Name */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Account Name
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            className="form-input w-full pl-10 rounded-xl border-gray-300 dark:border-gray-600 focus:border-primary focus:ring focus:ring-primary/20 transition-all"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            placeholder="Enter account name"
                                        />
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            <IconUser size={18} />
                                        </div>
                                    </div>
                                </div>

                                {/* Username / Handle */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Username / Handle
                                    </label>
                                    <div className="relative">
                                        <div className="flex rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600 focus-within:border-primary focus-within:ring focus-within:ring-primary/20 transition-all">
                                            <span className="inline-flex items-center px-4 bg-gray-100 dark:bg-[#1b2e4b] text-gray-600 dark:text-gray-400 text-sm font-medium border-r border-gray-300 dark:border-gray-600">
                                                @
                                            </span>
                                            <input 
                                                type="text" 
                                                className="form-input flex-1 border-0 focus:ring-0 rounded-none"
                                                placeholder="username"
                                                value={newUsername}
                                                onChange={(e) => setNewUsername(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Internal Notes */}
                                <div>
                                    <label className=" text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                        <IconNotes size={16} />
                                        Internal Notes
                                    </label>
                                    <div className="relative">
                                        <textarea 
                                            className="form-textarea w-full rounded-xl border-gray-300 dark:border-gray-600 focus:border-primary focus:ring focus:ring-primary/20 transition-all resize-none"
                                            rows={4}
                                            placeholder="Add private notes, contract details, client preferences..."
                                            value={newNotes}
                                            onChange={(e) => setNewNotes(e.target.value)}
                                        ></textarea>
                                        <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                                            {newNotes.length}/500
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                        <IconLock size={12} />
                                        These notes are private and only visible to you
                                    </p>
                                </div>
                            </div>

                            {/* ACTION BUTTONS */}
                            <div className="flex gap-3 mt-4 pt-5 border-t border-gray-200 dark:border-gray-700/50">
                                <button 
                                    className="flex-1 py-2 px-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 "
                                    onClick={() => setIsEditModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="flex-1 py-2 px-2 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-white font-semibold hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all duration-200  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                                    onClick={handleUpdate} 
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></div>
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <IconDeviceFloppy size={18} />
                                            <span>Save Changes</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10"></div>
                    </Dialog.Panel>
                </Transition.Child>
            </div>
        </div>
    </Dialog>
</Transition>

            <DeleteModal 
                isOpen={isDeleteModalOpen} 
                setIsOpen={setIsDeleteModalOpen} 
                onConfirm={handleDelete} 
                isLoading={isSubmitting}
                title="Delete Account?" 
                message={`Are you sure you want to delete "${getDisplayName(deletingPage?.page_name)}"? This will permanently delete ALL ${deletingPage?.total_reports} reports for this account.`}
            />
        </div>
    );
};

export default PageManager;