<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('facebook_ad_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('team_id')->constrained('teams')->onDelete('cascade');

            // Identity
            $table->string('account_name');          // Ad Account / Campaign group name
            $table->string('file_name');              // Original uploaded filename

            // Period
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();

            // KPI Summary (indexed for fast history queries)
            $table->decimal('total_spend', 12, 2)->default(0);
            $table->bigInteger('total_impressions')->default(0);
            $table->bigInteger('total_reach')->default(0);
            $table->bigInteger('total_clicks')->default(0);
            $table->bigInteger('total_conversions')->default(0);
            $table->decimal('avg_ctr', 8, 4)->default(0);     // %
            $table->decimal('avg_cpc', 8, 4)->default(0);     // currency
            $table->decimal('avg_cpm', 8, 4)->default(0);     // currency per 1k
            $table->decimal('total_roas', 8, 4)->default(0);  // return on ad spend

            // Full parsed breakdown for charts & tables
            $table->json('report_data')->nullable();

            // Future sharing
            $table->string('public_uuid')->unique()->nullable();

            $table->timestamps();

            // Indexes for history queries
            $table->index(['team_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('facebook_ad_reports');
    }
};
