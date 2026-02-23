<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\MediaFolder;
use App\Models\MediaFile;
use App\Models\Team;

class MediaLibraryController extends Controller
{
    /* ═══════════════════════════════════════
       STORAGE INFO
    ═══════════════════════════════════════ */

    public function storageInfo()
    {
        $user = Auth::user();
        $team = Team::with('plan')->find($user->team_id);

        if (!$team) {
            return response()->json(['error' => 'No workspace.'], 403);
        }

        $usedBytes = MediaFile::where('team_id', $team->id)->sum('size_bytes');
        $limitMb = $team->plan?->storage_limit_mb ?? 512;
        $limitBytes = $limitMb === 0 ? PHP_INT_MAX : $limitMb * 1024 * 1024;
        $usedPct = $limitBytes === PHP_INT_MAX ? 0 : min(100, round(($usedBytes / $limitBytes) * 100, 1));

        return response()->json([
            'used_bytes' => $usedBytes,
            'used_human' => $this->humanBytes($usedBytes),
            'limit_mb' => $limitMb,
            'limit_bytes' => $limitBytes === PHP_INT_MAX ? 0 : $limitBytes,
            'used_pct' => $usedPct,
            'unlimited' => $limitMb === 0,
        ]);
    }

    /* ═══════════════════════════════════════
       FOLDERS
    ═══════════════════════════════════════ */

    /** Full folder tree for the workspace */
    public function folders()
    {
        $teamId = Auth::user()->team_id;

        $roots = MediaFolder::with('childrenRecursive')
            ->where('team_id', $teamId)
            ->whereNull('parent_id')
            ->orderBy('name')
            ->get();

        return response()->json($roots);
    }

