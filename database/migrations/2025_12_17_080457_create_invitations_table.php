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
    Schema::create('invitations', function (Blueprint $table) {
        $table->id();
        $table->string('email');
        $table->string('token', 32)->unique();
        
        // ✅ SaaS Link: Which team are they being invited to?
        $table->foreignId('team_id')->constrained()->onDelete('cascade');
        
        // Role inside the team (e.g., 'editor', 'viewer')
        $table->string('role')->default('member'); 
        
        // Who sent the invite?
        $table->foreignId('invited_by')->constrained('users');
        
        $table->timestamp('expires_at');
        $table->timestamps();

        // Prevent sending duplicate invites to the same email for the same team
        $table->unique(['email', 'team_id']);
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invitations');
    }
};
