<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Http; // Import HTTP
use Illuminate\Http\Request;
use Illuminate\Auth\Events\Registered;
use App\Models\User;
use App\Models\Plan;
use App\Models\Team;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;
use App\Rules\NotDisposableEmail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str; 
use App\Models\Invitation;
use Illuminate\Support\Facades\Mail;
use App\Mail\ForgotPasswordMail;
use Illuminate\Support\Facades\Password;




// ... imports

class AuthController extends Controller
{
    // 1. REGISTER: Assign default 'user' role
public function register(Request $request)
{
    $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users',
        'password' => 'required|string|min:8|confirmed',
        'token' => 'nullable|string'
    ]);

    return DB::transaction(function () use ($request) {
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            // Mark as verified immediately if it's the master admin email
            'email_verified_at' => ($request->email === 'mengleangdeaun@gmail.com') ? now() : null,
        ]);

        $defaultPlan = Plan::where('slug', 'free')->first();
        $initialTokens = $defaultPlan ? $defaultPlan->max_tokens : 0; // Fall

        // 1. Handle Invitation: User joins an existing team
        if ($request->filled('token')) {
            $invitation = Invitation::where('token', $request->token)
                ->where('email', $request->email)
                ->first();

            if ($invitation) {
                $user->teams()->attach($invitation->team_id, ['role' => $invitation->role]);
                $user->team_id = $invitation->team_id;
                
                // If they are joining via a valid invite, we can trust the email
                $user->email_verified_at = now(); 
                $user->save();

                setPermissionsTeamId($invitation->team_id);
                $user->assignRole($invitation->role);
                $invitation->delete();

                return $this->authResponse($user);
            }
        }

        // 2. Workspace Creation
        if ($user->email === 'mengleangdeaun@gmail.com') {
            $targetTeamId = 1; // Admin Workspace
            $user->teams()->syncWithoutDetaching([$targetTeamId => ['role' => 'admin']]);
            $user->team_id = $targetTeamId;
            $user->save();
            
            setPermissionsTeamId($targetTeamId);
            $user->assignRole('admin');
        } else {
            // Standard User: Create their own Workspace
            $team = Team::create([
                'name' => $user->name . "'s Workspace",
                'user_id' => $user->id,
                'plan_type' => 'free',
                'token_balance' => $initialTokens,

            ]);

            $user->teams()->attach($team->id, ['role' => 'owner']);
            $user->token_balance = $initialTokens;
            $user->team_id = $team->id;
            $user->save();

            setPermissionsTeamId($team->id);
            $user->assignRole('admin'); 
            
            // Only send notification if not already verified (e.g., via invite)
            if (!$user->email_verified_at) {
                $user->sendEmailVerificationNotification();
            }
        }

        return $this->authResponse($user);
    });
}




private function getEffectivePermissions($user)
{
    // If it's a super admin, just return all permissions immediately
    if ($user->hasRole('admin')) {
        return \Spatie\Permission\Models\Permission::all()->pluck('name')->toArray();
    }

    $team = $user->team;
    if (!$team) return [];

    $plan = \App\Models\Plan::where('slug', $team->plan_type)->first();
    if (!$plan) return [];

    $planPermissions = $plan->allowed_permissions->pluck('name')->toArray();
    $userPermissions = $user->getAllPermissions()->pluck('name')->toArray();

    return array_values(array_intersect($userPermissions, $planPermissions));
}

    // 2. LOGIN: Send roles as clean strings
// In AuthController.php

// app/Http/Controllers/AuthController.php

/**
 * Handle Login Request
 */


        public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }

