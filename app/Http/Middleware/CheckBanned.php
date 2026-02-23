<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckBanned
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check() && Auth::user()->banned_at) {

            // Check if the request is from API (Sanctum)
            if ($request->user()->currentAccessToken()) {
                $request->user()->currentAccessToken()->delete();
            } else {
                // Web logout
                Auth::guard('web')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            if ($request->expectsJson()) {
                return response()->json(['message' => 'Your account has been banned.'], 403);
            }

            return redirect('/banned');
        }

        return $next($request);
    }
}
