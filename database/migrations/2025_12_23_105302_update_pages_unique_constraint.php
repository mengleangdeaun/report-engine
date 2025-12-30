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
        // 1. Drop the Foreign Key first to unlock the index
        $table->dropForeign(['user_id']); 

        // 2. Now we can drop the old unique index safely
        $table->dropUnique(['user_id', 'name', 'platform']);

        // 3. Add the new Team-based unique index
        $table->unique(['team_id', 'user_id', 'name', 'platform'], 'pages_team_user_name_platform_unique');

        // 4. Restore the Foreign Key relationship
        $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
    });
}

public function down()
{
    Schema::table('pages', function (Blueprint $table) {
        $table->dropForeign(['user_id']);
        $table->dropUnique('pages_team_user_name_platform_unique');
        $table->unique(['user_id', 'name', 'platform']);
        $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
    });
}
};
