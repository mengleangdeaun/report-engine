<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Channels\TelegramByobChannel; // ✅ Import your new channel

class TeamAlert extends Notification
{
    use Queueable;

    public $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function via($notifiable)
    {
        // Send to Database (In-App) AND Telegram (Custom Bot)
        return ['database', TelegramByobChannel::class]; 
    }

    public function toArray($notifiable)
    {
        return [
            'action' => $this->data['action'],
            'description' => $this->data['description'],
            'user_name' => $this->data['user_name'],
            'user_avatar' => $this->data['user_avatar'] ?? null,
            'time' => now()
        ];
    }
    
    // Optional: If you want specific formatting for Telegram
    public function toTelegram($notifiable)
    {
        return $this->data;
    }
}