<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SuperAdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // ✅ THE FIX: If it's you, let you through regardless of the database
        if ($user && $user->email === 'mengleangdeaun@gmail.com') {
            return $next($request);
        }

        // Otherwise, check if they have the SUPER admin role
        if ($user && $user->hasRole('super_admin')) {
            return $next($request);
        }

        return response()->json(['message' => 'User does not have the right roles.'], 403);
    }
}