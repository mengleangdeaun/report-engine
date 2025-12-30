<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('page_share_tokens', function (Blueprint $table) {
            // Remove redundant high-precision and metadata columns
            // These are now handled by the page_share_logs table
            $table->dropColumn([
                'lat', 
                'lng', 
                'last_device'
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('page_share_tokens', function (Blueprint $table) {
            // Restore columns if we ever need to roll back
            $table->decimal('lat', 10, 8)->nullable();
            $table->decimal('lng', 11, 8)->nullable();
            $table->string('last_device')->nullable();
        });
    }
};
