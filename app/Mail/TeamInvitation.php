<?php

namespace App\Mail;

use App\Models\Invitation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TeamInvitation extends Mailable
{
    use Queueable, SerializesModels;

    public $invitation;
    public $url;

    /**
     * Create a new message instance.
     */
    public function __construct(Invitation $invitation)
    {
        $this->invitation = $invitation;
        
        // Construct the link pointing to your React Frontend signup page
        // Using the token generated in InvitationController
        $this->url = "http://localhost:8000/auth/boxed-signup?token=" . $invitation->token . "&email=" . urlencode($invitation->email);
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject('Invitation to join ' . ($this->invitation->team->name ?? 'a Workspace'))
                    ->markdown('emails.team-invitation');
    }
}