<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\AdAccount;

class FacebookAdReport extends Model
{
    protected $table = 'facebook_ad_reports';

    protected $fillable = [
        'user_id',
        'team_id',
        'ad_account_id',
        'account_name',
        'file_name',
        'start_date',
        'end_date',
        'total_spend',
        'total_impressions',
        'total_reach',
        'total_clicks',
        'total_conversions',
        'avg_ctr',
        'avg_cpc',
        'avg_cpm',
        'total_roas',
        'report_data',
        'public_uuid',
    ];

    protected $casts = [
        'report_data' => 'array',
        'start_date' => 'date',
        'end_date' => 'date',
        'total_spend' => 'float',
        'avg_ctr' => 'float',
        'avg_cpc' => 'float',
        'avg_cpm' => 'float',
        'total_roas' => 'float',
    ];

    public function adAccount(): BelongsTo
    {
        return $this->belongsTo(AdAccount::class, 'ad_account_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }
}
