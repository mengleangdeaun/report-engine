<?php

namespace App\Services;

use Maatwebsite\Excel\Facades\Excel;
use Carbon\Carbon;
use Illuminate\Support\Str;

class FacebookAdsAnalyzer
{
    /**
     * Analyze a Facebook Ads Manager CSV export.
     * Handles all standard column headers the Ads Manager can produce.
     */
    public function analyze($file): array
    {
        // 1. Read the file
        $data = Excel::toCollection(new \stdClass, $file)->first();

        if (!$data || $data->isEmpty()) {
            throw new \Exception('The uploaded file is empty.');
        }

        // 2. Detect headers (row 0)
        $rawHeaders = $data->first();
        $headers = $rawHeaders->map(fn($h) => Str::slug((string) $h))->toArray();
        $map = $this->mapHeaders($headers);

        // 3. Process each data row
        $ads = [];
        $campaigns = [];
        $adSets = [];
        $dates = [];

        foreach ($data->slice(1) as $row) {
            // Skip totally empty rows
            if (!isset($row[0]) || trim((string) $row[0]) === '')
                continue;

            // --- Extract fields ---
            $campaignName = $this->str($row, $map, 'campaign');
            $adSetName = $this->str($row, $map, 'adset');
            $adName = $this->str($row, $map, 'ad');
            $startDate = $this->parseDate($row[$map['start_date']] ?? null);
            $endDate = $this->parseDate($row[$map['end_date']] ?? null);

            // --- Metrics ---
            $impressions = $this->num($row, $map, 'impressions');
            $reach = $this->num($row, $map, 'reach');
            $clicks = $this->num($row, $map, 'clicks');
            $linkClicks = $this->num($row, $map, 'link_clicks');
            $spend = $this->dec($row, $map, 'spend');
            $cpm = $this->dec($row, $map, 'cpm');
            $cpc = $this->dec($row, $map, 'cpc');
            $ctrRaw = $this->dec($row, $map, 'ctr');
            $conversions = $this->num($row, $map, 'conversions');
            $roas = $this->dec($row, $map, 'roas');
            $frequency = $this->dec($row, $map, 'frequency');
            $videoPlays = $this->num($row, $map, 'video_plays');
            $thruPlays = $this->num($row, $map, 'thruplays');

            // Derive CTR if not provided
            $ctr = $ctrRaw > 0 ? $ctrRaw : ($impressions > 0 ? round(($clicks / $impressions) * 100, 4) : 0);
            // Derive CPC if not provided
            if ($cpc == 0 && $clicks > 0 && $spend > 0) {
                $cpc = round($spend / $clicks, 4);
            }
            // Derive CPM if not provided
            if ($cpm == 0 && $impressions > 0 && $spend > 0) {
                $cpm = round(($spend / $impressions) * 1000, 4);
            }

            if ($startDate)
                $dates[] = $startDate;
            if ($endDate)
                $dates[] = $endDate;

            $adRow = [
                'campaign' => $campaignName ?: 'Unknown Campaign',
                'ad_set' => $adSetName ?: 'Unknown Ad Set',
                'ad' => $adName ?: 'Unknown Ad',
                'start_date' => $startDate,
                'end_date' => $endDate,
                'impressions' => $impressions,
                'reach' => $reach,
                'clicks' => $clicks,
                'link_clicks' => $linkClicks ?: $clicks,
                'spend' => $spend,
                'cpm' => $cpm,
                'cpc' => $cpc,
                'ctr' => $ctr,
                'conversions' => $conversions,
                'roas' => $roas,
                'frequency' => $frequency,
                'video_plays' => $videoPlays,
                'thruplays' => $thruPlays,
            ];

            $ads[] = $adRow;

            // Aggregate by campaign
            $cKey = $campaignName ?: 'Unknown Campaign';
            if (!isset($campaigns[$cKey])) {
                $campaigns[$cKey] = [
                    'name' => $cKey,
                    'impressions' => 0,
                    'reach' => 0,
                    'clicks' => 0,
                    'spend' => 0,
                    'conversions' => 0,
                    'roas' => 0,
                    'ad_count' => 0,
                ];
            }
            $campaigns[$cKey]['impressions'] += $impressions;
            $campaigns[$cKey]['reach'] += $reach;
            $campaigns[$cKey]['clicks'] += $clicks;
            $campaigns[$cKey]['spend'] += $spend;
            $campaigns[$cKey]['conversions'] += $conversions;
            $campaigns[$cKey]['roas'] = $spend > 0 && $conversions > 0
                ? round($campaigns[$cKey]['conversions'] / $campaigns[$cKey]['spend'], 4)
                : max($campaigns[$cKey]['roas'], $roas);
            $campaigns[$cKey]['ad_count']++;

            // Aggregate by ad set
            $sKey = "{$cKey} › {$adSetName}";
            if (!isset($adSets[$sKey])) {
                $adSets[$sKey] = [
                    'name' => $adSetName ?: 'Unknown Ad Set',
                    'campaign' => $cKey,
                    'impressions' => 0,
                    'reach' => 0,
                    'clicks' => 0,
                    'spend' => 0,
                    'conversions' => 0,
                ];
            }
            $adSets[$sKey]['impressions'] += $impressions;
            $adSets[$sKey]['reach'] += $reach;
            $adSets[$sKey]['clicks'] += $clicks;
            $adSets[$sKey]['spend'] += $spend;
            $adSets[$sKey]['conversions'] += $conversions;
        }

        // 4. Compute overall KPIs
        $totalImpressions = array_sum(array_column($ads, 'impressions'));
        $totalReach = array_sum(array_column($ads, 'reach'));
        $totalClicks = array_sum(array_column($ads, 'clicks'));
        $totalSpend = array_sum(array_column($ads, 'spend'));
        $totalConversions = array_sum(array_column($ads, 'conversions'));

        $avgCtr = $totalImpressions > 0
            ? round(($totalClicks / $totalImpressions) * 100, 4) : 0;
        $avgCpc = $totalClicks > 0
            ? round($totalSpend / $totalClicks, 4) : 0;
        $avgCpm = $totalImpressions > 0
            ? round(($totalSpend / $totalImpressions) * 1000, 4) : 0;
        $totalRoas = $totalSpend > 0 && $totalConversions > 0
            ? round($totalConversions / $totalSpend, 4) : 0;

        // 5. Top performers
        $adCollection = collect($ads);
        $topRoas = $adCollection->sortByDesc('roas')->first();
        $topCtr = $adCollection->sortByDesc('ctr')->first();
        $topConversions = $adCollection->sortByDesc('conversions')->first();
        $topImpressions = $adCollection->sortByDesc('impressions')->first();

        // 6. Period
        sort($dates);
        $startDate = $dates[0] ?? null;
        $endDate = end($dates) ?: null;
        $duration = ($startDate && $endDate)
            ? Carbon::parse($startDate)->diffInDays(Carbon::parse($endDate)) + 1
            : 0;

        return [
            'period' => [
                'start' => $startDate,
                'end' => $endDate,
                'duration' => $duration . ' Days',
            ],
            'kpi' => [
                'total_spend' => round($totalSpend, 2),
                'total_impressions' => $totalImpressions,
                'total_reach' => $totalReach,
                'total_clicks' => $totalClicks,
                'total_conversions' => $totalConversions,
                'avg_ctr' => $avgCtr,
                'avg_cpc' => $avgCpc,
                'avg_cpm' => $avgCpm,
                'total_roas' => $totalRoas,
            ],
            'campaigns' => array_values($campaigns),
            'ad_sets' => array_values($adSets),
            'ads' => $ads,
            'top_performers' => [
                'best_roas' => $topRoas,
                'best_ctr' => $topCtr,
                'best_conversions' => $topConversions,
                'best_impressions' => $topImpressions,
            ],
            'total_ads' => count($ads),
            'total_campaigns' => count($campaigns),
        ];
    }

    // -------------------------------------------------------------------------
    // Header mapping — handles all standard Facebook Ads Manager export columns
    // -------------------------------------------------------------------------
    private function mapHeaders(array $headers): array
    {
        // Defaults (column index fallbacks for common export order)
        $map = [
            'campaign' => 0,
            'adset' => 1,
            'ad' => 2,
            'impressions' => 3,
            'reach' => 4,
            'clicks' => 5,
            'link_clicks' => 5,
            'ctr' => 6,
            'cpc' => 7,
            'cpm' => 8,
            'spend' => 9,
            'conversions' => 10,
            'roas' => 11,
            'frequency' => 12,
            'video_plays' => 13,
            'thruplays' => 14,
            'start_date' => 15,
            'end_date' => 16,
        ];

        foreach ($headers as $i => $h) {
            // Campaign / Ad Set / Ad identity
            if ($h === 'campaign-name' || str_contains($h, 'campaign'))
                $map['campaign'] = $i;
            if ($h === 'ad-set-name' || str_contains($h, 'ad-set'))
                $map['adset'] = $i;
            if ($h === 'ad-name' || ($h === 'ad' && !str_contains($h, 'account') && !str_contains($h, 'ad-set') && !str_contains($h, 'spend') && !str_contains($h, 'delivery')))
                $map['ad'] = $i;

            // Delivery
            if ($h === 'impressions' || str_contains($h, 'impression'))
                $map['impressions'] = $i;
            if ($h === 'reach' || str_contains($h, 'reach'))
                $map['reach'] = $i;
            if ($h === 'frequency' || str_contains($h, 'frequency'))
                $map['frequency'] = $i;

            // Clicks
            if ($h === 'clicks-all' || $h === 'clicks' || str_contains($h, 'all-clicks'))
                $map['clicks'] = $i;
            if ($h === 'link-clicks' || str_contains($h, 'link-click'))
                $map['link_clicks'] = $i;

            // Cost metrics
            if ($h === 'amount-spent' || str_contains($h, 'amount-spent') || str_contains($h, 'spend'))
                $map['spend'] = $i;
            if ($h === 'cpm-cost-per-1000-impressions-reached' || $h === 'cpm' || str_contains($h, 'cpm'))
                $map['cpm'] = $i;
            if ($h === 'cpc-cost-per-link-click' || $h === 'cpc' || str_contains($h, 'cpc'))
                $map['cpc'] = $i;
            if ($h === 'ctr-link-click-through-rate' || $h === 'ctr' || str_contains($h, 'click-through-rate') || str_contains($h, 'ctr'))
                $map['ctr'] = $i;

            // Conversions / Results
            if ($h === 'results' || str_contains($h, 'result') || str_contains($h, 'conversion'))
                $map['conversions'] = $i;
            if (str_contains($h, 'purchase-roas') || str_contains($h, 'roas'))
                $map['roas'] = $i;

            // Video
            if (str_contains($h, 'video-play') && !str_contains($h, 'thru'))
                $map['video_plays'] = $i;
            if (str_contains($h, 'thruplay') || str_contains($h, 'thru-play'))
                $map['thruplays'] = $i;

            // Dates
            if ($h === 'reporting-starts' || str_contains($h, 'start-date') || str_contains($h, 'reporting-starts'))
                $map['start_date'] = $i;
            if ($h === 'reporting-ends' || str_contains($h, 'end-date') || str_contains($h, 'reporting-ends'))
                $map['end_date'] = $i;
        }

        return $map;
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------
    private function str($row, array $map, string $key): string
    {
        $idx = $map[$key] ?? null;
        if ($idx === null || !isset($row[$idx]))
            return '';
        return trim((string) $row[$idx]);
    }

    private function num($row, array $map, string $key): int
    {
        $idx = $map[$key] ?? null;
        if ($idx === null || !isset($row[$idx]))
            return 0;
        $val = str_replace([',', ' '], '', (string) $row[$idx]);
        return (int) $val;
    }

    private function dec($row, array $map, string $key): float
    {
        $idx = $map[$key] ?? null;
        if ($idx === null || !isset($row[$idx]))
            return 0.0;
        $val = str_replace([',', '%', '$', '€', '£', '฿', ' '], '', (string) $row[$idx]);
        return (float) $val;
    }

    private function parseDate($val): ?string
    {
        if (!$val)
            return null;
        try {
            if (is_numeric($val)) {
                return \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($val)->format('Y-m-d');
            }
            $str = trim((string) $val);
            if ($str === '' || $str === '-')
                return null;
            // Common FB format: "2024-01-15" or "01/15/2024"
            if (str_contains($str, '/')) {
                $parts = explode(' ', $str);
                return Carbon::createFromFormat('m/d/Y', $parts[0])->format('Y-m-d');
            }
            return Carbon::parse($str)->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
    }
}
