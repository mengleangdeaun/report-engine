<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Models\Permission;

class Plan extends Model
{
    use HasFactory;

protected $fillable = [
    'name', 'slug', 'price', 'member_limit', 'max_tokens', 'max_workspaces', 
    'features', 'is_active', 'description', 'badge_label', 'color_id', 'icon_svg', 'is_popular'
];

    protected $casts = [
        'features' => 'array', 
        'is_active' => 'boolean'
    ];

    /**
     * Accessor: Get all permissions allowed by this plan.
     * Fetches directly from the database based on the 'features' array.
     */
// app/Models/Plan.php
public function getAllowedPermissionsAttribute()
{
    $features = $this->features;

    // Ensure we are working with an array
    if (is_string($features)) {
        $features = json_decode($features, true);
    }

    if (!is_array($features) || empty($features)) {
        return collect(); // Return empty collection instead of crashing login
    }

    return \Spatie\Permission\Models\Permission::whereIn('name', $features)
        ->where('is_active', 1)
        ->get();
}
}