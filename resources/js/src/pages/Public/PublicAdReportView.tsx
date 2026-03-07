import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { IconLoader, IconDownload, IconBrandFacebook } from '@tabler/icons-react';
import api from '../../utils/api';
import FacebookAdsReportView from './components/FacebookAdsReportView';
import { formatUserDate } from '../../utils/userDate';
import { Button } from '../../components/ui/button';

const PublicAdReportView = () => {
    const { uuid } = useParams();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Fetch Public Data
        api.get(`/public/ad-reports/${uuid}`)
            .then(res => {
                setReport(res.data);
                setLoading(false);
            })
            .catch(() => {
                setError('Report unavailable or link expired.');
                setLoading(false);
            });
    }, [uuid]);

    if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><IconLoader className="animate-spin text-primary" size={40} /></div>;
    if (error) return <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-red-500 font-bold">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 p-3 sm:p-5 md:p-8 font-sans">
            <style>{`
                @media print {
                    @page { margin: 10mm; size: A4; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
                    .no-print { display: none !important; }
                    .max-w-6xl { max-width: none !important; width: 100% !important; }
                    .panel { border: 1px solid #eee !important; box-shadow: none !important; break-inside: avoid; }
                    .overflow-x-auto, .overflow-hidden { overflow: visible !important; display: block !important; height: auto !important; }
                    table { width: 100% !important; border-collapse: collapse !important; display: table !important; }
                    thead { display: table-header-group !important; }
                    tr { page-break-inside: avoid !important; break-inside: avoid !important; }
                    th, td { border-bottom: 1px solid #ddd !important; padding: 8px 4px !important; color: black !important; }
                    thead tr th { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; }
                }
            `}</style>

            <div className="max-w-6xl mx-auto">
                {/* --- SHARED HEADER --- */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 mb-6 sm:mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-4">
                        <div className="relative">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white dark:border-gray-700 shadow-md overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl sm:text-2xl font-bold text-gray-400">
                                {(report.account_name || 'F').charAt(0)}
                            </div>
                            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full text-white border-2 border-white dark:border-gray-700 bg-blue-600">
                                <IconBrandFacebook size={14} />
                            </div>
                        </div>

                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white leading-tight">{report.account_name || 'Facebook Ads Report'}</h1>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-gray-500 mt-1">
                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                                    Facebook Ads
                                </span>
                                <span>•</span>
                                <span className="font-medium">{formatUserDate(report.created_at)}</span>
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={() => window.print()}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-wider"
                    >
                        <IconDownload size={18} /> Download PDF
                    </Button>
                </div>

                <FacebookAdsReportView report={report} isPublic={true} />
            </div>

            <div className="text-center mt-10 text-gray-400 text-xs pb-10">
                <small> Generated by Report Engine </small>
                <p>Made with ❤️ by Mengleang Deaun</p>
            </div>
        </div>
    );
};

export default PublicAdReportView;
