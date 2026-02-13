<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{
    AdminController, AuthController, VerificationController, ReportController,
    PageController, TeamController, InvitationController, SubscriptionController,
    PlanController, RoleController, UserController, ProfileController,
    NotificationController, TelegramSettingsController, DashboardController, PublicReportController,
    ColorController

};

/*
|--------------------------------------------------------------------------
| 1. PUBLIC ROUTES
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register']);
// ->middleware('throttle:5,1');

Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/plans', [PlanController::class, 'index']);
Route::get('/auth/google/redirect', [AuthController::class, 'redirectToGoogle']);
Route::get('/auth/google', [AuthController::class, 'redirectToGoogle']);
// ->middleware('throttle:10,60');

Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback']);
Route::get('/public/reports/{uuid}', [ReportController::class, 'getPublicReport']);
Route::get('/public/share/{token}', [PublicReportController::class, 'getPublicPageHistory']);
Route::post('/public/share/{token}/exact-location', [PublicReportController::class, 'updateExactLocation']);
Route::get('api/email/verify/{id}/{hash}', [VerificationController::class, 'verify'])
->name('verification.verify'); 



/*
|--------------------------------------------------------------------------
| 2. PROTECTED BASE ROUTES (Login Required Only)
|--------------------------------------------------------------------------
*/
// Route::middleware('auth:sanctum')->get('/me', [AuthController::class, 'me']);
Route::middleware('auth:sanctum')->group(function () {
    
    
    // User Profile & Basics
    Route::get('/user', [AuthController::class, 'me']); // Simplified logic should be in Controller
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/user/profile', [ProfileController::class, 'update']);
    Route::put('/user/password', [ProfileController::class, 'updatePassword']);
    Route::post('/user/delete', [ProfileController::class, 'destroy']);
    
    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/clear', [NotificationController::class, 'clearAll']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    // Workspace & Activity
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/activity-logs', [App\Http\Controllers\ActivityLogController::class, 'index']);
    Route::get('/team/my-team', [TeamController::class, 'myTeam']);
    Route::post('/team/store', [TeamController::class, 'store']); //
    Route::get('/team/all', [TeamController::class, 'listAllWorkspaces']);
    Route::post('/team/switch', [TeamController::class, 'switchWorkspace']);
    Route::put('/team/name', [TeamController::class, 'updateName']);
    Route::get('/team/role-templates', [TeamController::class, 'getRoleTemplates']);

    Route::post('/email/verification-notification', [VerificationController::class, 'resend']);
    // ->middleware('throttle:3,60');
});

/*
|--------------------------------------------------------------------------
| 3. FEATURE PROTECTED ROUTES (Requires Plan & Role)
|--------------------------------------------------------------------------
*/


