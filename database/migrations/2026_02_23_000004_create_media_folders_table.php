<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('media_folders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained('teams')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->unsignedBigInteger('parent_id')->nullable(); // self-referencing for sub-folders
            $table->string('name');
            $table->string('color')->nullable()->default('#6366f1'); // folder color accent
            $table->timestamps();

            $table->foreign('parent_id')->references('id')->on('media_folders')->onDelete('cascade');
            $table->index(['team_id', 'parent_id']);
            $table->unique(['team_id', 'parent_id', 'name']); // no duplicate names in same parent
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media_folders');
    }
};
