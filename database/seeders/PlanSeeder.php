<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Plan;

class PlanSeeder extends Seeder
{
    public function run()
    {
        $plans = [
            [
                'name' => 'Free Starter',
                'slug' => 'free',
                'price' => 0,
                'member_limit' => 1,
                'max_tokens' => 10,
                'features' => ['facebook_basic']
            ],
            [
                'name' => 'Pro Business',
                'slug' => 'pro',
                'price' => 29,
                'member_limit' => 5,
                'max_tokens' => 1000,
                'features' => ['facebook_basic', 'facebook_advanced', 'tiktok_basic']
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'price' => 99,
                'member_limit' => 20,
                'max_tokens' => 10000,
                'features' => ['all']
            ]
        ];

        foreach ($plans as $plan) {
            Plan::updateOrCreate(['slug' => $plan['slug']], $plan);
        }
    }
}
