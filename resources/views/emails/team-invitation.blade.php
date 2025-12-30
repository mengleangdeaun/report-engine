@component('mail::message')
# Workspace Invitation

Hello,

You have been invited by **{{ $invitation->inviter->name }}** to join the **{{ $invitation->team->name }}** workspace on **{{ config('app.name') }}**.

As a member of this workspace, you will be assigned the role of **{{ ucfirst($invitation->role) }}**, allowing you to collaborate with the team, manage reports, and access shared resources.

@component('mail::button', ['url' => $url, 'color' => 'primary'])
Accept Invitation
@endcomponent

**Important Security Note:**
This invitation was sent to **{{ $invitation->email }}**. For your security, this link is unique to your account and will expire in **7 days**.

If you did not expect this invitation, please ignore this email or contact our support team.

Best regards,  
The {{ config('app.name') }} Team

@component('mail::panel')
If you're having trouble clicking the "Accept Invitation" button, copy and paste the URL below into your web browser:  
[{{ $url }}]({{ $url }})
@endcomponent
@endcomponent