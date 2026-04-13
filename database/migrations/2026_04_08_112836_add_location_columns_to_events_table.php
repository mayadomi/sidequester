<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->text('location_name')->nullable()->after('location_id');
            $table->text('location_address')->nullable()->after('location_name');
            $table->decimal('location_lat', 10, 7)->nullable()->after('location_address');
            $table->decimal('location_lng', 10, 7)->nullable()->after('location_lat');
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE events ADD COLUMN location_geometry geometry(Point, 4326)');
        }

        // Populate from locations table
        DB::statement('
            UPDATE events
            SET
                location_name    = locations.name,
                location_address = locations.address,
                location_lat     = locations.latitude,
                location_lng     = locations.longitude
            FROM locations
            WHERE events.location_id = locations.id
        ');

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('
                UPDATE events
                SET location_geometry = ST_SetSRID(
                    ST_MakePoint(location_lng::float, location_lat::float), 4326
                )
                WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL
            ');

            DB::statement('CREATE INDEX events_location_geometry_idx ON events USING GIST (location_geometry)');
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS events_location_geometry_idx');
            DB::statement('ALTER TABLE events DROP COLUMN IF EXISTS location_geometry');
        }

        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['location_name', 'location_address', 'location_lat', 'location_lng']);
        });
    }
};
