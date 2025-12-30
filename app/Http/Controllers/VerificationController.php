<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request; // ✅ Use standard Request, not EmailVerificationRequest
use App\Models\User;
use Illuminate\Auth\Events\Verified;

class VerificationController extends Controller
{
public function verify(Request $request, $id)
{
    $user = User::findOrFail($id);

    // ✅ FIX: Ensure the signature is validated against the URL
    if (! $request->hasValidSignature()) {
        return redirect('http://localhost:8000/auth/boxed-signin?error=invalid_signature');
    }

    if (! $user->hasVerifiedEmail()) {
        $user->markEmailAsVerified();
        event(new Verified($user));
    }

    // Redirect to your React Signin page
    return redirect('http://localhost:8000/auth/boxed-signin?verified=1');
}

    public function resend(Request $request)
{
    // If they are already verified, return 400 so the frontend can tell them
    if ($request->user()->hasVerifiedEmail()) {
        return response()->json(['message' => 'Email already verified.'], 400);
    }

    // Triggers the Laravel verification email
    $request->user()->sendEmailVerificationNotification();

    return response()->json(['message' => 'Verification link sent! Check your inbox.']);
}
}