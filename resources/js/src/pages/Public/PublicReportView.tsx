import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { IconLoader, IconDownload, IconBrandFacebook, IconBrandTiktok, IconCopy } from '@tabler/icons-react';
import api from '../../utils/api';
import { getStoragePath } from '../../utils/config';

// Import the new components
import FacebookPublicView from './components/FacebookPublicView';
import TikTokPublicView from './components/TikTokPublicView';

const PublicReportView = () => {
    const { uuid } = useParams();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Fetch Public Data
        api.get(`/public/reports/${uuid}`)
            .then(res => {
                setReport(res.data);
                setLoading(false);
            })
            .catch(() => {
                setError('Report unavailable or link expired.');
                setLoading(false);
            });
    }, [uuid]);

    if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><IconLoader className="animate-spin text-primary" size={40} /></div>;
    if (error) return <div className="h-screen flex items-center justify-center bg-gray-50 text-red-500 font-bold">{error}</div>;

    // Parse Data
    let data: any = {};
    try {
        data = typeof report.report_data === 'string' ? JSON.parse(report.report_data) : report.report_data;
    } catch (e) {
        data = {};
    }

    const page = report.page || {};
    const isFB = report.platform === 'facebook';

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 font-sans">

<style>{`
    @media print {
        @page { margin: 10mm; size: A4; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
        .no-print { display: none !important; }
        
        /* Reset Containers */
        .max-w-5xl { max-width: none !important; width: 100% !important; }
        .panel { 
            border: 1px solid #eee !important;
            box-shadow: none !important;
            break-inside: avoid; /* Try to keep panel together if possible */
        }

        /* --- 🔥 CRITICAL TABLE FIXES --- */
        
        /* 1. Remove scrolling limitations so the table can flow across pages */
        .overflow-x-auto, .overflow-hidden {
            overflow: visible !important;
            display: block !important;
            height: auto !important;
        }

        /* 2. Force table structure */
        table { 
            width: 100% !important; 
            border-collapse: collapse !important; 
            display: table !important; 
        }

        /* 3. Ensure Header repeats on next page if table is long */
        thead { display: table-header-group !important; }
        tfoot { display: table-footer-group !important; }
        tr { page-break-inside: avoid !important; break-inside: avoid !important; }

        /* 4. Visual Cleanup */
        th, td { 
            border-bottom: 1px solid #ddd !important; 
            padding: 8px 4px !important;
            color: black !important;
        }
        
        /* 5. Force Header Background Color */
        thead tr th { 
            background-color: #f3f4f6 !important; 
            -webkit-print-color-adjust: exact; 
        }
    }
`}</style>
            <div className="max-w-5xl mx-auto">
                
                {/* --- SHARED HEADER (Same for both) --- */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            {/* Logo */}
                            <div className="w-20 h-20 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100">
                                {page.avatar ? (
                                    <img src={getStoragePath(page.avatar)} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                                        {(page.name || 'R').charAt(0)}
                                    </div>
                                )}
                            </div>
                            {/* Platform Icon Badge */}
                            <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-full text-white border-2 border-white ${isFB ? 'bg-blue-600' : 'bg-black'}`}>
                                {isFB ? <IconBrandFacebook size={16} /> : <IconBrandTiktok size={16} />}
                            </div>
                        </div>
                        
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">{page.name || 'Analytics Report'}</h1>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${isFB ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-black'}`}>
                                    {report.platform}
                                </span>
                                <span>•</span>
                                <span>{new Date(report.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    
            <button 
                onClick={() => window.print()} 
                // ✅ Added 'print:hidden'
                className="btn btn-dark btn-sm flex items-center gap-2 shadow-lg shadow-gray-900/10 print:hidden"
            >
                <IconDownload size={18} /> Download PDF
            </button>
                </div>

                {/* --- CONDITIONAL VIEW --- */}
                {/* Check platform and render the correct component */}
                {isFB ? (
                    <FacebookPublicView data={data} />
                ) : (
                    <TikTokPublicView data={data} />
                )}

            </div>
            
            <div className="text-center mt-10 text-gray-400 text-xs">
                <small> Generated by Report Maker </small> 
                <p>Powered by Degrand Solution</p>
            </div>

{/* ✅ PRINT ONLY FOOTER (Visible only on PDF) */}
<div className="hidden print:block text-center mt-10 text-gray-500 text-[10px] border-t pt-4">
    <div className="flex justify-between">
        <span>Report ID: {uuid}</span>
        <span>Generated on: {new Date().toLocaleString()}</span>
    </div>
</div>
        </div>
    );
};

export default PublicReportView;