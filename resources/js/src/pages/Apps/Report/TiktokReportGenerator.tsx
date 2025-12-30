import { useEffect, useState, useMemo, Fragment } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import { IRootState } from '../../../store';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import ReactApexChart from 'react-apexcharts';
import toast, { Toaster } from 'react-hot-toast';
import CreatableSelect from 'react-select/creatable';
import { Listbox, Transition } from '@headlessui/react';
import ReportHistoryDrawer from './ReportHistoryDrawer';
import usePermission from '../../../hooks/usePermission';
import api from '../../../utils/api'; // Adjust path if needed
import { 
    IconBrandTiktok, IconUpload, IconHeart, 
    IconMessage, IconShare, IconEye, IconChartBar, 
    IconTrophy, IconMovie, IconBookmark,
    IconPrinter, IconFileSpreadsheet, IconChevronLeft, IconChevronRight,
    IconCheck, IconChevronUp, IconArrowLeft, IconHistory, IconChevronsLeft, IconChevronsRight, IconPlus
} from '@tabler/icons-react';

const TiktokReportGenerator = () => {
    const dispatch = useDispatch();
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark');

    // --- NAVIGATION & HISTORY HOOKS ---
    const location = useLocation();
    const navigate = useNavigate();
    const {can} = usePermission();

    // --- STATE ---
    const [resetKey, setResetKey] = useState(0);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<any>(null);
    const [pageOptions, setPageOptions] = useState<any[]>([]);
    
    // History Flag
    const [isFromHistory, setIsFromHistory] = useState(false);

        const getPageNameString = (input: any) => {
        if (!input) return '';
        if (typeof input === 'object' && 'label' in input) return input.label;
        return String(input);
    };

    const [pageName, setPageName] = useState<any>(
    location.state?.pageName 
        ? { label: location.state.pageName, value: location.state.pageName } 
        : null
    );
    const [pageId, setPageId] = useState(location.state?.pageId || null);

    // ✅ Drawer State
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [currentReportId, setCurrentReportId] = useState<number | null>(location.state?.currentReportId || null);
    
    // ✅ Back Path Logic
    const backPath = location.state?.backPath || '/apps/report/history';
    const showBackButton = !!location.state?.preloadedData;

    // Pagination State
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);



    useEffect(() => {
        dispatch(setPageTitle('TikTok Report Generator'));
        fetchPageNames();
    }, []);

    // ✅ AUTO-LOAD DATA FROM HISTORY
    useEffect(() => {
        if (location.state?.preloadedData) {
            console.log("Loading History Data:", location.state.preloadedData);
            setReportData(location.state.preloadedData);
            setIsFromHistory(true);
            
            if (location.state?.pageName) {
                setPageName({ label: location.state.pageName, value: location.state.pageName });
            }
            
            // Clear navigation state to prevent loops
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

const fetchPageNames = async () => {
    try {
        // ✅ Explicitly request facebook pages
        const response = await api.get('/user/page-names?platform=tiktok');

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


    const handleCreatePage = (inputValue: string) => {
        const newOption = { label: inputValue, value: inputValue };
        setPageOptions([...pageOptions, newOption]);
        setPageName(newOption);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) setFile(e.target.files[0]);
    };

    const handleGenerate = async () => {
        if (!pageName) { toast.error('Please select a Profile Name'); return; }
        if (!file) { toast.error('Please upload a file'); return; }

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('platform', 'tiktok'); // ✅ Specific Platform
        formData.append('page_name', pageName.value);

        const token = localStorage.getItem('token');
        const apiPromise = api.post('/generate-report', formData, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });

        toast.promise(apiPromise, {
            loading: 'Analyzing TikTok data...',
            success: (response) => {
                const data = response.data.data || response.data;
                setReportData(data);
                setPage(1);
                setIsFromHistory(false);
                return 'Report Ready!';
            },
            error: (err) => err.response?.data?.message || 'Failed to process data.'
        }).finally(() => setLoading(false));
    };

    const handleSwitchReport = (report: any) => {
        const safeName = getPageNameString(pageName);

        setReportData(report.report_data);
        setCurrentReportId(report.id); // ✅ Update Active ID
        
        // Update URL state so Back button still works
        navigate('.', { 
            state: { 
                preloadedData: report.report_data,
                pageName: safeName,
                pageId: pageId,
                backPath: backPath,
                currentReportId: report.id
            },
            replace: true 
        });

        toast.success(`Switched to report from ${new Date(report.created_at).toLocaleDateString()}`);
    };

    // --- EXPORT TO CSV ---
    const exportCSV = () => {
        if (!reportData?.posts) return;
        
        // Includes "Saves" column
        const headers = ["Date", "Title", "Views", "Likes", "Comments", "Shares", "Saves", "Engagement Rate", "Link"];
        const rows = reportData.posts.map((post: any) => [
            post.date,
            `"${post.title.replace(/"/g, '""')}"`,
            post.views,
            post.likes,
            post.comments,
            post.shares,
            post.saves, // TikTok Specific
            `${post.engagement_rate}%`,
            post.link
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.map((e: any[]) => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `TikTok_Report_${reportData.period.end}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    // --- CHARTS ---
    const getEngagementChart = () => {
        const likes = reportData?.kpi?.likes || 0;
        const comments = reportData?.kpi?.comments || 0;
        const shares = reportData?.kpi?.shares || 0;
        const saves = reportData?.kpi?.saves || 0;

        return {
            series: [likes, comments, shares, saves],
            options: {
                chart: { type: 'donut', height: 200, fontFamily: 'Nunito, sans-serif' },
                labels: ['Likes', 'Comments', 'Shares', 'Saves'],
                // TikTok Brand Colors: Pink, Teal, Black
                colors: ['#FE2C55', '#25F4EE', '#000000', '#FCA5A5'], 
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

    const fmt = (num: number) => num ? num.toLocaleString() : '0';
    const truncate = (str: string, n: number) => (str.length > n ? str.substr(0, n - 1) + '...' : str);

    return (
        <div className="space">

            {/* --- CSS FOR PRINTING --- */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #report-content, #report-content * { visibility: visible; }
                    #report-content { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; background: white; color: black !important; }
                    .no-print { display: none !important; }
                    .table-responsive { overflow: visible !important; }
                }
            `}</style>

            {/* HEADER */}
    <div className="flex items-center justify-between no-print mb-5">
    <div className="flex items-center gap-3">
        {showBackButton && (
            <Link 
                to={backPath} 
                className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:border-gray-900 hover:text-gray-900 dark:hover:border-white dark:hover:text-white hover:scale-105 active:scale-95 transition-all shadow-sm"
                title="Go Back"
            >
                <IconArrowLeft size={20} />
            </Link>
        )}

        <div className="bg-gradient-to-br from-black to-gray-900 p-3 rounded-xl text-white shadow-lg shadow-black/25">
            <IconBrandTiktok size={24} />
        </div>
        
        <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white truncate">
                TikTok Analytics
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mt-0.5 truncate">
                {backPath.includes('manager') ? 'Viewing report from Account Manager' : 'Analyze your TikTok content performance.'}
            </p>
        </div>
    </div>

    <div className="flex gap-2">
        {pageId && (
                    <button 
                        onClick={() => setIsHistoryOpen(true)}
                        className="h-10 px-3 sm:px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 active:scale-95 transition-all font-medium text-sm shadow-sm"
                    >
                        <IconHistory size={18} />
                        <span className="hidden sm:inline">History</span>
                    </button>
        )}
        {reportData && (
        
            <button 
                onClick={handleCreateNew} 
                className="h-10 px-5 bg-gray-700 text-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700  rounded-lg
                flex items-center gap-2 dark:text-gray-300 hover:border-gray-900 dark:hover:border-gray-400 dark:hover:text-white hover:shadow-gray-600/40 transition-all shadow-sm"
            >
                <IconPlus size={18} strokeWidth={2.5} />
                <span>Create New</span>
            </button>
        )}
    </div>
</div>

            {/* INPUT SECTION (Hidden if data exists) */}
      {!reportData && (
  <div className="max-w-4xl mx-auto py-12 px-4 no-print">
    {/* Header */}
    <div className="text-center mb-12">
      <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        Create Your TikTok Report
      </h2>
      <p className="text-lg text-gray-600 dark:text-gray-400">
        Select your profile and upload your data to generate comprehensive analytics
      </p>
    </div>

    {/* Single Unified Card – TikTok Accent */}
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* TikTok-inspired header bar */}
      <div className="bg-black px-8 py-5 flex items-center gap-4">
        <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
        <h3 className="text-2xl font-semibold text-white">
          TikTok Profile Analytics Generator
        </h3>
      </div>

      <div className="p-8 lg:p-12">
        <div className="space-y-12">
          {/* Step 1: Select TikTok Profile */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md">
                1
              </div>
              <h4 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Select TikTok Profile
              </h4>
            </div>

            <CreatableSelect
              isClearable
              options={pageOptions}
              value={pageName}
              onChange={setPageName}
              onCreateOption={handleCreatePage}
              placeholder="Select or Type New..."
              formatCreateLabel={(inputValue) => `Create new: "${inputValue}"`}
formatOptionLabel={(option: any) => (
        <div className="flex items-center justify-between">
            <span className="font-medium text-white-dark">{option.label}</span>
            {option.creator && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                    Added by {option.creator}
                </span>
            )}
        </div>
    )}
              menuPlacement="auto"

              classNames={{
                // Main control (input box)
                control: ({ isFocused, isDisabled }) =>
                  `!min-h-10 !border !rounded-md !bg-white dark:!bg-gray-800 !px-3 !py-2 !text-sm
                   !border-gray-300 dark:!border-gray-600
                   ${isDisabled ? '!opacity-60 !cursor-not-allowed' : '!cursor-pointer'}
                   ${isFocused 
                     ? '!border-black !outline-none !shadow-[0_0_0_3px_rgba(0,0,0,0.2)]' 
                     : '!shadow-sm hover:!border-black'
                   }`,

                // Input text
                input: () => '!text-gray-900 dark:!text-gray-100',

                // Selected single value
                singleValue: () => '!text-gray-900 dark:!text-gray-100',

                // Placeholder
                placeholder: () => '!text-gray-500 dark:!text-gray-400',

                // Dropdown menu
                menu: () => '!mt-1 !bg-white dark:!bg-gray-800 !border !border-gray-300 dark:!border-gray-600 !shadow-xl !z-50 !overflow-hidden',

                // Menu list (scrollable area)
                menuList: () => '!py-1 !max-h-60 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-900 dark:scrollbar-track-gray-900',

                // Individual options
                option: ({ isFocused, isSelected }) =>
                  `!px-4 !py-2.5 !text-sm !transition-all
                   ${isSelected 
                     ? '!bg-black !text-white' 
                     : isFocused 
                       ? '!bg-gray-100 dark:!bg-gray-700 !text-gray-900 dark:!text-gray-100' 
                       : '!text-gray-900 dark:!text-gray-200'
                   }
                   ${isSelected && isFocused ? '!bg-gray-900' : ''}`,

                // Indicators (dropdown arrow, clear button)
                dropdownIndicator: () => '!text-gray-500 hover:!text-gray-700',
                clearIndicator: () => '!text-gray-500 hover:!text-red-600',

                // Hide separator line
                indicatorSeparator: () => '!flex',

                // Multi-value chips
                multiValue: () => '!bg-gray-200 dark:!bg-gray-700 !rounded-md',
                multiValueLabel: () => '!text-gray-900 dark:!text-gray-100',
                multiValueRemove: () => '!hover:bg-red-500 !hover:text-white !rounded-md',
              }}

              styles={{
                input: (base) => ({ ...base, color: 'inherit' }),
                menuList: (base) => ({
                  ...base,
                  '::-webkit-scrollbar': {
                    width: '4px',
                  },
                  '::-webkit-scrollbar-track': {
                    background: 'transparent',
                    borderRadius: '4px',
                  },
                  '::-webkit-scrollbar-thumb': {
                    background: '#000000',
                    borderRadius: '4px',
                  },
                  '::-webkit-scrollbar-thumb:hover': {
                    background: '#333333',
                  },
                }),
              }}
            />

            {/* Selected Profile Indicator */}
            {pageName && (
              <div className="mt-5 flex items-center gap-3 text-base animate-fade-in">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Selected profile:</span>{' '}
                  <span className="font-semibold text-black dark:text-white">{pageName.label}</span>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Upload Data */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md">
                2
              </div>
              <h4 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Upload Your Data
              </h4>
            </div>

            {/* Enhanced Upload Area */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-10 text-center transition-all duration-300 hover:border-black hover:bg-black/5 dark:hover:bg-black/10">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-black/10 dark:bg-black/20 rounded-3xl mb-6">
                  <svg className="w-12 h-12 text-black dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5.5 5.5 0 1117.9 6h.1a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Drag & drop your file here
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  or click to browse • Supported: CSV, XLSX, XLS
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-5" key={resetKey}>
                <input
                  type="file"
                  className="block w-full text-sm text-gray-700 dark:text-gray-300 
                    file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 
                    file:text-sm file:font-semibold file:bg-black file:text-white 
                    hover:file:bg-gray-900 cursor-pointer transition-colors"
                  onChange={handleFileChange}
                  accept=".csv,.xlsx,.xls"
                />

                <button
                  onClick={handleGenerate}
                  disabled={loading || !pageName || !file}
                  className="w-full py-4 px-6 bg-black hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed 
                    text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl 
                    transition-all duration-200 flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
            {/* --- REPORT CONTAINER --- */}
            {reportData && (
                <div id="report-content" className="animate-fade-in-up space-y-6">
                    
                    {/* 1. REPORTING PERIOD */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="panel bg-gradient-to-r from-gray-900 to-gray-800 text-white flex flex-col justify-center">
                            <h4 className="font-semibold opacity-80 mb-1">Reporting Period</h4>
                            <div className="text-xl font-bold mb-4">
                                {reportData?.period?.start || 'N/A'} — {reportData?.period?.end || 'N/A'}
                            </div>
                            <div className="flex justify-between items-end border-t border-white/20 pt-4">
                                <div>
                                    <div className="text-4xl font-extrabold">{reportData?.total_content || 0}</div>
                                    <div className="text-sm opacity-80">Total Videos</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm opacity-80">Duration</div>
                                    <div className="font-bold">{reportData?.period?.duration || '-'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="panel lg:col-span-2 flex items-center justify-between">
                            <div>
                                <h5 className="font-bold text-lg mb-1">Engagement Split</h5>
                                <div className="flex flex-wrap gap-4 mt-2">
                                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#FE2C55]"></span><span className="font-bold">{fmt(reportData?.kpi?.likes)}</span> Likes</div>
                                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#25F4EE]"></span><span className="font-bold">{fmt(reportData?.kpi?.comments)}</span> Comments</div>
                                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#FCA5A5]"></span><span className="font-bold">{fmt(reportData?.kpi?.saves)}</span> Saves</div>
                                </div>
                            </div>
                            <div className="w-[200px]">
                                {/* @ts-ignore */}
                                <ReactApexChart options={getEngagementChart().options} series={getEngagementChart().series} type="donut" height={160} />
                            </div>
                        </div>
                    </div>

                    {/* 2. KPI GRID */}
                    <div>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-black dark:text-white">
                            <IconChartBar /> Key Performance Indicators
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <KPICard title="Total Views" value={reportData?.kpi?.views} icon={<IconEye size={20}/>} color="text-black dark:text-white" />
                            <KPICard title="Total Likes" value={reportData?.kpi?.likes} icon={<IconHeart size={20}/>} color="text-[#FE2C55]" />
                            <KPICard title="Comments" value={reportData?.kpi?.comments} icon={<IconMessage size={20}/>} color="text-[#25F4EE]" />
                            <KPICard title="Shares" value={reportData?.kpi?.shares} icon={<IconShare size={20}/>} color="text-blue-500" />
                            <KPICard title="Saves" value={reportData?.kpi?.saves} icon={<IconBookmark size={20}/>} color="text-yellow-500" />
                        </div>
                    </div>

                    {/* 3. CHAMPIONS */}
                    {reportData?.champions && (
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-black/30 p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800 dark:text-white">
                                <IconTrophy className="text-yellow-500" /> Champion Videos
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                <ChampionCard label="Highest Views" metric={`${fmt(reportData.champions.highest_view?.views || 0)} views`} post={reportData.champions.highest_view} color="border-l-black dark:border-l-white" />
                                <ChampionCard label="Highest Engagement" metric={`${fmt(reportData.champions.highest_engagement?.total_engagement || 0)} interactions`} subMetric={`${fmt(reportData.champions.highest_engagement?.engagement_rate || 0)}% Rate`} post={reportData.champions.highest_engagement} color="border-l-[#FE2C55]" />
                                <ChampionCard label="Most Saved" metric={`${fmt(reportData.champions.highest_saves?.saves || 0)} saves`} post={reportData.champions.highest_saves} color="border-l-yellow-500" />
                            </div>
                        </div>
                    )}

                    {/* 4. CONTENT TABLE */}
                    <div className="panel p-0 overflow-hidden print:shadow-none print:border-none">
                        <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center no-print">
                            <h3 className="text-lg font-bold">Video Performance</h3>
                            <div className="flex gap-2">
                                <button className="btn btn-sm btn-outline-success gap-2" onClick={exportCSV}>
                                    <IconFileSpreadsheet size={16}/> CSV
                                </button>
                                <button className="btn btn-sm btn-outline-primary gap-2" onClick={() => window.print()}>
                                    <IconPrinter size={16}/> PDF
                                </button>
                            </div>
                        </div>

                        <div className="table-responsive">
                            <table className="table-striped table-hover w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-700">
                                        <th className="p-3">Video Title</th>
                                        <th className="p-3 text-right">Views</th>
                                        <th className="p-3 text-right">Likes</th>
                                        <th className="p-3 text-right">Comments</th>
                                        <th className="p-3 text-right">Shares</th>
                                        <th className="p-3 text-right">Saves</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedPosts.map((post: any, index: number) => (
                                        <tr key={index} className="border-b dark:border-gray-700">
                                            <td className="p-3 min-w-[250px]">
                                                <a href={post.link} target="_blank" rel="noreferrer" className="font-semibold text-black dark:text-white hover:underline block truncate max-w-[300px]">
                                                    {truncate(post.title || 'Untitled Video', 50)}
                                                </a>
                                                <span className="text-xs text-gray-500 block">{post.date ? new Date(post.date).toLocaleDateString() : '-'}</span>
                                            </td>
                                            <td className="p-3 text-right font-mono">{fmt(post.views)}</td>
                                            <td className="p-3 text-right font-mono text-[#FE2C55]">{fmt(post.likes)}</td>
                                            <td className="p-3 text-right font-mono">{fmt(post.comments)}</td>
                                            <td className="p-3 text-right font-mono">{fmt(post.shares)}</td>
                                            <td className="p-3 text-right font-mono font-bold text-yellow-600">{fmt(post.saves)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* PAGINATION */}
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
            {/* ✅ HISTORY DRAWER */}
            <ReportHistoryDrawer 
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                pageId={typeof pageId === 'object' ? pageId?.value : pageId}
                pageName={pageName}
                onSelectReport={handleSwitchReport}
                activeReportId={currentReportId}
            />
        </div>
    );
};

// --- SUB COMPONENTS ---
const KPICard = ({ title, value, icon, color }: any) => (
    <div className="panel p-4 flex flex-col justify-between h-full hover:shadow-lg transition-shadow border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
        <div className={`mb-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 w-fit ${color}`}>{icon}</div>
        <div>
            <div className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</div>
            <div className={`text-xl font-extrabold mt-1 ${color}`}>{value ? value.toLocaleString() : '0'}</div>
        </div>
    </div>
);

const ChampionCard = ({ label, metric, subMetric, post, color }: any) => {
    if (!post) return null;
    return (
        <div className={`panel p-4 border-l-4 ${color} shadow-sm hover:shadow-md transition-all`}>
            <div className="flex justify-between items-start mb-2">
                <div className="text-xs font-bold uppercase text-gray-400">{label}</div>
                <div className="flex items-center gap-1 text-black dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-[10px]"><IconMovie size={12}/> Video</div>
            </div>
            <div className="text-2xl font-bold mb-1">{metric}</div>
            {subMetric && <div className="text-xs font-bold text-gray-500 mb-3">{subMetric}</div>}
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-sm line-clamp-2 italic text-gray-600 dark:text-gray-400 mb-2">"{post.title || 'No caption'}"</p>
                <a href={post.link} target="_blank" className="text-xs text-blue-600 hover:underline flex items-center gap-1">Watch Video <IconEye size={12}/></a>
            </div>
        </div>
    );
};

export default TiktokReportGenerator;