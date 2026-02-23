<?php

namespace App\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramAdminChannel
{
    public function send($notifiable, Notification $notification)
    {
        // Fetch System Global Settings
        $token = \App\Models\Setting::where('key', 'telegram_bot_token')->value('value');
        $chatId = \App\Models\Setting::where('key', 'telegram_chat_id')->value('value');
        $topicId = \App\Models\Setting::where('key', 'telegram_topic_id')->value('value');

        if (!$token || !$chatId) {
            \Log::warning('Telegram Admin Notification skipped: Missing Token or Chat ID (Check System Config)');
            return;
        }

        $data = $notification->toTelegram($notifiable);

        $message = "🔔 <b>{$data['action']}</b>\n\n" .
            "{$data['description']}\n\n" .
            "👤 <b>User:</b> {$data['user_name']}\n" .
            "📧 <b>Email:</b> {$data['user_email']}\n" .
            "📅 <b>Time:</b> " . now()->setTimezone('Asia/Phnom_Penh')->toDateTimeString();

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
            \Log::error("Telegram Admin Notification Failed: " . $e->getMessage());
        }
    }
}
