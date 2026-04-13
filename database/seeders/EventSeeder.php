<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Event;
use App\Models\Sponsor;
use Illuminate\Database\Seeder;

class EventSeeder extends Seeder
{
    /**
     * Seed sample TDU events using the denormalised location schema.
     */
    public function run(): void
    {
        $categories = Category::pluck('id', 'slug');
        $sponsors = Sponsor::pluck('id', 'slug');

        $events = [
            // ── Race Stages ───────────────────────────────────────────────────
            [
                'title' => 'Stage 1: Adelaide City Circuit',
                'description' => 'The Tour kicks off with an exciting city circuit race through the heart of Adelaide. Watch the peloton navigate tight corners and sprint finishes on this fast, technical course.',
                'start_datetime' => '2026-01-20 10:00:00',
                'end_datetime' => '2026-01-20 14:00:00',
                'category_id' => $categories['race-stages'] ?? null,
                'sponsor_id' => $sponsors['santos'] ?? null,
                'location_name' => 'Victoria Square',
                'location_address' => 'Victoria Square, Adelaide SA 5000',
                'location_lat' => -34.9285,
                'location_lng' => 138.6007,
                'ride_distance_km' => 51.0,
                'elevation_gain_m' => 120,
                'is_featured' => true,
                'is_free' => true,
                'url' => 'https://www.tourdownunder.com.au',
            ],
            [
                'title' => 'Stage 2: Tanunda to Angaston',
                'description' => 'A stunning ride through the Barossa Valley wine region. Rolling hills and picturesque vineyards provide the backdrop for this challenging stage.',
                'start_datetime' => '2026-01-21 09:30:00',
                'end_datetime' => '2026-01-21 14:30:00',
                'category_id' => $categories['race-stages'] ?? null,
                'sponsor_id' => $sponsors['santos'] ?? null,
                'location_name' => 'Tanunda',
                'location_address' => 'Murray Street, Tanunda SA 5352',
                'location_lat' => -34.5247,
                'location_lng' => 138.9608,
                'ride_distance_km' => 145.0,
                'elevation_gain_m' => 1850,
                'is_featured' => true,
                'is_free' => true,
                'url' => 'https://www.tourdownunder.com.au',
            ],
            [
                'title' => 'Stage 3: Victor Harbor Circuit',
                'description' => 'Coastal racing at its finest. The peloton battles ocean winds and scenic clifftop roads in this spectacular seaside stage.',
                'start_datetime' => '2026-01-22 10:00:00',
                'end_datetime' => '2026-01-22 15:00:00',
                'category_id' => $categories['race-stages'] ?? null,
                'sponsor_id' => $sponsors['santos'] ?? null,
                'location_name' => 'Victor Harbor',
                'location_address' => 'Ocean Street, Victor Harbor SA 5211',
                'location_lat' => -35.5524,
                'location_lng' => 138.6178,
                'ride_distance_km' => 138.5,
                'elevation_gain_m' => 1420,
                'is_featured' => true,
                'is_free' => true,
                'url' => 'https://www.tourdownunder.com.au',
            ],
            [
                'title' => 'Stage 4: McLaren Vale to Willunga Hill',
                'description' => 'The Queen Stage! The iconic Willunga Hill climb decides the overall classification. Two ascents of the famous climb will test the best climbers.',
                'start_datetime' => '2026-01-23 09:00:00',
                'end_datetime' => '2026-01-23 15:30:00',
                'category_id' => $categories['race-stages'] ?? null,
                'sponsor_id' => $sponsors['santos'] ?? null,
                'location_name' => 'Willunga',
                'location_address' => 'High Street, Willunga SA 5172',
                'location_lat' => -35.2717,
                'location_lng' => 138.5517,
                'ride_distance_km' => 151.5,
                'elevation_gain_m' => 2650,
                'is_featured' => true,
                'is_free' => true,
                'url' => 'https://www.tourdownunder.com.au',
            ],
            [
                'title' => 'Stage 5: Adelaide City Criterium',
                'description' => "The final stage concludes with a thrilling criterium through Adelaide's streets. Fast corners and bunch sprints provide a fitting finale.",
                'start_datetime' => '2026-01-24 11:00:00',
                'end_datetime' => '2026-01-24 14:00:00',
                'category_id' => $categories['race-stages'] ?? null,
                'sponsor_id' => $sponsors['santos'] ?? null,
                'location_name' => 'Adelaide City Circuit',
                'location_address' => 'King William Street, Adelaide SA 5000',
                'location_lat' => -34.9290,
                'location_lng' => 138.5999,
                'ride_distance_km' => 90.0,
                'elevation_gain_m' => 85,
                'is_featured' => true,
                'is_free' => true,
                'url' => 'https://www.tourdownunder.com.au',
            ],

            // ── Official Events ───────────────────────────────────────────────
            [
                'title' => 'Team Presentation Night',
                'description' => 'Meet the riders! All participating teams are officially presented to the public in a spectacular night-time event in the city.',
                'start_datetime' => '2026-01-17 18:00:00',
                'end_datetime' => '2026-01-17 21:00:00',
                'category_id' => $categories['official-events'] ?? null,
                'sponsor_id' => $sponsors['santos'] ?? null,
                'location_name' => 'Elder Park',
                'location_address' => 'Kintore Ave, Adelaide SA 5000',
                'location_lat' => -34.9228,
                'location_lng' => 138.5975,
                'is_featured' => true,
                'is_free' => true,
                'url' => 'https://www.tourdownunder.com.au',
            ],

            // ── Watch Parties ─────────────────────────────────────────────────
            [
                'title' => 'Willunga Hill Summit Watch Party',
                'description' => 'The best vantage point on the race! Join thousands of fans at the famous Willunga Hill summit to cheer the riders up the decisive climb.',
                'start_datetime' => '2026-01-23 12:00:00',
                'end_datetime' => '2026-01-23 16:00:00',
                'category_id' => $categories['watch-parties'] ?? null,
                'sponsor_id' => $sponsors['ziptrak'] ?? null,
                'location_name' => 'Willunga Hill Summit',
                'location_address' => 'Willunga Hill Road, Willunga SA 5172',
                'location_lat' => -35.2644,
                'location_lng' => 138.5486,
                'is_featured' => false,
                'is_free' => true,
            ],
            [
                'title' => 'Glenelg Beach Watch Party',
                'description' => 'Watch the racing action on big screens with a beach backdrop. Food, drinks, and a great atmosphere for all ages.',
                'start_datetime' => '2026-01-22 11:00:00',
                'end_datetime' => '2026-01-22 16:00:00',
                'category_id' => $categories['watch-parties'] ?? null,
                'sponsor_id' => null,
                'location_name' => 'Glenelg Foreshore',
                'location_address' => 'Foreshore Road, Glenelg SA 5045',
                'location_lat' => -34.9799,
                'location_lng' => 138.5148,
                'is_featured' => false,
                'is_free' => true,
            ],

            // ── Group Rides ───────────────────────────────────────────────────
            [
                'title' => 'Shimano Gran Fondo — Long Course',
                'description' => 'Ride the same roads as the professionals! The long course offers a true test for experienced cyclists with full road closures.',
                'start_datetime' => '2026-01-19 06:00:00',
                'end_datetime' => '2026-01-19 14:00:00',
                'category_id' => $categories['group-rides'] ?? null,
                'sponsor_id' => $sponsors['shimano'] ?? null,
                'location_name' => 'McLaren Vale',
                'location_address' => 'Main Road, McLaren Vale SA 5171',
                'location_lat' => -35.2192,
                'location_lng' => 138.5456,
                'ride_distance_km' => 152.0,
                'elevation_gain_m' => 2100,
                'is_featured' => false,
                'is_free' => false,
                'min_cost' => 175.00,
                'max_cost' => 175.00,
                'url' => 'https://www.tourdownunder.com.au/gran-fondo',
            ],
            [
                'title' => 'Shimano Gran Fondo — Short Course',
                'description' => 'An accessible ride for all fitness levels. Experience the excitement of closed roads and a festival atmosphere.',
                'start_datetime' => '2026-01-19 08:00:00',
                'end_datetime' => '2026-01-19 12:00:00',
                'category_id' => $categories['group-rides'] ?? null,
                'sponsor_id' => $sponsors['shimano'] ?? null,
                'location_name' => 'McLaren Vale',
                'location_address' => 'Main Road, McLaren Vale SA 5171',
                'location_lat' => -35.2192,
                'location_lng' => 138.5456,
                'ride_distance_km' => 50.0,
                'elevation_gain_m' => 450,
                'is_featured' => false,
                'is_free' => false,
                'min_cost' => 95.00,
                'max_cost' => 95.00,
                'url' => 'https://www.tourdownunder.com.au/gran-fondo',
            ],
            [
                'title' => 'Morning Coffee Ride — Adelaide Hills',
                'description' => 'A relaxed morning group ride through the Adelaide Hills. All fitness levels welcome. Café stop at Stirling.',
                'start_datetime' => '2026-01-20 07:00:00',
                'end_datetime' => '2026-01-20 10:00:00',
                'category_id' => $categories['group-rides'] ?? null,
                'sponsor_id' => $sponsors['specialized'] ?? null,
                'location_name' => 'Stirling',
                'location_address' => 'Mount Barker Road, Stirling SA 5152',
                'location_lat' => -34.9967,
                'location_lng' => 138.7200,
                'ride_distance_km' => 42.0,
                'elevation_gain_m' => 520,
                'is_featured' => false,
                'is_free' => true,
                'pace' => 'social',
            ],

            // ── Expo ─────────────────────────────────────────────────────────
            [
                'title' => 'Tour Village — Adelaide',
                'description' => 'The heart of the Tour Down Under! Live music, food trucks, cycling expo, team presentations, and giant screens showing all the racing action.',
                'start_datetime' => '2026-01-18 10:00:00',
                'end_datetime' => '2026-01-24 20:00:00',
                'category_id' => $categories['expo'] ?? null,
                'sponsor_id' => $sponsors['santos'] ?? null,
                'location_name' => 'Victoria Square',
                'location_address' => 'Victoria Square, Adelaide SA 5000',
                'location_lat' => -34.9285,
                'location_lng' => 138.6007,
                'is_featured' => true,
                'is_free' => true,
                'url' => 'https://www.tourdownunder.com.au',
            ],

            // ── Food & Wine ───────────────────────────────────────────────────
            [
                'title' => 'Barossa Valley Wine & Cycling Evening',
                'description' => 'Celebrate stage day in the Barossa with a curated wine tasting paired with a cycling theme. Meet the winemakers and enjoy local produce.',
                'start_datetime' => '2026-01-21 18:00:00',
                'end_datetime' => '2026-01-21 21:30:00',
                'category_id' => $categories['food-wine'] ?? null,
                'sponsor_id' => null,
                'location_name' => 'Tanunda',
                'location_address' => 'Murray Street, Tanunda SA 5352',
                'location_lat' => -34.5247,
                'location_lng' => 138.9608,
                'is_featured' => false,
                'is_free' => false,
                'min_cost' => 85.00,
                'max_cost' => 120.00,
            ],

            // ── Entertainment ─────────────────────────────────────────────────
            [
                'title' => 'Hahndorf Street Party',
                'description' => 'Experience German heritage meets cycling culture! Live music, local wines, artisan food, and family entertainment in this charming Adelaide Hills town.',
                'start_datetime' => '2026-01-21 16:00:00',
                'end_datetime' => '2026-01-21 22:00:00',
                'category_id' => $categories['entertainment'] ?? null,
                'sponsor_id' => null,
                'location_name' => 'Hahndorf',
                'location_address' => 'Main Street, Hahndorf SA 5245',
                'location_lat' => -35.0286,
                'location_lng' => 138.8075,
                'is_featured' => false,
                'is_free' => true,
            ],

            // ── Local Racing ──────────────────────────────────────────────────
            [
                'title' => 'Norwood Criterium Series',
                'description' => 'Fast and furious criterium racing along The Parade. Categories for all grades with cash prizes for the top three.',
                'start_datetime' => '2026-01-17 14:00:00',
                'end_datetime' => '2026-01-17 18:00:00',
                'category_id' => $categories['local-racing'] ?? null,
                'sponsor_id' => $sponsors['trek-bikes'] ?? null,
                'location_name' => 'The Parade, Norwood',
                'location_address' => 'The Parade, Norwood SA 5067',
                'location_lat' => -34.9214,
                'location_lng' => 138.6317,
                'ride_distance_km' => 20.0,
                'elevation_gain_m' => 25,
                'is_featured' => false,
                'is_free' => false,
                'min_cost' => 45.00,
                'max_cost' => 45.00,
            ],
        ];

        foreach ($events as $event) {
            Event::create($event);
        }
    }
}
