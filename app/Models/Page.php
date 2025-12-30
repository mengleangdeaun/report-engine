<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Page extends Model
{
    use HasFactory;

    // ✅ Fix: Allow all fields to be mass-assigned
    protected $guarded = []; 


    protected $fillable = [
    'user_id', 
    'team_id', // ✅ NEW
    'name', 
    'platform', 
    'username', 
    'avatar', 
    'notes', 
    'is_active', 
    'is_favorite'
];

    protected $casts = [
        'is_favorite' => 'boolean',
        'last_updated' => 'datetime', // Good practice to cast dates too
    ];
    // Relationships
    public function reports()
    {
        return $this->hasMany(Report::class);
    }
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    public function favoritedBy()
    {
        return $this->belongsToMany(User::class, 'favorites', 'page_id', 'user_id')->withTimestamps();
    }
}