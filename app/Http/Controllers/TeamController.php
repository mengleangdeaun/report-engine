<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Team;
use App\Models\Invitation;
use App\Models\Transaction; // ✅ Import for Token Usage

class TeamController extends Controller
{


public function store(Request $request)
{
    $request->validate(['name' => 'required|string|max:50']);
    $user = Auth::user();

    // 1. Identify the Plan based on the owner's primary account
    $primaryPlan = $user->ownedTeam->plan; 

    return DB::transaction(function () use ($request, $user, $primaryPlan) {
        // 2. Create the Team without hardcoding any limits
        $team = Team::create([
            'name' => $request->name,
            'user_id' => $user->id,
            'plan_type' => $primaryPlan->slug, // e.g., 'enterprise'
        ]);

        // 3. Setup owner roles
        $user->teams()->attach($team->id, ['role' => 'owner']);
        setPermissionsTeamId($team->id);
        $user->assignRole('admin');

        return response()->json(['message' => 'Workspace created!', 'team_id' => $team->id]);
    });
}

private function getTeamPermissions($team)
{
    // 1. Get the plan linked to the team
    $plan = \App\Models\Plan::where('slug', $team->plan_type)->first();

    if (!$plan) {
        return [];
    }

    // 2. Use your Plan Model accessor 'allowed_permissions'
    // We map it to {id, label} for the React frontend
    return $plan->allowed_permissions->map(function ($permission) {
        return [
            'id' => $permission->name, // Spatie permission name
            'label' => $permission->label ?? ucwords(str_replace(['_', '-'], ' ', $permission->name))
        ];
    })->values()->all();
}
    /**
     * Helper: Check if User is Admin or Owner
     */
    private function isTeamAdmin($user, $team)
    {
        // 1. Is Owner?
        if ($user->id === $team->user_id) return true;

        // 2. Is Admin in Pivot?
        $member = $team->members()->where('user_id', $user->id)->first();
        return $member && $member->pivot->role === 'admin';
    }

