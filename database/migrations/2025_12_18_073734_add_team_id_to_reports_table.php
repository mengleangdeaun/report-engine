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
        // Add team_id after user_id
        $table->foreignId('team_id')->nullable()->after('user_id')->constrained()->onDelete('cascade');
    });
}

public function down()
{
    Schema::table('reports', function (Blueprint $table) {
        $table->dropForeign(['team_id']);
        $table->dropColumn('team_id');
    });
}
};
