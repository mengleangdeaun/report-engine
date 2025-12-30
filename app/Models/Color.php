<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Color extends Model
{
    use HasFactory;

protected $fillable = [
    'name',
    'hex_code',
    'hex_dark',
    'is_gradient',
    'hex_start',
    'hex_end',
    'default_icon_svg',
    'is_active'
];

    /**
     * Relationship: A color can be used by many subscription plans.
     */
    public function plans(): HasMany
    {
        return $this->hasMany(Plan::class, 'color_id');
    }

    /**
     * Helper: Check if this color is currently "in use".
     * Useful for preventing accidental deletion.
     */
    public function inUse(): bool
    {
        return $this->plans()->exists();
    }

    // app/Models/Color.php
public function getContrastTextAttribute()
{
    // Simple YIQ formula to determine if white or black text is better
    $hex = str_replace('#', '', $this->hex_code);
    $r = hexdec(substr($hex, 0, 2));
    $g = hexdec(substr($hex, 2, 2));
    $b = hexdec(substr($hex, 4, 2));
    $yiq = (($r * 299) + ($g * 587) + ($b * 114)) / 1000;

    return ($yiq >= 128) ? '#000000' : '#FFFFFF';
}
}