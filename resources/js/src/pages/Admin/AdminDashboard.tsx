import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ReactApexChart from 'react-apexcharts';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../../store';
import PerfectScrollbar from 'react-perfect-scrollbar';
import Dropdown from '../../components/Dropdown';
import { setPageTitle } from '../../store/themeConfigSlice';
import axios from 'axios';

const AdminDashboard = () => {
    const dispatch = useDispatch();
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl';

    // --- STATE ---
    const [stats, setStats] = useState({
        total_users: 0,
        total_reports: 0,
        tokens_outstanding: 0,
        tokens_spent: 0,
        recent_activity: [],
        chart_data: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dispatch(setPageTitle('Admin Dashboard'));
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8000/api/admin/dashboard', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(response.data);
        } catch (error) {
            console.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    // --- CHART CONFIGURATION (Dynamic) ---
    const reportsChartSeries = [{
        name: 'Reports Generated',
        data: stats.chart_data.map((d: any) => d.count) // Map API data to chart
    }];

    const reportsChartOptions: any = {
        chart: {
            height: 58,
            type: 'line',
            sparkline: { enabled: true },
            dropShadow: { enabled: true, blur: 3, color: '#009688', opacity: 0.4 },
        },
        stroke: { curve: 'smooth', width: 2 },
        colors: ['#009688'],
        grid: { padding: { top: 5, bottom: 5, left: 5, right: 5 } },
        tooltip: {
            x: { show: false },
            y: { title: { formatter: () => '' } },
        },
    };

    // Activity Chart (Using tokens spent as data points for visual variety)
    const tokensChartSeries = [{
        data: [21, 9, 36, 12, 44, 25, 59, 41, 66, 25] // Placeholder pattern for visual style
    }];
    
    const tokensChartOptions: any = {
        chart: {
            height: 58,
            type: 'line',
            sparkline: { enabled: true },
            dropShadow: { enabled: true, blur: 3, color: '#e2a03f', opacity: 0.4 },
        },
        stroke: { curve: 'smooth', width: 2 },
        colors: ['#e2a03f'],
        grid: { padding: { top: 5, bottom: 5, left: 5, right: 5 } },
        tooltip: { x: { show: false }, y: { title: { formatter: () => '' } } },
    };

    return (
        <div>
            {/* Breadcrumb */}
            <ul className="flex space-x-2 rtl:space-x-reverse mb-5">
                <li><Link to="/" className="text-primary hover:underline">Dashboard</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Analytics</span></li>
            </ul>

            <div className="pt-5">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    
                    {/* --- STATS CARD 1: REPORTS --- */}
                    <div className="panel h-full sm:col-span-2 lg:col-span-1">
                        <div className="flex justify-between dark:text-white-light mb-5">
                            <h5 className="font-semibold text-lg ">Platform Usage</h5>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-8 text-sm text-[#515365] font-bold">
                            <div>
                                <div>
                                    <div>Reports Generated</div>
                                    <div className="text-[#f8538d] text-lg">{stats.total_reports}</div>
                                </div>
                                {/* Live Chart for Reports */}
                                <ReactApexChart series={reportsChartSeries} options={reportsChartOptions} type="line" height={58} className="overflow-hidden" />
                            </div>

                            <div>
                                <div>
                                    <div>Total Users</div>
                                    <div className="text-[#f8538d] text-lg">{stats.total_users}</div>
                                </div>
                                <ReactApexChart series={tokensChartSeries} options={tokensChartOptions} type="line" height={58} className="overflow-hidden" />
                            </div>
                        </div>
                    </div>

                    {/* --- STATS CARD 2: TOKENS (Economy) --- */}
                    <div className="panel h-full">
                        <div className="flex justify-between dark:text-white-light mb-5">
                            <h5 className="font-semibold text-lg ">Token Economy</h5>
                        </div>
                        <div className="text-[#e95f2b] text-3xl font-bold my-10">
                            <span>{stats.tokens_spent} 🪙</span>
                            <span className="text-black text-sm dark:text-white-light ltr:mr-2 rtl:ml-2">spent all-time</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="w-full rounded-full h-5 p-1 bg-dark-light overflow-hidden shadow-3xl dark:shadow-none dark:bg-dark-light/10">
                                <div
                                    className="bg-gradient-to-r from-[#4361ee] to-[#805dca] w-full h-full rounded-full relative"
                                    style={{ width: '70%' }}
                                ></div>
                            </div>
                            <span className="ltr:ml-5 rtl:mr-5 dark:text-white-light text-xs">Usage</span>
                        </div>
                    </div>

                    {/* --- STATS CARD 3: TOTAL BALANCE (Admin View) --- */}
                    <div
                        className="panel h-full overflow-hidden before:bg-[#1937cc] before:absolute before:-right-44 before:top-0 before:bottom-0 before:m-auto before:rounded-full before:w-96 before:h-96 grid grid-cols-1 content-between"
                        style={{ background: 'linear-gradient(0deg,#00c6fb -227%,#005bea)' }}
                    >
                        <div className="flex items-start justify-between text-white-light mb-16 z-[7]">
                            <h5 className="font-semibold text-lg">System Liability</h5>
                            <div className="relative text-xl whitespace-nowrap">
                                {stats.tokens_outstanding} 🪙
                                <span className="table text-[#d3d3d3] bg-[#4361ee] rounded p-1 text-xs mt-1 ltr:ml-auto rtl:mr-auto">User Holdings</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- ACTIVITY LOG --- */}
                <div className="grid lg:grid-cols-3 gap-6 mb-6">
                    <div className="panel h-full lg:col-span-3">
                        <div className="flex items-start justify-between dark:text-white-light mb-5 p-5 pt-0 border-b border-white-light dark:border-[#1b2e4b]">
                            <h5 className="font-semibold text-lg ">Recent Activity Log</h5>
                        </div>
                        <PerfectScrollbar className="perfect-scrollbar relative h-[360px] ltr:pr-3 rtl:pl-3 ltr:-mr-3 rtl:-ml-3">
                            <div className="space-y-7 p-4">
                                {stats.recent_activity.map((activity: any) => (
                                    <div className="flex" key={activity.id}>
                                        <div className="shrink-0 ltr:mr-2 rtl:ml-2 relative z-10 before:w-[2px] before:h-[calc(100%-24px)] before:bg-white-dark/30 before:absolute before:top-10 before:left-4">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow 
                                                ${activity.type === 'spend' ? 'bg-danger shadow-danger' : 'bg-success shadow-success'}`}>
                                                {activity.type === 'spend' ? (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14m-7-7h14"/></svg> // Minus-like icon
                                                ) : (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14m-7-7h14"/></svg> // Plus icon
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <h5 className="font-semibold dark:text-white-light">
                                                {activity.user?.name} 
                                                <span className={`ml-1 ${activity.amount < 0 ? 'text-danger' : 'text-success'}`}>
                                                    {activity.amount > 0 ? '+' : ''}{activity.amount} Tokens
                                                </span>
                                            </h5>
                                            <p className="text-white-dark text-xs">{activity.description}</p>
                                            <p className="text-white-dark text-[10px] mt-1">{new Date(activity.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                                {stats.recent_activity.length === 0 && (
                                    <p className="text-center text-gray-500">No recent activity.</p>
                                )}
                            </div>
                        </PerfectScrollbar>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;