public function handleGoogleCallback(Request $request)
{
    try {
        // 1. Get Google user details via Socialite
        $googleUser = Socialite::driver('google')->stateless()->user();

        // 2. Extract invite token from the 'state' parameter passed during redirect
        $state = $request->input('state');
        parse_str($state, $stateParams);
        $inviteToken = $stateParams['invite_token'] ?? null;

        return DB::transaction(function () use ($googleUser, $inviteToken) {
            // 3. Find existing user or prep for new one
            $user = User::where('email', $googleUser->email)->first();

            $defaultPlan = Plan::where('slug', 'free')->first();
            $initialTokens = $defaultPlan ? $defaultPlan->max_tokens : 0;

            if (!$user) {
                // NEW USER: Create with the verified timestamp and google_id
                $user = User::create([
                    'name' => $googleUser->name,
                    'email' => $googleUser->email,
                    'avatar' => $googleUser->avatar,
                    'google_id' => $googleUser->id, // ✅ Now storing google_id
                    'password' => Hash::make(Str::random(24)),
                    'email_verified_at' => now(), // ✅ Trust Google's verification
                ]);
            } else {
                // EXISTING USER: Ensure email is marked verified and update google_id if missing
                if (is_null($user->email_verified_at)) {
                    $user->email_verified_at = now();
                }
                
                if (!$user->google_id) {
                    $user->google_id = $googleUser->id;
                }
                $user->save();
            }

            // 4. Handle Invitation Logic
            if ($inviteToken) {
                $invitation = Invitation::where('token', $inviteToken)
                    ->where('email', $user->email)
                    ->first();

                if ($invitation) {
                    // Sync user to the invited team and set as active workspace
                    $user->teams()->syncWithoutDetaching([$invitation->team_id => ['role' => $invitation->role]]);
                    $user->team_id = $invitation->team_id;
                    $user->save();

                    setPermissionsTeamId($invitation->team_id);
                    $user->assignRole($invitation->role);
                    $invitation->delete();
                }
            } 
            // 5. Default Workspace creation if they aren't joining an invite and have no team
            else if (!$user->team_id) {
                $team = Team::create([
                    'name' => $user->name . "'s Workspace",
                    'user_id' => $user->id,
                    'plan_type' => 'free',
                    'token_balance' => $initialTokens,
                ]);

                $user->teams()->attach($team->id, ['role' => 'owner']);
                $user->token_balance = $initialTokens;
                $user->team_id = $team->id;
                $user->save();

                // FIXED: Immediately set context and assign Admin role for their own workspace
                setPermissionsTeamId($team->id);
                $user->assignRole('admin');
            }

            // 6. Ensure Spatie Role is assigned (Super Admin check included)
        
            
            // Set context for the current active team
            if ($user->team_id) {
                setPermissionsTeamId($user->team_id);
                
                // Determine what role they SHOULD have if none is present
                $roleName = ($user->email === 'mengleangdeaun@gmail.com') ? 'admin' : 'admin'; 
                // Usually, the person who owns the workspace is an 'admin' in Spatie terms 
                // even if their team-pivot role is 'owner'.

                if (!$user->hasRole($roleName)) {
                    $user->assignRole($roleName);
                }
            }

            // Create role if it doesn't exist for the current team context
            \Spatie\Permission\Models\Role::firstOrCreate([
                'name' => $roleName, 
                'guard_name' => 'web'
            ]);
            

            // 7. Issue API Token and redirect back to frontend
            $token = $user->createToken('auth_token')->plainTextToken;
            return redirect(config('app.frontend_url') . "/auth/callback?token={$token}");
        });

    } catch (\Exception $e) {
        \Log::error('Google Auth Error: ' . $e->getMessage());
        return redirect(config('app.frontend_url') . "/auth/boxed-signin?error=google_failed");
    }
}


