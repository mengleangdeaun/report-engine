<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use App\Models\TelegramConfig;

class TelegramSettingsController extends Controller
{
    // 1. Get Config (Mask the token)
    public function show()
    {
        $team = Auth::user()->team;
        $config = TelegramConfig::where('team_id', $team->id)->first();

        if (!$config) {
            return response()->json(['configured' => false]);
        }

        return response()->json([
            'configured' => true,
            'bot_name' => $config->bot_name,
            'chat_id' => $config->chat_id,
            'topic_id' => $config->topic_id,
            'is_active' => $config->is_active,
            // 🔒 SECURITY: Never send the real token back to UI
            'has_token' => !empty($config->bot_token), 
        ]);
    }

    // 2. Update Config
    public function update(Request $request)
    {
        $request->validate([
            'bot_token' => 'nullable|string',
            'chat_id' => 'required|string',
            'topic_id' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $team = Auth::user()->team;

        $config = TelegramConfig::firstOrNew(['team_id' => $team->id]);

        // Only update token if the user typed a new one
        if ($request->filled('bot_token')) {
            $config->bot_token = $request->bot_token;
            
            // Auto-fetch Bot Name from Telegram API
            $response = Http::get("https://api.telegram.org/bot{$request->bot_token}/getMe");
            if ($response->successful()) {
                $config->bot_name = $response['result']['first_name'];
            }
        }

        $config->chat_id = $request->chat_id;
        $config->topic_id = $request->topic_id;
        $config->is_active = $request->boolean('is_active');
        $config->save();

        return response()->json(['message' => 'Telegram settings saved', 'bot_name' => $config->bot_name]);
    }

    // 3. Test Connection (Real-time check)
    public function testConnection(Request $request)
    {
        $request->validate([
            'bot_token' => 'nullable|string', // Optional if using saved one
            'chat_id' => 'required|string',
            'topic_id' => 'nullable|string',
        ]);

        $team = Auth::user()->team;
        
        // Use provided token OR fallback to saved token
        $token = $request->bot_token;
        if (!$token) {
            $config = TelegramConfig::where('team_id', $team->id)->first();
            $token = $config ? $config->bot_token : null;
        }

        if (!$token) {
            return response()->json(['message' => 'No Bot Token provided'], 422);
        }

        // Send Test Message
        $url = "https://api.telegram.org/bot{$token}/sendMessage";
        
        $payload = [
            'chat_id' => $request->chat_id,
            'text' => "✅ Connection Successful!\nYour Report Maker Dashboard is now connected to this chat.",
        ];

        if ($request->topic_id) {
            $payload['message_thread_id'] = $request->topic_id;
        }

        $response = Http::post($url, $payload);

        if ($response->successful()) {
            return response()->json(['message' => 'Test message sent! Check your Telegram group.']);
        } else {
            return response()->json([
                'message' => 'Connection Failed',
                'error' => $response->json()['description'] ?? 'Unknown error'
            ], 400);
        }
    }
}