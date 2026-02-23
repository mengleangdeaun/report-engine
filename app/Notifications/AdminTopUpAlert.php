<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use App\Channels\TelegramAdminChannel;

class AdminTopUpAlert extends Notification implements ShouldQueue
{
    use Queueable;

    public $topUpRequest;

    public function __construct($topUpRequest)
    {
        $this->topUpRequest = $topUpRequest;
    }

    public function via($notifiable)
    {
        return ['broadcast', 'database', TelegramAdminChannel::class];
    }


    public function toBroadcast($notifiable)
    {
        return new BroadcastMessage([
            'title' => 'New Top Up Request',
            'message' => "{$this->topUpRequest->user->name} requested {$this->topUpRequest->amount} credits.",
            'user' => $this->topUpRequest->user->name,
            'amount' => $this->topUpRequest->amount,
            // Header.tsx expects these for the toast/popup usually, but Echo listener uses title/message
            'user_name' => $this->topUpRequest->user->name,
            'action' => 'New Top Up Request',
            'description' => "Requested {$this->topUpRequest->amount} credits."
        ]);
    }

    public function toDatabase($notifiable)
    {
        return [
            'action' => 'New Top Up Request',
            'description' => "User {$this->topUpRequest->user->name} requested {$this->topUpRequest->amount} credits.",
            'user_name' => $this->topUpRequest->user->name,
            'user_avatar' => $this->topUpRequest->user->avatar, // Assuming avatar exists on User
            'amount' => $this->topUpRequest->amount,
            'request_id' => $this->topUpRequest->id,
            'url' => '/admin/top-up-requests'
        ];
    }

    public function toTelegram($notifiable)
    {
        return [
            'action' => 'New Top Up Request',
            'description' => "User <b>{$this->topUpRequest->user->name}</b> has requested <b>{$this->topUpRequest->amount}</b> tokens.",
            'user_name' => $this->topUpRequest->user->name,
            'user_email' => $this->topUpRequest->user->email,
        ];
    }
}
