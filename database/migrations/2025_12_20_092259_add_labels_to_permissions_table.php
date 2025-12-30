<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
public function up()
{
    Schema::table('permissions', function (Blueprint $table) {
        $table->string('label')->nullable()->after('name');
        $table->string('module')->nullable()->after('label'); // e.g., 'Reporting', 'Automation'
    });

    // Populate existing permissions with clean labels
    $data = [
        'report_facebook_basic' => ['Facebook Reports (Basic)', 'Reporting'],
        'report_facebook_pro'   => ['Facebook Insights (Pro)', 'Reporting'],
        'report_tiktok_basic'   => ['TikTok Reports (Basic)', 'Reporting'],
        'report_tiktok_pro'     => ['TikTok Insights (Pro)', 'Reporting'],
        'report_export_pdf'     => ['Export PDF', 'Reporting'],
        'share_report_link'     => ['Share Public Link', 'Reporting'],
        'bot_telegram'          => ['Telegram BYOB Integration', 'Automation'],
        'team_manage_members'   => ['Manage Team Members', 'Workspace'],
        'team_manage_roles'     => ['Manage Custom Roles', 'Workspace'],
    ];

    foreach ($data as $name => $info) {
        DB::table('permissions')->where('name', $name)->update([
            'label' => $info[0],
            'module' => $info[1]
        ]);
    }
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('permissions', function (Blueprint $table) {
            //
        });
    }
};
