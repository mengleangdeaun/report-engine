<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\FacebookAdsAnalyzer;

$analyzer = new FacebookAdsAnalyzer();

$testHeaders = [
    'Reporting starts',
    'Reporting ends',
    'Ad name',
    'Ad delivery',
    'Results',
    'Result indicator',
    'Cost per results',
    'Ad set budget',
    'Ad set budget type',
    'Amount spent (USD)',
    'Impressions',
    'Reach',
    'Ends',
    'Attribution setting',
    'Bid',
    'Bid type',
    'Last significant edit',
    'Quality ranking'
];

$testRow = [
    '2023-01-01',
    '2023-01-31',
    'Ad 1',
    'Active',
    '10',
    '',
    '1.50',
    '100',
    'Daily',
    '15.00',
    '1000',
    '500',
    '2023-02-01',
    '7-day click',
    'Auto',
    '',
    '2023-01-15T10:00:00',
    'Above Average'
];

// Recreate the minimal data structure expected by analyze()
// The method uses Maatwebsite\Excel\Facades\Excel; but we can mock it if we construct a raw collection
$collection = collect([
    $testHeaders,
    $testRow,
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''] // Empty to stop or test handling
]);

// Since the analyzer expects a file, we should mock Excel::toCollection
// Alternatively, let's just run the chunk of code that parses headers:

$data = $collection;

$headerRowIndex = 0;
$rawHeaders = null;

foreach ($data as $i => $row) {
    if (!isset($row[0]))
        continue;
    $firstCell = strtolower(trim((string) ($row[0])));
    if ($firstCell !== '' && !is_numeric($firstCell) && !str_contains($firstCell, 'total')) {
        $headerRowIndex = $i;
        $rawHeaders = $row;
        break;
    }
}

$headers = [];
foreach ($rawHeaders as $i => $h) {
    $val = trim((string) $h);
    if ($val !== '') {
        $slug = str_replace('-', '_', \Illuminate\Support\Str::slug($val));
        $headers[$i] = $slug;
    }
}

echo "Slugged Headers:\n";
print_r($headers);

$mappedRow = [];
foreach ($headers as $i => $key) {
    $row = $testRow;
    if (!isset($row[$i]))
        continue;
    $val = trim((string) $row[$i]);

    // Simulate getMetricType
    $type = 'int';
    $floatMetrics = ['spend', 'amount', 'cpm', 'cpc', 'ctr', 'roas', 'frequency', 'cost_per', 'rate', 'value', 'return', 'budget'];
    $strMetrics = ['campaign', 'ad_set', 'ad', 'name', 'id', 'date', 'objective', 'status', 'gender', 'age', 'country', 'region', 'platform', 'placement', 'device', 'creative', 'category', 'brand', 'type', 'card', 'destination', 'source', 'url', 'text', 'headline', 'description', 'call_to_action', 'starts', 'ends', 'time', 'edit', 'created', 'updated', 'setting', 'ranking', 'delivery', 'indicator'];

    foreach ($strMetrics as $m) {
        if (str_contains($key, $m)) {
            $type = 'string';
            break;
        }
    }
    if ($type !== 'string') {
        foreach ($floatMetrics as $m) {
            if (str_contains($key, $m)) {
                $type = 'float';
                break;
            }
        }
    }

    echo "Key: $key -> Type: $type -> Val: $val\n";
}
