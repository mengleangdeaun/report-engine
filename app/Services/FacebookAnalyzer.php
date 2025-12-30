<?php

namespace App\Services;

use Maatwebsite\Excel\Facades\Excel;
use Carbon\Carbon;
use Illuminate\Support\Str;

class FacebookAnalyzer
{
    public function analyze($file)
    {
        // 1. Read File
        $data = Excel::toCollection(new \stdClass, $file)->first();

        if ($data->isEmpty()) {
            throw new \Exception("The uploaded file is empty.");
        }

        // 2. Map Headers
        $headers = $data->first()->map(fn($h) => Str::slug((string)$h))->toArray();
        $map = $this->mapHeaders($headers);

        $posts = [];
        $types = ['reels' => 0, 'videos' => 0, 'photos' => 0];
        $totals = [
            'views' => 0, 'reach' => 0, 'reactions' => 0, 
            'comments' => 0, 'shares' => 0, 'link_clicks' => 0
        ];

        // 3. Process Rows
        foreach ($data->slice(1) as $row) {
            // Skip empty rows
            if (!isset($row[0]) || $row[0] === '') continue;

            // --- DATA EXTRACTION ---
            $title    = isset($map['title']) ? (string)($row[$map['title']] ?? 'Untitled Post') : 'Untitled Post';
            $link     = isset($map['link']) ? (string)($row[$map['link']] ?? '#') : '#';
            $rawType  = (string)($row[$map['type']] ?? 'Photo');
            $dateVal  = $row[$map['date']] ?? null;

            // --- METRICS ---
            $reach     = (int)($row[$map['reach']] ?? 0);
            
            // Views Logic: Use Views column, fallback to Reach
            $views     = (int)($row[$map['views']] ?? 0);
            if ($views === 0) $views = $reach; 

            $reactions = (int)($row[$map['likes']] ?? 0);
            $comments  = (int)($row[$map['comments']] ?? 0);
            $shares    = (int)($row[$map['shares']] ?? 0);
            $clicks    = (int)($row[$map['clicks']] ?? 0);

            // --- ACCUMULATE ---
            $totals['views']       += $views;
            $totals['reach']       += $reach;
            $totals['reactions']   += $reactions;
            $totals['comments']    += $comments;
            $totals['shares']      += $shares;
            $totals['link_clicks'] += $clicks;

            $totalInteractions = $totals['reactions'] + $totals['comments'] + $totals['shares'];

            $totals['engagement_rate'] = $totals['reach'] > 0 
            ? round(($totalInteractions / $totals['reach']) * 100, 2) 
            : 0;

            // --- TYPE DETECTION ---
            $type = $this->detectType($rawType);
            if (isset($types[$type])) { $types[$type]++; } else { $types['photos']++; }

            // --- ENGAGEMENT CALCULATION ---
            // FIX: Use the explicit "Reactions, Comments and Shares" column if available
            if (isset($map['engagement_total'])) {
                $totalInteraction = (int)($row[$map['engagement_total']] ?? 0);
            } else {
                // Fallback if that specific column is missing in a different export format
                $totalInteraction = $reactions + $comments + $shares;
            }

            // ER Calculation (Interactions / Reach)
            $er = $reach > 0 ? round(($totalInteraction / $reach) * 100, 2) : 0;

            $posts[] = [
                'title'            => $this->cleanTitle($title),
                'date'             => $this->parseDate($dateVal),
                'type'             => ucfirst($type),
                'views'            => $views,
                'reach'            => $reach,
                'reactions'        => $reactions,
                'comments'         => $comments,
                'shares'           => $shares,
                'link_clicks'      => $clicks,
                'total_engagement' => $totalInteraction, // Used for sorting Champion
                'engagement_rate'  => $er,
                'link'             => $link
            ];
        }

        // 4. Sort & Finalize
        $col = collect($posts)->sortBy('date');

        return [
            'period' => [
                'start'    => $col->first()['date'] ?? null,
                'end'      => $col->last()['date'] ?? null,
                'duration' => $col->unique('date')->count() . ' Days Active'
            ],
            'total_content' => $col->count(),
            'breakdown'     => $types,
            'kpi'           => $totals,
            'champions'     => [
                'highest_view'       => $col->sortByDesc('views')->first(),
                'highest_reach'      => $col->sortByDesc('reach')->first(),
                // Uses the specific column value now
                'highest_engagement' => $col->sortByDesc('total_engagement')->first(),
                'highest_comments'   => $col->sortByDesc('comments')->first(),
                'highest_shares'     => $col->sortByDesc('shares')->first(),
                'highest_clicks'     => $col->sortByDesc('link_clicks')->first(),
            ],
            'posts' => $col->sortByDesc('date')->values()->all()
        ];
    }

