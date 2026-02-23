<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AdAccount extends Model
{
    protected $table = 'ad_accounts';

    protected $fillable = [
        'team_id',
        'user_id',
        'name',
        'platform',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function facebookAdReports(): HasMany
    {
        return $this->hasMany(FacebookAdReport::class, 'ad_account_id');
    }
}
