<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EnsurePlanSupportsPermission
{
public function handle(Request $request, Closure $next, $permission = null) {
    $user = Auth::user();
    if (!$user) return $next($request);

    // ✅ BYPASS: If the user is an admin, they get everything
    if ($user->hasRole('admin')) return $next($request);

    // ✅ CONTEXT: Get the team from the header or user session
    $teamId = $request->header('X-Team-Id') ?? $user->current_team_id;
    
    if ($teamId) {
        setPermissionsTeamId($teamId);
    } else {
        // If we are just fetching the profile, let it pass without a team
        return $next($request);
    }

    // If a specific permission is requested (e.g. facebook_gen), check it
    if ($permission) {
        // Plan Ceiling check
        $plan = \App\Models\Plan::where('slug', $user->team->plan_type ?? 'free')->first();
        $allowed = collect($plan->features ?? []);

        if (!$allowed->contains($permission)) {
            return response()->json(['message' => 'Feature not in your plan'], 403);
        }
    }

    return $next($request);
}
}