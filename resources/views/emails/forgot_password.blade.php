@component('mail::message')
# Reset Your Password

Hello,

You are receiving this email because we received a password reset request for your account associated with **{{ config('app.name') }}**.

@component('mail::button', ['url' => $url, 'color' => 'primary'])
Reset Password
@endcomponent

**Important Security Note:**
This password reset link will expire in **{{ config('auth.passwords.'.config('auth.defaults.passwords').'.expire') }} minutes**.

If you did not request a password reset, no further action is required. Please ignore this email or contact our support team if you have concerns.

Best regards,  
The {{ config('app.name') }} Team

@component('mail::panel')
If you're having trouble clicking the "Reset Password" button, copy and paste the URL below into your web browser:  
[{{ $url }}]({{ $url }})
@endcomponent
@endcomponent