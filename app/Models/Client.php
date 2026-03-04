<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Client extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'team_id',
        'name',
        'email',
        'password',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'password' => 'hashed',
    ];

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    /**
     * Get all assigned reports.
     */
    public function reports()
    {
        return $this->morphedByMany(Report::class, 'reportable', 'client_reports');
    }

    /**
     * Get all assigned facebook ad reports.
     */
    public function facebookAdReports()
    {
        return $this->morphedByMany(FacebookAdReport::class, 'reportable', 'client_reports');
    }
}
