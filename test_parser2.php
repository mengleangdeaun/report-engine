<?php
require 'vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$analyzer = app(App\Services\FacebookAdsAnalyzer::class);
$method = new ReflectionMethod($analyzer, 'getMetricType');
$method->setAccessible(true);

$tests = [
    'leads',
    'ad_id',
    'amount_spent',
    'cost_per_lead',
    'messages',
    'average_play_time',
    'video_views',
    'ad_set_name',
    'location_searches',
    'business_locations',
    'video_average_play_time',
    'messages_delivered',
    'cost_per_message_delivered',
    'campaign_delivery',
    'adds_to_cart',
    'ad_creative',
    'date_of_birth'
];

foreach ($tests as $t) {
    echo $t . ": " . $method->invoke($analyzer, $t) . "\n";
}
