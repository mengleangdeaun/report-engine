<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\FacebookAdReport;
use App\Models\AdAccount;
use App\Models\MediaFolder;
use App\Models\MediaFile;
use App\Services\FacebookAdsAnalyzer;

class FacebookAdReportController extends Controller
{
    const REPORT_COST = 10;

    /**
     * Generate a new Facebook Ads Manager report.
     */
    public function generate(Request $request, FacebookAdsAnalyzer $analyzer)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt,xlsx,xls',
            'account_name' => 'required|string|max:150',
        ]);

        $user = Auth::user();
        $team = \App\Models\Team::find($user->team_id);

        if (!$team) {
            return response()->json(['message' => 'Invalid workspace context.'], 403);
        }

        // Set Spatie context for permission checks
        setPermissionsTeamId($team->id);

        // Permission check — owners bypass
        $isOwner = $team->user_id === $user->id;
        if (!$isOwner && !$user->can('generate facebook ads report')) {
            return response()->json([
                'message' => "Your role in this workspace doesn't allow generating Facebook Ads reports."
            ], 403);
        }

        $owner = $team->owner;

        // Token limit check (member-level)
        $membership = $team->members()->where('user_id', $user->id)->first();
        $userLimit = $membership ? $membership->pivot->token_limit : null;

        if (!is_null($userLimit) && ($user->tokens_used + self::REPORT_COST > $userLimit)) {
            return response()->json([
                'message' => "Workspace limit reached ({$userLimit} tokens). Contact the Team Admin."
            ], 403);
        }

        // Workspace balance check
        if ($owner->token_balance < self::REPORT_COST) {
            return response()->json(['message' => 'The Workspace balance is insufficient.'], 403);
        }

        // Optional: Check storage quota if store_file is requested
        if ($request->boolean('store_file')) {
            try {
                MediaFile::checkStorageQuota($team, $request->file('file')->getSize());
            } catch (\Exception $e) {
                return response()->json(['message' => $e->getMessage()], 413);
            }
        }

        DB::beginTransaction();
        try {
            // Deduct tokens
            $owner->decrement('token_balance', self::REPORT_COST);
            $user->increment('tokens_used', self::REPORT_COST);

            // Analyze CSV
            $reportData = $analyzer->analyze($request->file('file'));
            $kpi = $reportData['kpi'] ?? [];
            $period = $reportData['period'] ?? [];

            // Find or create the AdAccount (workspace-scoped, mirrors the Page pattern)
            $adAccount = AdAccount::firstOrCreate(
                ['team_id' => $team->id, 'name' => $request->account_name],
                ['user_id' => $user->id, 'platform' => 'facebook_ads', 'is_active' => true]
            );

            // Save report
            $report = FacebookAdReport::create([
                'user_id' => $user->id,
                'team_id' => $team->id,
                'ad_account_id' => $adAccount->id,
                'account_name' => $adAccount->name,
                'file_name' => $request->file('file')->getClientOriginalName(),
                'start_date' => $period['start'] ?? null,
                'end_date' => $period['end'] ?? null,
                'total_spend' => $kpi['total_spend'] ?? 0,
                'total_impressions' => $kpi['total_impressions'] ?? 0,
                'total_reach' => $kpi['total_reach'] ?? 0,
                'total_clicks' => $kpi['total_clicks'] ?? 0,
                'total_conversions' => $kpi['total_conversions'] ?? 0,
                'avg_ctr' => $kpi['avg_ctr'] ?? 0,
                'avg_cpc' => $kpi['avg_cpc'] ?? 0,
                'avg_cpm' => $kpi['avg_cpm'] ?? 0,
                'total_roas' => $kpi['total_roas'] ?? 0,
                'report_data' => $reportData,
                'public_uuid' => (string) Str::uuid(),
            ]);

            // Save to Media Library if requested
            if ($request->boolean('store_file')) {
                $folder = MediaFolder::getOrCreateSourceFolder($team->id, $user->id, 'facebook', 'ads');
                MediaFile::storeFile($request->file('file'), $team->id, $user->id, $folder->id);
            }

            // Log transaction
            $owner->transactions()->create([
                'team_id' => $team->id,
                'amount' => -self::REPORT_COST,
                'type' => 'spend',
                'description' => "Facebook Ads Report: {$adAccount->name} (by {$user->name})",
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Report generated successfully.',
                'data' => $reportData,
                'id' => $report->id,
                'ad_account' => $adAccount,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 422);
        }
    }

    /**
     * Paginated history for the current workspace.
     */
    public function history(Request $request)
    {
        $user = Auth::user();
        $team = \App\Models\Team::find($user->team_id);

        if (!$team) {
            return response()->json(['data' => [], 'total' => 0]);
        }

        $perPage = (int) $request->get('per_page', 10);
        $search = $request->get('search', '');

        $query = FacebookAdReport::with(['user:id,name,avatar', 'adAccount:id,name'])
            ->where('team_id', $team->id)
            ->when($search, fn($q) => $q->where('account_name', 'like', "%{$search}%"))
            ->latest();

        $reports = $query->paginate($perPage);

        return response()->json([
            'data' => $reports->items(),
            'total' => $reports->total(),
            'current_page' => $reports->currentPage(),
            'last_page' => $reports->lastPage(),
        ]);
    }

    /**
     * Get a single report's full data.
     */
    public function show(int $id)
    {
        $user = Auth::user();
        $team = \App\Models\Team::find($user->team_id);
        $report = FacebookAdReport::with('adAccount:id,name')
            ->where('team_id', $team?->id)->findOrFail($id);

        return response()->json($report);
    }

    /**
     * List all Ad Accounts for the current workspace (for autocomplete).
     */
    public function adAccounts(Request $request)
    {
        $user = Auth::user();
        $team = \App\Models\Team::find($user->team_id);

        if (!$team) {
            return response()->json([]);
        }

        $accounts = AdAccount::where('team_id', $team->id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'platform']);

        return response()->json($accounts);
    }

    /**
     * Delete a report.
     */
    public function destroy(int $id)
    {
        $user = Auth::user();
        $team = \App\Models\Team::find($user->team_id);
        $report = FacebookAdReport::where('team_id', $team?->id)->findOrFail($id);
        $report->delete();

        return response()->json(['message' => 'Report deleted.']);
    }

    /**
     * Export report data as CSV.
     */
    public function exportCsv(int $id)
    {
        $user = Auth::user();
        $team = \App\Models\Team::find($user->team_id);
        $report = FacebookAdReport::where('team_id', $team?->id)->findOrFail($id);

        $data = $report->report_data;
        $ads = $data['ads'] ?? [];

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="fb-ads-report-' . $report->id . '.csv"',
        ];

        return response()->stream(function () use ($ads, $report) {
            $handle = fopen('php://output', 'w');

            // KPI summary rows
            fputcsv($handle, ['Facebook Ads Performance Report']);
            fputcsv($handle, ['Account', $report->account_name]);
            fputcsv($handle, ['Period', "{$report->start_date} to {$report->end_date}"]);
            fputcsv($handle, ['Generated', $report->created_at->format('Y-m-d H:i')]);
            fputcsv($handle, []);

            // Ad-level headers
            fputcsv($handle, [
                'Campaign',
                'Ad Set',
                'Ad',
                'Impressions',
                'Reach',
                'Clicks',
                'CTR (%)',
                'Spend',
                'CPC',
                'CPM',
                'Conversions',
                'ROAS',
            ]);

            foreach ($ads as $ad) {
                fputcsv($handle, [
                    $ad['campaign'] ?? '',
                    $ad['ad_set'] ?? '',
                    $ad['ad'] ?? '',
                    $ad['impressions'] ?? 0,
                    $ad['reach'] ?? 0,
                    $ad['clicks'] ?? 0,
                    $ad['ctr'] ?? 0,
                    $ad['spend'] ?? 0,
                    $ad['cpc'] ?? 0,
                    $ad['cpm'] ?? 0,
                    $ad['conversions'] ?? 0,
                    $ad['roas'] ?? 0,
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }
}
