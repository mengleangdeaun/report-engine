<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash; //
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class ProfileController extends Controller
{
    // 1. Update Profile (Name, Email, Avatar)
 public function update(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'avatar' => 'nullable|image|max:5120' // Max 5MB
        ]);

        if ($request->hasFile('avatar')) {
            // ✅ FIX: Get the RAW value from DB (ignore the Model Accessor)
            $oldAvatar = $user->getRawOriginal('avatar'); 

            // Only delete if it exists AND is not a URL (Google)
            if ($oldAvatar && !str_starts_with($oldAvatar, 'http')) {
                Storage::disk('public')->delete($oldAvatar);
            }

            // Store new avatar
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar = $path;
        }

        $user->name = $request->name;
        // Note: Updating email usually requires re-verification, but for now we'll allow it
        $user->email = $request->email; 
        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user, // This now includes the full URL thanks to Step 1
        ]);
    }

// 2. ✅ FIXED: Smart Password Update
    public function updatePassword(Request $request)
    {
        $user = Auth::user();

        $rules = [
            'password' => 'required|string|min:8|confirmed',
        ];

        // LOGIC: Only require 'current_password' if:
        // 1. User HAS a password
        // 2. AND User does NOT have a google_id (If they have Google, we trust the session)
        if ($user->password && !$user->google_id) {
            $rules['current_password'] = 'required|current_password';
        }

        $request->validate($rules);

        $user->password = Hash::make($request->password);
        $user->save();

        return response()->json(['message' => 'Password updated successfully']);
    }

    // 3. ✅ FIXED: Smart Account Deletion
public function destroy(Request $request)
{
    /** @var \App\Models\User $user */
    $user = Auth::user();

    // 1. Safety check to ensure user is authenticated
    if (!$user) {
        return response()->json(['message' => 'Unauthorized'], 401);
    }

    // 2. LOGIC: Only force password check for standard email users
    // If the user has a google_id, we skip password validation
    $isSocialUser = !empty($user->google_id);

    if (!$isSocialUser) {
        $request->validate([
            'password' => 'required|current_password',
        ], [
            'password.current_password' => 'The provided password does not match your current password.'
        ]);
    }

    return DB::transaction(function () use ($user) {
        // 3. Delete Avatar (Cleanup)
        $oldAvatar = $user->getRawOriginal('avatar');
        if ($oldAvatar && !str_starts_with($oldAvatar, 'http')) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($oldAvatar);
        }

        // 4. Revoke all tokens to prevent further API access
        $user->tokens()->delete();

        // 5. Delete the user record
        $user->delete();

        return response()->json(['message' => 'Account deleted successfully']);
    });
}




}