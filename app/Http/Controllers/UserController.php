<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class UserController extends Controller
{
    /**
     * 1. LIST USERS
     */
    public function index(Request $request)
    {
        $query = User::with(['roles', 'team']);


        // Search
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('email', 'like', "%{$request->search}%");
            });
        }

        // Sort
        $sortDir = $request->input('sort_dir', 'desc');
        $sortBy = $request->input('sort_by', 'created_at');
        $query->orderBy($sortBy, $sortDir);

        return response()->json($query->paginate($request->input('per_page', 10)));
    }

    /**
     * 2. UPDATE GENERAL INFO (Name, Email, Password, Roles)
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users,email,' . $id,
            'password' => 'nullable|min:6',
            'roles' => 'array' // Expecting ['admin', 'user']
        ]);

        $user->name = $request->name;
        $user->email = $request->email;

        if ($request->password) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        // Sync Roles
        if ($request->has('roles')) {
            $user->syncRoles($request->roles);
        }

        return response()->json(['message' => 'User profile updated successfully']);
    }

    /**
     * 3. MANAGE TOKENS (Moved from AdminController)
     */
    public function adjustTokens(Request $request, $id)
    {
        $request->validate([
            'amount' => 'required|integer',
            'description' => 'required|string',
            'type' => 'nullable|string' // Allow optional type
        ]);

        $user = User::findOrFail($id);

        DB::transaction(function () use ($user, $request) {
            if ($request->amount > 0) {
                $user->increment('token_balance', $request->amount);
            } else {
                $user->decrement('token_balance', abs($request->amount));
            }

            $user->transactions()->create([
                'amount' => $request->amount,
                'type' => $request->input('type', 'admin_adjustment'), // Use provided type or default
                'description' => $request->description . ' (By Admin)'
            ]);
        });

        return response()->json(['message' => 'Tokens updated', 'new_balance' => $user->token_balance]);
    }

    /**
     * 4. GET PERMISSIONS & SETTINGS (Moved from AdminController)
     */
    public function getUserDetails($id)
    {
        // Fetch user with Spatie relationships
        $user = User::findOrFail($id);

        return response()->json([
            // This gets names of all permissions inherited from roles + direct
            'user_permissions' => $user->getPermissionNames(),
            'user_settings' => $user->settings ?? ['member_limit' => 0],
            'all_permissions' => Permission::pluck('name'),
            'all_roles' => Role::pluck('name')
        ]);
    }

    /**
     * 5. UPDATE PERMISSIONS (Moved from AdminController)
     */
    public function updatePermissions(Request $request, $id)
    {
        $user = User::findOrFail($id);

        if ($request->has('permissions')) {
            $user->syncPermissions($request->permissions);
        }

        $currentSettings = $user->settings ?: [];
        $user->settings = array_merge($currentSettings, [
            'member_limit' => (int) $request->input('member_limit', 0)
        ]);
        $user->save();

        return response()->json(['message' => 'User capabilities updated']);
    }

    /**
     * 6. DELETE USER
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);

        if ($user->hasRole('admin') && $user->id === auth()->id()) {
            return response()->json(['message' => 'You cannot delete yourself.'], 403);
        }

        $user->delete();
        return response()->json(['message' => 'User deleted successfully']);
    }

    /**
     * 7. BAN USER
     */
    public function ban($id)
    {
        $user = User::findOrFail($id);
        $currentUser = auth()->user();

        // 1. Prevent banning yourself
        if ($user->id === $currentUser->id) {
            return response()->json(['message' => 'You cannot ban yourself.'], 403);
        }

        // 2. Prevent banning admins or super admins
        if ($user->hasRole('admin') || $user->isSuperAdmin()) {
            return response()->json(['message' => 'You cannot ban an admin.'], 403);
        }

        $user->banned_at = now();
        $user->save();

        return response()->json(['message' => 'User has been banned successfully']);
    }

    /**
     * 8. UNBAN USER
     */
    public function unban($id)
    {
        $user = User::findOrFail($id);
        $user->banned_at = null;
        $user->save();

        return response()->json(['message' => 'User has been unbanned successfully']);
    }
}