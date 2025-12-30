<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Drop the Foreign Keys using raw SQL to avoid "key not found" crashes
        $this->dropForeignKeyIfExists('pages', 'pages_user_id_foreign');
        $this->dropForeignKeyIfExists('pages', 'pages_team_id_foreign');

        Schema::table('pages', function (Blueprint $table) {
            // 2. Drop the old Unique Index
            // We use a try-catch here because Laravel's Blueprint doesn't check if it exists
            try {
                $table->dropUnique('pages_team_user_name_platform_unique');
            } catch (\Exception $e) {
                // If the index was already dropped in a previous attempt, ignore the error
            }

            // 3. Create the NEW Sharable Index
            // This is the key change: Removing 'user_id' allows the team to share the page.
            $table->unique(['team_id', 'name', 'platform'], 'pages_team_share_unique');

            // 4. Restore the Foreign Keys
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('team_id')->references('id')->on('teams')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pages', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['team_id']);
            $table->dropUnique('pages_team_share_unique');
            
            // Revert back to the user-specific unique index
            $table->unique(['team_id', 'user_id', 'name', 'platform'], 'pages_team_user_name_platform_unique');
            
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('team_id')->references('id')->on('teams')->onDelete('cascade');
        });
    }

    /**
     * Helper to drop a foreign key safely
     */
    private function dropForeignKeyIfExists(string $table, string $key): void
    {
        $exists = DB::select("
            SELECT CONSTRAINT_NAME 
            FROM information_schema.TABLE_CONSTRAINTS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = '{$table}' 
            AND CONSTRAINT_NAME = '{$key}'
        ");

        if (!empty($exists)) {
            DB::statement("ALTER TABLE {$table} DROP FOREIGN KEY {$key}");
        }
    }
};