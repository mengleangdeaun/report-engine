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
    Schema::create('activity_logs', function (Blueprint $table) {
        $table->id();
        $table->foreignId('team_id')->constrained()->onDelete('cascade'); // Scope to Workspace
        $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Who did it?
        $table->string('action'); // e.g. "Deleted Page"
        $table->text('description')->nullable(); // e.g. "Deleted 'Nike' profile"
        $table->string('ip_address')->nullable(); // Security: Track IP
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
