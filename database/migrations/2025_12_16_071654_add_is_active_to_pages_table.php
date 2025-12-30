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
    Schema::table('pages', function (Blueprint $table) {
        if (!Schema::hasColumn('pages', 'is_active')) {
            // Default to 1 (Active) so existing pages don't disappear
            $table->boolean('is_active')->default(true)->after('is_favorite');
        }
    });
}

public function down()
{
    Schema::table('pages', function (Blueprint $table) {
        $table->dropColumn('is_active');
    });
}
};
