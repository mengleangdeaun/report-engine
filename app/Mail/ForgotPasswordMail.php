<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ForgotPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    public $url;
    public $email;

// app/Mail/ForgotPasswordMail.php

public function __construct($token, $email)
{
    $this->email = $email;
    // Point this to your React Frontend Route
    $frontendUrl = config('app.frontend_url', 'http://127.0.0.1:8000'); 
    $this->url = $frontendUrl . '/auth/reset-password/' . $token . '?email=' . urlencode($email);
}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reset Password Notification',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.forgot_password', // Use 'markdown' instead of 'view'
        );
    }
}