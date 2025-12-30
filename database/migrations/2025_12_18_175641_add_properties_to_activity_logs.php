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
    Schema::table('activity_logs', function (Blueprint $table) {
        // Add JSON column to store detailed changes
        $table->json('properties')->nullable()->after('description');
    });
}

public function down()
{
    Schema::table('activity_logs', function (Blueprint $table) {
        $table->dropColumn('properties');
    });
}
};
