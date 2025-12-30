<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\RateLimiter; // ✅ Import this
use Illuminate\Http\Request;
use Illuminate\Auth\Notifications\ResetPassword; // <--- Import
use Illuminate\Cache\RateLimiting\Limit;
use App\Models\Team;
use App\Observers\TeamObserver;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    
    {
        Team::observe(TeamObserver::class);
        // ✅ Define a limiter named "register"
        // Allow 3 attempts per 1 minute per IP address
        RateLimiter::for('register', function (Request $request) {
            return Limit::perMinute(3)->by($request->ip());
        });

        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
        // This points to your React Frontend Route
        return "http://localhost:8000/auth/reset-password?token={$token}&email={$notifiable->getEmailForPasswordReset()}";

        
    });
// if (str_contains(config('app.url'), 'ngrok-free.dev')) {
//         // This forces Laravel to generate https:// links for assets
//         URL::forceScheme('https');
        
//         // This tells Laravel to trust the ngrok proxy headers
//         Request::setTrustedProxies(
//             ['0.0.0.0/0'], 
//             \Illuminate\Http\Request::HEADER_X_FORWARDED_FOR | 
//             \Illuminate\Http\Request::HEADER_X_FORWARDED_HOST | 
//             \Illuminate\Http\Request::HEADER_X_FORWARDED_PORT | 
//             \Illuminate\Http\Request::HEADER_X_FORWARDED_PROTO
//         );
//     }
    }



}