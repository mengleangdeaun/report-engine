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
        // 1. Check for Avatar
        if (!Schema::hasColumn('pages', 'avatar')) {
            $table->string('avatar')->nullable()->after('name');
        }

        // 2. Check for Username
        if (!Schema::hasColumn('pages', 'username')) {
            $table->string('username')->nullable()->after('name'); // Just place after name to be safe
        }

        // 3. Check for Platform ID
        if (!Schema::hasColumn('pages', 'platform_id')) {
            $table->string('platform_id')->nullable()->after('platform');
        }

        // 4. Check for Notes (FIXED: Uses 'updated_at' anchor)
        if (!Schema::hasColumn('pages', 'notes')) {
            // We use 'updated_at' because 'last_updated' likely doesn't exist in the DB schema
            if (Schema::hasColumn('pages', 'updated_at')) {
                $table->text('notes')->nullable()->after('updated_at');
            } else {
                $table->text('notes')->nullable(); // Fallback: add at end
            }
        }

        // 5. Check for Favorite
        if (!Schema::hasColumn('pages', 'is_favorite')) {
            $table->boolean('is_favorite')->default(false)->after('platform'); 
        }
    });
}

public function down()
{
    Schema::table('pages', function (Blueprint $table) {
        $table->dropColumn(['avatar', 'username', 'platform_id', 'notes', 'is_favorite']);
    });
}
};