    /**
     * Get My Team Info, Members, and Pending Invites
     */

public function myTeam(Request $request)
{
    $user = Auth::user();
    
    // ✅ ACTIVE WORKSPACE: Fetch team with the plan relationship
    $team = \App\Models\Team::where('id', $user->team_id)->with('plan')->first();

    if (!$team) return response()->json(['message' => 'No team found'], 404);

    // ✅ Get the plan record. If it doesn't exist, use a fallback Plan object
    $plan = $team->plan ?? \App\Models\Plan::where('slug', 'free')->first();

    // ✅ REQUIRED: Set context for Spatie
    setPermissionsTeamId($team->id);

    // 1. Calculate Team Usage safely
    $memberIds = $team->members()->pluck('users.id');
    $tokensUsed = \App\Models\Transaction::whereIn('user_id', $memberIds)
        ->where('type', 'spend')
        ->where('created_at', '>=', now()->startOfMonth())
        ->sum('amount');

    // 2. Map Members
    $members = $team->members()
        ->select('users.id', 'users.name', 'users.email', 'users.avatar', 'users.tokens_used')
        ->get()
        ->map(function ($member) use ($team) {
            $rawRole = $member->pivot->role ?? 'member';
            
            $member->display_role = ($member->id === $team->user_id) ? 'Owner' : $rawRole;
            $member->token_limit = ($member->id === $team->user_id) ? null : ($member->pivot->token_limit ?? 0);
            $member->tokens_used = $member->tokens_used ?? 0;
            $member->permission_names = $member->getAllPermissions()->pluck('name')->toArray();
            
            return $member;
        });

    $availablePermissions = $this->getTeamPermissions($team);

    // ✅ PLAN REFERENCE: Get correct limits from the linked Plan record
    $plan = $team->plan; 

    return response()->json([
        'id' => $team->id,
        'team_name' => $team->name,
        'plan' => $plan->name ?? 'Free',
        'member_limit' => $plan->member_limit ?? 5, 
        'token_limit' => $plan->max_tokens ?? 0,
        'features' => $plan->features ?? [],
        
        'member_count' => $members->count() + $team->invitations()->count(),
        'tokens_used' => abs($tokensUsed),
        'members' => $members,
        'invites' => $team->invitations()->get(),
        'is_owner' => $user->id === $team->user_id,
        'is_admin' => $this->isTeamAdmin($user, $team),
        'available_permissions' => $availablePermissions 
    ]);
}  
    

public function getRoleTemplates(Request $request)
{
    // 1. Get Team ID from Header OR from the authenticated user's active team
    $activeTeamId = $request->header('X-Team-Id') ?? auth()->user()->team_id;

    if ($activeTeamId) {
        setPermissionsTeamId($activeTeamId);
    }

    // 2. Fetch roles belonging to this team OR global roles
    $roles = \Spatie\Permission\Models\Role::where(function($query) use ($activeTeamId) {
            $query->where('team_id', $activeTeamId);
            if (!$activeTeamId) {
                $query->orWhereNull('team_id');
            }
        })
        ->orWhereNull('team_id') // Always include global roles like 'admin/user'
        ->get()
        ->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name')->toArray()
            ];
        });

    return response()->json($roles);
}


    /**
     * Rename Team (Owner OR Admin)
     */
    public function updateName(Request $request)
    {
        $request->validate(['name' => 'required|string|max:50']);
        
        $user = Auth::user();
        $team = $user->team;

        if (!$this->isTeamAdmin($user, $team)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $team->name = $request->name;
        $team->save();

        return response()->json(['message' => 'Workspace renamed successfully.']);
    }

    /**
     * Remove Member (Owner OR Admin)
     */
    public function removeMember(Request $request, $userId)
    {
        $currentUser = Auth::user();
        $team = $currentUser->team;

        // 1. Check Permissions
        if (!$this->isTeamAdmin($currentUser, $team)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // 2. Prevent removing the Owner
        if ($userId == $team->user_id) {
            return response()->json(['message' => 'Cannot remove the Workspace Owner.'], 403);
        }

        // 3. Prevent removing yourself
        if ($currentUser->id == $userId) {
            return response()->json(['message' => 'Cannot remove yourself.'], 400);
        }

        // Detach from Pivot
        $team->members()->detach($userId);

        return response()->json(['message' => 'Member removed.']);
    }

    /**
     * Update Token Limit (Owner OR Admin)
     */
    public function updateLimit(Request $request, $userId)
    {
        $request->validate([
            'limit' => 'nullable|integer|min:-1' // -1 for unlimited
        ]);

        $currentUser = Auth::user();
        $team = $currentUser->team;

        if (!$this->isTeamAdmin($currentUser, $team)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        // Ensure target user is in the team
        $exists = $team->members()->where('user_id', $userId)->exists();
        if (!$exists) {
            return response()->json(['message' => 'User not found in this team'], 404);
        }

        $limit = ($request->limit == -1) ? null : $request->limit;

        // Update Pivot
        $team->members()->updateExistingPivot($userId, ['token_limit' => $limit]);

        return response()->json(['message' => "Limit updated successfully."]);
    }

    /**
     * Update Member Role (Only Owner)
     */
public function updateMemberRole(Request $request, $memberId)
{
    $currentUser = Auth::user();
    $team = $currentUser->team;

    // 1. Fetch valid roles from the database
    $validRoles = \Spatie\Permission\Models\Role::where('team_id', $team->id)
        ->orWhereNull('team_id')
        ->pluck('name')
        ->toArray();

    // 2. ✅ FIXED VALIDATION
    // We validate against the actual names in the database
    $request->validate([
        'role' => 'required|string|in:' . implode(',', $validRoles)
    ]);

    // 3. Update the Pivot table for UI display
    $team->members()->updateExistingPivot($memberId, ['role' => $request->role]);

    // 4. ✅ AUTOMATIC PERMISSION SYNC
    $targetMember = User::findOrFail($memberId);
    setPermissionsTeamId($team->id);
    
    // This assigns the role and its associated permissions to the user
    $targetMember->syncRoles([$request->role]);

    return response()->json(['message' => "Role updated to {$request->role}"]);
}




public function updatePermissions(Request $request, $userId)
{
    $request->validate([
        'permissions' => 'array',
        'role_name' => 'nullable|string' // We handle null below
    ]);

    $owner = Auth::user();
    $team = $owner->team;
    if (!$team) return response()->json(['message' => 'Workspace not found.'], 404);

    // Set Spatie context for the team
    setPermissionsTeamId($team->id);

    $member = User::findOrFail($userId);
    
    // ✅ Fix: Ensure role_name is never null for the database
    $roleName = $request->role_name ?? 'Custom';

    if ($roleName === 'Custom') {
        // 1. Remove Spatie Roles so they don't override direct permissions
        $member->syncRoles([]); 
        
        // 2. Assign the specific permissions checked in the modal
        $member->syncPermissions($request->permissions);
        
        // 3. Update the UI display role in the pivot table
        $team->members()->updateExistingPivot($userId, ['role' => 'Custom']);
    } else {
        // 1. Re-sync the Role Template (Spatie automatically applies permissions)
        $member->syncRoles([$roleName]);
        
        // 2. Clear direct permissions so the Role Template is the source of truth
        $member->syncPermissions([]); 
        
        // 3. Update the UI display role
        $team->members()->updateExistingPivot($userId, ['role' => $roleName]);
    }

    // Force clear Spatie cache for this user
    app()->make(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

    return response()->json(['message' => 'Access updated successfully.']);
}

public function listAllWorkspaces()
{
    $user = Auth::user();

    // 1. Fetch all teams Dara belongs to via the pivot table
    $teams = $user->teams()
        ->select('teams.id', 'teams.name', 'teams.plan_type')
        ->get();

    // 2. Count workspaces Dara OWNS
    $ownedCount = Team::where('user_id', $user->id)->count();

    // 3. Get the plan limit from his primary (owned) workspace
    $primaryTeam = $user->ownedTeam; 
    $plan = $primaryTeam ? $primaryTeam->plan : \App\Models\Plan::where('slug', 'free')->first();

    return response()->json([
        'teams' => $teams,
        'current_team_id' => $user->team_id,
        'owned_count' => $ownedCount, // ✅ Added for frontend usage bar
        'max_workspaces' => $plan->max_workspaces ?? 1 // ✅ From the new DB column
    ]);
}

public function switchWorkspace(Request $request)
{
    $request->validate(['team_id' => 'required|exists:teams,id']);
    $user = Auth::user();

    // Security: Verify the user actually belongs to the requested team
    if (!$user->teams()->where('teams.id', $request->team_id)->exists()) {
        return response()->json(['message' => 'Unauthorized access to this workspace.'], 403);
    }

    // Update the pointer to change the active context
    $user->update(['team_id' => $request->team_id]);

    return response()->json(['message' => 'Workspace switched successfully.']);
}

}