<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Team extends Model
{
    use HasFactory;

    /**
     * ✅ CLEANUP: Removed 'member_limit' and 'max_tokens' from fillable.
     * We only save the 'plan_type' slug now.
     */
    protected $fillable = [
        'name', 
        'user_id', 
        'plan_type', 
        'subscription_expires_at'
    ];

    protected $casts = [
        'subscription_expires_at' => 'datetime', // ✅ This converts the string to a Carbon object
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * The Owner of the team (the person who created it).
     */
    public function owner()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * The Members of the team (including the owner if in pivot).
     */
    public function members()
    {
        return $this->belongsToMany(User::class, 'team_user')
                    ->withPivot('role', 'token_limit')
                    ->withTimestamps();
    }

    /**
     * Pending Invitations for this team.
     */
    public function invitations()
    {
        return $this->hasMany(Invitation::class);
    }

    /**
     * ✅ RELATIONSHIP: Links 'plan_type' slug to the Plans table.
     */
    public function plan()
    {
        return $this->belongsTo(\App\Models\Plan::class, 'plan_type', 'slug');
    }

    /**
     * ✅ ACCESSOR: Forces member_limit to come from the Plan table.
     * This makes $team->member_limit work even though the column is redundant.
     */
    public function getMemberLimitAttribute($value)
    {
        return $this->plan ? $this->plan->member_limit : ($value ?? 5);
    }

    /**
     * ✅ ACCESSOR: Forces max_tokens to come from the Plan table.
     */
    public function getMaxTokensAttribute($value)
    {
        return $this->plan ? $this->plan->max_tokens : ($value ?? 0);
    }
}