    public function createFolder(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'parent_id' => 'nullable|integer|exists:media_folders,id',
            'color' => 'nullable|string|max:20',
        ]);

        $user = Auth::user();
        $teamId = $user->team_id;

        // Ensure parent belongs to same team
        if ($request->parent_id) {
            $parent = MediaFolder::where('team_id', $teamId)->findOrFail($request->parent_id);
        }

        // Check duplicate name in same parent
        $exists = MediaFolder::where('team_id', $teamId)
            ->where('parent_id', $request->parent_id)
            ->where('name', $request->name)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'A folder with that name already exists here.'], 422);
        }

        $folder = MediaFolder::create([
            'team_id' => $teamId,
            'user_id' => $user->id,
            'parent_id' => $request->parent_id,
            'name' => $request->name,
            'color' => $request->color ?? '#6366f1',
        ]);

        return response()->json($folder->load('children'), 201);
    }

    public function updateFolder(Request $request, int $id)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'color' => 'nullable|string|max:20',
        ]);

        $folder = MediaFolder::where('team_id', Auth::user()->team_id)->findOrFail($id);
        $folder->update(['name' => $request->name, 'color' => $request->color ?? $folder->color]);

        return response()->json($folder);
    }

    public function deleteFolder(int $id)
    {
        $folder = MediaFolder::where('team_id', Auth::user()->team_id)->findOrFail($id);

        // Delete files from disk recursively
        $this->deleteFolderFiles($folder);
        $folder->delete(); // cascades sub-folders via DB FK

        return response()->json(['message' => 'Folder deleted.']);
    }

    /** Recursively delete physical files in folder + sub-folders */
    private function deleteFolderFiles(MediaFolder $folder): void
    {
        foreach ($folder->files as $file) {
            Storage::disk('public')->delete($file->path);
        }
        foreach ($folder->children as $child) {
            $this->deleteFolderFiles($child);
        }
    }

    /* ═══════════════════════════════════════
       FILES
    ═══════════════════════════════════════ */

    public function files(Request $request)
    {
        $user = Auth::user();
        $teamId = $user->team_id;

        $query = MediaFile::with('user:id,name,avatar')
            ->where('team_id', $teamId);

        // Filter by folder
        if ($request->filled('folder_id')) {
            $folderId = (int) $request->folder_id;

            // Check if this folder has sub-folders (i.e. it's a parent source folder)
            $childFolderIds = MediaFolder::where('parent_id', $folderId)->pluck('id')->toArray();

            if (!empty($childFolderIds)) {
                // Parent folder: show files from this folder AND all its sub-folders
                $query->whereIn('folder_id', array_merge([$folderId], $childFolderIds));
            } else {
                // Leaf folder: show only files in this exact folder
                $query->where('folder_id', $folderId);
            }
        }

        // Filter by file type
        if ($request->filled('file_type') && $request->file_type !== 'all') {
            $query->where('file_type', $request->file_type);
        }

        // Search by name
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // Filter by favorites
        if ($request->boolean('favorites')) {
            $query->where('is_favorite', true);
        }

        $files = $query->latest()->paginate((int) $request->get('per_page', 50));

        return response()->json([
            'data' => $files->items(),
            'total' => $files->total(),
            'last_page' => $files->lastPage(),
            'current_page' => $files->currentPage(),
        ]);
    }

    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:51200', // 50 MB
            'folder_id' => 'nullable|integer|exists:media_folders,id',
        ]);

        $user = Auth::user();
        $team = Team::with('plan')->find($user->team_id);

        if (!$team) {
            return response()->json(['message' => 'No workspace.'], 403);
        }

        // Enforce quota
        try {
            MediaFile::checkStorageQuota($team, $request->file('file')->getSize());
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 413);
        }

        $file = $request->file('file');
        $ext = strtolower($file->getClientOriginalExtension());
        $mimeType = $file->getMimeType();
        $fileType = MediaFile::detectFileType($ext);
        $diskName = Str::uuid() . '.' . $ext;
        $path = "media/{$team->id}/{$diskName}";

        // Ensure folder belongs to same team
        if ($request->folder_id) {
            MediaFolder::where('team_id', $team->id)->findOrFail($request->folder_id);
        }

        Storage::disk('public')->putFileAs("media/{$team->id}", $file, $diskName);

        $mediaFile = MediaFile::create([
            'team_id' => $team->id,
            'user_id' => $user->id,
            'folder_id' => $request->folder_id ?: null,
            'name' => $file->getClientOriginalName(),
            'disk_name' => $diskName,
            'path' => $path,
            'mime_type' => $mimeType,
            'extension' => $ext,
            'file_type' => $fileType,
            'size_bytes' => $file->getSize(),
        ]);

        return response()->json($mediaFile, 201);
    }

    public function updateFile(Request $request, int $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $file = MediaFile::where('team_id', Auth::user()->team_id)->findOrFail($id);

        $file->update([
            'name' => $request->name
        ]);

        return response()->json($file);
    }

    public function deleteFile(int $id)
    {
        $file = MediaFile::where('team_id', Auth::user()->team_id)->findOrFail($id);
        Storage::disk('public')->delete($file->path);
        $file->delete();

        return response()->json(['message' => 'File deleted.']);
    }

    public function toggleFavorite(int $id)
    {
        $file = MediaFile::where('team_id', Auth::user()->team_id)->findOrFail($id);
        $file->update(['is_favorite' => !$file->is_favorite]);

        return response()->json($file);
    }

    public function download(int $id)
    {
        $file = MediaFile::where('team_id', Auth::user()->team_id)->findOrFail($id);
        $abspath = Storage::disk('public')->path($file->path);
        return response()->download($abspath, $file->name);
    }

    /* ── Helpers ── */
    private function humanBytes(int $bytes): string
    {
        if ($bytes < 1024)
            return "{$bytes} B";
        if ($bytes < 1048576)
            return round($bytes / 1024, 1) . ' KB';
        if ($bytes < 1073741824)
            return round($bytes / 1048576, 1) . ' MB';
        return round($bytes / 1073741824, 2) . ' GB';
    }
}
