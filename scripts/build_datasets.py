#!/usr/bin/env python3
"""
build_datasets.py

Extracts raw GPX and RunGo datasets from fetched sources, normalizes them,
computes cumulative geodesic distances, elevations, gradients, timing mat checkpoints,
and produces standardized GeoJSON, GPX, projection, schedule, and elevation datasets.
"""

import json
import math
import os
import xml.etree.ElementTree as ET
import base64

EARTH_RADIUS_M = 6371000.0

def haversine_distance(lat1, lon1, lat2, lon2):
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = (math.sin(dphi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return EARTH_RADIUS_M * c

def initial_bearing(lat1, lon1, lat2, lon2):
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dlambda = math.radians(lon2 - lon1)
    y = math.sin(dlambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(dlambda)
    deg = math.degrees(math.atan2(y, x))
    return (deg + 360.0) % 360.0

def parse_gpx_file(gpx_bytes):
    root = ET.fromstring(gpx_bytes)
    ns = {'gpx': 'http://www.topografix.com/GPX/1/1'}
    trkpts = root.findall('.//gpx:trkpt', ns)
    if not trkpts:
        trkpts = root.findall('.//trkpt')
    
    points = []
    for pt in trkpts:
        lat = float(pt.attrib['lat'])
        lon = float(pt.attrib['lon'])
        ele_elem = pt.find('gpx:ele', ns) if 'gpx' in ns else None
        if ele_elem is None:
            ele_elem = pt.find('ele')
        ele = float(ele_elem.text) if ele_elem is not None and ele_elem.text else 0.0
        points.append({'lat': lat, 'lon': lon, 'ele': ele})
    return points

def extract_gpx_from_step(step_path):
    with open(step_path, 'r', encoding='utf-8') as f:
        text = f.read()
    for line in text.splitlines():
        if line.startswith('{'):
            data = json.loads(line)
            return base64.b64decode(data['content'])
    raise ValueError(f"Could not find JSON payload in {step_path}")

def extract_rungo_from_step(step_path):
    with open(step_path, 'r', encoding='utf-8') as f:
        for line in f:
            if line.startswith('{'):
                return json.loads(line)
    raise ValueError(f"Could not find RunGo JSON in {step_path}")

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    gpx_dir = os.path.join(base_dir, 'data', 'gpx')
    geojson_dir = os.path.join(base_dir, 'data', 'geojson')
    rungo_dir = os.path.join(base_dir, 'data', 'rungo')
    stats_dir = os.path.join(base_dir, 'data', 'stats')
    sched_dir = os.path.join(base_dir, 'data', 'schedules')
    proj_dir = os.path.join(base_dir, 'data', 'projections')
    splits_dir = os.path.join(base_dir, 'data', 'splits')

    for d in [gpx_dir, geojson_dir, rungo_dir, stats_dir, sched_dir, proj_dir, splits_dir]:
        os.makedirs(d, exist_ok=True)

    # 1. Step sources for GPX
    gpx_steps = {
        'new_york': ('/Users/volodymyr/.gemini/antigravity/brain/b1bde2b9-5d16-4c4f-a000-94b3c822e3d7/.system_generated/steps/210/content.md', 'TCS New York City Marathon'),
        'boston': ('/Users/volodymyr/.gemini/antigravity/brain/b1bde2b9-5d16-4c4f-a000-94b3c822e3d7/.system_generated/steps/216/content.md', 'Boston Marathon'),
        'chicago': ('/Users/volodymyr/.gemini/antigravity/brain/b1bde2b9-5d16-4c4f-a000-94b3c822e3d7/.system_generated/steps/206/content.md', 'Bank of America Chicago Marathon'),
        'london': ('/Users/volodymyr/.gemini/antigravity/brain/b1bde2b9-5d16-4c4f-a000-94b3c822e3d7/.system_generated/steps/214/content.md', 'TCS London Marathon'),
        'berlin': ('/Users/volodymyr/.gemini/antigravity/brain/b1bde2b9-5d16-4c4f-a000-94b3c822e3d7/.system_generated/steps/212/content.md', 'BMW Berlin-Marathon'),
        'tokyo': ('/Users/volodymyr/.gemini/antigravity/brain/b1bde2b9-5d16-4c4f-a000-94b3c822e3d7/.system_generated/steps/218/content.md', 'Tokyo Marathon')
    }

    # 2. Step sources for RunGo JSON
    rungo_steps = {
        'new_york': '/Users/volodymyr/.gemini/antigravity/brain/b1bde2b9-5d16-4c4f-a000-94b3c822e3d7/.system_generated/steps/38/content.md',
        'boston': '/Users/volodymyr/.gemini/antigravity/brain/b1bde2b9-5d16-4c4f-a000-94b3c822e3d7/.system_generated/steps/108/content.md',
        'chicago': '/Users/volodymyr/.gemini/antigravity/brain/b1bde2b9-5d16-4c4f-a000-94b3c822e3d7/.system_generated/steps/132/content.md'
    }

    for k, v in rungo_steps.items():
        data = extract_rungo_from_step(v)
        out_path = os.path.join(rungo_dir, f"{k}_rungo.json")
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        print(f"Saved RunGo: {out_path}")

    # Standard marathon timing splits in meters
    target_splits = [
        ("Start", 0),
        ("5K", 5000),
        ("10K", 10000),
        ("15K", 15000),
        ("20K", 20000),
        ("Half", 21097.5),
        ("25K", 25000),
        ("30K", 30000),
        ("35K", 35000),
        ("40K", 40000),
        ("Finish", 42195.0)
    ]

    all_stats = {}
    all_splits = {}

    for slug, (step_file, title) in gpx_steps.items():
        gpx_bytes = extract_gpx_from_step(step_file)
        # Write clean GPX file
        out_gpx = os.path.join(gpx_dir, f"{slug}.gpx")
        with open(out_gpx, 'wb') as f:
            f.write(gpx_bytes)
        print(f"Saved GPX: {out_gpx}")

        raw_pts = parse_gpx_file(gpx_bytes)

        # Compute cumulative distance, elevation gains, and slopes
        processed_pts = []
        cum_dist = 0.0
        elev_gain = 0.0
        elev_loss = 0.0
        min_ele = 99999.0
        max_ele = -99999.0

        for i, pt in enumerate(raw_pts):
            lat = pt['lat']
            lon = pt['lon']
            ele = pt['ele']
            min_ele = min(min_ele, ele)
            max_ele = max(max_ele, ele)

            if i == 0:
                d = 0.0
                grade = 0.0
            else:
                prev = processed_pts[i - 1]
                d = haversine_distance(prev['lat'], prev['lon'], lat, lon)
                cum_dist += d
                dele = ele - prev['ele']
                if dele > 0:
                    elev_gain += dele
                else:
                    elev_loss += abs(dele)
                grade = (dele / d * 100.0) if d > 0.001 else 0.0

            processed_pts.append({
                'index': i,
                'lat': lat,
                'lon': lon,
                'ele': ele,
                'cum_dist_m': round(cum_dist, 2),
                'cum_dist_km': round(cum_dist / 1000.0, 3),
                'cum_dist_mi': round(cum_dist / 1609.344, 3),
                'segment_dist_m': round(d, 2),
                'grade_pct': round(grade, 2)
            })

        total_dist_m = cum_dist
        start_ele = processed_pts[0]['ele']
        finish_ele = processed_pts[-1]['ele']
        net_ele = finish_ele - start_ele

        # Find coordinates for standard timing splits by linear interpolation
        splits_for_course = []
        for name, dist_m in target_splits:
            # clamp target
            t_m = min(dist_m, total_dist_m)
            # find segment
            found = False
            for j in range(len(processed_pts) - 1):
                p1 = processed_pts[j]
                p2 = processed_pts[j + 1]
                if p1['cum_dist_m'] <= t_m <= p2['cum_dist_m']:
                    seg_len = p2['cum_dist_m'] - p1['cum_dist_m']
                    ratio = (t_m - p1['cum_dist_m']) / seg_len if seg_len > 0 else 0.0
                    lat_interp = p1['lat'] + ratio * (p2['lat'] - p1['lat'])
                    lon_interp = p1['lon'] + ratio * (p2['lon'] - p1['lon'])
                    ele_interp = p1['ele'] + ratio * (p2['ele'] - p1['ele'])
                    splits_for_course.append({
                        'split_name': name,
                        'target_distance_m': dist_m,
                        'actual_distance_m': round(t_m, 1),
                        'actual_distance_km': round(t_m / 1000.0, 2),
                        'actual_distance_mi': round(t_m / 1609.344, 2),
                        'lat': round(lat_interp, 6),
                        'lon': round(lon_interp, 6),
                        'ele': round(ele_interp, 1)
                    })
                    found = True
                    break
            if not found and processed_pts:
                p = processed_pts[-1]
                splits_for_course.append({
                    'split_name': name,
                    'target_distance_m': dist_m,
                    'actual_distance_m': round(p['cum_dist_m'], 1),
                    'actual_distance_km': round(p['cum_dist_m'] / 1000.0, 2),
                    'actual_distance_mi': round(p['cum_dist_m'] / 1609.344, 2),
                    'lat': round(p['lat'], 6),
                    'lon': round(p['lon'], 6),
                    'ele': round(p['ele'], 1)
                })

        all_splits[slug] = splits_for_course

        # GeoJSON construction
        lons = [pt['lon'] for pt in processed_pts]
        lats = [pt['lat'] for pt in processed_pts]
        bbox = [min(lons), min(lats), max(lons), max(lats)]

        coordinates = [[pt['lon'], pt['lat'], pt['ele']] for pt in processed_pts]

        geojson_feature = {
            "type": "FeatureCollection",
            "properties": {
                "id": slug,
                "title": title,
                "official_distance_m": 42195,
                "measured_track_distance_m": round(total_dist_m, 1),
                "point_count": len(processed_pts),
                "elevation_summary": {
                    "start_m": round(start_ele, 1),
                    "finish_m": round(finish_ele, 1),
                    "net_change_m": round(net_ele, 1),
                    "min_m": round(min_ele, 1),
                    "max_m": round(max_ele, 1),
                    "gain_m": round(elev_gain, 1),
                    "loss_m": round(elev_loss, 1)
                },
                "bbox": bbox,
                "timing_splits": splits_for_course
            },
            "features": [
                {
                    "type": "Feature",
                    "id": f"{slug}_course_line",
                    "properties": {
                        "name": f"{title} Course Path",
                        "stroke": "#0284c7",
                        "stroke-width": 4,
                        "distances_m": [pt['cum_dist_m'] for pt in processed_pts],
                        "elevations_m": [pt['ele'] for pt in processed_pts],
                        "grades_pct": [pt['grade_pct'] for pt in processed_pts]
                    },
                    "geometry": {
                        "type": "LineString",
                        "coordinates": coordinates
                    }
                }
            ]
        }

        # Add Point features for timing splits
        for sp in splits_for_course:
            geojson_feature["features"].append({
                "type": "Feature",
                "id": f"{slug}_split_{sp['split_name'].lower()}",
                "properties": {
                    "marker_type": "timing_mat",
                    "split_name": sp['split_name'],
                    "distance_km": sp['actual_distance_km'],
                    "distance_mi": sp['actual_distance_mi'],
                    "elevation_m": sp['ele']
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [sp['lon'], sp['lat'], sp['ele']]
                }
            })

        out_geojson = os.path.join(geojson_dir, f"{slug}.geojson")
        with open(out_geojson, 'w', encoding='utf-8') as f:
            json.dump(geojson_feature, f, indent=2)
        print(f"Saved GeoJSON: {out_geojson}")

        all_stats[slug] = {
            "title": title,
            "points": len(processed_pts),
            "total_distance_m": round(total_dist_m, 1),
            "total_distance_km": round(total_dist_m / 1000.0, 3),
            "total_distance_mi": round(total_dist_m / 1609.344, 3),
            "start_ele_m": round(start_ele, 1),
            "finish_ele_m": round(finish_ele, 1),
            "net_ele_m": round(net_ele, 1),
            "min_ele_m": round(min_ele, 1),
            "max_ele_m": round(max_ele, 1),
            "gain_m": round(elev_gain, 1),
            "loss_m": round(elev_loss, 1),
            "bbox": bbox
        }

    # Save timing mats
    with open(os.path.join(splits_dir, "timing_mats.json"), 'w', encoding='utf-8') as f:
        json.dump(all_splits, f, indent=2)
    print("Saved timing mats dataset.")

    # Save course stats
    with open(os.path.join(stats_dir, "elevation_and_course_stats.json"), 'w', encoding='utf-8') as f:
        json.dump(all_stats, f, indent=2)
    print("Saved course elevation and distance statistics.")

    # 3. Create Schedules Database
    schedules = {
        "new_york": {
            "race_name": "TCS New York City Marathon",
            "host_city": "New York City, NY, USA",
            "annual_date": "First Sunday in November (e.g. November 1, 2026 / November 2, 2025)",
            "start_location": "Fort Wadsworth, Staten Island (Verrazzano-Narrows Bridge)",
            "finish_location": "Tavern on the Green, Central Park West & 67th St, Manhattan",
            "course_cutoff_time": "13:45 min/mile pace (~6 hours after last wave start, sweep bus ends ~7:30 PM)",
            "start_waves": [
                {"wave": "Professional Wheelchairs", "time": "08:00:00", "description": "Men & Women Wheelchair Division"},
                {"wave": "Handcycle & Select AWD", "time": "08:22:00", "description": "Handcycle category & athletes with disabilities"},
                {"wave": "Professional Women", "time": "08:40:00", "description": "Elite Women Open Division"},
                {"wave": "Professional Men", "time": "09:05:00", "description": "Elite Men Open Division"},
                {"wave": "Wave 1", "time": "09:10:00", "corral_colors": ["Blue", "Orange", "Green"], "corrals": "A to F", "projected_finish_paces": "< 3h15m (< 7:26 min/mi)"},
                {"wave": "Wave 2", "time": "09:45:00", "corral_colors": ["Blue", "Orange", "Green"], "corrals": "A to F", "projected_finish_paces": "3h15m - 3h45m (7:26 - 8:35 min/mi)"},
                {"wave": "Wave 3", "time": "10:20:00", "corral_colors": ["Blue", "Orange", "Green"], "corrals": "A to F", "projected_finish_paces": "3h45m - 4h15m (8:35 - 9:43 min/mi)"},
                {"wave": "Wave 4", "time": "10:55:00", "corral_colors": ["Blue", "Orange", "Green"], "corrals": "A to F", "projected_finish_paces": "4h15m - 4h55m (9:43 - 11:15 min/mi)"},
                {"wave": "Wave 5", "time": "11:30:00", "corral_colors": ["Blue", "Orange", "Green"], "corrals": "A to F", "projected_finish_paces": "> 4h55m (> 11:15 min/mi)"}
            ],
            "course_peculiarities": [
                "Three distinct colored start staging routes (Blue, Orange, Green) on Verrazzano-Narrows Bridge: Blue & Orange run on upper deck, Green runs on lower deck.",
                "All routes converge at Fourth Avenue & 92nd Street in Brooklyn (approx Mile 3 / 4.8 km).",
                "Five major bridges: Verrazzano (mi 1-2), Pulaski (mi 13.1), Queensboro (mi 15-16), Willis Ave (mi 20), Madison Ave (mi 21)."
            ]
        },
        "boston": {
            "race_name": "Boston Marathon (B.A.A.)",
            "host_city": "Hopkinton to Boston, MA, USA",
            "annual_date": "Third Monday of April (Patriots' Day, e.g. April 20, 2026 / April 21, 2025)",
            "start_location": "Main Street, Hopkinton, MA",
            "finish_location": "Boylston Street near Copley Square, Boston, MA",
            "course_cutoff_time": "6 hours after the last runner crosses the start line (~5:30 PM)",
            "start_waves": [
                {"wave": "Men's Wheelchair", "time": "09:02:00", "description": "Push rim wheelchair men"},
                {"wave": "Women's Wheelchair", "time": "09:05:00", "description": "Push rim wheelchair women"},
                {"wave": "Handcycles & Duos", "time": "09:30:00", "description": "Handcycle program and duo teams"},
                {"wave": "Professional Men", "time": "09:37:00", "description": "Elite Men"},
                {"wave": "Professional Women", "time": "09:47:00", "description": "Elite Women"},
                {"wave": "Para Athletics Division", "time": "09:50:00", "description": "Ambulatory Para divisions"},
                {"wave": "Wave 1", "time": "10:00:00", "bib_numbers": "1 - 7,999", "projected_finish_paces": "< 3h00m (< 6:52 min/mi)"},
                {"wave": "Wave 2", "time": "10:25:00", "bib_numbers": "8,000 - 15,999", "projected_finish_paces": "3h00m - 3h25m (6:52 - 7:49 min/mi)"},
                {"wave": "Wave 3", "time": "10:50:00", "bib_numbers": "16,000 - 23,999", "projected_finish_paces": "3h25m - 3h55m (7:49 - 8:58 min/mi)"},
                {"wave": "Wave 4", "time": "11:15:00", "bib_numbers": "24,000 - 33,000+", "projected_finish_paces": "> 3h55m (> 8:58 min/mi)"}
            ],
            "course_peculiarities": [
                "Point-to-point course from west to east; prevailing wind (headwind vs tailwind) has massive impact on times.",
                "First 4 miles drop over 200 feet, tempting early over-pacing and eccentric quad damage.",
                "Newton Hills from Mile 16 to 21 (Firehouse Hill, Commonwealth Ave hills, Heartbreak Hill at Mile 20.5).",
                "Iconic final turns: Right on Hereford, Left on Boylston."
            ]
        },
        "chicago": {
            "race_name": "Bank of America Chicago Marathon",
            "host_city": "Chicago, IL, USA",
            "annual_date": "Sunday of Columbus Day weekend in October (e.g. October 11, 2026 / October 12, 2025)",
            "start_location": "Grant Park (Columbus Drive & Monroe St), Chicago, IL",
            "finish_location": "Grant Park (Columbus Drive & Roosevelt Rd), Chicago, IL",
            "course_cutoff_time": "6 hours 30 minutes from crossing the start line (15 min/mile pace)",
            "start_waves": [
                {"wave": "Wheelchair Men", "time": "07:20:00", "description": "Men wheelchair division"},
                {"wave": "Wheelchair Women", "time": "07:21:00", "description": "Women wheelchair division"},
                {"wave": "Handcycle", "time": "07:23:00", "description": "Handcycle category"},
                {"wave": "Wave 1", "time": "07:30:00", "corrals": ["A", "B", "C", "D", "E"], "projected_finish_paces": "< 3h15m (< 7:26 min/mi)"},
                {"wave": "Wave 2", "time": "08:00:00", "corrals": ["F", "G", "H"], "projected_finish_paces": "3h15m - 4h00m (7:26 - 9:09 min/mi)"},
                {"wave": "Wave 3", "time": "08:35:00", "corrals": ["J", "K", "L", "M", "N"], "projected_finish_paces": "> 4h00m (> 9:09 min/mi)"}
            ],
            "course_peculiarities": [
                "World record course (Kelvin Kiptum 2:00:35, Ruth Chepngetich 2:09:56).",
                "Loop through 29 Chicago neighborhoods (North to Lincoln Park, West to Near West, South to Pilsen & Chinatown).",
                "Tall skyscrapers in downtown Loop (miles 1-3) induce severe GPS drift / multipath reflections.",
                "Pancake flat elevation profile; only notable gradient is the 'Mount Roosevelt' overpass at mile 26 before the finish."
            ]
        },
        "london": {
            "race_name": "TCS London Marathon",
            "host_city": "London, England, UK",
            "annual_date": "Third or Fourth Sunday of April (e.g. April 26, 2026 / April 27, 2025)",
            "start_location": "Blackheath / Greenwich Park, London",
            "finish_location": "The Mall near Buckingham Palace, London",
            "course_cutoff_time": "8 hours from the final start crossing",
            "start_waves": [
                {"wave": "Elite Wheelchairs", "time": "08:50:00", "description": "Wheelchair racing division"},
                {"wave": "Elite Women", "time": "09:00:00", "description": "Elite Women"},
                {"wave": "Elite Men & Mass Wave 1", "time": "09:40:00", "start_zones": ["Blue", "Green", "Red", "Yellow"], "corrals": "Fastest seeded"},
                {"wave": "Mass Wave 2-8", "time": "09:45:00 - 11:30:00", "start_zones": ["Blue", "Green", "Red", "Yellow"], "interval": "Every 5-10 minutes"}
            ],
            "course_peculiarities": [
                "Three separate starts (Blue from Blackheath, Red from Greenwich Park, Green from St John's) converge at Woolwich (approx Mile 2.8).",
                "Passes historic Cutty Sark (mile 6), Tower Bridge (mile 12.5), Canary Wharf loop (miles 14-20), Embankment (miles 23-25), Big Ben / Parliament, and finishes at The Mall."
            ]
        },
        "berlin": {
            "race_name": "BMW Berlin-Marathon",
            "host_city": "Berlin, Germany",
            "annual_date": "Last Sunday of September (e.g. September 27, 2026 / September 28, 2025)",
            "start_location": "Straße des 17. Juni (Tiergarten / Großer Stern), Berlin",
            "finish_location": "Straße des 17. Juni (passing through Brandenburg Gate), Berlin",
            "course_cutoff_time": "6 hours 15 minutes from crossing the start line",
            "start_waves": [
                {"wave": "Handbike", "time": "08:50:00", "description": "Handbike division"},
                {"wave": "Wheelchair", "time": "08:57:00", "description": "Wheelchair division"},
                {"wave": "Wave 1", "time": "09:15:00", "start_blocks": ["A", "B", "C", "D"], "projected_finish_paces": "A (< 2h45), B (2h45-3h00), C (3h00-3h15), D (3h15-3h30)"},
                {"wave": "Wave 2", "time": "09:35:00", "start_blocks": ["E"], "projected_finish_paces": "3h30 - 3h50"},
                {"wave": "Wave 3", "time": "10:05:00", "start_blocks": ["F"], "projected_finish_paces": "3h50 - 4h15"},
                {"wave": "Wave 4", "time": "10:30:00", "start_blocks": ["G", "H"], "projected_finish_paces": "G (4h15 - 4h45), H (> 4h45)"}
            ],
            "course_peculiarities": [
                "Single flat loop through Berlin (Tiergarten, Mitte, Kreuzberg, Schöneberg, Steglitz, Charlottenburg).",
                "Widely considered the fastest marathon course in history (multiple world records by Kipchoge, Bekele, Gebrselassie).",
                "Iconic finish running through the Brandenburg Gate with 400m sprint to the line."
            ]
        },
        "tokyo": {
            "race_name": "Tokyo Marathon",
            "host_city": "Tokyo, Japan",
            "annual_date": "First Sunday of March (e.g. March 1, 2026 / March 2, 2025)",
            "start_location": "Tokyo Metropolitan Government Building (Shinjuku), Tokyo",
            "finish_location": "Tokyo Station (Gyoko-dori), Chiyoda, Tokyo",
            "course_cutoff_time": "7 hours from crossing the start line",
            "start_waves": [
                {"wave": "Wheelchair", "time": "09:05:00", "description": "Wheelchair marathon"},
                {"wave": "Marathon Wave 1", "time": "09:10:00", "blocks": ["A", "B", "C", "D", "E"], "description": "Elite and fast qualifying blocks"},
                {"wave": "Marathon Wave 2", "time": "09:25:00", "blocks": ["F", "G", "H", "J", "K", "L"], "description": "Mass participation blocks"}
            ],
            "course_peculiarities": [
                "Starts with a net downhill drop of ~30 meters from Shinjuku through Iidabashi in the first 5 km.",
                "Multiple out-and-back spurs allowing runners to see elite leaders (Asakusa Kaminarimon, Ginza, Shinagawa).",
                "Extremely strict checkpoint cut-off times at each 5km timing gate with sweep buses."
            ]
        }
    }

    with open(os.path.join(sched_dir, "marathon_schedules.json"), 'w', encoding='utf-8') as f:
        json.dump(schedules, f, indent=2)
    print("Saved schedules database.")

    # 4. Create Map Projections Database
    projections = {
        "global_standard_crs": {
            "geographic_crs": {
                "name": "WGS 84",
                "epsg": "EPSG:4326",
                "units": "decimal degrees (longitude, latitude)",
                "ellipsoid": "WGS 84 (a=6378137.0 m, 1/f=298.257223563)",
                "usage": "GPS chips, GeoJSON standard (RFC 7946), raw track logging"
            },
            "web_projected_crs": {
                "name": "WGS 84 / Pseudo-Mercator (Web Mercator)",
                "epsg": "EPSG:3857",
                "units": "meters",
                "usage": "Mapbox, Google Maps, Apple Maps, Leaflet, OpenStreetMap slippy tiles",
                "distortion": "High area distortion at higher latitudes (scales by sec(lat)); not recommended for geodesic length calculations without cos(lat) correction factor"
            }
        },
        "local_conformal_projections": {
            "new_york": {
                "state_plane": {
                    "name": "NAD83 / New York Long Island (ftUS)",
                    "epsg": "EPSG:2263",
                    "projection_type": "Lambert Conformal Conic",
                    "units": "US survey foot",
                    "scale_factor": 1.0,
                    "bounds": [-74.26, 40.47, -71.85, 41.31]
                },
                "utm": {
                    "name": "WGS 84 / UTM Zone 18N",
                    "epsg": "EPSG:32618",
                    "projection_type": "Transverse Mercator",
                    "units": "meters",
                    "central_meridian": -75.0,
                    "scale_factor_at_cm": 0.9996
                }
            },
            "boston": {
                "state_plane": {
                    "name": "NAD83 / Massachusetts Mainland",
                    "epsg": "EPSG:26986",
                    "projection_type": "Lambert Conformal Conic (2SP)",
                    "units": "meters",
                    "bounds": [-73.5, 41.46, -69.86, 42.89]
                },
                "utm": {
                    "name": "WGS 84 / UTM Zone 19N",
                    "epsg": "EPSG:32619",
                    "projection_type": "Transverse Mercator",
                    "units": "meters",
                    "central_meridian": -69.0,
                    "scale_factor_at_cm": 0.9996
                }
            },
            "chicago": {
                "state_plane": {
                    "name": "NAD83 / Illinois East (ftUS)",
                    "epsg": "EPSG:3435",
                    "projection_type": "Transverse Mercator",
                    "units": "US survey foot",
                    "bounds": [-88.3, 38.3, -87.5, 42.5]
                },
                "utm": {
                    "name": "WGS 84 / UTM Zone 16N",
                    "epsg": "EPSG:32616",
                    "projection_type": "Transverse Mercator",
                    "units": "meters",
                    "central_meridian": -87.0,
                    "scale_factor_at_cm": 0.9996
                }
            },
            "london": {
                "national_grid": {
                    "name": "OSGB36 / British National Grid",
                    "epsg": "EPSG:27700",
                    "projection_type": "Transverse Mercator",
                    "units": "meters",
                    "datum": "Ordnance Survey Great Britain 1936",
                    "central_meridian": -2.0,
                    "scale_factor_at_cm": 0.9996012717
                },
                "utm": {
                    "name": "WGS 84 / UTM Zone 30N",
                    "epsg": "EPSG:32630",
                    "projection_type": "Transverse Mercator",
                    "units": "meters",
                    "central_meridian": -3.0
                }
            },
            "berlin": {
                "national_utm": {
                    "name": "ETRS89 / UTM Zone 33N",
                    "epsg": "EPSG:25833",
                    "projection_type": "Transverse Mercator",
                    "units": "meters",
                    "datum": "European Terrestrial Reference System 1989",
                    "central_meridian": 15.0
                }
            },
            "tokyo": {
                "plane_rectangular": {
                    "name": "JGD2011 / Japan Plane Rectangular CS IX",
                    "epsg": "EPSG:6677",
                    "projection_type": "Transverse Mercator",
                    "units": "meters",
                    "datum": "Japanese Geodetic Datum 2011",
                    "origin": [36.0, 139.833333333]
                },
                "utm": {
                    "name": "WGS 84 / UTM Zone 54N",
                    "epsg": "EPSG:32654",
                    "projection_type": "Transverse Mercator",
                    "units": "meters",
                    "central_meridian": 141.0
                }
            }
        },
        "mathematical_projections_for_distance_forecast": {
            "equirectangular_flat_earth_approximation": {
                "formula": "x = R * (lambda2 - lambda1) * cos((phi1 + phi2)/2); y = R * (phi2 - phi1); d = sqrt(x^2 + y^2)",
                "error_at_marathon_scale": "< 0.05% error across a 42km bounding box",
                "computational_cost": "Extremely low, O(1), no spherical trigonometry required, ideal for real-time mobile tracking"
            },
            "great_circle_haversine": {
                "formula": "a = sin^2(dphi/2) + cos(phi1)*cos(phi2)*sin^2(dlambda/2); c = 2*atan2(sqrt(a), sqrt(1-a)); d = R*c",
                "error": "< 0.2% compared to WGS-84 geodesic ellipsoidal models"
            },
            "vincenty_geodesic": {
                "accuracy": "Millimeter level precision on oblate ellipsoid (GRS 80 / WGS 84)"
            }
        }
    }

    with open(os.path.join(proj_dir, "map_projections.json"), 'w', encoding='utf-8') as f:
        json.dump(projections, f, indent=2)
    print("Saved map projections dataset.")

    print("\n--- Summary of Built Datasets ---")
    for k, v in all_stats.items():
        print(f"{v['title']:35} | Points: {v['points']:4} | Distance: {v['total_distance_km']:6.2f} km | Gain: +{v['gain_m']:5.1f}m | Loss: -{v['loss_m']:5.1f}m | Net: {v['net_ele_m']:+5.1f}m")

if __name__ == '__main__':
    main()
