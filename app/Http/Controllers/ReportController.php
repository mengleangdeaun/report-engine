<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Report;
use App\Services\FacebookAnalyzer; // Import our new Service
use App\Services\TikTokAnalyzer;
use App\Models\Page;
use App\Models\PageShareToken;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{

    // Define cost in one place
    const REPORT_COST = 10;
    // --- DASHBOARD (Unchanged) ---
public function dashboard()
    {
        $user = Auth::user();
        return response()->json([
            'balance' => $user->token_balance,
            'total_reports' => $user->transactions()->where('type', 'spend')->count(),
            'recent_reports' => $user->transactions()->where('type', 'spend')->latest()->take(5)->get()
        ]);
    }

    // --- GENERATE REPORT (Updated) ---
// public function generate(Request $request, FacebookAnalyzer $fbAnalyzer, TikTokAnalyzer $ttAnalyzer)
//     {
//         $request->validate([
//             'file' => 'required|file|mimes:csv,txt,xlsx,xls',
//             'platform' => 'required|in:tiktok,facebook',
//             'page_name' => 'required|string|max:100',
//         ]);

//         $user = Auth::user();
//         $team = $user->team;

//         if (!$team) {
//             return response()->json(['message' => 'You must belong to a team workspace.'], 403);
//         }

//         $owner = $team->owner;

//         // ✅ FIX 1: Fetch Token Limit correctly from the Pivot Table (Team Membership)
//         // We look up the member record inside the current team
//         $membership = $team->members()->where('user_id', $user->id)->first();
        
//         // If they are the Owner, $membership might be null or have different logic, 
//         // but Owners usually don't have limits.
//         $userLimit = $membership ? $membership->pivot->token_limit : null;

//         // ✅ FIX 2: Check Limit vs Usage
//         // Note: We use $user->tokens_used. Ensure this column exists in your users table 
//         // and is reset monthly if you want monthly limits.
//         if (!is_null($userLimit) && ($user->tokens_used + self::REPORT_COST > $userLimit)) {
//             return response()->json([
//                 'message' => "You have reached your spending limit of {$userLimit} tokens. Please contact your Team Admin."
//             ], 403);
//         }

//         // Check Team Balance
//         if ($owner->token_balance < self::REPORT_COST) {
//             return response()->json([
//                 'message' => 'The Team Workspace does not have enough tokens. Please ask the Owner to recharge.'
//             ], 403);
//         }

//         DB::beginTransaction();

//         try {
//             // Deduct from Owner
//             $owner->decrement('token_balance', self::REPORT_COST);
            
//             // Increment User Usage
//             $user->increment('tokens_used', self::REPORT_COST);

//             // Analyze
//             if ($request->platform === 'facebook') {
//                 $reportData = $fbAnalyzer->analyze($request->file('file'));
//             } elseif ($request->platform === 'tiktok') {
//                 $reportData = $ttAnalyzer->analyze($request->file('file'));
//             }

//             // Save Page


//             $page = Page::firstOrCreate(
//                 [
//                     // SEARCH criteria (Matches your DB Unique Index)
//                     'user_id' => $user->id,
//                     'name' => $request->input('page_name'),
//                     'platform' => $request->platform,
//                 ],
//                 [
//                     // CREATE values (Only used if no page is found)
//                     'team_id' => $team->id 
//                 ]
//                 );

//             // Create Report
//             $report = Report::create([
//                 'user_id' => $user->id,
//                 'team_id' => $team->id,  // <--- HERE IS THE FIX
//                 'page_id' => $page->id,
//                 'platform' => $request->platform,
//                 'file_name' => $request->file('file')->getClientOriginalName(),
//                 'report_data' => $reportData,
//                 'public_uuid' => Str::uuid()
//             ]);

//             // Log Transaction
//             $owner->transactions()->create([
//                 'amount' => -self::REPORT_COST,
//                 'type' => 'spend',
//                 'description' => "Report: {$request->platform} - {$page->name} (by {$user->name})"
//             ]);

//             DB::commit();

//             return response()->json([
//                 'message' => 'Report generated successfully',
//                 'team_balance' => $owner->token_balance,
//                 'data' => $reportData
//             ]);

//         } catch (\Exception $e) {
//             DB::rollBack();
//             return response()->json(['message' => 'Error: ' . $e->getMessage()], 422);
//         }
//     }


public function generate(Request $request, FacebookAnalyzer $fbAnalyzer, TikTokAnalyzer $ttAnalyzer)
{
    $request->validate([
        'file' => 'required|file|mimes:csv,txt,xlsx,xls',
        'platform' => 'required|in:tiktok,facebook',
        'page_name' => 'required|string|max:100',
    ]);

    $user = Auth::user();
    
    // ✅ ACTIVE WORKSPACE CONTEXT
    $team = \App\Models\Team::find($user->team_id);

    if (!$team) {
        return response()->json(['message' => 'Invalid workspace context.'], 403);
    }

    // Set Spatie context for permission checks in THIS specific team
    setPermissionsTeamId($team->id);

    // ✅ SMART PERMISSION CHECK: Owner bypass
    $isOwner = $team->user_id === $user->id;
    $permName = "generate {$request->platform} report";

    if (!$isOwner && !$user->can($permName)) {
        return response()->json([
            'message' => "Your role in this workspace doesn't allow generating {$request->platform} reports."
        ], 403);
    }

    $owner = $team->owner; 

    // ✅ TEAM MEMBERSHIP LIMITS
    $membership = $team->members()->where('user_id', $user->id)->first();
    $userLimit = $membership ? $membership->pivot->token_limit : null;

    if (!is_null($userLimit) && ($user->tokens_used + self::REPORT_COST > $userLimit)) {
        return response()->json([
            'message' => "Workspace limit reached ({$userLimit} tokens). Contact the Team Admin."
        ], 403);
    }

    if ($owner->token_balance < self::REPORT_COST) {
        return response()->json(['message' => 'The Workspace balance is insufficient.'], 403);
    }

    DB::beginTransaction();
    try {
        $owner->decrement('token_balance', self::REPORT_COST);
        $user->increment('tokens_used', self::REPORT_COST);

        $reportData = ($request->platform === 'facebook') 
            ? $fbAnalyzer->analyze($request->file('file')) 
            : $ttAnalyzer->analyze($request->file('file'));

            $kpi = $reportData['kpi'] ?? [];
            $period = $reportData['period'] ?? [];
            

            $page = Page::firstOrCreate(
                [ 
                    'team_id'  => $team->id,        // 🔍 Search the WHOLE workspace
                    'name'     => $request->page_name,
                    'platform' => $request->platform,
                ],
                [
                    'user_id'  => $user->id,        // ✨ Only set the creator if it's NEW
                    'is_active' => true 
                ]
            );

        // ✅ TEAM-SCOPED REPORT
    $report = Report::create([
                'user_id'         => $user->id,
                'team_id'         => $team->id,
                'page_id'         => $page->id,
                'platform'        => $request->platform,
                'file_name'       => $request->file('file')->getClientOriginalName(),
                'report_data'     => $reportData,
                
                // Map metrics from the analyzer results to your table columns
// ✅ THE FIX: Map to the correct database columns
            'total_views'     => $kpi['views'] ?? 0,
            'engagement_rate' => $kpi['engagement_rate'] ?? 0,
            'total_likes'     => $request->platform === 'facebook' ? ($kpi['reactions'] ?? 0) : ($kpi['likes'] ?? 0),
            'total_comments'  => $kpi['comments'] ?? 0,
            'total_shares'    => $kpi['shares'] ?? 0,
            
            
            'total_link_clicks' => $request->platform === 'facebook' ? ($kpi['link_clicks'] ?? 0) : 0,
            'total_saves'       => $request->platform === 'tiktok' ? ($kpi['saves'] ?? 0) : 0,
            
           
            'start_date'      => $period['start'] ?? null,
            'end_date'        => $period['end'] ?? null,
                
                'public_uuid'     => (string) \Illuminate\Support\Str::uuid()
            ]);

        $owner->transactions()->create([
            'team_id' => $team->id,
            'amount' => -self::REPORT_COST,
            'type' => 'spend',
            'description' => "Report: {$request->platform} - {$page->name} (by {$user->name})"
        ]);

        DB::commit();
        return response()->json(['message' => 'Report generated successfully', 'data' => $reportData]);

    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json(['message' => 'Error: ' . $e->getMessage()], 422);
    }
}

public function getTopPerformers(Request $request)
{
    $team = $request->user()->team;
    
    $historicalAvgSub = Report::from('reports as sub')
        ->selectRaw('AVG(sub.engagement_rate)')
        ->whereColumn('sub.page_id', 'reports.page_id')
        ->whereColumn('sub.platform', 'reports.platform')
        ->whereColumn('sub.id', '<', 'reports.id')
        ->where('sub.team_id', $team->id)
        ->orderBy('sub.id', 'desc')
        ->limit(5);

    $topReports = Report::with('page:id,name')
        ->select('reports.*')
        ->selectSub($historicalAvgSub, 'historical_avg')
        ->where('team_id', $team->id)
        // ✅ Increase to 90 days for testing to ensure data appears
        ->where('created_at', '>=', now()->subDays(90)) 
        ->get()
        ->map(function ($r) {
            $current = (float)$r->engagement_rate;
            $avg = $r->historical_avg ? (float)$r->historical_avg : null;
            
            // ✅ Only calculate growth if history exists, else set to 0
            $r->growth_rate = ($avg && $avg > 0) 
                ? (($current - $avg) / $avg) * 100 
                : 0;
            return $r;
        })
        // ✅ Filter out those with 0 growth (the "New" ones)
        ->filter(fn($r) => $r->growth_rate > 0)
        ->sortByDesc('growth_rate')
        ->take(3)
        ->values();

    return response()->json($topReports);
}

public function history(Request $request)
{
    $user = $request->user();
    $team = $user->team;
    setPermissionsTeamId($team->id);

    // 1. Build the Subquery for Historical Average
    // We wrap this in a COALESCE to return the current ER if no history exists

    $historicalAvgSub = Report::from('reports as sub')
        ->selectRaw('AVG(sub.engagement_rate)')
        ->whereColumn('sub.page_id', 'reports.page_id')
        ->whereColumn('sub.platform', 'reports.platform')
        ->whereColumn('sub.id', '<', 'reports.id') // Compare against older IDs
        ->where('sub.team_id', $team->id) // Ensure we stay within the same team
        ->orderBy('sub.id', 'desc')
        ->limit(5);
        

    // 2. Main Query
    $query = Report::with(['page', 'user:id,name,avatar'])
        ->select('reports.*')
        ->selectSub($historicalAvgSub, 'historical_avg') 
        ->where('reports.team_id', $team->id);

    // --- SORTING ---
    $allowedSortColumns = [
        'created_at', 'file_name', 'platform', 'status', 
        'total_views', 'engagement_rate', 'start_date', 'end_date'
    ];
    $sortBy = $request->input('sort_by', 'created_at');
    if (!in_array($sortBy, $allowedSortColumns)) { $sortBy = 'created_at'; }
    $sortDir = $request->input('sort_dir', 'desc');

    // --- PERMISSIONS ---
    $isOwner = (int)$team->user_id === (int)$user->id; 
    $canViewAll = $user->hasPermissionTo('view all team reports'); 
    $isAdminPivot = \DB::table('team_user')->where(['team_id' => $team->id, 'user_id' => $user->id, 'role' => 'admin'])->exists();

    if ($isOwner || $canViewAll || $isAdminPivot) {
        if ($request->filled('user_ids')) {
            $ids = is_array($request->user_ids) ? $request->user_ids : explode(',', $request->user_ids);
            if (($key = array_search('me', $ids)) !== false) {
                unset($ids[$key]);
                $ids[] = $user->id;
            }
            $query->whereIn('user_id', $ids);
        }
    } else {
        $query->where('user_id', $user->id);
    }

    // --- FILTERS & SEARCH ---
    if ($request->filled('page_id')) $query->where('page_id', $request->page_id);
    if ($request->filled('platform') && $request->platform !== 'all') $query->where('platform', $request->platform);
    if ($request->filled('start_date') && $request->filled('end_date')) {
        $query->whereBetween('reports.created_at', [$request->start_date . ' 00:00:00', $request->end_date . ' 23:59:59']);
    }
    if ($request->filled('search')) {
        $search = $request->search;
        $query->where(function($q) use ($search) {
            $q->whereHas('page', fn($sq) => $sq->where('name', 'like', "%{$search}%"))
              ->orWhere('file_name', 'like', "%{$search}%")
              ->orWhereHas('user', fn($sq) => $sq->where('name', 'like', "%{$search}%"));
        });
    }

    $query->orderBy($sortBy, $sortDir);
    $reports = $query->paginate($request->input('per_page', 10));

        // 3. Final Pass: Ensure historical_avg is a float for React
 $reports->getCollection()->transform(function ($report) {
        // We leave it as NULL if no history exists so the frontend hides the arrow
        // But if it exists, we cast to float for precision
        if (!is_null($report->historical_avg)) {
            $report->historical_avg = round((float)$report->historical_avg, 4);
        }
        return $report;
    });


    return response()->json($reports);
}
    public function generateShareLink($id)
    {
        $report = Report::findOrFail($id);

        // Generate UUID if it doesn't exist yet
        if (empty($report->public_uuid)) {
            $report->public_uuid = (string) Str::uuid();
            $report->save();
        }

        // Return the Frontend URL (React Route)
        // Adjust 'localhost:5173' to your actual frontend domain in production
        $frontendUrl = env('FRONTEND_URL'); 
        
        return response()->json([
            'uuid' => $report->public_uuid,
            'url' => "{$frontendUrl}/share/r/{$report->public_uuid}"
        ]);
    }

    public function shareWholePage(Page $page)
{
    // Get or create a token for this page
    $share = PageShareToken::firstOrCreate(
        ['page_id' => $page->id],
        ['token' => Str::random(64)]
    );

    return response()->json([
        'url' => url("/share/page/{$share->token}"),
        'token' => $share->token
    ]);
}

public function regenerateShareToken(Page $page)
{
    // 1. Delete the old record. 
    // Because of 'onDelete(cascade)', all logs are deleted automatically by MySQL!
    \App\Models\PageShareToken::where('page_id', $page->id)->delete();

    // 2. Create the fresh token and return it
    return $this->shareWholePage($page);
}

public function togglePageShare(Page $page)
{
    $share = PageShareToken::where('page_id', $page->id)->firstOrFail();
    
    // Switch between true and false
    $share->is_active = !$share->is_active;
    $share->save();

    return response()->json([
        'is_active' => $share->is_active,
        'message' => $share->is_active ? 'Public link enabled' : 'Public link disabled'
    ]);
}

public function getShareStatus(Page $page)
{
    $share = PageShareToken::where('page_id', $page->id)
        ->with(['logs' => function($q) {
            $q->latest()->take(5); 
        }])
        ->first();

    return response()->json([
        'exists' => (bool)$share,
        'is_active' => $share ? (bool)$share->is_active : false,
        'view_count' => $share ? $share->view_count : 0,
        'token' => $share ? $share->token : null,
        'history' => $share ? $share->logs : [], 
    ]);
}

public function resetShareHistory(Page $page)
{
    // 1. Find the existing share token for this page
    $share = PageShareToken::where('page_id', $page->id)->firstOrFail();
    
    // 2. 🔥 THE CRITICAL FIX: Delete all related activity logs
    // Without this, the 'history' array in React will not be empty.
    $share->logs()->delete();

    // 3. Reset the Summary Token record
    $share->update([
        'last_accessed_at' => null,
        'view_count' => 0,
        'last_device' => null,
        'last_location' => null,
        'lat' => null,
        'lng' => null,
    ]);

    // 4. Return the clean state to sync with your React frontend
    return response()->json([
        'message' => 'Access history and activity logs cleared successfully',
        'last_accessed_at' => null,
        'view_count' => 0,
        'last_device' => null,
        'last_location' => null,
        'lat' => null,
        'lng' => null,
        'history' => [], // Explicitly return empty array
    ]);
}

    // 2. PUBLIC: Fetch Report Data by UUID
    public function getPublicReport($uuid)
    {
        $report = Report::where('public_uuid', $uuid)
            ->with('page') // Load page details (Logo, Name) for the header
            ->firstOrFail();

        return response()->json($report);
    }

    // Add this function at the bottom of your class
public function destroy($id)
    {
        $report = Report::where('user_id', Auth::id())->where('id', $id)->first();

        if (!$report) {
            return response()->json(['message' => 'Report not found'], 404);
        }

        $report->delete();
        return response()->json(['message' => 'Report deleted']);
    }


public function exportCsv(Request $request)
{
    $user = $request->user();
    $team = $user->team;
    setPermissionsTeamId($team->id);

    // 1. Build the Subquery for Historical Average (Same logic as history method)
    $historicalAvgSub = Report::from('reports as sub')
        ->selectRaw('AVG(sub.engagement_rate)')
        ->whereColumn('sub.page_id', 'reports.page_id')
        ->whereColumn('sub.platform', 'reports.platform')
        ->whereColumn('sub.id', '<', 'reports.id')
        ->where('sub.team_id', $team->id)
        ->orderBy('sub.id', 'desc')
        ->limit(5);

    // 2. Build the Main Query with Filters
    $query = Report::with(['page', 'user'])
        ->select('reports.*')
        ->selectSub($historicalAvgSub, 'historical_avg')
        ->where('team_id', $team->id);

    // Apply exact same filters as history()
    $isOwner = (int)$team->user_id === (int)$user->id; 
    $isAdminPivot = \DB::table('team_user')->where(['team_id' => $team->id, 'user_id' => $user->id, 'role' => 'admin'])->exists();
    
    if (!($isOwner || $isAdminPivot || $user->hasPermissionTo('view all team reports'))) {
        $query->where('user_id', $user->id);
    }

    if ($request->filled('platform') && $request->platform !== 'all') $query->where('platform', $request->platform);
    if ($request->filled('page_id')) $query->where('page_id', $request->page_id);
    if ($request->filled('start_date') && $request->filled('end_date')) {
        $query->whereBetween('reports.created_at', [$request->start_date . ' 00:00:00', $request->end_date . ' 23:59:59']);
    }
    
    $reports = $query->orderBy('created_at', 'desc')->get();

    // 3. Stream the Response
    $response = new StreamedResponse(function () use ($reports) {
        $handle = fopen('php://output', 'w');
        
        // CSV Headers (Added Trend Columns)
        fputcsv($handle, [
            'ID', 'Page Name', 'Platform', 'Period Start', 'Period End', 
            'Views', 'Likes/Reactions', 'Comments', 'Shares', 
            'ER (%)', 'Point Diff (%)', 'Growth Rate (%)', 'Trend', 'Created By'
        ]);

        foreach ($reports as $report) {
            $er = (float)$report->engagement_rate;
            $hist = $report->historical_avg !== null ? (float)$report->historical_avg : null;
            
            // Calculate Point Diff and Growth Rate
            $pointDiff = $hist !== null ? round($er - $hist, 2) : 0;
            $growthRate = ($hist !== null && $hist > 0) ? round((($er - $hist) / $hist) * 100, 2) : 0;
            $trendText = $hist === null ? 'New' : ($pointDiff > 0 ? 'Improving' : ($pointDiff < 0 ? 'Declining' : 'Stable'));

            fputcsv($handle, [
                $report->id,
                $report->page->name ?? 'N/A',
                ucfirst($report->platform),
                $report->start_date?->format('Y-m-d') ?? 'N/A',
                $report->end_date?->format('Y-m-d') ?? 'N/A',
                $report->total_views,
                $report->total_likes,
                $report->total_comments,
                $report->total_shares,
                $er . '%',
                ($hist !== null ? ($pointDiff > 0 ? '+' : '') . $pointDiff . '%' : '-'),
                ($hist !== null ? ($growthRate > 0 ? '+' : '') . $growthRate . '%' : '-'),
                $trendText,
                $report->user->name ?? 'System'
            ]);
        }
        fclose($handle);
    });

    $response->headers->set('Content-Type', 'text/csv');
    $response->headers->set('Content-Disposition', 'attachment; filename="winsou-performance-export-' . now()->format('Y-m-d') . '.csv"');

    return $response;
}

}