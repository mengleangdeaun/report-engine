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
        $uniqueAds = [];
        $kpiRow = [];
        $fallbackObjective = null;

        foreach ($data->slice($headerRowIndex + 1) as $row) {
            // Skip totally empty rows
            if (!isset($row[0]) || trim((string) $row[0]) === '')
                continue;

            $isTotalRow = str_contains(strtolower((string) $row[0]), 'total') || (isset($row[1]) && str_contains(strtolower((string) $row[1]), 'total'));
            $mappedRow = [];

            // Map cells to slugified headers and cast to proper types
            foreach ($headers as $i => $key) {
                if (!isset($row[$i]))
                    continue;
                $val = trim((string) $row[$i]);

                $type = $this->getMetricType($key);

                if ($type === 'float') {
                    $mappedRow[$key] = $this->floatFromStr($val);
                } elseif ($type === 'int') {
                    $mappedRow[$key] = $this->intFromStr($val);
                } else {
                    $mappedRow[$key] = $val;
                }
            }

            if ($isTotalRow) {
                $kpiRow = array_merge($kpiRow, $mappedRow);
                continue;
            }

            $adRow = $mappedRow;

            if (!$fallbackObjective && !empty($adRow['objective'])) {
                $fallbackObjective = $adRow['objective'];
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

            // Stash an implied purchase value so ROAS can be mathematically aggregated across multi-row age/gender combinations
            $adRow['_implied_purchase_value'] = $roas * $spend;

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

            $adIdentifier = $adRow['ad_id'] ?? $adRow['ad'] ?? 'ad_' . count($uniqueAds);

            // Deduplicate Add Rows (Useful for CSVs that exported Age/Gender Breakdowns)
            if (!isset($uniqueAds[$adIdentifier])) {
                $uniqueAds[$adIdentifier] = $adRow;
            } else {
                foreach ($adRow as $k => $v) {
                    if ($this->getMetricType($k) !== 'string') {
                        $uniqueAds[$adIdentifier][$k] = ($uniqueAds[$adIdentifier][$k] ?? 0) + $v;
                    } elseif (empty($uniqueAds[$adIdentifier][$k]) && !empty($v)) {
                        $uniqueAds[$adIdentifier][$k] = $v;
                    }
                }
            }

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
                    'ad_count' => 0,
                    '_unique_ads' => []
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

            // Dynamic Aggregation for all metrics
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
                } else {
                    // It is a string metric. Preserve the first encountered non-empty value for campaigns/ad_sets.
                    // This solves the missing "last_significant_edit" and others on aggregated breakdown levels
                    if (empty($campaigns[$cKey][$k]) && !empty($v)) {
                        $campaigns[$cKey][$k] = $v;
                    }
                    if (empty($adSets[$sKey][$k]) && !empty($v)) {
                        $adSets[$sKey][$k] = $v;
                    }
                }
            }
            $campaigns[$cKey]['_unique_ads'][$adIdentifier] = true;
            $campaigns[$cKey]['ad_count'] = count($campaigns[$cKey]['_unique_ads']);
        }

        // Finalize Ads Array
        $ads = array_values($uniqueAds);

        // 4. Compute overall KPIs & recalibrate rates at agg levels
        $kpi = $kpiRow;

        // Ensure objective is preserved in the KPI
        $kpi['objective'] = $kpiRow['objective'] ?? $fallbackObjective ?? 'Unknown';

        // If the export was missing a total row, we must generate dynamic sums at least for all numeric columns.
        if (empty($kpiRow)) {
            $dynamicKpi = [];
            foreach ($ads as $ad) {
                foreach ($ad as $k => $v) {
                    if ($this->getMetricType($k) !== 'string') {
                        $dynamicKpi[$k] = ($dynamicKpi[$k] ?? 0) + $v;
                    }
                }
            }
            $dynamicKpi['objective'] = $fallbackObjective ?? 'Unknown';
            $kpi = $dynamicKpi;
        }

        foreach ($campaigns as &$c) {
            unset($c['_unique_ads']);
        }

        // Recalculate true rates for any aggregated items to avoid additive corruption (e.g. 5% + 5% != 10%)
        $recalculateRates = function (&$item) {
            $impressions = $item['impressions'] ?? 0;
            $clicks = $item['clicks'] ?? 0;
            $spend = $item['spend'] ?? 0;

            if ($impressions > 0) {
                $item['ctr'] = round(($clicks / $impressions) * 100, 4);
                $item['ctr_all'] = $item['ctr'];
                if ($spend > 0) {
                    $item['cpm'] = round(($spend / $impressions) * 1000, 4);
                    $item['cpm_cost_per_1000_impressions'] = $item['cpm'];
                }
            }
            if ($clicks > 0 && $spend > 0) {
                $item['cpc'] = round($spend / $clicks, 4);
                $item['cpc_all'] = $item['cpc'];
                $item['cpc_cost_per_link_click'] = $item['cpc'];
            }
            if ($spend > 0 && isset($item['_implied_purchase_value'])) {
                $item['roas'] = round($item['_implied_purchase_value'] / $spend, 4);
                $item['purchase_roas_return_on_ad_spend'] = $item['roas'];
            }
        };

        foreach ($ads as &$ad) {
            $recalculateRates($ad);
        }
        foreach ($campaigns as &$c) {
            $recalculateRates($c);
        }
        foreach ($adSets as &$s) {
            $recalculateRates($s);
        }
        $recalculateRates($kpi);

        // Map standard KPI keys for database preservation if present
        $kpi['total_spend'] = $kpi['total_spend'] ?? $this->findVal($kpi, ['amount_spent', 'amount_spent_usd', 'spend', 'total_spend']);
        $kpi['total_impressions'] = $kpi['total_impressions'] ?? $this->findVal($kpi, ['impressions', 'total_impressions']);
        $kpi['total_reach'] = $kpi['total_reach'] ?? $this->findVal($kpi, ['reach', 'total_reach']);
        $kpi['total_clicks'] = $kpi['total_clicks'] ?? $this->findVal($kpi, ['clicks', 'clicks_all', 'total_clicks']);
        $kpi['total_conversions'] = $kpi['total_conversions'] ?? $this->findVal($kpi, ['results', 'conversions', 'total_conversions']);
        $kpi['avg_ctr'] = $kpi['avg_ctr'] ?? $this->findVal($kpi, ['ctr', 'ctr_all', 'avg_ctr']);
        $kpi['avg_cpc'] = $kpi['avg_cpc'] ?? $this->findVal($kpi, ['cpc', 'cpc_all', 'avg_cpc']);
        $kpi['avg_cpm'] = $kpi['avg_cpm'] ?? $this->findVal($kpi, ['cpm', 'cpm_all', 'avg_cpm']);
        $kpi['total_roas'] = $kpi['total_roas'] ?? $this->findVal($kpi, ['purchase_roas_return_on_ad_spend', 'roas', 'total_roas']);

        // 5. Dynamic Top performers driven by Objective
        $adCollection = collect($ads);
        $objective = strtoupper($kpi['objective'] ?? '');
        $topPerformers = [];

        // Helper to format winners dynamically
        $addWinner = function ($key, $title, $type = 'raw', $color = '#0866FF') use ($adCollection, &$topPerformers) {
            $winner = $adCollection->sortByDesc($key)->first();
            if ($winner && ($winner[$key] ?? 0) > 0) {
                $topPerformers[] = [
                    'id' => $key,
                    'title' => $title,
                    'ad' => $winner,
                    'metric' => $winner[$key],
                    'type' => $type,
                    'color' => $color
                ];
            }
        };

        // Helper for lowest-cost winners
        $addLowestCost = function ($key, $title, $color = '#FBBC05') use ($adCollection, &$topPerformers) {
            $winner = $adCollection->filter(fn($a) => ($a[$key] ?? 0) > 0)->sortBy($key)->first();
            if ($winner) {
                $topPerformers[] = [
                    'id' => $key,
                    'title' => $title,
                    'ad' => $winner,
                    'metric' => $winner[$key],
                    'type' => 'money',
                    'color' => $color
                ];
            }
        };

        switch ($objective) {
            case 'SALES':
                $addWinner('roas', 'Best ROAS', 'multiplier', '#0866FF');
                $addWinner('conversions', 'Most Conversions', 'raw', '#34A853');
                $addLowestCost('cpc', 'Lowest CPC', '#FBBC05');
                break;
            case 'LEADS':
                $addWinner('conversions', 'Most Leads', 'raw', '#34A853');
                $addLowestCost('cost_per_results', 'Lowest Cost per Lead', '#FBBC05');
                $addWinner('ctr', 'Highest CTR', 'pct', '#0866FF');
                break;
            case 'TRAFFIC':
                $addWinner('clicks', 'Most Link Clicks', 'raw', '#0866FF');
                $addWinner('ctr', 'Highest CTR', 'pct', '#34A853');
                $addLowestCost('cpc', 'Lowest CPC', '#FBBC05');
                break;
            case 'ENGAGEMENT':
                $addWinner('post_engagements', 'Most Engagements', 'raw', '#0866FF');
                $addWinner('messaging_conversations_started', 'Most Messages', 'raw', '#34A853');
                $addWinner('video_plays', 'Most Video Plays', 'raw', '#8B5CF6');
                break;
            case 'AWARENESS':
                $addWinner('reach', 'Highest Reach', 'raw', '#0866FF');
                $addWinner('impressions', 'Most Impressions', 'raw', '#34A853');
                $addLowestCost('cpm', 'Lowest CPM', '#FBBC05');
                break;
            case 'APP PROMOTION':
                $addWinner('conversions', 'Most App Installs', 'raw', '#34A853');
                $addLowestCost('cost_per_results', 'Lowest Cost per Install', '#FBBC05');
                $addWinner('clicks', 'Most Clicks', 'raw', '#0866FF');
                break;
            default:
                // Fallback for Unknown or unmapped
                $addWinner('roas', 'Best ROAS', 'multiplier', '#0866FF');
                $addWinner('ctr', 'Highest CTR', 'pct', '#34A853');
                $addWinner('conversions', 'Most Conversions', 'raw', '#FBBC05');
                $addWinner('impressions', 'Most Impressions', 'raw', '#8B5CF6');
                break;
        }

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
            'kpi' => $kpi,
            'campaigns' => array_values($campaigns),
            'ad_sets' => array_values($adSets),
            'ads' => $ads,
            'top_performers' => $topPerformers,
            'total_ads' => count($uniqueAds),
            'total_campaigns' => count($campaigns),
            'available_columns' => array_values($headers),
        ];
    }

    /**
     * Helper to classify metrics to correct data types safely
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
            'percentage',
            'value',
            'return',
            'budget'
        ];

        // Exact or explicit word-boundary strings to prevent the word 'ad' from matching 'leads', 
        // or 'age' matching 'messages'
        $strMetrics = [
            'campaign',
            'ad_set',
            'ad',
            'name',
            'id',
            'date',
            'objective',
            'status',
            'indicator',
            'setting',
            'ranking',
            'delivery',
            'bid',
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
            'link',
            'text',
            'headline',
            'description',
            'call_to_action',
            'starts',
            'ends',
            'time_of_day',
            'edit',
            'created',
            'updated',
            'goal',
            'schedule',
            'body',
            'currency',
            'timezone',
            'hash',
            'audience',
            'business_locations',
            'sound',
            'component'
        ];

        // 1. Float Check (loose substring is slightly safer here, but still better to word-bound)
        foreach ($floatMetrics as $m) {
            if (preg_match("/(^|_)" . preg_quote($m, '/') . "($|_)/i", $key) || str_contains($key, $m)) {
                return 'float';
            }
        }

        // 2. String Check (Must be strictly bound to avoid false positives)
        foreach ($strMetrics as $m) {
            if (preg_match("/(^|_|-)" . preg_quote($m, '/') . "($|_|-)/i", $key)) {
                return 'string';
            }
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
