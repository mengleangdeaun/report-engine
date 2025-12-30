<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('telegram_configs', function (Blueprint $table) {
            $table->id();
            // Link to the Workspace/Team
            $table->foreignId('team_id')->constrained()->onDelete('cascade');
            
            // The Secret Token (We will encrypt this)
            $table->text('bot_token')->nullable();
            $table->string('bot_name')->nullable(); // e.g., "My Report Bot"
            
            // The Destination
            $table->string('chat_id')->nullable(); // e.g., "-100123456"
            $table->string('topic_id')->nullable(); // Optional for Forum Groups
            
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('telegram_configs');
    }
};