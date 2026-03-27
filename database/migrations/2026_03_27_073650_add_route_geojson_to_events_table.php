<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            // Stores the processed GeoJSON (FeatureCollection) derived from the
            // uploaded GPX file. Ready for direct consumption by MapLibre GL.
            // Original GPX is preserved in the route_gpx Spatie media collection.
            $table->json('route_geojson')->nullable()->after('route_url');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn('route_geojson');
        });
    }
};
