<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
public function up(): void
{
    Schema::table('page_share_tokens', function (Blueprint $table) {
        $table->unsignedInteger('view_count')->default(0)->after('last_accessed_at');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('page_share_tokens', function (Blueprint $table) {
            //
        });
    }
};
