<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Just create the 'pages' table. Do NOT touch 'reports' here.
        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('platform');
            $table->timestamps();

            $table->unique(['user_id', 'name', 'platform']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pages');
    }
};