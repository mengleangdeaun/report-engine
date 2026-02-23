<?php

namespace App\Http\Controllers;

use App\Models\QrCode;
use App\Models\QrCodeScan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Stevebauman\Location\Facades\Location;

class QrCodeController extends Controller
{
    /**
     * List user's QR codes (with scan counts)
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $teamId = $user->current_team_id ?? $user->team_id;

        $query = QrCode::query()->with('user:id,name,avatar');

        if ($teamId) {
            $query->where('team_id', $teamId);
        } else {
            $query->where('user_id', $user->id);
        }

        if ($request->has('user_id') && $request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('content', 'like', "%{$search}%")
                    ->orWhere('short_code', 'like', "%{$search}%");
            });
        }

        $limit = $request->get('limit', 10);
        $qrCodes = $query->orderBy('created_at', 'desc')->paginate($limit);

        return response()->json($qrCodes);
    }

    /**
     * Save a new QR code
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:url,text,wifi,email,phone,sms',
            'content' => 'required|string|max:4096',
            'settings' => 'nullable|array',
        ]);

        $user = $request->user();

        $qrCode = QrCode::create([
            'user_id' => $user->id,
            'team_id' => $user->current_team_id ?? $user->team_id,
            'name' => $request->name,
            'type' => $request->type,
            'content' => $request->content,
            'settings' => $request->settings,
            'short_code' => QrCode::generateShortCode(),
        ]);

        return response()->json($qrCode, 201);
    }

    /**
     * Get QR code with detailed scan statistics
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        $teamId = $user->current_team_id ?? $user->team_id;

        $query = QrCode::where('id', $id);
        if ($teamId) {
            $query->where('team_id', $teamId);
        } else {
            $query->where('user_id', $user->id);
        }
        $qrCode = $query->firstOrFail();

        // Date Filtering
        $startDate = $request->input('start_date') ? Carbon::parse($request->input('start_date'))->startOfDay() : Carbon::now()->subDays(30)->startOfDay();
        $endDate = $request->input('end_date') ? Carbon::parse($request->input('end_date'))->endOfDay() : Carbon::now()->endOfDay();

        // Base query for scans within range
        $scansQuery = QrCodeScan::where('qr_code_id', $qrCode->id)
            ->whereBetween('scanned_at', [$startDate, $endDate]);

        // Scan count by day
        // Note: We apply the timezone offset (+7h) BEFORE extracting the date, so grouping aligns with user's local time.
        $dailyScans = (clone $scansQuery)
            ->select(DB::raw('DATE(DATE_ADD(scanned_at, INTERVAL 7 HOUR)) as date'), DB::raw('COUNT(*) as count'))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Device breakdown
        $deviceBreakdown = (clone $scansQuery)
            ->select('device_type', DB::raw('COUNT(*) as count'))
            ->groupBy('device_type')
            ->get();

        // Recent scans
        $recentScans = (clone $scansQuery)
            ->orderBy('scanned_at', 'desc')
            ->limit(20)
            ->get();

        // Country breakdown
        $countryBreakdown = (clone $scansQuery)
            ->whereNotNull('country')
            ->select('country', DB::raw('COUNT(*) as count'))
            ->groupBy('country')
            ->orderBy('count', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'qr_code' => $qrCode,
            'stats' => [
                'total_scans' => $qrCode->total_scans, // Total ever
                'period_scans' => $scansQuery->count(), // Total in this period
                'daily_scans' => $dailyScans,
                'device_breakdown' => $deviceBreakdown,
                'country_breakdown' => $countryBreakdown,
                'recent_scans' => $recentScans,
            ],
        ]);
    }

    /**
     * Update a QR code
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();

        $qrCode = QrCode::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:url,text,wifi,email,phone,sms',
            'content' => 'required|string|max:4096',
            'settings' => 'nullable|array',
        ]);

        $qrCode->update([
            'name' => $request->name,
            'type' => $request->type,
            'content' => $request->content,
            'settings' => $request->settings,
        ]);

        return response()->json($qrCode);
    }

    /**
     * Delete a QR code
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        $qrCode = QrCode::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $qrCode->delete();

        return response()->json(['message' => 'QR code deleted']);
    }

    /**
     * PUBLIC: Track scan and redirect
     */
    public function track(Request $request, $shortCode)
    {
        $qrCode = QrCode::where('short_code', $shortCode)->first();

        if (!$qrCode) {
            abort(404, 'QR code not found');
        }

        // Log the scan
        $userAgent = $request->userAgent();
        $ip = $request->ip();

        // Try to get location
        $position = Location::get($ip);

        QrCodeScan::create([
            'qr_code_id' => $qrCode->id,
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'referer' => $request->header('referer'),
            'device_type' => QrCodeScan::detectDevice($userAgent),
            'country' => $position ? $position->countryName : null,
            'city' => $position ? $position->cityName : null,
            'scanned_at' => Carbon::now(),
        ]);

        // Increment counter
        $qrCode->increment('total_scans');

        // Determine redirect URL
        $redirectUrl = $qrCode->content;

        // For non-URL types, show the content on a simple page
        if ($qrCode->type !== 'url') {
            // Return a simple page showing the QR content
            return response()->view('qr-content', [
                'qrCode' => $qrCode,
            ]);
        }

        // Ensure URL has protocol
        if (!preg_match('/^https?:\/\//', $redirectUrl)) {
            $redirectUrl = 'https://' . $redirectUrl;
        }

        return redirect()->away($redirectUrl);
    }
}
