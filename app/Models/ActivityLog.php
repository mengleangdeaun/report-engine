<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    // 1. Add 'properties' to fillable
    protected $fillable = ['team_id', 'user_id', 'action', 'description', 'ip_address', 'properties'];

    // 2. Cast JSON to Array
    protected $casts = [
        'properties' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}