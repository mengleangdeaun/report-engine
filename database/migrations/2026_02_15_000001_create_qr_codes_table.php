<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('qr_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->unsignedBigInteger('team_id')->nullable();
            $table->string('name');
            $table->string('type')->default('url'); // url, text, wifi, email, phone, sms
            $table->text('content'); // The encoded value
            $table->json('settings')->nullable(); // colors, patterns, logo, size, label
            $table->string('short_code', 10)->unique();
            $table->unsignedBigInteger('total_scans')->default(0);
            $table->timestamps();

            $table->index(['user_id', 'team_id']);
            $table->index('short_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qr_codes');
    }
};
