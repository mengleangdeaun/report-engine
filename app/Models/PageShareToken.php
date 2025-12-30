<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PageShareToken extends Model
{
    use HasFactory;

 protected $fillable = [
    'page_id', 
    'token', 
    'is_active',
    'last_accessed_at',
    'view_count',
    'last_device',
];

protected $casts = [
    'last_accessed_at' => 'datetime',
    'is_active' => 'boolean',
    'view_count' => 'integer',
];

    /**
     * Get the page that owns the share token.
     */
    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }
    public function logs()
{
    // This allows you to call $share->logs to get the history
    return $this->hasMany(PageShareLog::class);
}
}
