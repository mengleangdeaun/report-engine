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
        // -1 or NULL could mean "Unlimited" (access to full team wallet)
        $table->integer('token_limit')->nullable()->default(null)->comment('Max tokens user can spend'); 
        
        // Track how much they used so far
        $table->integer('tokens_used')->default(0)->comment('Tokens spent by user this period');
    });
}

public function down()
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropColumn(['token_limit', 'tokens_used']);
    });
}
};
