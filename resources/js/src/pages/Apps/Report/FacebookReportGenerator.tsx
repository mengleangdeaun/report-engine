import PerfectScrollbar from 'react-perfect-scrollbar';
import { useEffect, useState, useMemo, Fragment } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import { IRootState } from '../../../store';
import ReactApexChart from 'react-apexcharts';
import { toast, Toaster  } from 'react-hot-toast';

import CreatableSelect from 'react-select/creatable';
import { Listbox, Transition } from '@headlessui/react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import ReportHistoryDrawer from './ReportHistoryDrawer';
import api from '../../../utils/api'; // Adjust path if needed
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';
import 'tippy.js/animations/shift-away.css';
import 'tippy.js/animations/shift-toward.css';
import 'tippy.js/animations/perspective.css';
import { 
    IconBrandFacebook, IconUpload, IconClick, IconThumbUp, 
    IconMessage, IconShare, IconEye, IconChartBar, 
    IconTrophy, IconPhoto, IconMovie, IconVideo,
    IconPrinter, IconFileSpreadsheet, IconChevronLeft, IconChevronRight,
    IconCheck, IconChevronUp, IconChevronDown, IconArrowLeft, IconHistory, IconChevronsLeft, IconChevronsRight, IconTrendingUp, IconHeart, IconShare2, IconMessageCircle, IconPlus
} from '@tabler/icons-react';


const getTypeIcon = (type: string) => {
    if (!type) return <IconPhoto size={16} className="text-gray-400"/>;
    const t = type.toLowerCase();
    
    if (t.includes('reel')) {
        return (
            <div className="flex items-center gap-1.5 text-pink-600 dark:text-pink-400 bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-950/30 dark:to-pink-900/20 px-3 py-1.5 rounded-md text-xs font-medium w-fit mx-auto border border-pink-200 dark:border-pink-800/50 shadow-sm">
                <IconMovie size={14} className="flex-shrink-0"/> 
                <span>Reel</span>
            </div>
        );
    }
    if (t.includes('video')) {
        return (
            <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 px-3 py-1.5 rounded-md text-xs font-medium w-fit mx-auto border border-red-200 dark:border-red-800/50 shadow-sm">
                <IconVideo size={14} className="flex-shrink-0"/> 
                <span>Video</span>
            </div>
        );
    }
    // Default to Photo
    return (
        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 px-3 py-1.5 rounded-md text-xs font-medium w-fit mx-auto border border-blue-200 dark:border-blue-800/50 shadow-sm">
            <IconPhoto size={14} className="flex-shrink-0"/> 
            <span>Photo</span>
        </div>
    );
};

