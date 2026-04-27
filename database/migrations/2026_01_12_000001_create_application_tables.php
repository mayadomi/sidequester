<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Enable PostGIS for spatial queries (PostgreSQL only)
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('CREATE EXTENSION IF NOT EXISTS postgis');
        }

        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->timestamps();
        });

        Schema::create('sponsors', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('website')->nullable();
            $table->timestamps();
        });

        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->dateTime('start_datetime');
            $table->dateTime('end_datetime');
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sponsor_id')->nullable()->constrained()->nullOnDelete();
            $table->text('location_name')->nullable();
            $table->text('location_address')->nullable();
            $table->decimal('location_lat', 10, 7)->nullable();
            $table->decimal('location_lng', 10, 7)->nullable();
            $table->decimal('ride_distance_km', 5, 2)->nullable();
            $table->integer('elevation_gain_m')->nullable();
            $table->string('pace')->nullable();
            $table->string('route_url')->nullable();
            $table->text('url')->nullable();
            $table->decimal('min_cost', 8, 2)->nullable();
            $table->decimal('max_cost', 8, 2)->nullable();
            $table->boolean('is_race_stage')->default(false);
            $table->boolean('is_recurring')->default(false);
            $table->boolean('is_womens')->default(false);
            $table->boolean('is_free')->default(true);
            $table->timestamps();

            $table->index('start_datetime');
            $table->index('end_datetime');
            $table->index('is_race_stage');
            $table->index('is_recurring');
            $table->index('is_womens');
            $table->index('is_free');
            $table->index('min_cost');
            $table->index('max_cost');
        });

        // PostgreSQL spatial columns on events
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE events ADD COLUMN route_geometry geometry(LineString, 4326)');
            DB::statement('CREATE INDEX events_route_geometry_idx ON events USING GIST (route_geometry)');
            DB::statement('ALTER TABLE events ADD COLUMN location_geometry geometry(Point, 4326)');
            DB::statement('CREATE INDEX events_location_geometry_idx ON events USING GIST (location_geometry)');
        }

        Schema::create('favourites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'event_id']);
        });

        Schema::create('tags', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->timestamps();
        });

        Schema::create('event_tag', function (Blueprint $table) {
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
            $table->primary(['event_id', 'tag_id']);
        });

        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->morphs('model');
            $table->uuid()->nullable()->unique();
            $table->string('collection_name');
            $table->string('name');
            $table->string('file_name');
            $table->string('mime_type')->nullable();
            $table->string('disk');
            $table->string('conversions_disk')->nullable();
            $table->unsignedBigInteger('size');
            $table->json('manipulations');
            $table->json('custom_properties');
            $table->json('generated_conversions');
            $table->json('responsive_images');
            $table->unsignedInteger('order_column')->nullable()->index();
            $table->nullableTimestamps();
        });

        Schema::create('sponsor_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sponsor_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status')->default('pending');
            $table->string('request_type');
            $table->text('editor_note')->nullable();
            $table->text('admin_note')->nullable();
            $table->string('proposed_sponsor_name')->nullable();
            $table->string('proposed_sponsor_website')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->foreignId('verified_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('status');
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sponsor_user');
        Schema::dropIfExists('media');
        Schema::dropIfExists('event_tag');
        Schema::dropIfExists('tags');
        Schema::dropIfExists('favourites');

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS events_location_geometry_idx');
            DB::statement('DROP INDEX IF EXISTS events_route_geometry_idx');
            DB::statement('ALTER TABLE events DROP COLUMN IF EXISTS location_geometry');
            DB::statement('ALTER TABLE events DROP COLUMN IF EXISTS route_geometry');
        }

        Schema::dropIfExists('events');
        Schema::dropIfExists('sponsors');
        Schema::dropIfExists('categories');
    }
};
