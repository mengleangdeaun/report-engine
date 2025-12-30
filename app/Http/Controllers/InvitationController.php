<?php

namespace App\Http\Controllers;

use App\Models\Invitation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use App\Mail\TeamInvitation;

class InvitationController extends Controller
{
    /**
     * Create Invitation (Owner OR Admin)
     */
    public function store(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'role' => 'required|string',
        ]);

        $user = Auth::user();
        $team = $user->team;

        if (!$team) {
            return response()->json(['message' => 'You do not have a team workspace.'], 403);
        }

        // 1. PERMISSION CHECK: Owner OR Admin
        $isOwner = $user->id === $team->user_id;
        $member = $team->members()->where('user_id', $user->id)->first();
        $isAdmin = $member && $member->pivot->role === 'admin';

        if (!$isOwner && !$isAdmin) {
            return response()->json(['message' => 'Unauthorized. Only Admins can invite.'], 403);
        }

        // 2. DUPLICATE MEMBER CHECK
        $existingMember = $team->members()->where('email', $request->email)->exists();
        if ($existingMember) {
            return response()->json(['message' => 'User is already in this team.'], 422);
        }

        // 3. LIMIT CHECK
        $currentMemberCount = $team->members()->count();
        $pendingInviteCount = $team->invitations()->count();
        $totalUsage = $currentMemberCount + $pendingInviteCount;

        if ($totalUsage >= $team->member_limit) {
            return response()->json([
                'message' => "Limit reached! Your plan allows {$team->member_limit} members."
            ], 403);
        }

        // 4. DUPLICATE INVITE CHECK
        $existingInvite = Invitation::where('email', $request->email)
                                    ->where('team_id', $team->id)
                                    ->first();
        if ($existingInvite) {
            return response()->json(['message' => 'This user has already been invited.'], 422);
        }

        // 5. CREATE
        $token = Str::random(32);
        $invitation = Invitation::create([
            'email' => $request->email,
            'token' => $token,
            'role' => $request->role,
            'team_id' => $team->id,
            'invited_by' => $user->id,
            'expires_at' => Carbon::now()->addDays(7),
        ]);

        // 6. SEND EMAIL
        try {
            Mail::to($request->email)->send(new TeamInvitation($invitation));
        } catch (\Exception $e) {
            \Log::error("Mail failed: " . $e->getMessage());
        }

        return response()->json(['message' => 'Invitation sent successfully.'], 201);
    }

    /**
     * Cancel Invitation (Owner OR Admin)
     */
    /**
     * Cancel Invitation (Owner OR Admin)
     */
    public function destroy($id)
    {
        $user = Auth::user();
        $team = $user->team;

        // 1. PERMISSION CHECK
        $isOwner = $user->id === $team->user_id;
        $member = $team->members()->where('user_id', $user->id)->first();
        $isAdmin = $member && $member->pivot->role === 'admin';

        if (!$isOwner && !$isAdmin) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // 2. FIND AND DELETE
        $invitation = Invitation::where('id', $id)
            ->where('team_id', $team->id)
            ->firstOrFail();

        $invitation->delete();

        return response()->json(['message' => 'Invitation cancelled.']);
    }
}