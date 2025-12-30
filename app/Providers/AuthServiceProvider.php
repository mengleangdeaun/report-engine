<?php

namespace App\Providers;
use Illuminate\Support\Facades\Gate;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Auth\Notifications\VerifyEmail;

// use Illuminate\Support\Facades\Gate;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        // 'App\Models\Model' => 'App\Policies\ModelPolicy',
    ];

    /**
     * Register any authentication / authorization services.
     */
public function boot(): void
{
    // Implicitly grant "admin" role all permissions
    // This bypasses the "User does not have the right roles" error for your email
    Gate::before(function ($user, $ability) {
        return $user->email === 'mengleangdeaun@gmail.com' ? true : null;
    });

VerifyEmail::toMailUsing(function ($notifiable, $url) {
        // We extract the parts Laravel generated
        $parts = parse_url($url);
        $pathParts = explode('/', $parts['path']);
        
        // Extract ID and Hash from the path
        $id = $pathParts[count($pathParts) - 2];
        $hash = end($pathParts);
        $query = $parts['query'] ?? '';

        // Point this to your BACKEND route name we just created
        // The user clicks this -> hits Backend -> Backend redirects to Frontend
        return (new MailMessage)
            ->subject('Verify Your Email Address')
            ->line('Please click the button below to verify your email address.')
            ->action('Verify Email Address', $url) // This stays as the $url (Backend API)
            ->line('If you did not create an account, no further action is required.');
    });
}
}
