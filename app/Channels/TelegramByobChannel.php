<?php

namespace App\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use App\Models\TelegramConfig;

class TelegramByobChannel
{
    public function send($notifiable, Notification $notification)
    {
        // 1. Get the Team ID from the User
        // Assumes $notifiable is a User model with a 'team' relationship
        $teamId = $notifiable->team_id ?? $notifiable->team->id;

        if (!$teamId) return;

        // 2. Fetch the Custom Bot Config
        $config = TelegramConfig::where('team_id', $teamId)
                    ->where('is_active', true)
                    ->first();

        // Stop if no config or no token
        if (!$config || !$config->bot_token || !$config->chat_id) {
            return;
        }

        // 3. Get the message data
        // We expect the notification to have a 'toTelegram' method, 
        // or we just use the array data.
        $data = method_exists($notification, 'toTelegram') 
                ? $notification->toTelegram($notifiable) 
                : $notification->toArray($notifiable);

        $message = $this->formatMessage($data);

        // 4. Send Request to Telegram API
        // We use the USER'S token, not the system token
        $url = "https://api.telegram.org/bot{$config->bot_token}/sendMessage";
        
        $payload = [
            'chat_id' => $config->chat_id,
            'text' => $message,
            'parse_mode' => 'HTML', // Allows bold/italic
        ];

        if ($config->topic_id) {
            $payload['message_thread_id'] = $config->topic_id;
        }

        try {
            Http::post($url, $payload);
        } catch (\Exception $e) {
            // Log error silently so it doesn't break the app
            \Log::error("Telegram BYOB Error: " . $e->getMessage());
        }
    }

    protected function formatMessage($data)
    {
        // Customizable Message Template
        $icon = match($data['action'] ?? '') {
            'Page Updated' => '📝',
            'Report Generated' => '📊',
            'Status Changed' => '🔔',
            default => 'ℹ️'
        };

        return "<b>{$icon} {$data['action']}</b>\n\n" .
               "{$data['description']}\n" .
               "<i>User: {$data['user_name']}</i>";
    }
}