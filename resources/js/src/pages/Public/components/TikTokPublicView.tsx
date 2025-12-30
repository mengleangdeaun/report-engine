import { 
    IconEye, IconHeart, IconShare, IconMessageDots, 
    IconBookmark, IconTrophy 
} from '@tabler/icons-react';

const TikTokPublicView = ({ data }: { data: any }) => {
    const safeVal = (val: any) => val ? Number(val).toLocaleString() : 0;

    const kpi = data.kpi || {};
    const champions = data.champions || {};
    const posts = data.posts || [];

    return (
        <div className="animate-fade-in space-y-8">
            
            {/* --- SECTION 1: KEY METRICS --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard 
                    title="Video Views" 
                    value={safeVal(kpi.views || data.total_views)} 
                    icon={<IconEye size={20}/>} 
                    color="bg-black text-white" 
                />
                <StatCard 
                    title="Likes" 
                    value={safeVal(kpi.likes || data.total_likes)} 
                    icon={<IconHeart size={20}/>} 
                    color="bg-pink-50 text-pink-600" 
                />
                <StatCard 
                    title="Comments" 
                    value={safeVal(kpi.comments || data.total_comments)} 
                    icon={<IconMessageDots size={20}/>} 
                    color="bg-teal-50 text-teal-600" 
                />
                <StatCard 
                    title="Shares" 
                    value={safeVal(kpi.shares || data.total_shares)} 
                    icon={<IconShare size={20}/>} 
                    color="bg-blue-50 text-blue-600" 
                />
                <StatCard 
                    title="Saves" 
                    value={safeVal(kpi.saves || data.total_saves)} 
                    icon={<IconBookmark size={20}/>} 
                    color="bg-yellow-50 text-yellow-600" 
                />
            </div>

            {/* --- SECTION 2: HIGHLIGHTS (CHAMPIONS) --- */}
            {champions.highest_view && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Best Performing Video Card */}
                    <div className="panel p-6 border border-gray-100 rounded-2xl shadow-sm bg-gradient-to-r from-gray-900 to-gray-800 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4 text-yellow-400 font-bold uppercase tracking-widest text-xs">
                                <IconTrophy size={16} /> Most Viewed Video
                            </div>
                            <h3 className="text-lg font-bold line-clamp-2 mb-4 leading-relaxed">
                                "{champions.highest_view.title}"
                            </h3>
                            
                            <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-300">
                                <span className="flex items-center gap-1"><IconEye size={16}/> {safeVal(champions.highest_view.views)}</span>
                                <span className="flex items-center gap-1"><IconHeart size={16}/> {safeVal(champions.highest_view.likes)}</span>
                                <span className="flex items-center gap-1"><IconShare size={16}/> {safeVal(champions.highest_view.shares)}</span>
                            </div>

                            <div className="mt-6">
                                <a 
                                    href={champions.highest_view.link} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm text-white border border-white/20"
                                >
                                    Watch on TikTok ↗
                                </a>
                            </div>
                        </div>
                        <IconEye className="absolute -bottom-5 -right-5 text-white/5 rotate-12" size={200} />
                    </div>

                    {/* Most Engaging Video Card */}
                    {champions.highest_engagement && (
                         <div className="panel p-6 border border-gray-100 rounded-2xl shadow-sm bg-white relative overflow-hidden">
                            <div className="flex items-center gap-2 mb-4 text-pink-600 font-bold uppercase tracking-widest text-xs">
                                <IconHeart size={16} /> Most Engaging Video
                            </div>
                            <h3 className="text-lg font-bold line-clamp-2 mb-4 text-gray-800 leading-relaxed">
                                "{champions.highest_engagement.title}"
                            </h3>
                             <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-500">
                                <span className="flex items-center gap-1 text-pink-600"><IconHeart size={16}/> {safeVal(champions.highest_engagement.likes)}</span>
                                <span className="flex items-center gap-1"><IconMessageDots size={16}/> {safeVal(champions.highest_engagement.comments)}</span>
                                <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-bold">
                                    {champions.highest_engagement.engagement_rate}% ER
                                </span>
                            </div>
                            <div className="mt-6">
                                <a 
                                    href={champions.highest_engagement.link} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-sm text-gray-700 border border-gray-200"
                                >
                                    Watch on TikTok ↗
                                </a>
                            </div>
                         </div>
                    )}
                </div>
            )}

            {/* --- SECTION 3: ALL CONTENT LIST --- */}
            {posts.length > 0 && (
                <div className="panel p-0 overflow-hidden border border-gray-100 rounded-xl shadow-sm bg-white print:overflow-visible ">
                     {/* ✅ Updated Header to show ALL items */}
                     <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-700">All Content Performance</h3>
                        <span className="px-2 py-1 rounded bg-white border border-gray-200 text-xs font-bold text-gray-500">
                            Total {posts.length} Videos
                        </span>
                     </div>
                     
                     <div className="overflow-x-auto print:overflow-visible ">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-white text-gray-500 border-b border-gray-100">
                                    <th className="p-4 font-semibold">Video Title / Caption</th>
                                    <th className="p-4 text-right font-semibold">Date</th>
                                    <th className="p-4 text-right font-semibold">Views</th>
                                    <th className="p-4 text-right font-semibold">Likes</th>
                                    <th className="p-4 text-right font-semibold">Comments</th>
                                    <th className="p-4 text-right font-semibold">Shares</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {posts.map((post: any, i: number) => (
                                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 max-w-[250px]">
                                            <a href={post.link} target="_blank" rel="noreferrer" className="block truncate font-medium text-gray-800 hover:text-primary">
                                                {post.title || '(No Title)'}
                                            </a>
                                        </td>
                                        <td className="p-4 text-right text-gray-500 text-xs">
                                            {new Date(post.date).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right font-mono text-gray-700">{safeVal(post.views)}</td>
                                        <td className="p-4 text-right font-mono text-gray-700">{safeVal(post.likes)}</td>
                                        <td className="p-4 text-right font-mono text-gray-700">{safeVal(post.comments)}</td>
                                        <td className="p-4 text-right font-mono text-gray-700">{safeVal(post.shares)}</td>
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
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">{title}</p>
            <h4 className="text-2xl font-bold text-gray-800 mt-0.5">{value}</h4>
        </div>
    </div>
);

export default TikTokPublicView;