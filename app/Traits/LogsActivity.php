<?php

namespace App\Traits;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

trait LogsActivity
{
    // ✅ Updated signature: accepts optional $properties array
    protected function logActivity($action, $description = null, $properties = [])
    {
        if (!Auth::check()) return;
        $user = Auth::user();

        ActivityLog::create([
            'team_id' => $user->team_id ?? $user->team->id,
            'user_id' => $user->id,
            'action' => $action,
            'description' => $description,
            'ip_address' => Request::ip(),
            'properties' => $properties // ✅ Save the raw data
        ]);
    }
}