<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Page;
use App\Models\Report;
use App\Models\Transaction; // ✅ Import Transaction Model
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $team = $user->team;
        
        $isOwner = $team->user_id === $user->id;
        $isAdmin = $team->members()->where('user_id', $user->id)->wherePivot('role', 'admin')->exists();
        $canViewTeamStats = $isOwner || $isAdmin;

        // ==========================================
        // 1. TOKEN LOGIC (Real DB Data)
        // ==========================================
        
        // A. Get The Limit (From Team Settings)
        $limit = $team->max_tokens ?? 0;

        // B. Calculate Usage
        // We sum the absolute value of 'spend' transactions for all team members
        // Logic: Get all user IDs in this team -> Sum their 'spend' transactions
        $teamUserIds = $team->members->pluck('id')->push($team->user_id); // Members + Owner
        
        $used = Transaction::whereIn('user_id', $teamUserIds)
                    ->where('type', 'spend')
                    ->sum(DB::raw('ABS(amount)')); // Convert -10 to 10

        // C. Calculate Left
        $left = max(0, $limit - $used);

        // ==========================================
        // 2. STATS
        // ==========================================
        $stats = [
            'my_reports' => Report::where('user_id', $user->id)->count(),
            'token_used' => (int) $used, 
            'token_left' => (int) $left,
            'token_limit'=> (int) $limit // Pass limit for UI progress bars
        ];

        // ==========================================
        // 3. RECENT REPORTS
        // ==========================================
        $reportQuery = Report::with('page:id,name,platform,avatar')
                             ->orderBy('created_at', 'desc')
                             ->take(5);

        if ($canViewTeamStats) {
            $reportQuery->where('team_id', $team->id)->with('user:id,name,avatar');
        } else {
            $reportQuery->where('user_id', $user->id);
        }

        $recentReports = $reportQuery->get()->map(function($r) {
            return [
                'id' => $r->id,
                'page_name' => $r->page_name ?? $r->page->name ?? 'Unknown',
                'platform' => $r->platform,
                'created_at' => $r->created_at->diffForHumans(),
                'user_name' => $r->user ? $r->user->name : 'Me',
                'user_avatar' => $r->user ? $r->user->avatar : null,
            ];
        });

        // ==========================================
        // 4. CHART (Last 7 Days)
        // ==========================================
        $startDate = Carbon::now()->subDays(6)->startOfDay();
        $chartQuery = Report::select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->where('created_at', '>=', $startDate);

        if ($canViewTeamStats) {
            $chartQuery->where('team_id', $team->id);
        } else {
            $chartQuery->where('user_id', $user->id);
        }
        $chartData = $chartQuery->groupBy('date')->orderBy('date', 'ASC')->get();
        
        $formattedChart = [];
        for ($i = 0; $i < 7; $i++) {
            $date = $startDate->copy()->addDays($i)->format('Y-m-d');
            $found = $chartData->firstWhere('date', $date);
            $formattedChart['categories'][] = Carbon::parse($date)->format('M d'); 
            $formattedChart['series'][] = $found ? $found->count : 0;
        }

        return response()->json([
            'role' => $isOwner ? 'Owner' : ($isAdmin ? 'Admin' : 'Member'),
            'is_admin' => $canViewTeamStats,
            'stats' => $stats,
            'chart' => $formattedChart,
            'recent_reports' => $recentReports
        ]);
    }
}