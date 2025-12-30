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
    Schema::create('favorites', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->onDelete('cascade');
        $table->foreignId('page_id')->constrained()->onDelete('cascade');
        $table->timestamps();

        // Prevent duplicate favorites
        $table->unique(['user_id', 'page_id']);
    });

    // OPTIONAL: Drop the old column from pages table
    // Schema::table('pages', function (Blueprint $table) {
    //     $table->dropColumn('is_favorite');
    // });
}
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('favorites');
    }
};
