<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckWorkspaceActive
{
    /**
     * Block non-owner members if their active workspace is deactivated.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $user = Auth::user();
            $team = $user->team;

            // Only block if team exists, is inactive, and user is NOT the owner
            if ($team && !$team->is_active && $user->id !== $team->user_id) {
                $ownerEmail = $team->owner?->email ?? 'N/A';

                if ($request->expectsJson()) {
                    return response()->json([
                        'message' => 'workspace_inactive',
                        'team_name' => $team->name,
                        'owner_email' => $ownerEmail,
                    ], 403);
                }

                return redirect('/workspace-inactive');
            }
        }

        return $next($request);
    }
}
