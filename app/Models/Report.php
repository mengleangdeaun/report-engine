<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    use HasFactory;



    protected $fillable = [
        'user_id',
        'team_id',
        'page_id',
        'platform',
        'report_data',
        'file_name',
        'start_date',
        'end_date',
        'total_views',
        'total_likes',
        'total_comments',
        'total_shares',
        'total_saves',
        'total_link_clicks', 
        'engagement_rate',
        'top_performers',
        'public_uuid'
    ];

    // Cast JSON to Array automatically

    protected $casts = [
        'report_data' => 'array',
        'start_date'  => 'date',
        'end_date'    => 'date',
        'total_views' => 'integer',
        'engagement_rate' => 'float',
        'total_likes' => 'integer',
        'total_comments' => 'integer',
        'total_shares' => 'integer',
        'total_saves' => 'integer',
        'total_link_clicks' => 'integer',
        'created_at' => 'datetime:Y-m-d H:i:s',
    ];

    // Relationship: Report belongs to a Page
    public function page()
    {
        return $this->belongsTo(Page::class);
    }

    // Relationship: Report belongs to a User (Member)
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function team()
    {
        return $this->belongsTo(Team::class);
    }
}