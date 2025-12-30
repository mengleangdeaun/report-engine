<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
public function up(): void
{
    Schema::table('plans', function (Blueprint $table) {
        $table->text('description')->nullable()->after('features');
        $table->string('badge_label')->nullable()->after('description');
        $table->integer('color_id')->default(1)->after('badge_label');
        $table->longText('icon_svg')->nullable()->after('color_id');
        $table->boolean('is_popular')->default(false)->after('is_active');
    });
}

public function down(): void
{
    Schema::table('plans', function (Blueprint $table) {
        $table->dropColumn(['description', 'badge_label', 'color_id', 'icon_svg', 'is_popular']);
    });
}
};
