<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleController extends Controller
{
    /**
     * 1. List Workspace Roles & Plan Permissions
     * This fixes the "Cannot read properties of undefined (reading 'map')" error.
     */
public function index()
{
    $team = Auth::user()->team;
    setPermissionsTeamId($team->id);

    // 1. Get the allowed feature slugs from the current plan
    $allowedSlugs = $team->plan->features ?? [];

    // 2. Fetch only permissions that are BOTH in the Plan AND currently active
    $availablePermissions = Permission::whereIn('name', $allowedSlugs)
        ->where('is_active', true)
        ->select('name', 'label', 'module')
        ->get();

    $allowedNames = $availablePermissions->pluck('name')->toArray();

    // 3. Filter roles to ensure they only show permissions valid for the current plan
    $roles = Role::where('team_id', $team->id)
        ->with('permissions')
        ->get()
        ->map(function ($role) use ($allowedNames) {
            // ✅ Only retain permissions that match the workspace's current plan
            $filteredPermissions = $role->permissions->filter(function ($permission) use ($allowedNames) {
                return in_array($permission->name, $allowedNames);
            });

            // Rebind the relationship so the frontend receives the filtered list
            $role->setRelation('permissions', $filteredPermissions->values());
            return $role;
        });

    return response()->json([
        'roles' => $roles,
        'available_permissions' => $availablePermissions
    ]);
}

public function syncRolesToPlan()
{
    $team = Auth::user()->team;
    setPermissionsTeamId($team->id);

    // 1. Get current plan features
    $allowedSlugs = $team->plan->features ?? [];
    
    // 2. Fetch roles for this team
    $roles = Role::where('team_id', $team->id)->with('permissions')->get();
    $syncCount = 0;

    foreach ($roles as $role) {
        // Find permissions the role has that are NOT in the current plan
        $currentRolePerms = $role->permissions->pluck('name')->toArray();
        $validPerms = array_intersect($currentRolePerms, $allowedSlugs);

        // ✅ RE-SYNC: This removes unsupported "Ghost Permissions"
        $role->syncPermissions($validPerms);
        $syncCount++;
    }

    return response()->json([
        'message' => "Successfully synchronized $syncCount roles with your current plan features."
    ]);
}

    /**
     * 2. Create a New Custom Role
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:50',
            'permissions' => 'array' 
        ]);

        $user = Auth::user();
        $team = $user->team;
        setPermissionsTeamId($team->id);

        // ✅ PLAN CHECK: Ensure they aren't trying to add features not in their plan
        $planFeatures = collect($team->plan->features ?? []);
        $requested = collect($request->permissions);
        
        $unauthorized = $requested->diff($planFeatures);
        if ($unauthorized->isNotEmpty()) {
            return response()->json([
                'message' => 'Your plan does not support: ' . $unauthorized->implode(', ')
            ], 403);
        }

        // ✅ TEAM SCOPE: Create the role linked to this specific team
        $role = Role::create([
            'name' => $request->name, 
            'team_id' => $team->id, 
            'guard_name' => 'web'
        ]);

        if ($request->has('permissions')) {
            $role->syncPermissions($request->permissions);
        }

        return response()->json(['message' => 'Role created successfully', 'role' => $role]);
    }

    /**
     * 3. Update Role & Permissions
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $team = $user->team;
        setPermissionsTeamId($team->id);

        // Ensure the role belongs to this team
        $role = Role::where('id', $id)->where('team_id', $team->id)->firstOrFail();

        $request->validate([
            'name' => 'required|string|max:50',
            'permissions' => 'array'
        ]);

        // Plan Check again (in case they try to hack the API request)
        $planFeatures = collect($team->plan->features ?? []);
        $requested = collect($request->permissions);
        if ($requested->diff($planFeatures)->isNotEmpty()) {
            return response()->json(['message' => 'Unsupported permissions for your plan'], 403);
        }

        $role->name = $request->name;
        $role->save();
        $role->syncPermissions($request->permissions);

        return response()->json(['message' => 'Role updated successfully']);
    }

    /**
     * 4. Delete Role
     */
    public function destroy($id)
    {
        $user = Auth::user();
        $team = $user->team;
        setPermissionsTeamId($team->id);

        $role = Role::where('id', $id)->where('team_id', $team->id)->firstOrFail();
        
        // Prevent deleting the system-generated Admin role
        if ($role->name === 'admin') {
            return response()->json(['message' => 'Cannot delete the workspace admin role.'], 403);
        }

        $role->delete();
        return response()->json(['message' => 'Role deleted successfully']);
    }
}