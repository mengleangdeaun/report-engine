<?php

namespace App\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramUserChannel
{
    public function send($notifiable, Notification $notification)
    {
        // 1. Get User's Team and Telegram Config
        // $notifiable is the User instance
        $team = $notifiable->team;

        if (!$team) {
            return;
        }

        $telegramConfig = $team->telegramConfig;

        if (!$telegramConfig || !$telegramConfig->bot_token || !$telegramConfig->chat_id || !$telegramConfig->is_active) {
            // No config, missing tokens, or inactive
            return;
        }

        $token = $telegramConfig->bot_token;
        $chatId = $telegramConfig->chat_id;
        $topicId = $telegramConfig->topic_id;

        // 3. Get Message Payload
        if (!method_exists($notification, 'toTelegram')) {
            \Log::warning('Telegram User Notification skipped: Notification missing toTelegram method');
            return;
        }

        $data = $notification->toTelegram($notifiable);

        // Allow toTelegram to return formatted message (string) or array
        if (is_string($data)) {
            $message = $data;
        } else {
            // Standardize simple array to message
            $message = "🔔 <b>{$data['action']}</b>\n\n" .
                "{$data['description']}";
        }


        // 4. Send Message
        $payload = [
            'chat_id' => $chatId,
            'text' => $message,
            'parse_mode' => 'HTML'
        ];

        if ($topicId) {
            $payload['message_thread_id'] = $topicId;
        }

        try {
            Http::post("https://api.telegram.org/bot{$token}/sendMessage", $payload);
        } catch (\Exception $e) {
            \Log::error("Telegram User Notification Failed: " . $e->getMessage());
        }
    }
}
