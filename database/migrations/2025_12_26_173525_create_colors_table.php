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
    Schema::create('colors', function (Blueprint $table) {
        $table->id();
        $table->string('name'); // e.g., "SaaS Pro Purple"
        $table->string('hex_code'); // e.g., "#8b5cf6"
        $table->string('text_class')->nullable(); // Optional: Tailwind text color
        $table->string('bg_class')->nullable();   // Optional: Tailwind bg color
        $table->boolean('is_active')->default(true);
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('colors');
    }
};
