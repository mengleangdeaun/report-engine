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
    Schema::table('users', function (Blueprint $table) {
        // ONLY add google_id if it is missing
        if (!Schema::hasColumn('users', 'google_id')) {
            $table->string('google_id')->nullable()->after('email');
        }

        // ONLY add token_balance if it is missing
        if (!Schema::hasColumn('users', 'token_balance')) {
            $table->integer('token_balance')->default(0)->after('email');
        }
    });
}

public function down()
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropColumn(['google_id', 'token_balance']);
    });
}
};
