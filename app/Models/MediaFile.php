<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class MediaFile extends Model
{
    protected $table = 'media_files';

    protected $fillable = [
        'team_id',
        'user_id',
        'folder_id',
        'name',
        'disk_name',
        'path',
        'mime_type',
        'extension',
        'file_type',
        'size_bytes',
        'is_favorite',
    ];

    protected $casts = [
        'is_favorite' => 'boolean',
    ];

    protected $appends = ['url', 'size_human'];

    /* ── File type map ── */
    public static array $typeMap = [
        'photo' => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'heic'],
        'video' => ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'm4v', '3gp'],
        'audio' => ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma'],
        'document' => ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf', 'odt', 'ods'],
    ];

    public static function detectFileType(string $extension): string
    {
        $ext = strtolower($extension);
        foreach (self::$typeMap as $type => $extensions) {
            if (in_array($ext, $extensions)) {
                return $type;
            }
        }
        return 'other';
    }

    /* ── Accessors ── */

    public function getUrlAttribute(): string
    {
        return Storage::url($this->path);
    }

    public function getSizeHumanAttribute(): string
    {
        $bytes = $this->size_bytes;
        if ($bytes < 1024)
            return "{$bytes} B";
        if ($bytes < 1048576)
            return round($bytes / 1024, 1) . ' KB';
        if ($bytes < 1073741824)
            return round($bytes / 1048576, 1) . ' MB';
        return round($bytes / 1073741824, 2) . ' GB';
    }

    /* ── Relationships ── */

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function folder(): BelongsTo
    {
        return $this->belongsTo(MediaFolder::class, 'folder_id');
    }

    /**
     * Helper to store a file to the media library from an uploaded file.
     */
    public static function storeFile($uploadedFile, int $teamId, int $userId, ?int $folderId = null): self
    {
        $ext = strtolower($uploadedFile->getClientOriginalExtension());
        $mimeType = $uploadedFile->getMimeType();
        $fileType = self::detectFileType($ext);
        $diskName = \Illuminate\Support\Str::uuid() . '.' . $ext;
        $path = "media/{$teamId}/{$diskName}";

        \Illuminate\Support\Facades\Storage::disk('public')->putFileAs("media/{$teamId}", $uploadedFile, $diskName);

        return self::create([
            'team_id' => $teamId,
            'user_id' => $userId,
            'folder_id' => $folderId,
            'name' => $uploadedFile->getClientOriginalName(),
            'disk_name' => $diskName,
            'path' => $path,
            'mime_type' => $mimeType,
            'extension' => $ext,
            'file_type' => $fileType,
            'size_bytes' => $uploadedFile->getSize(),
        ]);
    }

    /**
     * Checks if the team has enough storage space for a new file.
     * Returns true if OK, or throws an logic exception with message.
     */
    public static function checkStorageQuota(Team $team, int $newFileSize): bool
    {
        $limitMb = $team->plan?->storage_limit_mb ?? 512;
        if ($limitMb === 0)
            return true; // Unlimited

        $usedBytes = self::where('team_id', $team->id)->sum('size_bytes');
        $limitBytes = $limitMb * 1024 * 1024;

        if ($usedBytes + $newFileSize > $limitBytes) {
            throw new \RuntimeException("Storage limit of {$limitMb} MB reached. Upgrade your plan or delete files.");
        }

        return true;
    }
}
