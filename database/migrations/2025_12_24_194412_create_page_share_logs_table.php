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
    Schema::create('page_share_logs', function (Blueprint $table) {
        $table->id();
        // Change this line to include onDelete('cascade')
        $table->foreignId('page_share_token_id')
              ->constrained('page_share_tokens')
              ->onDelete('cascade'); 
        
        $table->string('ip_address')->nullable();
        $table->string('location')->nullable();
        $table->string('device')->nullable();
        
        // High-precision coordinates
        $table->decimal('lat', 11, 8)->nullable();
        $table->decimal('lng', 11, 8)->nullable();
        
        $table->timestamp('accessed_at')->nullable();
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('page_share_logs');
    }
};
