<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Location data is now denormalised onto the events table.
     * Drop the legacy location_id FK from events and the locations table.
     */
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('location_id');
        });

        Schema::dropIfExists('locations');
    }

    public function down(): void
    {
        Schema::create('locations', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->string('address')->nullable();
            $table->timestamps();
        });

        Schema::table('events', function (Blueprint $table): void {
            $table->foreignId('location_id')->nullable()->constrained()->nullOnDelete();
        });
    }
};
