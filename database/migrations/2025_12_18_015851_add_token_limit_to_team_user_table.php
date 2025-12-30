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
    Schema::table('team_user', function (Blueprint $table) {
        // Null = Unlimited, Number = Limit
        $table->integer('token_limit')->nullable()->default(null)->after('role');
    });
}

public function down()
{
    Schema::table('team_user', function (Blueprint $table) {
        $table->dropColumn('token_limit');
    });
}
};
