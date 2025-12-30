<?php

return [
    'plans' => [
        'free' => [
            'name' => 'Free Starter',
            'price' => 0,
            'member_limit' => 1, // Only the owner
            'max_tokens' => 10,
            'features' => ['facebook_basic']
        ],
        'pro' => [
            'name' => 'Pro Business',
            'price' => 29,
            'member_limit' => 50, // Owner + 4 members
            'max_tokens' => 1000,
            'features' => ['facebook_basic', 'facebook_advanced', 'tiktok_basic']
        ],
        'enterprise' => [
            'name' => 'Enterprise',
            'price' => 99,
            'member_limit' => 20,
            'max_tokens' => 10000,
            'features' => ['all']
        ]
    ]
];