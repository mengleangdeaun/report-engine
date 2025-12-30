<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        
        // Get last 10 notifications
        return response()->json(
            $user->notifications()->latest()->take(10)->get()
        );
    }

    public function markAsRead()
    {
        Auth::user()->unreadNotifications->markAsRead();
        return response()->json(['message' => 'Read']);
    }
    
    public function clearAll()
    {
        Auth::user()->notifications()->delete();
        return response()->json(['message' => 'Cleared']);
    }
    public function destroy($id)
    {
        $notification = Auth::user()
                        ->notifications()
                        ->where('id', $id)
                        ->first();

        if ($notification) {
            $notification->delete();
        }

        return response()->json(['message' => 'Deleted']);
    }
}