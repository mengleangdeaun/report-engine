<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use App\Models\TopUpRequest;

class TopUpStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $topUpRequest;
    public $status; // 'approved' or 'rejected'
    public $approvedAmount;

    public function __construct(TopUpRequest $topUpRequest, $status, $approvedAmount = null)
    {
        $this->topUpRequest = $topUpRequest;
        $this->status = $status;
        $this->approvedAmount = $approvedAmount ?? $topUpRequest->amount;
    }

    public function via($notifiable)
    {
        return ['database', 'broadcast', \App\Channels\TelegramUserChannel::class];
    }

    public function toDatabase($notifiable)
    {
        $message = $this->status === 'approved'
            ? "Your top-up request for {$this->topUpRequest->amount} credits has been approved. You received {$this->approvedAmount} credits."
            : "Your top-up request for {$this->topUpRequest->amount} credits has been rejected.";

        return [
            'action' => 'Top Up ' . ucfirst($this->status),
            'description' => $message,
            'user_name' => 'System', // Sender is System
            'amount' => $this->approvedAmount,
            'request_id' => $this->topUpRequest->id,
            'status' => $this->status,
            // No avatar for system, or use a system logo path if available
            'user_avatar' => ''
        ];
    }

    public function toBroadcast($notifiable)
    {
        $message = $this->status === 'approved'
            ? "Your top-up request for {$this->topUpRequest->amount} credits has been approved. You received {$this->approvedAmount} credits."
            : "Your top-up request for {$this->topUpRequest->amount} credits has been rejected.";

        return new BroadcastMessage([
            'title' => 'Top Up ' . ucfirst($this->status),
            'message' => $message,
            'status' => $this->status,
            'amount' => $this->approvedAmount,
            'action' => 'Top Up ' . ucfirst($this->status),
            'user_name' => 'System',
            'description' => $message
        ]);
    }

    public function toTelegram($notifiable)
    {
        $emoji = $this->status === 'approved' ? '✅' : '❌';
        $statusUpper = ucfirst($this->status);

        $message = "{$emoji} <b>Top Up Request {$statusUpper}</b>\n\n";

        if ($this->status === 'approved') {
            $message .= "Your request for <b>{$this->topUpRequest->amount}</b> credits has been approved.\n";
            $message .= "You have received <b>{$this->approvedAmount}</b> credits.";
        } else {
            $message .= "Your request for <b>{$this->topUpRequest->amount}</b> credits has been rejected.";
        }

        return $message;
    }
}
