<?php

namespace App\Services;

use Maatwebsite\Excel\Facades\Excel;
use Carbon\Carbon;
use Illuminate\Support\Str;

class TikTokAnalyzer
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
        $totals = [
            'views' => 0, 'likes' => 0, 'comments' => 0, 
            'shares' => 0, 'saves' => 0, 'engagement_rate' => 0
        ];

        // 3. Process Rows
        foreach ($data->slice(1) as $row) {
            if (!isset($row[0]) || $row[0] === '') continue;

            // --- DATA EXTRACTION ---
            $title    = isset($map['title']) ? (string)($row[$map['title']] ?? 'Untitled Video') : 'Untitled Video';
            $link     = isset($map['link']) ? (string)($row[$map['link']] ?? '#') : '#';
            $dateVal  = $row[$map['date']] ?? null;

            // --- METRICS ---
            $views     = (int)($row[$map['views']] ?? 0);
            $likes     = (int)($row[$map['likes']] ?? 0);
            $comments  = (int)($row[$map['comments']] ?? 0);
            $shares    = (int)($row[$map['shares']] ?? 0);
            $saves     = (int)($row[$map['saves']] ?? 0);

            // --- ACCUMULATE ---
            $totals['views']    += $views;
            $totals['likes']    += $likes;
            $totals['comments'] += $comments;
            $totals['shares']   += $shares;
            $totals['saves']    += $saves;

            // --- CALCULATE ENGAGEMENT ---
            // TikTok Engagement = Likes + Comments + Shares + Saves
            $totalInteraction = $likes + $comments + $shares + $saves;

            $er = $views > 0 ? round(($totalInteraction / $views) * 100, 2) : 0;

            $posts[] = [
                'title'            => $this->cleanTitle($title),
                'date'             => $this->parseDate($dateVal),
                'type'             => 'Video', // TikTok is almost always Video
                'views'            => $views,
                'likes'            => $likes,
                'comments'         => $comments,
                'shares'           => $shares,
                'saves'            => $saves,
                'total_engagement' => $totalInteraction,
                'engagement_rate'  => $er,
                'link'             => $link
            ];
        }

        $totalGlobalInteraction = $totals['likes'] + $totals['comments'] + $totals['shares'] + $totals['saves'];
        
        $totals['engagement_rate'] = $totals['views'] > 0 
            ? round(($totalGlobalInteraction / $totals['views']) * 100, 2) 
            : 0;

        // 4. Sort & Finalize
        $col = collect($posts)->sortBy('date');

        $startDate = $col->first()['date'] ?? null;
        $endDate   = $col->last()['date'] ?? null;

        $duration = ($startDate && $endDate)
            ? Carbon::parse($startDate)->diffInDays(Carbon::parse($endDate)) + 1
            : 0;

        return [
            'period' => [
                'start'    => $startDate,
                'end'      => $endDate,
                'duration' => $duration . ' Days Active',
            ],
            'total_content' => $col->count(),
            'kpi'           => $totals,
            'champions'     => [
                'highest_view'       => $col->sortByDesc('views')->first(),
                'highest_likes'      => $col->sortByDesc('likes')->first(),
                'highest_engagement' => $col->sortByDesc('total_engagement')->first(),
                'highest_comments'   => $col->sortByDesc('comments')->first(),
                'highest_shares'     => $col->sortByDesc('shares')->first(),
                'highest_saves'      => $col->sortByDesc('saves')->first(),
            ],
            'posts' => $col->sortByDesc('date')->values()->all()
        ];
    }

    private function mapHeaders($headers)
    {
        // Default Map
        $map = [
            'date'=>0, 'title'=>1, 'link'=>2, 
            'views'=>3, 'likes'=>4, 'comments'=>5, 'shares'=>6, 'saves'=>7
        ];

        foreach ($headers as $i => $h) {
            // DATE: "Time", "Date", "Publish time"
            if (str_contains($h, 'time') || str_contains($h, 'date')) $map['date'] = $i;
            
            // TITLE: "Video description", "Caption", "Title"
            if (str_contains($h, 'desc') || str_contains($h, 'caption') || str_contains($h, 'title')) $map['title'] = $i;
            
            // LINK: "Link", "Video link", "Permalink"
            if (str_contains($h, 'link') || str_contains($h, 'url')) $map['link'] = $i;
            
            // METRICS
            if (str_contains($h, 'view') || str_contains($h, 'play')) $map['views'] = $i;
            if (str_contains($h, 'like') || str_contains($h, 'heart')) $map['likes'] = $i;
            if (str_contains($h, 'comment')) $map['comments'] = $i;
            if (str_contains($h, 'share')) $map['shares'] = $i;
            
            // SAVES (Specific to TikTok)
            if (str_contains($h, 'save') || str_contains($h, 'favorite')) $map['saves'] = $i;
        }

        return $map;
    }

    private function parseDate($val)
    {
        if (!$val) return now()->format('Y-m-d');
        try {
            if (is_numeric($val)) {
                return \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($val)->format('Y-m-d');
            }
            return Carbon::parse($val)->format('Y-m-d');
        } catch (\Exception $e) {
            return now()->format('Y-m-d');
        }
    }

    private function cleanTitle($title) {
        if ($title === '') return 'Untitled Video';
        return Str::limit($title, 50);
    }
}