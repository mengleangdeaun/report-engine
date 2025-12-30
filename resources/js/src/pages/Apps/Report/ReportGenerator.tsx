import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import { IRootState } from '../../../store';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import toast, { Toaster } from 'react-hot-toast'; // <--- NEW LIBRARY
import axios from 'axios';
import CreatableSelect from 'react-select/creatable';
import { 
    IconBrandTiktok, 
    IconBrandFacebook, 
    IconShare, 
    IconDownload, 
    IconEye, 
    IconHistory, 
    IconCopy
} from '@tabler/icons-react';

const ReportGenerator = () => {
    const dispatch = useDispatch();
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark');

    // --- STATE ---
    const [balance, setBalance] = useState(0);
    const [platform, setPlatform] = useState<string>('tiktok');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    
    // Select Inputs
    const [pageOptions, setPageOptions] = useState<any[]>([]);
    const [pageName, setPageName] = useState<any>(null);
    
    // Data & History
    const [reportData, setReportData] = useState<any>(null);
    const [recentReports, setRecentReports] = useState<any[]>([]);

    useEffect(() => {
        dispatch(setPageTitle('Social Media Report Generator'));
        fetchUserBalance();
        fetchPageNames();
        fetchReportHistory();
    }, []);

    // --- API CALLS ---
    const fetchUserBalance = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8000/api/user', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBalance(response.data.token_balance);
        } catch (error) { console.error("Failed to fetch balance"); }
    };

    const fetchPageNames = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8000/api/user/page-names', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPageOptions(response.data.map((name: string) => ({ value: name, label: name })));
        } catch (error) { console.error(error); }
    };

    const fetchReportHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8000/api/reports/history', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Robust check to ensure we always set an array
            let historyData = [];
            if (Array.isArray(response.data)) {
                historyData = response.data;
            } else if (response.data && Array.isArray(response.data.data)) {
                historyData = response.data.data;
            }

            setRecentReports(historyData);
        } catch (error) { 
            console.error("Failed to fetch history");
            setRecentReports([]); 
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

    // --- GENERATE ACTION (Using React Hot Toast) ---
    const handleGenerate = async () => {
        if (!pageName || !file) {
            toast.error('Please select a page and upload a file.');
            return;
        }

        if (balance < 10) {
            toast.error('Insufficient Tokens (Need 10 🪙)');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('platform', platform);
        formData.append('page_name', pageName?.value || '');

        const token = localStorage.getItem('token');
        
        // toast.promise handles loading, success, and error states automatically
        const apiPromise = axios.post('http://localhost:8000/api/generate-report', formData, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });

        toast.promise(apiPromise, {
            loading: 'Analyzing data & generating report...',
            success: (response) => {
                setBalance(response.data.new_balance);
                setReportData(response.data.data);
                fetchReportHistory(); // Refresh sidebar
                return 'Report Generated Successfully!';
            },
            error: (err) => {
                return err.response?.data?.message || 'Failed to process file.';
            },
        }).finally(() => {
            setLoading(false);
        });
    };

    // --- SHARE ACTION ---
    const copyShareLink = () => {
        if (reportData?.public_url) {
            navigator.clipboard.writeText(reportData.public_url);
            toast.success('Link copied to clipboard!');
        } else {
            toast.error('No public link available.');
        }
    };

    // --- HELPER: FORMAT NUMBERS ---
    const fmt = (num: number) => num ? num.toLocaleString() : '0';

    // --- CHART CONFIG ---
// --- CHART CONFIG ---
    const getChartOptions = (): ApexOptions => {
        return {
            chart: {
                type: 'area',
                height: 300,
                toolbar: { show: false },
            },
            colors: platform === 'tiktok' ? ['#000000', '#25F4EE'] : ['#1877F2', '#4267B2'],
            stroke: { curve: 'smooth', width: 2 },
            dataLabels: { enabled: false },
            xaxis: {
                categories: ['Views', 'Likes', 'Comments', 'Shares', platform === 'facebook' ? 'Reach' : 'Saves'],
                axisBorder: { show: false },
                axisTicks: { show: false },
            },
            yaxis: {
                show: true,
            },
            grid: {
                borderColor: isDark ? '#191e3a' : '#e0e6ed',
            },
            tooltip: {
                theme: isDark ? 'dark' : 'light',
            },
        };
    };

    const getChartSeries = () => {
        if (!reportData) return [];
        const data = [
            reportData.total_views, 
            reportData.total_likes, 
            reportData.total_comments, 
            reportData.total_shares,
            platform === 'facebook' ? reportData.total_reach : reportData.total_saves
        ];
        return [{ name: 'Metrics', data }];
    };

    return (
        <div>
            
            
            {/* --- HEADER --- */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold">Social Media Report Generator</h2>
                    <p className="text-sm text-gray-500">Generate, Analyze, and Share client reports.</p>
                </div>
                <div className="btn btn-outline-primary shadow-sm rounded-full px-5">
                    Balance: <span className="font-extrabold ml-2 text-lg">{balance} 🪙</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* --- LEFT PANEL: INPUTS (4 Columns) --- */}
                <div className="panel lg:col-span-4 h-fit">
                    
                    {/* 1. Platform Selection */}
                    <div className="mb-5">
                        <h5 className="font-semibold text-lg mb-4">1. Select Platform</h5>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setPlatform('tiktok')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${platform === 'tiktok' ? 'border-black bg-gray-100 dark:border-white dark:bg-gray-800' : 'border-transparent bg-white shadow-sm'}`}>
                                <IconBrandTiktok className={platform === 'tiktok' ? 'text-black dark:text-white' : 'text-gray-400'} size={32} />
                                <span className="font-bold">TikTok</span>
                            </button>
                            <button onClick={() => setPlatform('facebook')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${platform === 'facebook' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-transparent bg-white shadow-sm'}`}>
                                <IconBrandFacebook className={platform === 'facebook' ? 'text-blue-600' : 'text-gray-400'} size={32} />
                                <span className="font-bold text-blue-600">Facebook</span>
                            </button>
                        </div>
                    </div>

                    {/* 2. Client Selection */}
                    <div className="mb-5">
                        <h5 className="font-semibold text-lg mb-2">2. Client / Page</h5>
                        <CreatableSelect
                            isClearable
                            options={pageOptions}
                            value={pageName}
                            onChange={setPageName}
                            onCreateOption={handleCreatePage}
                            placeholder="Select or Type New..."
                            formatCreateLabel={(inputValue) => `Create new: "${inputValue}"`}
                            classNames={{
                                control: ({ isFocused }) => `form-input p-0 !flex items-center !border-[#e0e6ed] dark:!border-[#17263c] !bg-white dark:!bg-[#1b2e4b] !rounded-md ${isFocused ? '!border-primary !ring-0 !shadow-[0_0_0_2px_rgba(67,97,238,0.3)]' : ''}`,
                                input: () => '!text-black dark:!text-white-dark',
                                singleValue: () => '!text-black dark:!text-white-dark',
                                placeholder: () => '!text-gray-500 dark:!text-gray-400',
                                menu: () => '!bg-white dark:!bg-[#191e3a] !border !border-[#e0e6ed] dark:!border-[#17263c] !rounded-md !mt-1 !z-50 shadow-lg',
                                option: ({ isFocused, isSelected }) => `!px-3 !py-2 !cursor-pointer !transition-colors ${isSelected ? '!bg-primary !text-white' : isFocused ? '!bg-gray-100 dark:!bg-[#3b3f5c] !text-black dark:!text-white-dark' : '!bg-transparent !text-black dark:!text-white-dark'}`,
                                multiValue: () => '!bg-gray-100 dark:!bg-[#3b3f5c] rounded-sm m-1',
                                multiValueLabel: () => '!text-black dark:!text-white-dark',
                                multiValueRemove: () => 'hover:!bg-danger hover:!text-white rounded-r-sm',
                            }}
                            styles={{ input: (base) => ({ ...base, color: 'inherit' }) }}
                        />
                    </div>

                    {/* 3. File Upload */}
                    <div className="mb-6">
                        <h5 className="font-semibold text-lg mb-4">3. Data Source</h5>
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:hover:border-gray-500">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {file ? <span className="text-primary font-bold">{file.name}</span> : <span>Click to upload CSV/XLS</span>}
                                </p>
                            </div>
                            <input type="file" className="hidden" onChange={handleFileChange} accept=".csv, .xlsx, .xls" />
                        </label>
                    </div>

                    <button type="button" onClick={handleGenerate} disabled={loading} className="btn btn-primary w-full shadow-lg text-lg py-3 mb-6">
                        {loading ? 'Analyzing...' : 'Generate Report (10 🪙)'}
                    </button>

                    {/* --- RECENT HISTORY SIDEBAR --- */}
                    <div className="border-t pt-4 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-3">
                            <IconHistory size={20} className="text-gray-500" />
                            <h5 className="font-bold text-gray-600 dark:text-gray-300">Recent Reports</h5>
                        </div>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {Array.isArray(recentReports) && recentReports.length > 0 ? (
                                recentReports.map((report: any, index: number) => (
                                    <div 
                                        key={report.id || index} 
                                        onClick={() => setReportData(report)} 
                                        className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-900 ${reportData?.id === report.id ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700'}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold text-sm truncate max-w-[150px]">{report.page_name}</span>
                                            <span className="text-xs text-gray-400">{report.created_at ? new Date(report.created_at).toLocaleDateString() : ''}</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className={`badge ${report.platform === 'tiktok' ? 'bg-black' : 'bg-blue-600'} text-xs capitalize`}>{report.platform}</span>
                                            <span className="text-xs font-mono">{fmt(report.total_views)} views</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 text-center py-4">No history available.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- RIGHT PANEL: DASHBOARD (8 Columns) --- */}
                <div className="panel lg:col-span-8 bg-gray-50/50 dark:bg-black/20">
                    {!reportData ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-50 min-h-[500px]">
                            <IconBrandTiktok size={64} className="mb-4 text-gray-300" />
                            <p className="text-xl font-bold text-gray-400">Ready to Analyze</p>
                            <p className="text-gray-400">Select a client and upload data to generate insights.</p>
                        </div>
                    ) : (
                        <div className="animate-fade-in-up space-y-6">
                            
                            {/* 1. REPORT HEADER & ACTIONS */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#1b2e4b] p-5 rounded-xl shadow-sm">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        {reportData.platform === 'tiktok' ? <IconBrandTiktok /> : <IconBrandFacebook className="text-blue-600"/>}
                                        {reportData.page_name}
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Period: <span className="font-semibold">{reportData.start_date} - {reportData.end_date}</span>
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={copyShareLink} className="btn btn-primary gap-2">
                                        <IconShare size={18} /> Share Link
                                    </button>
                                    {reportData.download_url && (
                                        <a href={reportData.download_url} target="_blank" className="btn btn-outline-dark gap-2">
                                            <IconDownload size={18} /> PDF
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* 2. MAIN KPI CARDS */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="panel p-4 bg-white dark:bg-[#1b2e4b]">
                                    <div className="text-gray-500 text-xs font-bold uppercase">Total Views</div>
                                    <div className="text-2xl font-bold text-primary mt-1">{fmt(reportData.total_views)}</div>
                                </div>
                                <div className="panel p-4 bg-white dark:bg-[#1b2e4b]">
                                    <div className="text-gray-500 text-xs font-bold uppercase">Total Likes</div>
                                    <div className="text-2xl font-bold text-secondary mt-1">{fmt(reportData.total_likes)}</div>
                                </div>
                                <div className="panel p-4 bg-white dark:bg-[#1b2e4b]">
                                    <div className="text-gray-500 text-xs font-bold uppercase">{platform === 'facebook' ? 'Total Reach' : 'Total Saves'}</div>
                                    <div className="text-2xl font-bold text-info mt-1">
                                        {fmt(platform === 'facebook' ? reportData.total_reach : reportData.total_saves)}
                                    </div>
                                </div>
                                <div className="panel p-4 bg-white dark:bg-[#1b2e4b]">
                                    <div className="text-gray-500 text-xs font-bold uppercase">Engagement</div>
                                    <div className="text-2xl font-bold text-success mt-1">{reportData.engagement_rate}%</div>
                                </div>
                            </div>

                            {/* 3. CHAMPION PERFORMERS */}
                            {reportData.top_performers && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Best Video Card */}
                                    <div className="panel border-l-4 border-l-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/10">
                                        <h4 className="text-sm font-bold text-yellow-600 uppercase mb-3 flex items-center gap-2">
                                            🏆 Highest Views
                                        </h4>
                                        <p className="text-xl font-bold">{fmt(reportData.top_performers.views.value)} views</p>
                                        <p className="text-sm text-gray-500 mt-2 line-clamp-2 italic">
                                            "{reportData.top_performers.views.title || 'No caption'}"
                                        </p>
                                        <a href={reportData.top_performers.views.link} target="_blank" className="text-xs text-primary mt-2 inline-flex items-center gap-1 hover:underline">
                                            View Post <IconEye size={12}/>
                                        </a>
                                    </div>

                                    {/* Best Engagement Card */}
                                    <div className="panel border-l-4 border-l-purple-400 bg-purple-50/50 dark:bg-purple-900/10">
                                        <h4 className="text-sm font-bold text-purple-600 uppercase mb-3 flex items-center gap-2">
                                            🔥 Highest Engagement
                                        </h4>
                                        <p className="text-xl font-bold">{fmt(reportData.top_performers.engagement.value)} interactions</p>
                                        <p className="text-sm text-gray-500 mt-2 line-clamp-2 italic">
                                            "{reportData.top_performers.engagement.title || 'No caption'}"
                                        </p>
                                        <a href={reportData.top_performers.engagement.link} target="_blank" className="text-xs text-primary mt-2 inline-flex items-center gap-1 hover:underline">
                                            View Post <IconEye size={12}/>
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* 4. PERFORMANCE CHART */}
                            <div className="panel">
                                <h5 className="font-semibold text-lg mb-4">Performance Overview</h5>
                                <ReactApexChart options={getChartOptions()} series={getChartSeries()} type="area" height={300} />
                            </div>

                            {/* 5. PUBLIC LINK SECTION */}
                            <div className="panel bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h5 className="font-bold text-gray-800 dark:text-gray-200">Client Share Link</h5>
                                        <p className="text-xs text-gray-500">This link is public and can be sent to your client.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="bg-white dark:bg-black px-3 py-2 rounded text-xs font-mono border select-all max-w-[200px] truncate">
                                            {reportData.public_url || 'https://winsou.com/r/loading...'}
                                        </div>
                                        <button onClick={copyShareLink} className="btn btn-sm btn-dark">
                                            <IconCopy size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportGenerator;