<?php

namespace App\Services;

use Maatwebsite\Excel\Facades\Excel;
use Carbon\Carbon;
use Illuminate\Support\Str;

class FacebookAdsAnalyzer
{
    /**
     * Analyze a Facebook Ads Manager CSV/XLSX export.
     * Uses dynamic header mapping to support an arbitrary number of columns.
     */
    public function analyze($file): array
    {
        // 1. Read the file
        $data = Excel::toCollection(new \stdClass, $file)->first();

        if (!$data || $data->isEmpty()) {
            throw new \Exception('The uploaded file is empty.');
        }

        // 2. Detect headers (row 0 or wherever they start)
        $headerRowIndex = 0;
        $rawHeaders = null;

        // Find the first row that doesn't look empty and isn't a "Total" row.
        // Usually, the first valid row in an FB Ads export contains 'Campaign Name', 'Campaign ID', 'Reporting Starts', etc.
        foreach ($data as $i => $row) {
            $firstCell = strtolower(trim((string) ($row[0] ?? '')));
            if ($firstCell !== '' && !is_numeric($firstCell) && !str_contains($firstCell, 'total')) {
                $headerRowIndex = $i;
                $rawHeaders = $row;
                break;
            }
        }

        if (!$rawHeaders) {
            $rawHeaders = $data->first();
        }

        $headers = [];
        foreach ($rawHeaders as $i => $h) {
            $val = trim((string) $h);
            if ($val !== '') {
                $slug = str_replace('-', '_', Str::slug($val));
                $headers[$i] = $slug;
            }
        }

        // 3. Process each data row
        $ads = [];
        $campaigns = [];
        $adSets = [];
        $dates = [];

        foreach ($data->slice($headerRowIndex + 1) as $row) {
            // Skip totally empty rows or rows that are summary totals
            if (!isset($row[0]) || trim((string) $row[0]) === '')
                continue;
            if (str_contains(strtolower((string) $row[0]), 'total'))
                continue;

            $adRow = [];

            // Map cells to slugified headers and cast to proper types
            foreach ($headers as $i => $key) {
                if (!isset($row[$i]))
                    continue;
                $val = trim((string) $row[$i]);

                // Allow empty values to be passed through for string breakdowns, 
                // but zero them out for numeric metrics.
                $type = $this->getMetricType($key);

                if ($type === 'float') {
                    $adRow[$key] = $this->floatFromStr($val);
                } elseif ($type === 'int') {
                    $adRow[$key] = $this->intFromStr($val);
                } else {
                    $adRow[$key] = $val;
                }
            }

            // Standardize some essential keys that the report generation expects
            $campaignName = $adRow['campaign_name'] ?? $adRow['campaign'] ?? 'Unknown Campaign';
            $adSetName = $adRow['ad_set_name'] ?? $adRow['ad_set'] ?? 'Unknown Ad Set';
            $adName = $adRow['ad_name'] ?? $adRow['ad'] ?? 'Unknown Ad';

            $adRow['campaign'] = $campaignName;
            $adRow['ad_set'] = $adSetName;
            $adRow['ad'] = $adName;

            // Map KPIs from various potential header names
            $spend = $this->findVal($adRow, ['amount_spent', 'amount_spent_usd', 'spend']);
            $impressions = $this->findVal($adRow, ['impressions']);
            $reach = $this->findVal($adRow, ['reach']);
            $clicks = $this->findVal($adRow, ['clicks', 'clicks_all']);
            $conversions = $this->findVal($adRow, ['results', 'conversions']);
            $roas = $this->findVal($adRow, ['purchase_roas_return_on_ad_spend', 'roas']);

            $adRow['spend'] = $spend;
            $adRow['impressions'] = $impressions;
            $adRow['reach'] = $reach;
            $adRow['clicks'] = $clicks;
            $adRow['conversions'] = $conversions;
            $adRow['roas'] = $roas;

            $ctrRaw = $this->findVal($adRow, ['ctr', 'ctr_all', 'ctr_link_click_through_rate']);
            $cpcRaw = $this->findVal($adRow, ['cpc', 'cpc_all', 'cpc_cost_per_link_click']);
            $cpmRaw = $this->findVal($adRow, ['cpm', 'cpm_cost_per_1000_impressions']);

            // Derive rates if not inherently exported
            $adRow['ctr'] = $ctrRaw > 0 ? $ctrRaw : ($impressions > 0 ? round(($clicks / $impressions) * 100, 4) : 0);
            $adRow['cpc'] = $cpcRaw > 0 ? $cpcRaw : ($clicks > 0 && $spend > 0 ? round($spend / $clicks, 4) : 0);
            $adRow['cpm'] = $cpmRaw > 0 ? $cpmRaw : ($impressions > 0 && $spend > 0 ? round(($spend / $impressions) * 1000, 4) : 0);

            // Parse dates
            $startDateRaw = $adRow['reporting_starts'] ?? $adRow['start_date'] ?? null;
            $endDateRaw = $adRow['reporting_ends'] ?? $adRow['end_date'] ?? null;

            $startDate = $this->parseDate($startDateRaw);
            $endDate = $this->parseDate($endDateRaw);

            $adRow['start_date'] = $startDate;
            $adRow['end_date'] = $endDate;

            if ($startDate)
                $dates[] = $startDate;
            if ($endDate)
                $dates[] = $endDate;

            $ads[] = $adRow;

            // Aggregation Setup
            $cKey = $campaignName;
            if (!isset($campaigns[$cKey])) {
                $campaigns[$cKey] = [
                    'name' => $cKey,
                    'impressions' => 0,
                    'reach' => 0,
                    'clicks' => 0,
                    'spend' => 0,
                    'conversions' => 0,
                    'roas' => 0,
                    'ad_count' => 0
                ];
            }
            $sKey = "{$cKey} › {$adSetName}";
            if (!isset($adSets[$sKey])) {
                $adSets[$sKey] = [
                    'name' => $adSetName,
                    'campaign' => $cKey,
                    'impressions' => 0,
                    'reach' => 0,
                    'clicks' => 0,
                    'spend' => 0,
                    'conversions' => 0
                ];
            }

            // Dynamic Aggregation for all numeric metrics
            foreach ($adRow as $k => $v) {
                // Ignore key identifiers and dates
                if (in_array($k, ['campaign', 'ad_set', 'ad', 'start_date', 'end_date', 'name', 'id', 'objective', 'status']))
                    continue;

                if ($this->getMetricType($k) !== 'string') {
                    if (!isset($campaigns[$cKey][$k]))
                        $campaigns[$cKey][$k] = 0;
                    if (!isset($adSets[$sKey][$k]))
                        $adSets[$sKey][$k] = 0;

                    // Only sum counts and totals (NOT rates) - we will recalculate core rates below
                    $campaigns[$cKey][$k] += $v;
                    $adSets[$sKey][$k] += $v;
                }
            }
            $campaigns[$cKey]['ad_count']++;
        }

        // 4. Compute overall KPIs & recalibrate rates at agg levels
        foreach ($campaigns as &$c) {
            $c['roas'] = $c['spend'] > 0 && $c['conversions'] > 0 ? round($c['conversions'] / $c['spend'], 4) : ($c['roas'] ?? 0);
            $c['ctr'] = $c['impressions'] > 0 ? round(($c['clicks'] / $c['impressions']) * 100, 4) : 0;
            $c['cpc'] = $c['clicks'] > 0 ? round($c['spend'] / $c['clicks'], 4) : 0;
            $c['cpm'] = $c['impressions'] > 0 ? round(($c['spend'] / $c['impressions']) * 1000, 4) : 0;
        }

        foreach ($adSets as &$s) {
            $s['roas'] = $s['spend'] > 0 && $s['conversions'] > 0 ? round($s['conversions'] / $s['spend'], 4) : ($s['roas'] ?? 0);
            $s['ctr'] = $s['impressions'] > 0 ? round(($s['clicks'] / $s['impressions']) * 100, 4) : 0;
            $s['cpc'] = $s['clicks'] > 0 ? round($s['spend'] / $s['clicks'], 4) : 0;
            $s['cpm'] = $s['impressions'] > 0 ? round(($s['spend'] / $s['impressions']) * 1000, 4) : 0;
        }

        $totalImpressions = array_sum(array_column($ads, 'impressions'));
        $totalReach = array_sum(array_column($ads, 'reach'));
        $totalClicks = array_sum(array_column($ads, 'clicks'));
        $totalSpend = array_sum(array_column($ads, 'spend'));
        $totalConversions = array_sum(array_column($ads, 'conversions'));

        $avgCtr = $totalImpressions > 0 ? round(($totalClicks / $totalImpressions) * 100, 4) : 0;
        $avgCpc = $totalClicks > 0 ? round($totalSpend / $totalClicks, 4) : 0;
        $avgCpm = $totalImpressions > 0 ? round(($totalSpend / $totalImpressions) * 1000, 4) : 0;
        $totalRoas = $totalSpend > 0 && $totalConversions > 0 ? round($totalConversions / $totalSpend, 4) : 0;

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
        $duration = ($startDate && $endDate) ? Carbon::parse($startDate)->diffInDays(Carbon::parse($endDate)) + 1 : 0;

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
            'available_columns' => array_values($headers),
        ];
    }

    /**
     * Helper to classify metrics to correct data types
     */
    private function getMetricType(string $key): string
    {
        $floatMetrics = [
            'spend',
            'amount',
            'cpm',
            'cpc',
            'ctr',
            'roas',
            'frequency',
            'cost_per',
            'rate',
            'value',
            'return',
            'budget'
        ];
        $strMetrics = [
            'campaign',
            'ad_set',
            'ad',
            'name',
            'id',
            'date',
            'objective',
            'status',
            'gender',
            'age',
            'country',
            'region',
            'platform',
            'placement',
            'device',
            'creative',
            'category',
            'brand',
            'type',
            'card',
            'destination',
            'source',
            'url',
            'text',
            'headline',
            'description',
            'call_to_action',
            'starts',
            'ends',
            'time'
        ];

        foreach ($strMetrics as $m) {
            if (str_contains($key, $m))
                return 'string';
        }
        foreach ($floatMetrics as $m) {
            if (str_contains($key, $m))
                return 'float';
        }
        return 'int';
    }

    private function findVal(array $arr, array $keys)
    {
        foreach ($keys as $k) {
            if (isset($arr[$k]))
                return $arr[$k];
        }
        return 0;
    }

    private function intFromStr($val): int
    {
        $val = str_replace([',', ' '], '', (string) $val);
        return (int) $val;
    }

    private function floatFromStr($val): float
    {
        $val = str_replace([',', '%', '$', '€', '£', '฿', ' '], '', (string) $val);
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
