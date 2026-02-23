<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TopUpRequest;
use Illuminate\Support\Facades\Auth;

class TopUpRequestController extends Controller
{
    // User: Request Top Up
    public function store(Request $request)
    {
        $user = Auth::user();
        $team = $user->team;

        if (!$team) {
            return response()->json(['message' => 'No active workspace found'], 404);
        }

        // Check if there is already a pending request
        $existing = TopUpRequest::where('team_id', $team->id)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return response()->json(['message' => 'You already have a pending request.'], 400);
        }

        $request->validate([
            'amount' => 'required|integer|min:1'
        ]);

        $topUpRequest = TopUpRequest::create([
            'user_id' => $user->id,
            'team_id' => $team->id,
            'amount' => $request->amount,
            'status' => 'pending'
        ]);

        // Notify Admin (Real-time + Telegram)
        // Find Super Admins (Assuming Spatie Permissions or User ID 1)
        // Fallback: If no roles package, notify user ID 1
        $admins = \App\Models\User::whereHas('roles', function ($q) {
            $q->where('name', 'super_admin');
        })->get();

        if ($admins->isEmpty()) {
            // Fallback to User ID 1 if no role found
            $admins = \App\Models\User::where('id', 1)->get();
        }

        foreach ($admins as $admin) {
            $admin->notify(new \App\Notifications\AdminTopUpAlert($topUpRequest));
        }

        return response()->json(['message' => 'Top-up request sent successfully.']);
    }

    // Admin: List Requests
    public function index(Request $request)
    {
        // Security: Ensure only super admin can see this (or use Middleware)
        // For now, we assume the route is protected by 'role:super_admin' or similar

        $query = TopUpRequest::with(['user:id,name,email', 'team:id,name'])
            ->orderBy('created_at', 'desc');

        // Filter by Status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Search by User Name or Email
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by Date Range
        if ($request->has('start_date') && $request->has('end_date')) {
            $startDate = $request->start_date;
            $endDate = $request->end_date;

            if ($startDate && $endDate) {
                $query->whereBetween('created_at', [
                    $startDate . ' 00:00:00',
                    $endDate . ' 23:59:59'
                ]);
            }
        }

        $perPage = $request->input('per_page', 10);
        $requests = $query->paginate($perPage);

        return response()->json($requests);
    }

    // Admin: Update Status (Approve/Reject)
    // Admin: Approve Request (Custom Amount)
    public function approve(Request $request, $id)
    {
        $request->validate([
            'amount' => 'required|integer|min:1'
        ]);

        $topUpRequest = TopUpRequest::findOrFail($id);

        if ($topUpRequest->status !== 'pending') {
            return response()->json(['message' => 'Request already processed.'], 400);
        }

        $user = $topUpRequest->user;
        $amount = $request->amount;

        // DB Transaction
        \DB::transaction(function () use ($user, $amount, $topUpRequest) {
            // 1. Add Tokens
            $user->increment('token_balance', $amount);

            // 2. Create Transaction Record
            $user->transactions()->create([
                'amount' => $amount,
                'type' => 'top_up',
                'description' => 'Top Up Approved (Request #' . $topUpRequest->id . ')'
            ]);

            // 3. Update Request Status
            $topUpRequest->update([
                'status' => 'approved',
                'approved_amount' => $amount
            ]);
        });

        // 4. Send Notification
        $user->notify(new \App\Notifications\TopUpStatusNotification($topUpRequest, 'approved', $amount));

        return response()->json(['message' => 'Request approved and tokens added.']);
    }

    // Admin: Reject Request
    public function update(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:rejected' // Only for rejection now, approve uses separate endpoint
        ]);

        $topUpRequest = TopUpRequest::findOrFail($id);

        if ($topUpRequest->status !== 'pending') {
            return response()->json(['message' => 'Request already processed.'], 400);
        }

        $topUpRequest->status = 'rejected';
        $topUpRequest->save();

        // Send Notification
        $topUpRequest->user->notify(new \App\Notifications\TopUpStatusNotification($topUpRequest, 'rejected'));

        return response()->json(['message' => 'Request rejected.']);
    }
    // Delete Single Request
    public function destroy($id)
    {
        $request = TopUpRequest::findOrFail($id);
        $request->delete();
        return response()->json(['message' => 'Request deleted successfully.']);
    }

    // Batch Delete Requests
    public function destroyMultiple(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:top_up_requests,id'
        ]);

        TopUpRequest::whereIn('id', $request->ids)->delete();

        return response()->json(['message' => 'Requests deleted successfully.']);
    }
}
