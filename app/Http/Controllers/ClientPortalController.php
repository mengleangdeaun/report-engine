<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\FacebookAdReportController;

class ClientPortalController extends Controller
{
    /**
     * Client Login.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $client = Client::where('email', $request->email)->first();

        if (!$client || !Hash::check($request->password, $client->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        if (!$client->is_active) {
            return response()->json(['message' => 'Your account is inactive. Please contact your coordinator.'], 403);
        }

        $token = $client->createToken('client-portal')->plainTextToken;

        return response()->json([
            'token' => $token,
            'client' => $client
        ]);
    }

    /**
     * Get current logged in client info.
     */
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    /**
     * List all reports assigned to the client.
     */
    public function index(Request $request)
    {
        $client = $request->user();
        $search = $request->query('search');
        $platform = $request->query('platform');
        $sortBy = $request->query('sort_by', 'created_at');
        $sortDir = $request->query('sort_dir', 'desc');
        $perPage = $request->query('per_page', 10);

        // 1. Fetch Standard Reports Query
        $standardQuery = $client->reports()
            ->with('page:id,name,avatar,platform')
            ->select('reports.id', 'reports.public_uuid', 'reports.page_id', 'reports.platform', 'reports.created_at', \DB::raw("'standard' as type"));

        if ($search) {
            $standardQuery->whereHas('page', function ($pq) use ($search) {
                $pq->where('name', 'like', "%{$search}%");
            });
        }

        if ($platform && $platform !== 'all') {
            $standardQuery->where('platform', $platform);
        }

        // 2. Fetch Facebook Ad Reports Query
        $facebookQuery = $client->facebookAdReports()
            ->select('facebook_ad_reports.id', 'facebook_ad_reports.public_uuid', \DB::raw('NULL as page_id'), 'facebook_ad_reports.account_name as page_name', \DB::raw("'facebook' as platform"), 'facebook_ad_reports.created_at', \DB::raw("'facebook' as type"));

        if ($search) {
            $facebookQuery->where('account_name', 'like', "%{$search}%");
        }

        if ($platform && $platform !== 'all' && $platform !== 'facebook') {
            // If filtering for something other than facebook, this query returns nothing
            $facebookQuery->whereRaw('1 = 0');
        }

        $standardReports = $standardQuery->get();
        $facebookReports = $facebookQuery->get();

        $merged = $standardReports->concat($facebookReports);

        // Map for consistent frontend keys
        $merged = $merged->map(function ($r) {
            $title = $r->page_name;

            // For standard reports that might use the related page name
            if (!$title && $r->type === 'standard' && $r->page) {
                $title = $r->page->name;
            }

            return [
                'id' => $r->public_uuid, // Use UUID as the primary identifier for frontend
                'real_id' => $r->id,
                'type' => $r->type,
                'title' => $title ?: 'Report #' . $r->id,
                'platform' => $r->platform,
                'created_at' => $r->created_at->format('Y-m-d H:i'),
                'raw_date' => $r->created_at,
            ];
        });

        // Sorting
        $merged = $sortDir === 'desc'
            ? $merged->sortByDesc($sortBy === 'created_at' ? 'raw_date' : $sortBy)
            : $merged->sortBy($sortBy === 'created_at' ? 'raw_date' : $sortBy);

        $total = $merged->count();
        $page = $request->query('page', 1);
        $paginated = $merged->forPage($page, $perPage)->values();

        return response()->json([
            'data' => $paginated,
            'total' => $total,
            'current_page' => (int) $page,
            'per_page' => (int) $perPage,
            'last_page' => (int) ceil($total / $perPage),
        ]);
    }

    /**
     * Show a specific report detail.
     */
    public function show(Request $request, $type, $id)
    {
        $client = $request->user();

        if ($type === 'standard') {
            $report = $client->reports()
                ->with('page')
                ->where('reports.public_uuid', $id)
                ->firstOrFail();
            return response()->json($report);
        } elseif ($type === 'facebook') {
            $report = $client->facebookAdReports()
                ->with('adAccount')
                ->where('facebook_ad_reports.public_uuid', $id)
                ->firstOrFail();
            return response()->json($report);
        }

        return response()->json(['message' => 'Invalid report type'], 400);
    }

    /**
     * Export report for client.
     */
    public function export(Request $request, $type, $id)
    {
        // Support token in query string for window.open downloads
        if (!$request->user() && $request->has('token')) {
            $token = \Laravel\Sanctum\PersonalAccessToken::findToken($request->token);
            if ($token && $token->tokenable instanceof \App\Models\Client) {
                auth()->login($token->tokenable);
            }
        }

        $client = $request->user();
        if (!$client) {
            abort(401, 'Unauthorized');
        }

        if ($type === 'standard') {
            $report = $client->reports()->where('reports.public_uuid', $id)->firstOrFail();
            return (new ReportController())->export($report->id);
        } elseif ($type === 'facebook') {
            $report = $client->facebookAdReports()->where('facebook_ad_reports.public_uuid', $id)->firstOrFail();
            return (new FacebookAdReportController())->exportCsv($report->id);
        }

        return response()->json(['message' => 'Invalid report type'], 400);
    }

    /**
     * Client Logout.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }
}
