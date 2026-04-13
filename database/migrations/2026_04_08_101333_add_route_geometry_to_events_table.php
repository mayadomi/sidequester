<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE events ADD COLUMN route_geometry geometry(LineString, 4326)');

        // Extract the LineString feature from each stored FeatureCollection
        DB::statement("
            UPDATE events
            SET route_geometry = (
                SELECT ST_Force2D(ST_GeomFromGeoJSON(feat->>'geometry'))
                FROM jsonb_array_elements(route_geojson::jsonb->'features') AS feat
                WHERE feat->'geometry'->>'type' = 'LineString'
                LIMIT 1
            )
            WHERE route_geojson IS NOT NULL
        ");

        DB::statement('CREATE INDEX events_route_geometry_idx ON events USING GIST (route_geometry)');
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('DROP INDEX IF EXISTS events_route_geometry_idx');
        DB::statement('ALTER TABLE events DROP COLUMN IF EXISTS route_geometry');
    }
};
