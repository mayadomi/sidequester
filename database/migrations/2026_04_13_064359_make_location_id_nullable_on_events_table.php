<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Location is now stored as denormalised columns on the events table.
     * Make the legacy location_id FK nullable so events can be created without it.
     */
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table): void {
            $table->foreignId('location_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table): void {
            $table->foreignId('location_id')->nullable(false)->change();
        });
    }
};
