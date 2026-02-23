<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('qr_code_scans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('qr_code_id')->constrained('qr_codes')->onDelete('cascade');
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('referer')->nullable();
            $table->string('country', 100)->nullable();
            $table->string('city', 100)->nullable();
            $table->string('device_type', 50)->nullable(); // mobile, desktop, tablet
            $table->timestamp('scanned_at');

            $table->index('qr_code_id');
            $table->index('scanned_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qr_code_scans');
    }
};
