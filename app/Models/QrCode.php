<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QrCode extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'team_id',
        'name',
        'type',
        'content',
        'settings',
        'short_code',
        'total_scans',
    ];

    protected $casts = [
        'settings' => 'array',
        'total_scans' => 'integer',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    public function scans()
    {
        return $this->hasMany(QrCodeScan::class);
    }

    // Generate a unique short code
    public static function generateShortCode(): string
    {
        do {
            $code = substr(str_shuffle('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), 0, 8);
        } while (self::where('short_code', $code)->exists());

        return $code;
    }
}
