import { 
    IconThumbUp, IconMessage, IconShare, IconEye, 
    IconClick, IconTrophy, IconChartBar 
} from '@tabler/icons-react';

const FacebookPublicView = ({ data }: { data: any }) => {
    // Helper to safely format numbers
    const safeVal = (val: any) => val ? Number(val).toLocaleString() : 0;

    // ✅ 1. Extract KPI & Champions (Handle nested structure)
    const kpi = data.kpi || {};
    const champions = data.champions || {};
    const posts = data.posts || [];

    return (
        <div className="animate-fade-in space-y-8">
            
            {/* --- SECTION 1: KEY METRICS --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard 
                    title="Total Reach" 
                    value={safeVal(kpi.reach || data.total_reach)} 
                    icon={<IconChartBar size={20}/>} 
                    color="bg-blue-50 text-blue-600" 
                />
                <StatCard 
                    title="Total Views" 
                    value={safeVal(kpi.views || data.total_views)} 
                    icon={<IconEye size={20}/>} 
                    color="bg-indigo-50 text-indigo-600" 
                />
                <StatCard 
                    title="Reactions" 
                    value={safeVal(kpi.reactions || data.total_reactions)} 
                    icon={<IconThumbUp size={20}/>} 
                    color="bg-blue-100 text-blue-700" 
                />
                <StatCard 
                    title="Shares" 
                    value={safeVal(kpi.shares || data.total_shares)} 
                    icon={<IconShare size={20}/>} 
                    color="bg-gray-100 text-gray-700" 
                />
                <StatCard 
                    title="Link Clicks" 
                    value={safeVal(kpi.link_clicks || data.total_clicks)} 
                    icon={<IconClick size={20}/>} 
                    color="bg-orange-50 text-orange-600" 
                />
            </div>

            {/* --- SECTION 2: CHAMPIONS (HIGHLIGHTS) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Most Engaging Post */}
                {champions.highest_engagement && (
                    <div className="panel p-6 border border-gray-100 rounded-2xl shadow-sm bg-gradient-to-br from-blue-600 to-blue-700 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4 text-white/80 font-bold uppercase tracking-widest text-xs">
                                <IconTrophy size={16} /> Most Engaging Post
                            </div>
                            <h3 className="text-lg font-bold line-clamp-2 mb-4 leading-relaxed">
                                "{champions.highest_engagement.title || 'No Caption'}"
                            </h3>
                            
                            <div className="flex flex-wrap gap-4 text-sm font-medium text-blue-100">
                                <span className="flex items-center gap-1"><IconThumbUp size={16}/> {safeVal(champions.highest_engagement.reactions)}</span>
                                <span className="flex items-center gap-1"><IconMessage size={16}/> {safeVal(champions.highest_engagement.comments)}</span>
                                <span className="flex items-center gap-1"><IconShare size={16}/> {safeVal(champions.highest_engagement.shares)}</span>
                            </div>

                            <div className="mt-6">
                                <a 
                                    href={champions.highest_engagement.link} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-sm text-white border border-white/20"
                                >
                                    View Post ↗
                                </a>
                            </div>
                        </div>
                        {/* Background Decor */}
                        <IconThumbUp className="absolute -bottom-6 -right-6 text-white/10 rotate-12" size={180} />
                    </div>
                )}

                {/* 2. Highest Reach Post */}
                {champions.highest_reach && (
                    <div className="panel p-6 border border-gray-100 rounded-2xl shadow-sm bg-white relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-4 text-blue-600 font-bold uppercase tracking-widest text-xs">
                            <IconChartBar size={16} /> Highest Reach
                        </div>
                        <h3 className="text-lg font-bold line-clamp-2 mb-4 text-gray-800 leading-relaxed">
                            "{champions.highest_reach.title || 'No Caption'}"
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-blue-50 p-3 rounded-lg">
                                <div className="text-xs text-blue-500 font-bold uppercase">Reach</div>
                                <div className="text-xl font-bold text-gray-800">{safeVal(champions.highest_reach.reach)}</div>
                            </div>
                            <div className="bg-indigo-50 p-3 rounded-lg">
                                <div className="text-xs text-indigo-500 font-bold uppercase">Views</div>
                                <div className="text-xl font-bold text-gray-800">{safeVal(champions.highest_reach.views)}</div>
                            </div>
                        </div>

                        <div>
                            <a 
                                href={champions.highest_reach.link} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-sm text-gray-700 border border-gray-200"
                            >
                                View Post ↗
                            </a>
                        </div>
                    </div>
                )}
            </div>

            {/* --- SECTION 3: RECENT CONTENT TABLE --- */}
            {posts.length > 0 && (
                <div className="panel p-0 overflow-hidden border border-gray-100 rounded-xl shadow-sm bg-white overflow-x-auto print:overflow-visible">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-700">Recent Posts Performance</h3>
                        <span className="text-xs text-gray-400 font-mono">Last {posts.length} Posts</span>
                    </div>
                    <div className="overflow-x-auto print:overflow-visible">
                        <table className="w-full text-left text-sm print:w-full">
                            <thead>
                                <tr className="bg-white text-gray-500 border-b border-gray-100">
                                    <th className="p-4 font-semibold">Post Content</th>
                                    <th className="p-4 text-right font-semibold">Type</th>
                                    <th className="p-4 text-right font-semibold">Date</th>
                                    <th className="p-4 text-right font-semibold text-blue-600">Reach</th>
                                    <th className="p-4 text-right font-semibold">Reactions</th>
                                    <th className="p-4 text-right font-semibold">Eng. Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {posts.map((post: any, i: number) => (
                                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 max-w-[250px]">
                                            <a href={post.link} target="_blank" rel="noreferrer" className="block truncate font-medium text-gray-800 hover:text-blue-600">
                                                {post.title || '(No Caption)'}
                                            </a>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-600">
                                                {post.type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right text-gray-500 text-xs">
                                            {new Date(post.date).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right font-mono font-bold text-gray-700">{safeVal(post.reach)}</td>
                                        <td className="p-4 text-right font-mono text-gray-700">{safeVal(post.reactions)}</td>
                                        <td className="p-4 text-right font-mono text-green-600 font-bold">
                                            {post.engagement_rate}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

// Reusable Card Component
const StatCard = ({ title, value, icon, color }: any) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:-translate-y-1 ... print:border print:border-gray-200 print-break-avoid">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">{title}</p>
            <h4 className="text-2xl font-bold text-gray-800 mt-0.5">{value}</h4>
        </div>
    </div>
);

export default FacebookPublicView;