Route::middleware(['auth:sanctum'])->group(function () {

    // --- REPORTING ---
    // Basic Report Generation (Gates by either FB or TT permissions)
    Route::post('/generate-report', [ReportController::class, 'generate']); 
    Route::get('/reports/history', [ReportController::class, 'history']);
    Route::get('/reports/export', [ReportController::class, 'exportCsv'])->name('reports.export');
    Route::get('/reports/top-performers', [ReportController::class, 'getTopPerformers']);
    Route::post('/pages/{page}/share-all', [ReportController::class, 'shareWholePage']);
    Route::post('/pages/{page}/regenerate-share', [ReportController::class, 'regenerateShareToken']);
    Route::get('/pages/{page}/share-status', [ReportController::class, 'getShareStatus']);
    Route::post('/pages/{page}/reset-share-history', [ReportController::class, 'resetShareHistory']);
    Route::post('/pages/{page}/toggle-share', [ReportController::class, 'togglePageShare']);
    Route::delete('/reports/{id}', [ReportController::class, 'destroy']);

    // Exporting (Requires PDF permission in Plan)
    Route::get('/reports/{id}/export', [ReportController::class, 'export'])
        ->middleware('plan.check:report_export_pdf');

    // Sharing (Requires Share Link permission in Plan)
    Route::post('/reports/{id}/share', [ReportController::class, 'generateShareLink'])
        ->middleware('plan.check:share_report_link');

    // --- PAGE MANAGEMENT ---
    Route::get('/pages/overview', [PageController::class, 'index']);
    Route::get('/user/page-names', [PageController::class, 'listNames']);
    Route::get('/pages/sync', [PageController::class, 'syncPages']);
    Route::post('/pages/{id}/favorite', [PageController::class, 'toggleFavorite']);
    
    // Modifying Pages (Requires edit permission)
    Route::put('/pages/{id}', [PageController::class, 'update']);// You can add 'page_edit' to your migration if not there
    Route::post('/pages/{id}/active', [PageController::class, 'toggleActive']);
    Route::post('/pages/delete', [PageController::class, 'destroy']);

    // --- TELEGRAM BOT (BYOB) ---
    // Protected by 'bot_telegram' plan feature
    Route::prefix('settings/telegram')->middleware('plan.check:bot_telegram')->group(function () {
        Route::get('/', [TelegramSettingsController::class, 'show']);
        Route::post('/', [TelegramSettingsController::class, 'update']);
        Route::post('/test', [TelegramSettingsController::class, 'testConnection']);
    });





    Route::prefix('team')->group(function () {
        Route::delete('/member/{id}', [TeamController::class, 'removeMember']);
        Route::put('/member/{id}/permissions', [TeamController::class, 'updatePermissions']);
        Route::put('/member/{id}/limit', [TeamController::class, 'updateLimit']);
        
        // ✅ Move these here
        Route::put('/member/{id}/role', [TeamController::class, 'updateMemberRole']); 
        Route::post('/invitations', [InvitationController::class, 'store']);
        Route::get('/invitations', [InvitationController::class, 'index']);
        Route::delete('/invitations/{id}', [InvitationController::class, 'destroy']);
    });

    Route::prefix('roles')->group(function () {
        Route::get('/', [RoleController::class, 'index']);
        Route::post('/', [RoleController::class, 'store']);
        Route::put('/{id}', [RoleController::class, 'update']);
        Route::delete('/{id}', [RoleController::class, 'destroy']);
        Route::post('/sync-plan', [RoleController::class, 'syncRolesToPlan']);
    });
});

/*
|--------------------------------------------------------------------------
| 4. SUPER ADMIN ROUTES (SaaS Owner Only)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'superadmin'])->prefix('admin')->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard']);
    Route::get('/teams', [SubscriptionController::class, 'index']);
    Route::put('/teams/{id}/plan', [SubscriptionController::class, 'updatePlan']);
    
    Route::get('/permissions/available', [PlanController::class, 'getAvailableFeatures']);
    Route::get('/permissions', [App\Http\Controllers\Admin\PermissionController::class, 'index']);
    Route::put('/permissions/{id}', [App\Http\Controllers\Admin\PermissionController::class, 'update']);
    Route::delete('/permissions/{id}', [App\Http\Controllers\Admin\PermissionController::class, 'destroy']);
    Route::post('/permissions/{id}/toggle', [App\Http\Controllers\Admin\PermissionController::class, 'toggleStatus']);

    // Plan Management
    Route::get('/plans', [PlanController::class, 'index']);
    Route::post('/plans', [PlanController::class, 'store']);
    Route::put('/plans/{id}', [PlanController::class, 'update']);
    Route::delete('/plans/{id}', [PlanController::class, 'destroy']);


    Route::get('/colors', [ColorController::class, 'index']);
    Route::post('/colors', [ColorController::class, 'store']);
    Route::put('/colors/{id}', [ColorController::class, 'update']);
    Route::delete('/colors/{id}', [ColorController::class, 'destroy']);

    // System User Management
    Route::get('/users', [UserController::class, 'index']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::put('/users/{id}/permissions', [UserController::class, 'updatePermissions']);
    Route::delete('/users/{id}', [AdminController::class, 'destroy']);
    Route::get('/users/{id}/details', [UserController::class, 'getUserDetails']);
    Route::post('/users/{id}/tokens', [UserController::class, 'adjustTokens']);
});