<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            // 0 = unlimited (Super Admin), otherwise MB limit
            $table->unsignedInteger('storage_limit_mb')->default(512)->after('max_workspaces');
        });
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn('storage_limit_mb');
        });
    }
};
