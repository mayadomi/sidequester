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

        // Add the geography point column — nullable initially so existing rows are valid
        DB::statement('ALTER TABLE locations ADD COLUMN coordinates geography(Point, 4326)');

        // Populate from existing latitude/longitude decimal columns
        DB::statement('UPDATE locations SET coordinates = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)');

        // Add a GIST spatial index for fast proximity queries
        DB::statement('CREATE INDEX locations_coordinates_idx ON locations USING GIST (coordinates)');
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('DROP INDEX IF EXISTS locations_coordinates_idx');
        DB::statement('ALTER TABLE locations DROP COLUMN IF EXISTS coordinates');
    }
};