    private function mapHeaders($headers)
    {
        $map = [
            'date'=>6, 'title'=>3, 'type'=>11, 
            'reach'=>18, 'views'=>17, 'likes'=>20, 
            'comments'=>21, 'shares'=>22, 'clicks'=>26, 'link'=>8
        ];

        foreach ($headers as $i => $h) {
            // DATE
            if ($h === 'publish-time' || str_contains($h, 'time') || str_contains($h, 'posted')) $map['date'] = $i;
            
            // TITLE
            if ($h === 'title') {
                $map['title'] = $i;
            } elseif (str_contains($h, 'message') || str_contains($h, 'caption')) {
                if (!isset($map['title'])) $map['title'] = $i;
            }
            
            // LINK
            if ($h === 'permalink' || (str_contains($h, 'link') && !str_contains($h, 'click'))) $map['link'] = $i;

            // TYPE
            if (str_contains($h, 'type')) $map['type'] = $i;
            
            // REACH
            if (str_contains($h, 'reach') && !str_contains($h, 'viral')) $map['reach'] = $i;

            // VIEWS
            if (str_contains($h, 'views') && !str_contains($h, 'impression')) {
                $map['views'] = $i;
            } elseif (!isset($map['views']) && str_contains($h, 'impression')) {
                $map['views'] = $i;
            }

            // LIKES
            if (str_contains($h, 'reaction') || (str_contains($h, 'like') && !str_contains($h, 'click'))) $map['likes'] = $i;

            // COMMENTS
            if (str_contains($h, 'comment')) $map['comments'] = $i;

            // SHARES
            if (str_contains($h, 'share')) $map['shares'] = $i;

            // LINK CLICKS
            if ($h === 'link-clicks' || str_contains($h, 'link-click') || str_contains($h, 'url-click')) $map['clicks'] = $i;

            // --- FIX: EXACT MATCH FOR "Reactions, Comments and Shares" ---
            // Slug becomes: reactions-comments-and-shares
            if ($h === 'reactions-comments-and-shares' || str_contains($h, 'reactions-comments-and-shares')) {
                $map['engagement_total'] = $i;
            }
        }

        return $map;
    }

    private function detectType($raw)
    {
        $t = strtolower((string)$raw);
        if (str_contains($t, 'reel')) return 'reels';
        if (str_contains($t, 'video')) return 'videos';
        if (str_contains($t, 'photo') || str_contains($t, 'image')) return 'photos';
        return 'photos';
    }

    private function parseDate($val)
    {
        if (!$val) return now()->format('Y-m-d');
        try {
            if (is_numeric($val)) {
                return \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($val)->format('Y-m-d');
            }
            if (str_contains($val, '/')) {
                $parts = explode(' ', $val);
                return Carbon::createFromFormat('m/d/Y', $parts[0])->format('Y-m-d');
            }
            return Carbon::parse($val)->format('Y-m-d');
        } catch (\Exception $e) {
            return now()->format('Y-m-d');
        }
    }

    private function cleanTitle($title) {
        if ($title === '-————————-' || $title === '') return 'Untitled Post';
        return Str::limit($title, 50);
    }
}