public function login(Request $request)
{
    $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    $user = \App\Models\User::where('email', $request->email)->first();

    if (!$user || !\Illuminate\Support\Facades\Hash::check($request->password, $user->password)) {
        throw \Illuminate\Validation\ValidationException::withMessages(['email' => ['Invalid credentials.']]);
        
    }

    $token = $user->createToken('auth_token')->plainTextToken;


    // Inside login() after verifying password
if ($request->filled('token')) {
    $invitation = \App\Models\Invitation::where('token', $request->token)
        ->where('email', $user->email)
        ->first();

  if ($invitation) {
    $user->team_id = $invitation->team_id;
    $user->save();

    setPermissionsTeamId($invitation->team_id);

    // ✅ FIX: Find or create the role so it never fails
    $role = \Spatie\Permission\Models\Role::firstOrCreate([
        'name' => $invitation->role, // Uses 'member' from the invitation
        'guard_name' => 'web',
        'team_id' => $invitation->team_id
    ]);

    $user->assignRole($role);
    $user->teams()->attach($invitation->team_id, ['role' => $invitation->role]);
    
    $invitation->delete();
    }
}

    // --- LOGIC SPLIT: Super Admin vs Regular User ---
    if ($user->email === 'mengleangdeaun@gmail.com') {
        // Super Admin: Bypass database and give everything
        $roles = ['admin'];
        $permissions = \Spatie\Permission\Models\Permission::all()->pluck('name')->toArray();
    } else {
        // Regular User: Fetch their specific roles and plan permissions
        // This uses your existing Spatie & Team logic
        $roles = $user->getRoleNames()->toArray();
        $permissions = $this->getEffectivePermissions($user);
    }

    $userData = [
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
        'avatar' => $user->avatar,
        'google_id' => $user->google_id,
        'roles' => $roles, 
        'permissions' => $permissions,
        'token_balance' => $user->token_balance,
        'active_team_id' => $user->team_id,
    ];

    return response()->json([
        'user' => $userData,
        'access_token' => $token,
        'token_type' => 'Bearer',
    ]);
}

public function me(Request $request)
{
    $user = $request->user();

    if ($user->team_id) {
        setPermissionsTeamId($user->team_id); //
    }

    // Logic for roles and permissions
    if ($user->email === 'mengleangdeaun@gmail.com') {
        $roles = ['admin'];
        $permissions = \Spatie\Permission\Models\Permission::all()->pluck('name')->toArray();
    } else {
        $roles = $user->getRoleNames()->toArray();
        $permissions = $this->getEffectivePermissions($user); //
    }

    // ✅ Match the structure expected by AuthCallback.tsx
    return response()->json([
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $user->avatar,
            'google_id' => $user->google_id,
            'active_team_id' => $user->team_id,
            'roles' => $roles,
            'email_verified_at' => $user->email_verified_at,
        ],
        'permissions' => $permissions, // Dara's UI fuel!
        'is_admin' => in_array('admin', $roles),
    ]);
}

    /**
     * Helper for consistent auth responses
     */
    private function authResponse($user)
    {
        return response()->json([
            'access_token' => $user->createToken('auth_token')->plainTextToken,
            'token_type' => 'Bearer',
            'user' => $user
        ], 201);
    }



public function redirectToGoogle(Request $request) {
    $inviteToken = $request->query('token'); // Get from React frontend
    
    return response()->json([
        'url' => Socialite::driver('google')
            ->stateless()
            ->with(['state' => 'invite_token=' . $inviteToken]) // Passes it to handleGoogleCallback
            ->redirect()
            ->getTargetUrl()
    ]);
}

public function forgotPassword(Request $request)
{
    $request->validate(['email' => 'required|email|exists:users,email']);

    $user = User::where('email', $request->email)->first();

    // Generate the token
    $token = Password::createToken($user);

    // Send the custom mail using the URL from ServiceProvider
    // Note: We use the ResetPassword::createUrlUsing logic indirectly here
    Mail::to($user->email)->send(new ForgotPasswordMail($token, $user->email));

    return response()->json(['message' => 'Password reset link sent!']);
}

public function resetPassword(Request $request)
{
    $request->validate([
        'token' => 'required',
        'email' => 'required|email|exists:users,email',
        'password' => 'required|min:8|confirmed',
    ]);

    $user = User::where('email', $request->email)->first();

    // 1. Use the Password Broker to verify the token
    // This handles the hashing and expiration checks automatically
    $tokenIsValid = Password::broker()->tokenExists($user, $request->token);

    if (!$tokenIsValid) {
        return response()->json(['message' => 'This password reset token is invalid.'], 400);
    }

    // 2. Update the user's password
    $user->password = Hash::make($request->password);
    $user->save();

    // 3. Delete the token so it cannot be used again
    Password::broker()->deleteToken($user);

    return response()->json(['message' => 'Password has been reset successfully.']);
}

}