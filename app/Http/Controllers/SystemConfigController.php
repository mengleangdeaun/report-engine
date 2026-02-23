<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Setting;
use Illuminate\Support\Facades\Http;

class SystemConfigController extends Controller
{
    public function index()
    {
        // Fetch all settings keyed by 'key'
        $settings = Setting::all()->pluck('value', 'key');

        return response()->json([
            // Telegram
            'telegram_bot_token' => $settings['telegram_bot_token'] ?? '',
            'telegram_chat_id' => $settings['telegram_chat_id'] ?? '',
            'telegram_topic_id' => $settings['telegram_topic_id'] ?? '',
            'telegram_bot_name' => $settings['telegram_bot_name'] ?? '',

            // Pusher
            'pusher_app_id' => $settings['pusher_app_id'] ?? '',
            'pusher_app_key' => $settings['pusher_app_key'] ?? '',
            'pusher_app_secret' => $settings['pusher_app_secret'] ?? '',
            'pusher_app_cluster' => $settings['pusher_app_cluster'] ?? 'mt1',
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'telegram_bot_token' => 'nullable|string',
            'telegram_chat_id' => 'nullable|string',
            'telegram_topic_id' => 'nullable|string',
            'pusher_app_id' => 'nullable|string',
            'pusher_app_key' => 'nullable|string',
            'pusher_app_secret' => 'nullable|string',
            'pusher_app_cluster' => 'nullable|string',
        ]);

        foreach ($data as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                [
                    'value' => $value,
                    'group' => str_contains($key, 'telegram') ? 'telegram' : 'pusher'
                ]
            );
        }

        // Optional: Fetch Bot Name if token changed
        if ($request->filled('telegram_bot_token')) {
            $response = Http::get("https://api.telegram.org/bot{$request->telegram_bot_token}/getMe");
            if ($response->successful()) {
                Setting::updateOrCreate(
                    ['key' => 'telegram_bot_name'],
                    ['value' => $response['result']['first_name'], 'group' => 'telegram']
                );
            }
        }

        return response()->json(['message' => 'Settings updated successfully.']);
    }

    // Public endpoint for Frontend
    public function getPublicConfig()
    {
        $settings = Setting::where('group', 'pusher')->pluck('value', 'key');
        return response()->json([
            'pusher' => [
                'key' => $settings['pusher_app_key'] ?? '',
                'cluster' => $settings['pusher_app_cluster'] ?? 'mt1',
                'forceTLS' => true,
            ]
        ]);
    }

    public function testTelegram(Request $request)
    {
        $token = $request->telegram_bot_token ?? Setting::where('key', 'telegram_bot_token')->value('value');
        $chatId = $request->telegram_chat_id ?? Setting::where('key', 'telegram_chat_id')->value('value');
        $topicId = $request->telegram_topic_id ?? Setting::where('key', 'telegram_topic_id')->value('value');

        if (!$token || !$chatId) {
            return response()->json(['message' => 'Missing Token or Chat ID'], 400);
        }

        $url = "https://api.telegram.org/bot{$token}/sendMessage";
        $payload = [
            'chat_id' => $chatId,
            'text' => "✅ System Config Test: Success!",
        ];

        if ($topicId) {
            $payload['message_thread_id'] = $topicId;
        }

        $response = Http::post($url, $payload);

        if ($response->successful()) {
            return response()->json(['message' => 'Test message sent successfully!']);
        }

        return response()->json(['message' => 'Failed to send message.', 'error' => $response->json()], 400);
    }
}
