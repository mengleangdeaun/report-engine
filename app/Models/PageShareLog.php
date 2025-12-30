<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PageShareLog extends Model
{
    // ⚠️ CRITICAL: If 'lat' and 'lng' are missing here, 
    // Laravel will ignore them during ->create()
    protected $fillable = [
        'page_share_token_id', 
        'ip_address', 
        'location', 
        'device', 
        'lat', 
        'lng', 
        'accessed_at'
    ];

    protected $casts = [
        'accessed_at' => 'datetime',
        'lat' => 'float',
        'lng' => 'float'
    ];
}