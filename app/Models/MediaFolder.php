<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MediaFolder extends Model
{
    protected $table = 'media_folders';

    protected $fillable = [
        'team_id',
        'user_id',
        'parent_id',
        'name',
        'color',
    ];

    /* ── Relationships ── */

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(MediaFolder::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(MediaFolder::class, 'parent_id')->orderBy('name');
    }

    /** Recursive children for full tree loading */
    public function childrenRecursive(): HasMany
    {
        return $this->children()->with('childrenRecursive');
    }

    public function files(): HasMany
    {
        return $this->hasMany(MediaFile::class, 'folder_id');
    }

    /* ── Helpers ── */

    /**
     * Ensures a source folder hierarchy exists for a team.
     * Creates: Platform Source > Content Performance | Ads Performance
     */
    public static function getOrCreateSourceFolder(int $teamId, int $userId, string $platform, string $reportType = 'content'): self
    {
        $platformName = ucfirst($platform) . ' Source';
        $color = $platform === 'facebook' ? '#0866FF' : '#FE2C55';

        // 1. Create or find the platform parent folder
        $parent = self::firstOrCreate(
            ['team_id' => $teamId, 'name' => $platformName, 'parent_id' => null],
            [
                'user_id' => $userId,
                'color' => $color,
            ]
        );

        // 2. Create or find the report-type sub-folder
        $subName = $reportType === 'ads' ? 'Ads Performance' : 'Content Performance';
        $subColor = $reportType === 'ads' ? '#f59e0b' : '#10b981';

        return self::firstOrCreate(
            ['team_id' => $teamId, 'parent_id' => $parent->id, 'name' => $subName],
            [
                'user_id' => $userId,
                'color' => $subColor,
            ]
        );
    }

    /** Total size of files in this folder (not recursive) */
    public function getSizeAttribute(): int
    {
        return $this->files()->sum('size_bytes');
    }
}
