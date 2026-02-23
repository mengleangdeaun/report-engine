<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. Create the ad_accounts table (mirrors the pages table pattern)
        Schema::create('ad_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained('teams')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // creator
            $table->string('name');           // Ad Account / Campaign group name
            $table->string('platform')->default('facebook_ads');
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            // Same workspace cannot have two accounts with the same name
            $table->unique(['team_id', 'name']);
            $table->index(['team_id', 'is_active']);
        });

        // 2. Add ad_account_id FK to facebook_ad_reports
        //    Keep account_name as a denormalized cache column for quick display
        Schema::table('facebook_ad_reports', function (Blueprint $table) {
            $table->foreignId('ad_account_id')
                ->nullable()
                ->after('team_id')
                ->constrained('ad_accounts')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('facebook_ad_reports', function (Blueprint $table) {
            $table->dropForeign(['ad_account_id']);
            $table->dropColumn('ad_account_id');
        });

        Schema::dropIfExists('ad_accounts');
    }
};
