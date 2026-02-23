<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QrCodeScan extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'qr_code_id',
        'ip_address',
        'user_agent',
        'referer',
        'country',
        'city',
        'device_type',
        'scanned_at',
    ];

    protected $casts = [
        'scanned_at' => 'datetime',
    ];

    public function qrCode()
    {
        return $this->belongsTo(QrCode::class);
    }

    // Detect device type from user agent
    public static function detectDevice(?string $userAgent): string
    {
        if (!$userAgent)
            return 'unknown';
        $ua = strtolower($userAgent);
        if (preg_match('/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/', $ua))
            return 'mobile';
        if (preg_match('/tablet|ipad|kindle|silk/', $ua))
            return 'tablet';
        return 'desktop';
    }
}
