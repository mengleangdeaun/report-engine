<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Transaction;
use Spatie\Permission\Models\Role;
use Carbon\Carbon;          // <--- NEEDED FOR DATES

class AdminController extends Controller
{
    // 1. LIST ALL USERS
// app/Http/Controllers/AdminController.php

public function index(Request $request)
{
    $perPage = $request->input('per_page', 10);
    $sortBy = $request->input('sort_by', 'created_at');
    $sortDir = $request->input('sort_dir', 'desc');
    $search = $request->input('search', '');

    // ✅ Clean Database Query: No hard-coded emails
    $users = User::with(['roles' => function($query) {
            // This ensures roles are fetched even if team_id is null (Global Roles)
            $query->whereNull('team_id')->orWhere('team_id', 1);
        }])
        ->where(function($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('email', 'like', "%{$search}%");
        })
        ->orderBy($sortBy, $sortDir)
        ->paginate($perPage);

    return response()->json($users);
}

    // 2. MANAGE TOKENS (Add/Remove)
    public function adjustTokens(Request $request, $id)
    {
        $request->validate([
            'amount' => 'required|integer', // Can be positive (add) or negative (remove)
            'description' => 'required|string'
        ]);

        $user = User::findOrFail($id);

        DB::transaction(function () use ($user, $request) {
            // Update Balance
            if ($request->amount > 0) {
                $user->increment('token_balance', $request->amount);
            } else {
                $user->decrement('token_balance', abs($request->amount));
            }

            // Log Transaction
            $user->transactions()->create([
                'amount' => $request->amount,
                'type' => 'admin_adjustment',
                'description' => $request->description . ' (By Admin)'
            ]);
        });

        return response()->json(['message' => 'Tokens updated successfully', 'new_balance' => $user->token_balance]);
    }

    // 3. MANAGE ROLES (Promote/Demote)
    public function updateRole(Request $request, $id)
    {
        $request->validate(['role' => 'required|exists:roles,name']);
        
        $user = User::findOrFail($id);
        $user->syncRoles([$request->role]); // Replaces old roles with new one

        return response()->json(['message' => 'User role updated to ' . $request->role]);
    }
    
    // 4. DELETE USER
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        return response()->json(['message' => 'User deleted']);
    }

    public function dashboard()
    {
        // A. Key Metrics
        $totalUsers = User::count();
        $totalReports = Transaction::where('type', 'spend')->count();
        // Sum of all tokens currently held by users (Liability)
        $tokensOutstanding = User::sum('token_balance'); 
        // Sum of all tokens ever spent (Revenue indicator)
        $tokensSpent = abs(Transaction::where('type', 'spend')->sum('amount'));

        // B. Chart Data: Reports Generated in the last 7 days
        // This groups transactions by date
        $chartData = Transaction::where('type', 'spend')
            ->where('created_at', '>=', now()->subDays(7))
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // C. Recent Activity Feed
        $recentActivity = Transaction::with('user')
            ->latest()
            ->take(5)
            ->get();

        return response()->json([
            'total_users' => $totalUsers,
            'total_reports' => $totalReports,
            'tokens_outstanding' => $tokensOutstanding,
            'tokens_spent' => $tokensSpent,
            'chart_data' => $chartData,
            'recent_activity' => $recentActivity
        ]);
    }


}