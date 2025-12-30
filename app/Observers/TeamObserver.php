<?php 

namespace App\Observers;

use App\Models\Team;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class TeamObserver
{
    public function created(Team $team): void

    {
        $user = \Illuminate\Support\Facades\Auth::user();
    
    // ✅ FIX: Ensure the new team inherits the plan from the creator's primary team
    // or defaults to a valid slug that exists in your 'plans' table
    $primaryPlanSlug = $user->ownedTeam->plan_type ?? 'free'; 
    
    $team->update(['plan_type' => $primaryPlanSlug]);
        // 1. Fetch the actual plan record to get the correct features
        $plan = $team->plan; 

        $defaultRoles = ['admin', 'member', 'user'];

        foreach ($defaultRoles as $roleName) {
            $role = Role::firstOrCreate([
                'name' => $roleName,
                'team_id' => $team->id,
                'guard_name' => 'web',
            ]);

            // 2. Map features to the Admin role base on the plan
            if ($roleName === 'admin' && $plan) {
                $planFeatures = $plan->features ?? [];
                
                // Only sync permissions that exist in your database
                $validPermissions = Permission::whereIn('name', $planFeatures)
                    ->pluck('name')
                    ->toArray();
                        
                $role->syncPermissions($validPermissions);
            }
        }
    }
}