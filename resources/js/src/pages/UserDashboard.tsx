import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../store/themeConfigSlice';
import axios from 'axios';

const UserDashboard = () => {
    const dispatch = useDispatch();
    const [stats, setStats] = useState<any>({ balance: 0, total_reports: 0, recent_reports: [] });
    
    useEffect(() => {
        dispatch(setPageTitle('My Dashboard'));
        fetchData();
    }, []);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.get('http://localhost:8000/api/user/dashboard', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(response.data);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Welcome Back!</h2>
                <Link to="/report-generator" className="btn btn-primary shadow-lg">
                    + New Report
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                {/* Balance Card */}
                <div className="panel bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white">
                    <div className="flex justify-between">
                        <div className="text-md font-semibold">My Balance</div>
                    </div>
                    <div className="flex items-center mt-5">
                        <div className="text-3xl font-bold">{stats.balance} 🪙</div>
                    </div>
                </div>

                {/* Reports Card */}
                <div className="panel bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                    <div className="flex justify-between">
                        <div className="text-md font-semibold">Reports Generated</div>
                    </div>
                    <div className="flex items-center mt-5">
                        <div className="text-3xl font-bold">{stats.total_reports}</div>
                    </div>
                </div>
            </div>

            <div className="panel">
                <div className="flex items-center justify-between mb-5">
                    <h5 className="font-semibold text-lg">Recent History</h5>
                </div>
                <div className="table-responsive">
                    <table className="table-hover">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Cost</th>
                                <th>Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.recent_reports.length === 0 ? (
                                <tr><td colSpan={4} className="text-center p-4">No reports yet.</td></tr>
                            ) : stats.recent_reports.map((report: any) => (
                                <tr key={report.id}>
                                    <td>{report.description}</td>
                                    <td className="text-danger font-bold">{report.amount}</td>
                                    <td>{new Date(report.created_at).toLocaleDateString()}</td>
                                    <td><span className="badge bg-success">Completed</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;