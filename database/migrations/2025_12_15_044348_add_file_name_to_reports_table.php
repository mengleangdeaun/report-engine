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
    Schema::table('reports', function (Blueprint $table) {
        // Add file_name column (nullable in case you have existing rows)
        $table->string('file_name')->nullable()->after('platform');
    });
}

public function down(): void
{
    Schema::table('reports', function (Blueprint $table) {
        $table->dropColumn('file_name');
    });
}
};
