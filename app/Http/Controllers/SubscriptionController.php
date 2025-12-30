<?php

namespace App\Http\Controllers;

use App\Models\Team;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class SubscriptionController extends Controller
{
    /**
     * Super Admin: List all Teams and their Plans
     */
public function index(Request $request)
{
    $perPage = $request->query('per_page', 10);
    $search = $request->query('search');
    $plan = $request->query('plan');
    $status = $request->query('status');

    // Join plans table to get member_limit and max_tokens
    $query = Team::query()
        ->select('teams.*', 'plans.member_limit', 'plans.max_tokens as plan_max_tokens')
        ->join('plans', 'teams.plan_type', '=', 'plans.slug')
        ->with(['owner:id,name,email,token_balance', 'members:id,name,email'])
        ->withCount('members');

    // --- Search & Filters (Server-Side) ---
    if ($search) {
        $query->where(function($q) use ($search) {
            $q->where('teams.name', 'like', "%{$search}%")
              ->orWhereHas('owner', function($sq) use ($search) {
                  $sq->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
              });
        });
    }

    if ($plan && $plan !== 'all') {
        $query->where('teams.plan_type', $plan);
    }

    if ($status === 'expired') {
        $query->where('subscription_expires_at', '<', now());
    } elseif ($status === 'active') {
        $query->where(function($q) {
            $q->where('subscription_expires_at', '>=', now())
              ->orWhereNull('subscription_expires_at');
        });
    }

    return response()->json($query->paginate($perPage));
}

    /**
     * Super Admin: Upgrade/Downgrade a Team
     */

public function updatePlan(Request $request, $teamId)
{
    $request->validate([
        'plan' => 'required|string',
        'duration_months' => 'nullable|integer'
    ]);

    $team = Team::findOrFail($teamId);
    $planConfig = \App\Models\Plan::where('slug', $request->plan)->firstOrFail();

    // 1. Update Plan Type
    $team->plan_type = $request->plan;
    
    // 2. Update Token Balance on the Owner
    if ($team->owner) {
        $team->owner->token_balance = $planConfig->max_tokens;
        $team->owner->save();
    }

    // 3. Update Expiry Date
    if ($request->duration_months) {
        // Now $team->subscription_expires_at is a Carbon object, not a string
        $baseDate = ($team->subscription_expires_at && $team->subscription_expires_at->isFuture()) 
            ? $team->subscription_expires_at 
            : \Carbon\Carbon::now();

        $team->subscription_expires_at = $baseDate->addMonths($request->duration_months);
    }

    $team->save();

    return response()->json([
        'message' => "Plan updated successfully",
        'team' => $team
    ]);
}
}