const FacebookReportGenerator = () => {
    const dispatch = useDispatch();
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark');

    const location = useLocation();
    const navigate = useNavigate();

    // 1. Get initial data from State
    const [reportData, setReportData] = useState(location.state?.preloadedData || null);
    const [pageName, setPageName] = useState<any>(
    location.state?.pageName 
        ? { label: location.state.pageName, value: location.state.pageName } 
        : null
);
    const [pageId, setPageId] = useState(location.state?.pageId || null);

    // 2. Drawer State
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    // --- STATE ---
    const [resetKey, setResetKey] = useState(0);
    const [file, setFile] = useState<File | null>(null);

    const [loading, setLoading] = useState(false);
    const [pageOptions, setPageOptions] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // New State to track if we are viewing history
    const [isFromHistory, setIsFromHistory] = useState(false);
    const [currentReportId, setCurrentReportId] = useState<number | null>(location.state?.currentReportId || null);

    const backPath = location.state?.backPath || '/apps/report/history';
    const showBackButton = !!location.state?.preloadedData; // Only show if viewing a saved report
 

    useEffect(() => {
        dispatch(setPageTitle('Facebook Report Generator'));
        fetchPageNames();
    }, []);

    useEffect(() => {
        if (location.state?.preloadedData) {
            console.log("Loading History Data:", location.state.preloadedData);
            setReportData(location.state.preloadedData);
            setIsFromHistory(true);
            
            // Optional: Pre-fill the page name dropdown
            if (location.state?.pageName) {
                setPageName({ label: location.state.pageName, value: location.state.pageName });
            }
            
            // Clean state to prevent reload loops
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    // --- COMPUTED DATA ---
    const displayedPosts = useMemo(() => {
        if (!reportData?.posts) return [];
        const start = (page - 1) * pageSize;
        return reportData.posts.slice(start, start + pageSize);
    }, [reportData, page, pageSize]);

    const totalPages = reportData?.posts ? Math.ceil(reportData.posts.length / pageSize) : 0;

    // --- API CALLS ---
const fetchPageNames = async () => {
    try {
        // ✅ Explicitly request facebook pages
        const response = await api.get('/user/page-names?platform=facebook');

        const options = response.data.map((item: any) => ({
            value: item.name, 
            label: item.name,
            creator: item.creator_name // ✅ Store the person who originally added it
        }));

        setPageOptions(options);
    } catch (error) { 
        console.error("Failed to fetch shared pages", error); 
    }
};

const getPageNameString = (input: any) => {
    if (!input) return '';
    // If it's an object like { label: 'My Page', value: 123 }
    if (typeof input === 'object' && 'label' in input) {
        return input.label;
    }
    // If it's already a string
    return String(input);
};

    const handleCreatePage = (inputValue: string) => {
        const newOption = { label: inputValue, value: inputValue };
        setPageOptions((prev) => [...prev, newOption]);
        setPageName(newOption);
    };



    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) setFile(e.target.files[0]);
    };

const handleSwitchReport = (report: any) => {
        const safeName = getPageNameString(pageName); // ✅ Extract string first

        setReportData(report.report_data);
        setCurrentReportId(report.id); // ✅ Update Active ID
        
        navigate('.', { 
            state: { 
                preloadedData: report.report_data,
                pageName: safeName, // ✅ Pass string, not object
                pageId: pageId,
                backPath: location.state?.backPath,
                currentReportId: report.id
            },
            replace: true 
        });

        
        toast.success(
  `Switched to report from ${new Date(report.start_date).toLocaleDateString()} 
   to ${new Date(report.end_date).toLocaleDateString()}`
);

    };
    

// 2. Updated Generate Function
    const handleGenerate = async () => {
        if (!pageName) { toast.error('Please select a Page Name'); return; }
        if (!file) { toast.error('Please upload a file'); return; }

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('platform', 'facebook');
        
        // ✅ KEY: We still send 'page_name' so the Backend can find/create the Page ID
        formData.append('page_name', pageName.value);

        const token = localStorage.getItem('token');
        const apiPromise = api.post('/generate-report', formData, {
            // ✅ GOOD: Browser automatically adds Content-Type with the correct Boundary
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });


        toast.promise(apiPromise, {
            loading: 'Analyzing & Linking data...',
            success: (response) => {
                const data = response.data.data || response.data;
                setReportData(data);
                setPage(1);
                
                // Refresh the list in case a new Page was just created in the DB
                fetchPageNames();
                
                return 'Report Ready!';
            },
            error: (err) => err.response?.data?.message || 'Failed to process data.'
        }).finally(() => setLoading(false));

    };

    const exportCSV = () => {
        if (!reportData?.posts) return;
        const headers = ["Date", "Title", "Type", "Views", "Reach", "Reactions", "Comments", "Shares", "Clicks", "Engagement Rate", "Link"];
        const rows = reportData.posts.map((post: any) => [
            post.date,
            `"${post.title.replace(/"/g, '""')}"`,
            post.type,
            post.views,
            post.reach,
            post.reactions,
            post.comments,
            post.shares,
            post.link_clicks,
            `${post.engagement_rate}%`,
            post.link
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map((e: any[]) => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `FB_Report_${reportData.period.end}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    // --- HELPERS ---
    const fmt = (num: number) => num ? num.toLocaleString() : '0';
    const truncate = (str: string, n: number) => (str.length > n ? str.substr(0, n - 1) + '...' : str);

    // FIX: Updated to handle plurals like 'Videos', 'Reels'

    const getBreakdownChart = () => {
        const reels = reportData?.breakdown?.reels || 0;
        const videos = reportData?.breakdown?.videos || 0;
        const photos = reportData?.breakdown?.photos || 0;
        return {
            series: [reels, videos, photos],
            options: {
                chart: { type: 'donut', height: 200, fontFamily: 'Nunito, sans-serif' },
                labels: ['Reels', 'Videos', 'Photos'],
                colors: ['#FE2C55', '#000000', '#1877F2'], 
                legend: { position: 'bottom' },
                dataLabels: { enabled: false },
                stroke: { show: false },
                plotOptions: { pie: { donut: { size: '65%' } } }
            }
        };
    };

const handleCreateNew = () => {
        // 1. Reset Report Data
        setReportData(null);
        setPageId(null);
        setPageName(null);
        setCurrentReportId(null);
        setIsHistoryOpen(false);

        // 2. ✅ CLEAR THE FILE STATE (Crucial!)
        // Check your code for the exact name: setFile(null) or setFiles([])
        setFile(null); 
        
        // 3. ✅ FORCE RESET UPLOAD COMPONENT
        // This makes the inputs forget the old file completely
        setResetKey(prev => prev + 1);

        // 4. Clear History
        navigate('.', { replace: true, state: {} });
    };

    return (
        <div className="space">

            {/* --- CSS FOR PRINTING --- */}
            <style>{`
                @media print {
                    /* Hide everything by default */
                    body * {
                        visibility: hidden;
                    }
                    /* Show only the report container */
                    #report-content, #report-content * {
                        visibility: visible;
                    }
                    /* Position the report at the top left */
                    #report-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 20px;
                        background: white;
                        color: black !important;
                    }
                    /* Hide buttons inside the report */
                    .no-print {
                        display: none !important;
                    }
                    /* Ensure tables print fully */
                    .table-responsive {
                        overflow: visible !important;
                    }
                }
            `}</style>

            {/* HEADER (Hidden on Print) */}

    <div>
        {/* ================= HEADER ================= */}
        <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    {/* Back Button */}
                    {showBackButton && (
                        <Link 
                            to={backPath} 
                            className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all shadow-sm hover:shadow-md"
                            title="Go Back"
                        >
                            <IconArrowLeft size={20} />
                        </Link>
                    )}

                    {/* Icon with Gradient */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                        <IconBrandFacebook size={24} className="text-primary" />
                    </div>
                    
                    {/* Title Section */}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Facebook Analytics</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                            {backPath.includes('manager') 
                                ? 'Viewing report from Account Manager' 
                                : 'Process exports to analyze Reels & Photos'}
                        </p>
                    </div>
                </div>
                
                {/* Action Buttons */}
<div className="flex items-center gap-2">
    {pageId && (
        <button
            onClick={() => setIsHistoryOpen(true)}
            className="h-10 px-3 sm:px-4
                       flex items-center gap-2
                       rounded-lg
                       bg-gray-100 dark:bg-[#1c1e21]
                       border border-gray-200 dark:border-gray-700
                       text-gray-700 dark:text-gray-300
                       hover:border-[#1877F2] hover:text-[#1877F2]
                       hover:bg-[#1877F2]/10
                       active:scale-95
                       transition-all duration-200
                       shadow-sm
                       group"
            aria-label="View history"
        >
            <IconHistory size={18} />
            <span className="hidden sm:inline text-sm font-medium">
                History
            </span>
        </button>
    )}

    {reportData && (
        <button
            onClick={handleCreateNew}
            className="h-10 px-3 sm:px-5
                       flex items-center gap-2
                       rounded-lg
                       bg-[#1877F2]
                       hover:bg-[#166fe5]
                       text-white font-semibold text-sm
                       border border-[#1877F2]
                       hover:shadow-lg hover:shadow-[#1877F2]/30
                       active:scale-95
                       transition-all duration-200
                       group"
            aria-label="Create new report"
        >
            <IconPlus
                size={18}
                className="transition-transform duration-200 group-hover:rotate-90"
            />
            <span className="hidden sm:inline">
                Create New
            </span>
        </button>
    )}
</div>

            </div>

            
        </div>

        {/* ================= MAIN CONTENT ================= */}
{!reportData && (
  <div className="max-w-4xl mx-auto">
    {/* Header */}
    <div className="text-center mb-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
        Facebook Analytics Report
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-400">
        Generate comprehensive insights from your Facebook page data
      </p>
    </div>

    {/* Main Card */}
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <IconBrandFacebook size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              Facebook Analytics Generator
            </h2>
            <p className="text-white/90 text-sm mt-1">
              Two-step process to generate your performance report
            </p>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-8 lg:p-10">
        <div className="space-y-12">
          {/* Step 1 */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 text-lg border border-blue-100 dark:border-blue-800">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Select Facebook Page
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  Choose an existing page or create a new one for analysis
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Facebook Page Selection
              </label>
              <CreatableSelect
                isClearable
                options={pageOptions}
                value={pageName}
                onChange={setPageName}
                onCreateOption={handleCreatePage}
                placeholder="Select page or create new..."
                formatCreateLabel={(inputValue) => `Create: "${inputValue}"`}
                formatOptionLabel={(option: any) => (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 dark:text-gray-100">{option.label}</span>
                    {option.creator && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded text-blue-700 dark:text-blue-400">
                        Added by {option.creator}
                      </span>
                    )}
                  </div>
                )}
                menuPlacement="auto"
                classNames={{
                  control: ({ isFocused }) => `
                    !min-h-12 !rounded-lg !border !bg-white dark:!bg-gray-800
                    !px-3 !py-2 !shadow-sm !border-gray-300 dark:!border-gray-600
                    ${isFocused 
                      ? '!border-blue-500 !ring-2 !ring-blue-500/20' 
                      : 'hover:!border-gray-400 dark:hover:!border-gray-500'
                    }
                  `,
                  input: () => '!text-gray-900 dark:!text-gray-100 !text-sm',
                  singleValue: () => '!text-gray-900 dark:!text-gray-100 !font-medium',
                  placeholder: () => '!text-gray-500 dark:!text-gray-400',
                  menu: () => '!mt-2 !rounded-lg !border !border-gray-200 dark:!border-gray-700 !shadow-xl !bg-white dark:!bg-gray-800',
                  menuList: () => '!py-2 !max-h-64',
                  option: ({ isFocused, isSelected }) => `
                    !px-4 !py-3 !text-sm !transition-colors
                    ${isSelected 
                      ? '!bg-blue-500 !text-white' 
                      : isFocused 
                      ? '!bg-gray-100 dark:!bg-gray-700 !text-gray-900 dark:!text-gray-100' 
                      : '!text-gray-900 dark:!text-gray-200'
                    }
                  `,
                  dropdownIndicator: () => '!text-gray-500 hover:!text-gray-700',
                  clearIndicator: () => '!text-gray-500 hover:!text-red-600',
                }}
                styles={{
                  menuList: (base) => ({
                    ...base,
                    '::-webkit-scrollbar': { width: '6px' },
                    '::-webkit-scrollbar-track': { background: 'transparent' },
                    '::-webkit-scrollbar-thumb': { 
                      background: '#3b82f6', 
                      borderRadius: '4px' 
                    },
                  }),
                }}
              />

              {/* Selection Confirmation */}
              {pageName && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        Selected: <span className="font-semibold">{pageName.label}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 2 */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 text-lg border border-blue-100 dark:border-blue-800">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Upload Data Files
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  Upload exported data from Facebook Analytics
                </p>
              </div>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/5 transition-colors">
              <div className="max-w-md mx-auto space-y-6" key={resetKey}>
                <div className="relative">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={handleFileChange}
                    accept=".csv,.xlsx,.xls"
                    id="facebook-file-upload"
                  />
                  <label
                    htmlFor="facebook-file-upload"
                    className="block w-full p-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 cursor-pointer hover:border-blue-500 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <svg className="w-7 h-7 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5.5 5.5 0 1117.9 6h.1a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Click to upload or drag & drop
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          CSV, XLSX, XLS (Max 10MB)
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                {file && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">
                      ✓ File selected: <span className="font-semibold">{file.name}</span>
                    </p>
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={loading || !pageName || !file}
                  className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing Data...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate Analytics Report
                    </>
                  )}
                </button>


                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <p>Ensure your file contains standard Facebook export columns</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Features Grid */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-500/10 dark:to-blue-500/5 rounded-xl border border-blue-200 dark:border-blue-500/20 p-6">
        <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Performance Analytics</h4>
        <p className="text-sm text-blue-700/80 dark:text-blue-400/80">
          Detailed insights into engagement, reach, and audience behavior
        </p>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-500/10 dark:to-purple-500/5 rounded-xl border border-purple-200 dark:border-purple-500/20 p-6">
        <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">Export Ready Reports</h4>
        <p className="text-sm text-purple-700/80 dark:text-purple-400/80">
          Professional reports in multiple formats for presentations and analysis
        </p>
      </div>

      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-500/10 dark:to-emerald-500/5 rounded-xl border border-emerald-200 dark:border-emerald-500/20 p-6">
        <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2">Secure Processing</h4>
        <p className="text-sm text-emerald-700/80 dark:text-emerald-400/80">
          Your data is processed securely and never stored permanently
        </p>
      </div>
    </div>
  </div>
)}
    </div>
            {/* --- REPORT CONTAINER (ID used for printing) --- */}
            {reportData && (
                <div id="report-content" className="animate-fade-in-up space-y-6">
                    
                    {/* 1. REPORTING PERIOD */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Left Panel - Facebook Blue Theme */}
  <div className="panel bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 text-white p-6 rounded-lg shadow-lg">
    {/* Header with subtle decoration */}
    <div className="mb-8 border-b border-white/10 pb-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-1 h-10 lg:h-14 bg-gradient-to-b from-blue-300 to-white rounded-full"></div>
        <div>
          <h4 className="text-sm font-semibold text-blue-100 uppercase tracking-wider">Reporting Period</h4>
          <div className="lg:text-2xl text-lg font-bold mt-1">
            {reportData?.period?.start || 'N/A'} — {reportData?.period?.end || 'N/A'}
          </div>
        </div>
      </div>
    </div>

    {/* Metrics Grid */}
    <div className="grid grid-cols-1 gap-4">
      {/* Total Posts Card */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-3xl font-bold mb-1">
              {reportData?.total_content || 0}
            </div>
            <div className="text-sm text-blue-100">Total Posts</div>
          </div>
          {/* Icon/Decoration */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Duration Card */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-3xl font-bold mb-1">
              {reportData?.period?.duration || '-'}
            </div>
            <div className="text-sm text-blue-100">Duration</div>
          </div>
          {/* Icon/Decoration */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    {/* Footer Stats - Facebook Platform Metrics */}
    <div className="mt-6 pt-5 border-t border-white/10">
      <div className="flex justify-between text-sm">
        <div className="text-center">
          <div className="text-lg font-semibold text-white">{reportData?.kpi?.reactions || '0'}</div>
          <div className="text-blue-100">Reactions</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-white">{reportData?.kpi?.comments || '0'}</div>
          <div className="text-blue-100">Comments</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-white">{reportData?.kpi?.shares || '0'}</div>
          <div className="text-blue-100">Shares</div>
        </div>
      </div>
    </div>
  </div>

  {/* Right Panel - Content Strategy */}
  <div className="panel lg:col-span-2 p-5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Content Strategy</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Breakdown of post types</p>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FE2C55]"></div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Reels</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#1877F2]"></div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Photos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-black dark:bg-gray-600"></div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Videos</span>
          </div>
        </div>
      </div>
    </div>

    {/* Bar Chart Container */}
    <div className="relative h-64 w-full">
      {/* @ts-ignore */}
      <ReactApexChart 
        options={{
          chart: {
            type: 'bar',
            height: '100%',
            toolbar: { show: false },
            background: 'transparent',
            fontFamily: 'Inter, sans-serif',
          },
          plotOptions: {
            bar: {
              horizontal: false,
              columnWidth: '60%',
              borderRadius: 6,
              borderRadiusApplication: 'end',
              borderRadiusWhenStacked: 'last',
            },
          },
          dataLabels: { enabled: false },
          stroke: {
            show: true,
            width: 2,
            colors: ['transparent'],
          },
          colors: ['#FE2C55', '#1877F2', '#000000'],
          grid: {
            borderColor: '#e5e7eb',
            strokeDashArray: 4,
            xaxis: { lines: { show: false } },
            yaxis: { lines: { show: true } },
          },
          xaxis: {
            categories: ['Reels', 'Photos', 'Videos'],
            labels: {
              style: {
                colors: '#6b7280',
                fontSize: '12px',
                fontWeight: 500,
                cssClass: 'dark:text-gray-400',
              },
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
          },
          yaxis: {
            labels: {
              style: {
                colors: '#6b7280',
                fontSize: '11px',
                cssClass: 'dark:text-gray-400',
              },
              formatter: (value) => {
                if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
                return value;
              },
            },
          },
          tooltip: {
            theme: 'dark',
            y: {
              formatter: (val) => val.toLocaleString(),
            },
          },
          responsive: [{
            breakpoint: 640,
            options: {
              plotOptions: {
                bar: { columnWidth: '70%' }
              },
              xaxis: {
                labels: { fontSize: '10px' }
              }
            }
          }]
        }}
        series={[{
          name: 'Content Types',
          data: [
            reportData?.breakdown?.reels || 0,
            reportData?.breakdown?.photos || 0,
            reportData?.breakdown?.videos || 0
          ]
        }]}
        type="bar"
        height="100%"
      />
    </div>

    {/* Total Content */}
    <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Content</span>
        <span className="text-lg font-bold text-gray-900 dark:text-white">
          {fmt((reportData?.breakdown?.reels || 0) + (reportData?.breakdown?.photos || 0) + (reportData?.breakdown?.videos || 0))}
        </span>
      </div>
      {/* Distribution Percentage */}
      <div className="flex items-center gap-4 mt-3">
        {['Reels', 'Photos', 'Videos'].map((type, index) => {
          const value = [
            reportData?.breakdown?.reels || 0,
            reportData?.breakdown?.photos || 0,
            reportData?.breakdown?.videos || 0
          ][index];
          const total = (reportData?.breakdown?.reels || 0) + (reportData?.breakdown?.photos || 0) + (reportData?.breakdown?.videos || 0);
          const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
          
          return (
            <div key={type} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#FE2C55]"
                   style={{ backgroundColor: index === 0 ? '#FE2C55' : index === 1 ? '#1877F2' : '#000000' }}></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">{percentage}% {type}</span>
            </div>
          );
        })}
      </div>
    </div>
  </div>
</div>

                    {/* 2. KPI GRID */}
                    <div>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-800 dark:text-blue-400">
                            <IconChartBar /> Key Performance Indicators
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <KPICard title="Total Views" value={reportData?.kpi?.views} icon={<IconEye size={20}/>} color="text-blue-600" />
                            <KPICard title="Total Reach" value={reportData?.kpi?.reach} icon={<IconShare size={20} className="rotate-180"/>} color="text-teal-600" />
                            <KPICard title="Reactions" value={reportData?.kpi?.reactions} icon={<IconThumbUp size={20}/>} color="text-pink-600" />
                            <KPICard title="Comments" value={reportData?.kpi?.comments} icon={<IconMessage size={20}/>} color="text-purple-600" />
                            <KPICard title="Shares" value={reportData?.kpi?.shares} icon={<IconShare size={20}/>} color="text-indigo-600" />
                            <KPICard title="Link Clicks" value={reportData?.kpi?.link_clicks} icon={<IconClick size={20}/>} color="text-orange-600" />
                        </div>
                    </div>

                    {/* 3. CHAMPION PERFORMERS */}
{reportData?.champions && (
    <div className="relative overflow-hidden bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-50 dark:from-yellow-950/20 dark:via-orange-950/20 dark:to-yellow-950/20 p-8 rounded-2xl border-2 border-yellow-200/50 dark:border-yellow-800/30 shadow-lg">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-200/20 dark:bg-yellow-600/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-200/20 dark:bg-orange-600/5 rounded-full blur-3xl -ml-32 -mb-32"></div>
        
        <div className="relative">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg">
                    <IconTrophy size={24} className="text-white" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-700 to-orange-600 dark:from-yellow-400 dark:to-orange-400 bg-clip-text text-transparent">
                        Champion Performers
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Top performing content across all metrics</p>
                </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <ChampionCard 
                    label="Highest Views" 
                    metric={`${fmt(reportData.champions.highest_view?.views || 0)} views`} 
                    post={reportData.champions.highest_view} 
                    color="border-l-blue-500" 
                    icon={IconEye}
                />
                <ChampionCard 
                    label="Highest Reach" 
                    metric={`${fmt(reportData.champions.highest_reach?.reach || 0)} reached`} 
                    post={reportData.champions.highest_reach} 
                    color="border-l-teal-500" 
                    icon={IconTrendingUp}
                />
                <ChampionCard 
                    label="Highest Engagement" 
                    metric={`${fmt(reportData.champions.highest_engagement?.total_engagement || 0)} interactions`} 
                    subMetric={`${fmt(reportData.champions.highest_engagement?.engagement_rate || 0)}% Rate`} 
                    post={reportData.champions.highest_engagement} 
                    color="border-l-pink-500" 
                    icon={IconHeart}
                />
                <ChampionCard 
                    label="Highest Comments" 
                    metric={`${fmt(reportData.champions.highest_comments?.comments || 0)} comments`} 
                    post={reportData.champions.highest_comments} 
                    color="border-l-purple-500" 
                    icon={IconMessageCircle}
                />
                <ChampionCard 
                    label="Highest Shares" 
                    metric={`${fmt(reportData.champions.highest_shares?.shares || 0)} shares`} 
                    post={reportData.champions.highest_shares} 
                    color="border-l-indigo-500" 
                    icon={IconShare2}
                />
                <ChampionCard 
                    label="Highest Link Clicks" 
                    metric={`${fmt(reportData.champions.highest_clicks?.link_clicks || 0)} clicks`} 
                    post={reportData.champions.highest_clicks} 
                    color="border-l-orange-500" 
                    icon={IconClick}
                />
            </div>
        </div>
    </div>
)}

                    {/* 4. CONTENT TABLE (Paginated & Clean) */}
                    <div className="panel p-0 overflow-hidden print:shadow-none print:border-none">
                        <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center no-print">
                            <h3 className="text-lg font-bold">Complete Content Analysis</h3>
                            <div className="flex gap-2">
                                <Tippy content="Export as Excel"
                                        theme='success'
                                        animation="shift-away"
                                        trigger="mouseenter"
                                        duration={200}
                                        hideOnClick={true} >
                                <button className="btn btn-sm btn-outline-success gap-2" onClick={exportCSV}>
                                    <IconFileSpreadsheet size={16}/> CSV
                                </button>
                                </Tippy>

                                <Tippy  content="Print as PDF"
                                        theme='primary'
                                        animation="shift-away"
                                        trigger="mouseenter"
                                        duration={200}
                                        hideOnClick={true}>
                                <button className="btn btn-sm btn-outline-primary gap-2" onClick={() => window.print()}>
                                    <IconPrinter size={16}/> PDF
                                </button>
                                </Tippy>
                            </div>
                        </div>

                        {/* TABLE */}
                        <div className="table-responsive">
                            <table className="table-striped table-hover w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-700">
                                        <th className="p-3">Content Title</th>
                                        <th className="p-3 text-center">Type</th>
                                        <th className="p-3 text-right">Views</th>
                                        <th className="p-3 text-right">Reach</th>
                                        <th className="p-3 text-right">Reactions</th>
                                        <th className="p-3 text-right">Comments</th>
                                        <th className="p-3 text-right">Shares</th>
                                        <th className="p-3 text-right">Clicks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedPosts.map((post: any, index: number) => (
                                        <tr key={index} className="border-b dark:border-gray-700">
                                            <td className="p-3 min-w-[250px]">
                                                <a href={post.link} target="_blank" rel="noreferrer" className="font-semibold text-blue-600 hover:underline block truncate max-w-[300px]">
                                                    {truncate(post.title || 'Untitled Post', 50)}
                                                </a>
                                                <span className="text-xs text-gray-500 block">{post.date ? new Date(post.date).toLocaleDateString() : '-'}</span>
                                            </td>
                                            <td className="p-3 text-center">{getTypeIcon(post.type)}</td>
                                            <td className="p-3 text-right font-mono">{fmt(post.views)}</td>
                                            <td className="p-3 text-right font-mono">{fmt(post.reach)}</td>
                                            <td className="p-3 text-right font-mono text-pink-600">{fmt(post.reactions)}</td>
                                            <td className="p-3 text-right font-mono">{fmt(post.comments)}</td>
                                            <td className="p-3 text-right font-mono">{fmt(post.shares)}</td>
                                            <td className="p-3 text-right font-mono font-bold text-orange-600">{fmt(post.link_clicks)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* PAGINATION (Hidden on Print) */}
<div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-6 py-5 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/50 dark:to-gray-900/50 rounded-b-xl no-print">
  
  {/* Left section: Rows per page selector */}
  <div className="flex items-center gap-3">
    <div className="relative w-20">
      <Listbox value={pageSize} onChange={setPageSize}>
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-pointer rounded-md bg-white dark:bg-gray-700 py-1.5 pl-3 pr-8 text-left shadow-sm border border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
            <span className="block truncate font-semibold text-gray-900 dark:text-white">{pageSize}</span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <IconChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </span>
          </Listbox.Button>
          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <Listbox.Options className="absolute bottom-full mb-2 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 focus:outline-none z-50">
              {[10, 25, 50, 100].map((size) => (
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

  {/* Right section: Navigation */}
  <div className="flex items-center gap-2">
    {/* First page */}
    <button
      type="button"
      className="p-2 rounded-md w-8 h-8 flex items-center justify-center transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent text-gray-700 dark:text-gray-300"
      onClick={() => setPage(1)}
      disabled={page === 1}
      title="First page"
    >
      <IconChevronsLeft size={18} />
    </button>

    {/* Previous page */}
    <button
      type="button"
      className="p-2 rounded-md w-8 h-8 flex items-center justify-center transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent text-gray-700 dark:text-gray-300"
      onClick={() => setPage(p => Math.max(1, p - 1))}
      disabled={page === 1}
      title="Previous page"
    >
      <IconChevronLeft size={18} />
    </button>

    {/* Page indicator */}
    <div className="px-4 py-1.5 min-w-[120px] text-center bg-white dark:bg-gray-700 rounded-md shadow-sm border border-gray-200 dark:border-gray-600">
      <span className="text-sm">
        <span className="font-semibold text-gray-900 dark:text-white">{page}</span>
        <span className="text-gray-500 dark:text-gray-400"> / {totalPages}</span>
      </span>
    </div>

    {/* Next page */}
    <button
      type="button"
      className="p-2 rounded-md w-8 h-8 flex items-center justify-center transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent text-gray-700 dark:text-gray-300"
      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
      disabled={page === totalPages}
      title="Next page"
    >
      <IconChevronRight size={18} />
    </button>

    {/* Last page */}
    <button
      type="button"
      className="p-2 rounded-md w-8 h-8 flex items-center justify-center transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent text-gray-700 dark:text-gray-300"
      onClick={() => setPage(totalPages)}
      disabled={page === totalPages}
      title="Last page"
    >
      <IconChevronsRight size={18} />
    </button>
  </div>
</div>
                    </div>
                </div>
            )}
            <ReportHistoryDrawer 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        pageId={pageId}
        pageName={pageName}
        onSelectReport={handleSwitchReport}
        activeReportId={currentReportId} // ✅ Updates data instantly
    />
        </div>
    );
};

// --- SUB-COMPONENTS ---
const KPICard = ({ title, value, icon, color }: any) => (
    <div className="panel p-4 flex flex-col justify-between h-full hover:shadow-lg transition-shadow border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
        <div className={`mb-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 w-fit ${color}`}>{icon}</div>
        <div>
            <div className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</div>
            <div className={`text-xl font-extrabold mt-1 ${color}`}>{value ? value.toLocaleString() : '0'}</div>
        </div>
    </div>
);

const ChampionCard = ({ label, metric, subMetric, post, color, icon: Icon }: any) => {
    if (!post) return null;

    return (
        <div className={`relative overflow-hidden bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 ${color} shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group`}>
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-gray-800/50 pointer-events-none"></div>
            
            <div className="relative">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                        {Icon && <Icon size={16} className="text-gray-400 dark:text-gray-500" />}
                        <div className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
                    </div>
                    {post.type && (
                        <span>
                            {getTypeIcon(post.type)}
                        </span>
                    )}
                </div>

                {/* Metrics */}
                <div className="text-3xl font-bold mb-1 bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    {metric}
                </div>
                {subMetric && (
                    <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">
                        {subMetric}
                    </div>
                )}

                {/* Post Info */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm line-clamp-2 italic text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                        "{post.title || 'No caption'}"
                    </p>
                    <a 
                        href={post.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group-hover:gap-2 duration-200"
                    >
                        View Post 
                        <IconEye size={14} className="transition-transform group-hover:scale-110"/>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default FacebookReportGenerator;