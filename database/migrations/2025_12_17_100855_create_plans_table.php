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
    Schema::create('plans', function (Blueprint $table) {
        $table->id();
        $table->string('name'); // e.g., "Pro Business"
        $table->string('slug')->unique(); // e.g., "pro" (for code references)
        $table->decimal('price', 8, 2)->default(0);
        
        // Limits & Quotas
        $table->integer('member_limit')->default(1);
        $table->integer('max_tokens')->default(0);
        
        // Features (Store as JSON array)
        $table->json('features')->nullable(); // e.g. ["facebook", "tiktok"]
        
        $table->boolean('is_active')->default(true);
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
