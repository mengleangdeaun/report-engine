import { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { useDispatch, useSelector } from 'react-redux';
import { setPageTitle } from '../store/themeConfigSlice';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { getStoragePath } from '../utils/config';
import { IconFileText, IconCpu, IconBolt } from '@tabler/icons-react';

const Dashboard = () => {
    // ... (Keep existing setup hooks) ...
    const dispatch = useDispatch();
    const isDark = useSelector((state: any) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dispatch(setPageTitle('Dashboard'));
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const res = await api.get('/dashboard');
            setData(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // ... (Keep Chart Options) ...
    const chartOptions: any = {
        chart: { height: 300, type: 'area', toolbar: { show: false }, zoom: { enabled: false } },
        colors: ['#4361ee'],
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        xaxis: { categories: data?.chart?.categories || [], axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { show: false },
        grid: { borderColor: isDark ? '#191e3a' : '#e0e6ed' },
        tooltip: { theme: isDark ? 'dark' : 'light' },
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, inverseColors: false, opacityFrom: 0.45, opacityTo: 0.05, stops: [20, 100] } },
    };

    if (loading) return <div className="p-5">Loading...</div>;

    return (
        <div>
            {/* 1. STATS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                
                {/* My Reports */}
                <div className="panel bg-gradient-to-r from-blue-500 to-blue-400 text-white">
                    <div className="flex justify-between">
                        <div className="text-md font-semibold">My Reports</div>
                        <IconFileText />
                    </div>
                    <div className="flex items-center mt-5">
                        <div className="text-3xl font-bold">{data.stats.my_reports}</div>
                    </div>
                </div>

                {/* Token Cards (Visible to everyone or just Admin? Usually everyone needs to know limits) */}
                <div className="panel bg-gradient-to-r from-cyan-500 to-cyan-400 text-white">
                    <div className="flex justify-between">
                        <div className="text-md font-semibold">Tokens Used</div>
                        <IconBolt />
                    </div>
{/* Inside the Tokens Used Card */}
<div className="mt-5">
    <div className="flex justify-between items-end mb-1">
        <div className="text-3xl font-bold">{data.stats.token_used}</div>
        <div className="text-xs text-white/80">of {data.stats.token_limit}</div>
    </div>
    {/* Progress Bar */}
    <div className="w-full bg-black/20 rounded-full h-1.5 mt-2">
        <div 
            className="bg-white h-1.5 rounded-full" 
            style={{ width: `${Math.min(100, (data.stats.token_used / data.stats.token_limit) * 100)}%` }}
        ></div>
    </div>
</div>
                </div>

                <div className="panel bg-gradient-to-r from-violet-500 to-violet-400 text-white">
                    <div className="flex justify-between">
                        <div className="text-md font-semibold">Tokens Left</div>
                        <IconCpu />
                    </div>
                    <div className="flex items-center mt-5">
                        <div className="text-3xl font-bold">{data.stats.token_left}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* 2. CHART */}
                <div className="panel h-full">
                    <div className="flex items-center justify-between dark:text-white-light mb-5">
                        <h5 className="font-semibold text-lg">Activity Trend</h5>
                    </div>
                    <div className="relative">
                        <ReactApexChart series={[{ name: 'Reports', data: data.chart.series }]} options={chartOptions} type="area" height={300} />
                    </div>
                </div>

                {/* 3. RECENT REPORTS TABLE */}
                <div className="panel h-full">
                    <div className="flex items-center justify-between dark:text-white-light mb-5">
                        <h5 className="font-semibold text-lg">Recent Reports</h5>
                        <Link to="/apps/reports" className="text-primary text-sm hover:underline">View All</Link>
                    </div>
                    <div className="table-responsive">
                        <table className="table-hover w-full text-left">
                            <thead>
                                <tr>
                                    <th>Page Name</th>
                                    <th>Platform</th>
                                    {/* ✅ Only show 'Generated By' if Admin */}
                                    {data.is_admin && <th>Generated By</th>}
                                    <th className="text-right">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recent_reports.length === 0 ? (
                                    <tr><td colSpan={4} className="p-4 text-center">No reports yet.</td></tr>
                                ) : (
                                    data.recent_reports.map((report: any) => (
                                        <tr key={report.id}>
                                            <td className="font-semibold">{report.page_name}</td>
                                            <td>
                                                <span className={`badge ${report.platform === 'facebook' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-800'}`}>
                                                    {report.platform}
                                                </span>
                                            </td>
                                            
                                            {/* ✅ Admin: Show User Avatar + Name */}
                                            {data.is_admin && (
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200">
                                                            {report.user_avatar ? (
                                                                <img src={getStoragePath(report.user_avatar)} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="flex items-center justify-center w-full h-full text-[10px] font-bold">
                                                                    {report.user_name.substring(0,2)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs">{report.user_name}</span>
                                                    </div>
                                                </td>
                                            )}

                                            <td className="text-right text-xs text-gray-500">{report.created_at}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;