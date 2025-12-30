<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('colors', function (Blueprint $table) {
            // Dark Mode Support
            $table->string('hex_dark')->nullable()->after('hex_code'); 
            
            // Gradient Logic
            $table->boolean('is_gradient')->default(false)->after('hex_dark');
            $table->string('hex_start')->nullable()->after('is_gradient');
            $table->string('hex_end')->nullable()->after('hex_start');
            
            // Automation: Default Icon Mapping
            $table->text('default_icon_svg')->nullable()->after('hex_end');
        });
    }

    public function down(): void
    {
        Schema::table('colors', function (Blueprint $table) {
            $table->dropColumn([
                'hex_dark', 
                'is_gradient', 
                'hex_start', 
                'hex_end', 
                'default_icon_svg'
            ]);
        });
    }
};