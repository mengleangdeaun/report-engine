<?php

use App\Http\Controllers\AppController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController; // <--- Import your controller
use App\Http\Controllers\VerificationController;
use Illuminate\Notifications\Messages\MailMessage;
/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/email/verify/{id}/{hash}', [VerificationController::class, 'verify'])
    ->middleware(['signed', 'throttle:6,1'])
    ->name('verification.verify');

Route::get('/test-notify/{id}', function ($id) {
    try {
        $user = \App\Models\User::find($id);
        if (!$user)
            return "User $id not found";

        $req = \App\Models\TopUpRequest::with('user')->first();
        if (!$req) {
            // Create a dummy structure if no actual request exists
            $req = new \stdClass();
            $req->id = 999;
            $req->amount = 500;
            $req->user = $user;
        }

        $user->notify(new \App\Notifications\AdminTopUpAlert($req));
        return "Notification sent to {$user->name} (ID: $id)";
    } catch (\Exception $e) {
        return "Error: " . $e->getMessage();
    }
});

Route::get('/{any}', [AppController::class, 'index'])->where('any', '.*');

Route::get('/auth/reset-password/{token}', function () {
    return view('app'); // Change 'app' to whatever your main blade file is named
})->name('password.reset');
/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// 1. PUBLIC ROUTES (Login, Register, Google)
Route::post('/register', [AuthController::class, 'register']); // <--- YOU WERE MISSING THIS
Route::post('/login', [AuthController::class, 'login']);       // <--- AND THIS

Route::get('/auth/google/url', [AuthController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback']);

// 2. PROTECTED ROUTES (Require Login)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/logout', [AuthController::class, 'logout']);
});
;
