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
    Schema::create('reports', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->onDelete('cascade');
        $table->foreignId('page_id')->constrained('pages')->onDelete('cascade');
        $table->string('platform'); // 'tiktok' or 'facebook'
        $table->date('start_date')->nullable();
        $table->date('end_date')->nullable();
        
        // Metrics
        $table->bigInteger('total_views')->default(0);
        $table->bigInteger('total_likes')->default(0);
        $table->bigInteger('total_comments')->default(0);
        $table->bigInteger('total_shares')->default(0);
        $table->bigInteger('total_saves')->default(0); // or reach
        $table->decimal('engagement_rate', 5, 2)->default(0);

        // JSON Data for charts/top performers
        $table->json('top_performers')->nullable();
        
        $table->string('public_uuid')->unique(); // For sharing
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
