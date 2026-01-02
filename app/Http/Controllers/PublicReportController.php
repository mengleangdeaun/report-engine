<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PageShareToken;
use App\Models\Report;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;

class PublicReportController extends Controller
{
    /**
     * Initial visit handler: Creates the log and returns report data.
     * If GPS is not sent immediately, it defaults to IP-based location.
     */
public function getPublicPageHistory(Request $request, $token)
{
    // 1. Validate Token and Active Status
    $share = PageShareToken::where('token', $token)
                ->where('is_active', true)
                ->first();

    if (!$share) {
        return response()->json(['error' => 'Dashboard unavailable or private.'], 404);
    }

    // 2. Identify IP and setup defaults
    $ip = $request->ip();
    $testIp = ($ip === '127.0.0.1' || $ip === '::1') ? '202.58.98.130' : $ip;

    $ipLat = null; 
    $ipLon = null; 
    $location = 'Unknown';

    // 3. Get IP-Based Geolocation (Fallback)
    try {
        $res = Http::timeout(3)->get("http://ip-api.com/json/{$testIp}");
        if ($res->successful()) {
            $data = $res->json();
            $location = ($data['city'] ?? 'Unknown') . ', ' . ($data['country'] ?? 'KH');
            $ipLat = $data['lat']; 
            $ipLon = $data['lon'];
        }
    } catch (\Exception $e) {}

    // 4. Rate Limiting Logic
    $rateKey = 'share-access:' . $ip;
    if (RateLimiter::tooManyAttempts($rateKey, 30)) {
        return response()->json(['error' => 'Too many requests.'], 429);
    }
    RateLimiter::hit($rateKey, 60);

    // 5. Finalize Coordinates for this specific request
    $finalLat = $request->input('lat') ?? $ipLat;
    $finalLng = $request->input('lng') ?? $ipLon;
    $deviceType = $this->getDeviceType($request->header('User-Agent'));

    // 6. Log and Tracking
    // ✅ Create full detailed Log Entry (Source of truth for history)
    $share->logs()->create([
        'ip_address'  => $ip,
        'location'    => $location,
        'device'      => $deviceType,
        'lat'         => $finalLat,
        'lng'         => $finalLng,
        'accessed_at' => now(),
    ]);

    // ✅ Update Summary Data ONLY (lat, lng, and last_device are removed)
    $share->update([
        'last_accessed_at' => now(),
        'last_location'    => $location,
    ]);

    // Prune logs: Keep only the most recent 5 entries to save space
    $share->logs()->latest()->skip(5)->take(10)->get()->each->delete();

    // Unique View Tracking (24-hour lock)
    $uniqueKey = 'viewed_' . $ip . '_' . $token;
    if (!Cache::has($uniqueKey)) {
        $share->increment('view_count'); 
        Cache::put($uniqueKey, true, now()->addDay());
    }

    // 7. Fetch Reports (Historical Average Logic)
    $historicalAvgSub = Report::from('reports as sub')
        ->selectRaw('AVG(sub.engagement_rate)')
        ->whereColumn('sub.page_id', 'reports.page_id')
        ->whereColumn('sub.platform', 'reports.platform')
        ->whereColumn('sub.id', '<', 'reports.id')
        ->limit(5);

    $reports = Report::with('page')
        ->select('reports.*')
        ->selectSub($historicalAvgSub, 'historical_avg')
        ->where('page_id', $share->page_id)
        ->latest()
        ->paginate(15);

    // 8. Final Response
    return response()->json([
        'page_name'  => $share->page->name,
        'reports'    => $reports,
        'view_count' => $share->view_count,
        'history'    => $share->logs()->latest()->take(5)->get(),
    ]);
}

    /**
     * Secondary handler: Updates the "guess" coordinates with precise GPS.
     * This fixes both the Summary (Token) and the Recent Log.
     */
  public function updateExactLocation(Request $request, $token)
{
    // 1. Find the parent token
    $share = PageShareToken::where('token', $token)->firstOrFail();

    $lat = $request->lat;
    $lng = $request->lng;

    // 2. Update the Main Token summary (Text summary only)
    // We removed 'lat' and 'lng' from here to follow the new schema
    $share->update([
        'last_location' => "GPS: {$lat}, {$lng}",
    ]);

    // 3. 🔥 THE SYNC: Update the specific activity log entry
    // We find the log created in the last 2 minutes for this specific visit
    $latestLog = $share->logs()
        ->where('created_at', '>=', now()->subMinutes(2))
        ->latest()
        ->first();

    if ($latestLog) {
        $latestLog->update([
            'lat'      => $lat,
            'lng'      => $lng,
            'location' => "GPS: {$lat}, {$lng}" // Precise location for the timeline
        ]);
    }

    return response()->json(['status' => 'success']);
}

    private function getDeviceType($userAgent)
    {
        if (Str::contains($userAgent, ['iPhone', 'Android', 'Mobile'])) {
            return 'Mobile';
        }
        if (Str::contains($userAgent, ['iPad', 'Tablet'])) {
            return 'Tablet';
        }
        return 'Desktop';
    }
}