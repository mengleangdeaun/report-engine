<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TelegramConfig extends Model
{
    use HasFactory;

    protected $fillable = [
        'team_id',
        'bot_token',
        'bot_name',
        'chat_id',
        'topic_id',
        'is_active',
    ];

    // ✅ AUTOMATIC ENCRYPTION
    // Laravel will encrypt on save, decrypt on access
    protected $casts = [
        'bot_token' => 'encrypted',
        'is_active' => 'boolean',
    ];

    public function team()
    {
        return $this->belongsTo(Team::class);
    }
}