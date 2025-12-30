<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Upgrade Roles Table
        Schema::table('roles', function (Blueprint $table) {
            if (!Schema::hasColumn('roles', 'team_id')) {
                $table->unsignedBigInteger('team_id')->nullable()->after('id');
                $table->index('team_id');
                
                // Remove the old global unique constraint
                $table->dropUnique('roles_name_guard_name_unique');
                // Add new unique constraint scoped to each team
                $table->unique(['team_id', 'name', 'guard_name']);
            }
        });

        // 2. Upgrade Model Has Roles Table (The error fix)
        Schema::table('model_has_roles', function (Blueprint $table) {
            if (!Schema::hasColumn('model_has_roles', 'team_id')) {
                // A. Drop the foreign key first so we can modify the primary key
                $table->dropForeign('model_has_roles_role_id_foreign');

                // B. Drop the current primary key
                $table->dropPrimary();

                // C. Add the team_id column
                $table->unsignedBigInteger('team_id')->nullable()->after('role_id');
                $table->index('team_id');

                // D. Re-create the Primary Key including team_id
                $table->primary(['team_id', 'role_id', 'model_id', 'model_type'], 'model_has_roles_team_primary');

                // E. Re-create the foreign key constraint
                $table->foreign('role_id')->references('id')->on('roles')->onDelete('cascade');
            }
        });

        // 3. Standardize Permission Names to match your 'plans' features
        $mappings = [
            'generate facebook report' => 'report_facebook_basic',
            'generate tiktok report'   => 'report_tiktok_basic',
            'view facebook insights'   => 'report_facebook_pro',
            'view tiktok insights'     => 'report_tiktok_pro',
            'export pdf'               => 'report_export_pdf',
            'share public link'        => 'share_report_link',
            'connect telegram bot'     => 'bot_telegram',
            'manage users'             => 'team_manage_members',
            'manage roles'             => 'team_manage_roles',
        ];

        foreach ($mappings as $old => $new) {
            DB::table('permissions')->where('name', $old)->update(['name' => $new]);
        }
    }

    public function down(): void
    {
        // Reversal logic is complex for this type of upgrade; usually requires a full rollback.
    }
};