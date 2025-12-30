<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Page; 
use App\Models\Report;
use App\Traits\LogsActivity;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver; // Or Imagick if you prefer
use App\Notifications\TeamAlert;
use App\Models\User;

class PageController extends Controller
{
    use LogsActivity;

// ==========================================
    // 🔐 THE GATEKEEPER (Private Helper)
    // ==========================================
    /**
     * Finds a page and ensures the current user is allowed to edit it.
     * Rules:
     * 1. Page must belong to User's Team.
     * 2. User must be: Creator OR Team Owner OR Team Admin.
     */
    private function getAuthorizedPage($pageId)
    {
        $user = Auth::user();
        $team = $user->team;

        // 1. Scope Search to the Team
        // This prevents accessing pages from other workspaces
        $page = Page::where('team_id', $team->id)->findOrFail($pageId);

        // 2. Check Permissions
        $isCreator = $page->user_id === $user->id;
        $isTeamOwner = $team->user_id === $user->id;
        $isTeamAdmin = $team->members()
                            ->where('user_id', $user->id)
                            ->wherePivot('role', 'admin')
                            ->exists();

        // 3. Authorization Gate
        if ($isCreator || $isTeamOwner || $isTeamAdmin) {
            return $page;
        }

        // 4. Deny Access
        abort(403, 'You do not have permission to manage this account.');
    }

public function index(Request $request)
{
    $user = Auth::user();
    $team = $user->team;

    // 1. Force set the Team ID for Spatie context consistency
    setPermissionsTeamId($team->id);

    // 2. Base Query scoped to the active team
    $query = Page::where('team_id', $team->id)->with('user:id,name');

    // 3. Hierarchical Visibility Logic
    $isOwner = (int)$team->user_id === (int)$user->id;
    $canViewAll = $user->hasPermissionTo('view all team reports'); 
    
    // Backup check for the 'admin' pivot role
    $isAdminPivot = \DB::table('team_user')
        ->where('team_id', $team->id)
        ->where('user_id', $user->id)
        ->where('role', 'admin')
        ->exists();

    if ($isOwner || $canViewAll || $isAdminPivot) {
        // Admin/Owner: Allowed to see all pages in the team or filter by specific members
        if ($request->filled('user_ids')) {
            $ids = is_array($request->user_ids) ? $request->user_ids : explode(',', $request->user_ids);
            
            // Convert 'me' alias to actual user ID
            if (($key = array_search('me', $ids)) !== false) {
                unset($ids[$key]);
                $ids[] = $user->id;
            }
            
            if (!empty($ids)) {
                $query->whereIn('user_id', $ids);
            }
        }
    } else {
        // Regular Member: Restricted to only seeing pages they created
        $query->where('user_id', $user->id);
    }

    // 4. Platform Visibility Filtering (Based on User Permissions)
    $allowedPlatforms = [];
    if ($user->can('generate facebook report')) $allowedPlatforms[] = 'facebook';
    if ($user->can('generate tiktok report')) $allowedPlatforms[] = 'tiktok';



    
    // If they have no generate permissions, they see no pages by default
    if (!($isOwner || $isAdminPivot || $canViewAll)) {
        if (empty($allowedPlatforms)) {
            return response()->json([]); // Truly no permissions
        }
        $query->whereIn('platform', $allowedPlatforms);
    } else {
        // Admin/Owner: Only filter if allowedPlatforms is NOT empty to avoid locking them out
        if (!empty($allowedPlatforms)) {
            $query->whereIn('platform', $allowedPlatforms);
        }
    }
    // 5. Fetch Results with Counts and Personal Favorites
    $pages = $query->withCount('reports')
        ->withExists(['favoritedBy as is_personal_favorite' => function ($q) use ($user) {
            $q->where('user_id', $user->id);
        }])
        ->orderBy('updated_at', 'desc')
        ->get();

    // 6. Format JSON Response
    $formatted = $pages->map(function($page) {
        return [
            'id' => $page->id,
            'page_name' => $page->name,
            'platform' => $page->platform,
            'total_reports' => $page->reports_count,
            'last_updated' => $page->updated_at,
            'avatar' => $page->avatar,
            'username' => $page->username,
            'notes' => $page->notes,
            'is_favorite' => (boolean) $page->is_personal_favorite, 
            'is_active' => (boolean) $page->is_active,
            'owner_name' => $page->user ? $page->user->name : 'Unknown', 
            'user_id' => $page->user_id
        ];
    });

    return response()->json($formatted);
}




public function listNames(Request $request)
{
    $user = Auth::user();
    
    // 1. Start with pages scoped to the active team
    $query = Page::where('team_id', $user->team_id)
        ->with('user:id,name')
        ->latest(); // 👈 latest first (created_at DESC)

    // 2. Filter by platform if provided (e.g., ?platform=facebook)
    if ($request->has('platform')) {
        $query->where('platform', $request->query('platform'));
    }

    $pages = $query->get();

    // 3. Map the data for the frontend
    return response()->json($pages->map(function ($p) {
        return [
            'name'         => $p->name,
            'platform'     => $p->platform,
            'is_active'    => (bool) $p->is_active,
            'creator_name' => $p->user ? $p->user->name : 'System',
        ];
    }));
}




// ==========================================
    // ✏️ WRITE (Update, Toggle, Delete)
    // ==========================================

public function update(Request $request, $id)
    {
        // 1. Define User (Required for notification logic)
        $user = \Illuminate\Support\Facades\Auth::user();

        $request->validate([
            'name' => 'required|string|max:100',
            'username' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:500',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        // 🔐 Use Gatekeeper
        $page = $this->getAuthorizedPage($id);

        // 2. Capture OLD Data (Before changes)
        // ✅ FIX: Define $oldName variable so it can be used in text strings below
        $oldName = $page->name; 
        $oldData = $page->only(['name', 'username', 'notes', 'avatar']);

        // 3. Apply Changes
        $page->name = $request->name;
        $page->username = $request->username;
        $page->notes = $request->notes;

if ($request->hasFile('avatar')) {
            // Delete old avatar if exists
            if ($page->avatar && \Storage::disk('public')->exists($page->avatar)) {
                \Storage::disk('public')->delete($page->avatar);
            }

            $file = $request->file('avatar');
            
            // Generate a unique filename with .webp extension
            $filename = 'avatars/' . uniqid() . '.webp';

            // ✅ OPTIMIZATION MAGIC
            // 1. Create Manager
            $manager = new ImageManager(new Driver());
            
            // 2. Read Image
            $image = $manager->read($file);

            // 3. Resize (Scale Down)
            // We use scaleDown so small images aren't stretched, 
            // but big images are shrunk to max 300x300px (Plenty for profile pics)
            $image->scaleDown(300, 300);

            // 4. Encode to WebP with 80% quality
            $encoded = $image->toWebp(80);

            // 5. Save using Laravel Storage
            \Storage::disk('public')->put($filename, (string) $encoded);

            $page->avatar = $filename;
        }

        $page->save();

        // 4. Capture NEW Data (Only what changed)
        $changes = $page->getChanges();

        // 5. Log Activity (JSON History)
        $this->logActivity(
            'Updated Page', 
            "Updated details for '{$oldName}'",
            [
                'old' => $oldData, 
                'attributes' => $changes
            ]
        );

        // 🔔 6. NOTIFY OWNER (Active Alert)
        $team = $user->team;
        
        // Only notify if the person editing is NOT the team owner
        if ($team->user_id !== $user->id) {
            $owner = \App\Models\User::find($team->user_id);
            
            if ($owner) {
                $owner->notify(new \App\Notifications\TeamAlert([
                    'action' => 'Page Updated',
                    'description' => "{$user->name} updated details for page '{$oldName}'",
                    'user_name' => $user->name,
                    'user_avatar' => $user->avatar
                ]));
            }
        }

        return response()->json([
            'message' => 'Account updated successfully',
            'page' => $page->fresh() 
        ]);
    }

public function toggleFavorite($id)
    {
        // 🔐 Gatekeeper: Ensure they have access to the page first
        $page = $this->getAuthorizedPage($id);
        $user = Auth::user();

        // ✅ NEW: Toggle the pivot table entry
        // toggle() automatically attaches if missing, detaches if exists
        $result = $page->favoritedBy()->toggle($user->id);

        // Check the result array to see if we attached or detached
        $isFavorite = count($result['attached']) > 0;

        return response()->json([
            'message' => $isFavorite ? 'Added to favorites' : 'Removed from favorites',
            'is_favorite' => $isFavorite
        ]);
    }

public function toggleActive($id)
    {
        // ✅ 1. Define User (Required for notification logic)
        $user = \Illuminate\Support\Facades\Auth::user();

        // 🔐 Use Gatekeeper
        $page = $this->getAuthorizedPage($id);
        
        // Capture state before toggle
        $oldStatus = $page->is_active;

        $page->is_active = !$page->is_active;
        $page->save();

        $statusText = $page->is_active ? 'Activated' : 'Deactivated';
        
        // Log with data (Passive History)
        $this->logActivity(
            'Updated Status', 
            "{$statusText} page '{$page->name}'",
            [
                'attributes' => [
                    'is_active' => $page->is_active
                ],
                'old' => [
                    'is_active' => $oldStatus
                ]
            ]
        );

        // 🔔 2. NOTIFY OWNER (Active Alert)
        $team = $user->team;
        
        // Only notify if the person acting is NOT the owner
        if ($team->user_id !== $user->id) {
            $owner = \App\Models\User::find($team->user_id);
            
            if ($owner) {
                $owner->notify(new \App\Notifications\TeamAlert([
                    'action' => 'Page Status Changed',
                    'description' => "{$user->name} " . strtolower($statusText) . " page '{$page->name}'", 
                    'user_name' => $user->name,
                    'user_avatar' => $user->avatar
                ]));
            }
        }

        return response()->json([
            'message' => $page->is_active ? 'Account activated' : 'Account deactivated',
            'is_active' => $page->is_active
        ]);
    }

   public function destroy(Request $request)
    {
        // ✅ FIX: Define $user globally for this method
        $user = Auth::user();
        $team = $user->team;

        // --- SCENARIO A: ID-based deletion (Preferred) ---
        if ($request->has('id')) {
            // 🔐 Use Gatekeeper
            $page = $this->getAuthorizedPage($request->id);
            $name = $page->name; // Capture name before delete
            
            $page->delete();
            
            $this->logActivity('Deleted Page', "Deleted profile '{$name}'");

            // 🔔 NOTIFY OWNER
            if ($team->user_id !== $user->id) {
                $owner = \App\Models\User::find($team->user_id);
                if ($owner) {
                    $owner->notify(new \App\Notifications\TeamAlert([
                        'action' => 'Page Deleted',
                        'description' => "{$user->name} deleted page '{$name}'",
                        'user_name' => $user->name,
                        'user_avatar' => $user->avatar
                    ]));
                }
            }

            return response()->json(['message' => "Account deleted."]);
        }

        // --- SCENARIO B: Legacy Name/Platform deletion ---
        // We manually apply the Gatekeeper logic here since we don't have an ID yet

        $page = Page::where('team_id', $team->id)
                    ->where('name', $request->page_name)
                    ->where('platform', $request->platform)
                    ->firstOrFail();

        // Manual Permission Check
        $isCreator = $page->user_id === $user->id;
        $isTeamOwner = $team->user_id === $user->id;
        $isTeamAdmin = $team->members()
                            ->where('user_id', $user->id)
                            ->wherePivot('role', 'admin')
                            ->exists();

        if (!$isCreator && !$isTeamOwner && !$isTeamAdmin) {
            abort(403, 'You do not have permission to delete this account.');
        }

        $name = $page->name;
        $page->delete();

        $this->logActivity('Deleted Page', "Deleted profile '{$name}'");

        // 🔔 NOTIFY OWNER
        if ($team->user_id !== $user->id) {
            $owner = \App\Models\User::find($team->user_id);
            if ($owner) {
                $owner->notify(new \App\Notifications\TeamAlert([
                    'action' => 'Page Deleted',
                    'description' => "{$user->name} deleted page '{$name}'",
                    'user_name' => $user->name,
                    'user_avatar' => $user->avatar
                ]));
            }
        }

        return response()->json(['message' => "Account deleted."]);
    }


    // ==========================================
    // 🔄 UTILITY
    // ==========================================

    public function syncPages()
    {
        $user = Auth::user();
        $team = $user->team;
        
        $reports = Report::where('user_id', $user->id)->get();
        $count = 0;

        foreach ($reports as $report) {
            $pageName = $report->page_name ?: '(Untitled Profile)';

            // Use Search vs Create logic to prevent Unique errors
            $page = Page::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'name' => $pageName,
                    'platform' => $report->platform
                ],
                [
                    'team_id' => $team->id
                ]
            );

            // Fix legacy team linkage
            if ($page->team_id !== $team->id) {
                $page->team_id = $team->id;
                $page->save();
            }

            if($report->page_id !== $page->id) {
                $report->page_id = $page->id;
                $report->save();
            }
            
            $count++;
        }

        return response()->json(['message' => "Synced {$count} reports."]);
    }


    

}