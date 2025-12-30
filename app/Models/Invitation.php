<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invitation extends Model
{
    use HasFactory;

    protected $fillable = [
        'email', 
        'token', 
        'role', 
        'invited_by', 
        'team_id', // ✅ Linked to team
        'expires_at'
    ];

    public function inviter()
{
    // Ensure this matches the 'invited_by' column in your migrations
    return $this->belongsTo(User::class, 'invited_by');
}
    public function team()
    {
        return $this->belongsTo(Team::class);
    }
}
