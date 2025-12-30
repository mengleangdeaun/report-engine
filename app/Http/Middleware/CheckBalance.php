<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth; // <--- IMPORTANT: Don't forget this!
use Symfony\Component\HttpFoundation\Response;

class CheckBalance
{
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Get the current user
        $user = Auth::user();

        // 2. Check if they have enough tokens (e.g., 10)
        // You can change '10' to a setting or config variable later
        if ($user->token_balance < 10) {
            return response()->json([
                'message' => 'Insufficient tokens. You need 10 tokens to generate a report.',
                'current_balance' => $user->token_balance
            ], 403); // 403 means "Forbidden"
        }

        // 3. If they have enough, let them pass!
        return $next($request);
    }
}