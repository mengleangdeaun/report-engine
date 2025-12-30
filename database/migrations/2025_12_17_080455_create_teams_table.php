<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
{
    Schema::create('teams', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Owner
        
        // ✅ PLAN & SUBSCRIPTION FIELDS
        $table->string('plan_type')->default('free'); // 'free', 'pro', 'enterprise'
        $table->timestamp('subscription_expires_at')->nullable(); // Null = Forever/Free, or Date = Expiry
        
        // ✅ LIMITS
        $table->integer('member_limit')->default(1); // Start small for free
        $table->integer('max_tokens')->default(10); // Monthly allowance
        
        $table->timestamps();
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teams');
    }
};
