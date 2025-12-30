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
    Schema::table('reports', function (Blueprint $table) {
        // Add link clicks after the existing social metrics
        $table->unsignedBigInteger('total_link_clicks')->default(0)->after('total_shares');
    });
}

public function down()
{
    Schema::table('reports', function (Blueprint $table) {
        $table->dropColumn('total_link_clicks');
    });
}
};
