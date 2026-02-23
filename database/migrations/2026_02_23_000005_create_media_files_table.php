<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('media_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained('teams')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('folder_id')->nullable()->constrained('media_folders')->onDelete('set null');
            $table->string('name');               // original filename shown in UI
            $table->string('disk_name');          // stored filename (uuid.ext)
            $table->string('path');               // storage path
            $table->string('mime_type');          // e.g. image/png
            $table->string('extension', 20);      // e.g. pdf, png
            $table->string('file_type', 20);      // photo | video | document | audio | other
            $table->unsignedBigInteger('size_bytes')->default(0);
            $table->timestamps();

            $table->index(['team_id', 'folder_id']);
            $table->index(['team_id', 'file_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media_files');
    }
};
