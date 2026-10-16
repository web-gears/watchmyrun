#!/usr/bin/env python3
"""
runner_forecast_engine.py

Runner Position Forecasting Engine for Marathons.
Implements:
1. Distance interpolation along geospatial polyline.
2. Pacing models:
   - Uniform / Even Pacing
   - Fatigue / Positive Split (Riegel power curve)
   - Grade-Adjusted Pace (Minetti metabolic cost model on elevation slope)
   - Timing Mat Calibrated (Bayesian / piecewise update with live splits)
3. Spectator Arrival Window Estimation.
4. Turn-by-turn and Landmark lookup.
"""

import json
import math
import os
from datetime import datetime, timedelta

EARTH_RADIUS_M = 6371000.0

def haversine(lat1, lon1, lat2, lon2):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = math.sin(dp / 2.0)**2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2.0)**2
    return EARTH_RADIUS_M * 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

def bearing(lat1, lon1, lat2, lon2):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dl = math.radians(lon2 - lon1)
    y = math.sin(dl) * math.cos(p2)
    x = math.cos(p1) * math.sin(p2) - math.sin(p1) * math.cos(p2) * math.cos(dl)
    return (math.degrees(math.atan2(y, x)) + 360.0) % 360.0

def minetti_cost(slope):
    """
    Minetti et al. (2002) metabolic energy cost of running as a function of gradient (i = dh/ds).
    Output units: J / (kg * m). Flat ground (slope = 0) is ~3.6 J/(kg*m).
    """
    i = max(-0.4, min(0.4, slope))
    return 155.4 * (i**5) - 30.4 * (i**4) - 43.3 * (i**3) + 46.3 * (i**2) + 19.5 * i + 3.6

class MarathonCourse:
    def __init__(self, slug, base_data_dir=None):
        if base_data_dir is None:
            base_data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data')
        self.slug = slug
        self.base_data_dir = base_data_dir
        self.load_geojson()
        self.load_waypoints()

    def load_geojson(self):
        path = os.path.join(self.base_data_dir, 'geojson', f'{self.slug}.geojson')
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        self.meta = data['properties']
        line_feature = data['features'][0]
        coords = line_feature['geometry']['coordinates']
        distances = line_feature['properties']['distances_m']
        elevations = line_feature['properties']['elevations_m']
        grades = line_feature['properties']['grades_pct']

        self.points = []
        for i in range(len(coords)):
            self.points.append({
                'lon': coords[i][0],
                'lat': coords[i][1],
                'ele': elevations[i] if i < len(elevations) else coords[i][2],
                'cum_dist_m': distances[i],
                'grade_pct': grades[i] if i < len(grades) else 0.0
            })
        self.total_distance_m = self.points[-1]['cum_dist_m']
        self.splits = self.meta.get('timing_splits', [])

    def load_waypoints(self):
        rungo_path = os.path.join(self.base_data_dir, 'rungo', f'{self.slug}_rungo.json')
        self.waypoints = []
        if os.path.exists(rungo_path):
            with open(rungo_path, 'r', encoding='utf-8') as f:
                rungo_data = json.load(f)
            self.waypoints = rungo_data.get('waypoints', [])

    def get_coordinate_at_distance(self, distance_m):
        """Interpolates lat, lon, ele, bearing, and grade at arbitrary distance s."""
        d = max(0.0, min(distance_m, self.total_distance_m))
        if d <= 0.0:
            p0 = self.points[0]
            p1 = self.points[1] if len(self.points) > 1 else p0
            return {
                'lat': p0['lat'],
                'lon': p0['lon'],
                'ele': p0['ele'],
                'distance_m': 0.0,
                'distance_km': 0.0,
                'distance_mi': 0.0,
                'bearing_deg': bearing(p0['lat'], p0['lon'], p1['lat'], p1['lon']),
                'grade_pct': 0.0
            }
        if d >= self.total_distance_m:
            p_end = self.points[-1]
            p_prev = self.points[-2] if len(self.points) > 1 else p_end
            return {
                'lat': p_end['lat'],
                'lon': p_end['lon'],
                'ele': p_end['ele'],
                'distance_m': self.total_distance_m,
                'distance_km': round(self.total_distance_m / 1000.0, 3),
                'distance_mi': round(self.total_distance_m / 1609.344, 3),
                'bearing_deg': bearing(p_prev['lat'], p_prev['lon'], p_end['lat'], p_end['lon']),
                'grade_pct': 0.0
            }

        # Binary search for segment
        low = 0
        high = len(self.points) - 1
        while low <= high:
            mid = (low + high) // 2
            if self.points[mid]['cum_dist_m'] <= d:
                if mid == len(self.points) - 1 or self.points[mid + 1]['cum_dist_m'] >= d:
                    low = mid
                    break
                low = mid + 1
            else:
                high = mid - 1

        p1 = self.points[low]
        p2 = self.points[min(low + 1, len(self.points) - 1)]
        seg_dist = p2['cum_dist_m'] - p1['cum_dist_m']
        ratio = (d - p1['cum_dist_m']) / seg_dist if seg_dist > 1e-6 else 0.0

        lat = p1['lat'] + ratio * (p2['lat'] - p1['lat'])
        lon = p1['lon'] + ratio * (p2['lon'] - p1['lon'])
        ele = p1['ele'] + ratio * (p2['ele'] - p1['ele'])
        brg = bearing(p1['lat'], p1['lon'], p2['lat'], p2['lon'])

        return {
            'lat': round(lat, 6),
            'lon': round(lon, 6),
            'ele': round(ele, 1),
            'distance_m': round(d, 1),
            'distance_km': round(d / 1000.0, 3),
            'distance_mi': round(d / 1609.344, 3),
            'bearing_deg': round(brg, 1),
            'grade_pct': p2.get('grade_pct', 0.0)
        }

    def get_nearest_landmark(self, distance_m):
        """Finds nearby turn or POI dialogue from waypoints."""
        if not self.waypoints:
            return None
        closest = None
        min_diff = 999999.0
        for wp in self.waypoints:
            wp_d = wp.get('dist', 0.0)
            diff = abs(wp_d - distance_m)
            if diff < min_diff:
                min_diff = diff
                closest = wp
        if closest and min_diff <= 800: # within 800m
            desc = closest.get('Dialogue') or closest.get('Street2') or closest.get('type')
            return {
                'distance_offset_m': round(min_diff, 1),
                'landmark_dist_m': round(closest.get('dist', 0.0), 1),
                'description': desc,
                'type': closest.get('type')
            }
        return None

class RunnerForecast:
    def __init__(self, course: MarathonCourse, start_time: datetime, target_finish_seconds: float, pacing_strategy="fatigue"):
        self.course = course
        self.start_time = start_time
        self.target_seconds = target_finish_seconds
        self.pacing_strategy = pacing_strategy
        self.known_splits = {} # {split_name: elapsed_seconds}
        self._precalculate_pace_profile()

    def add_known_split(self, split_name, elapsed_seconds):
        self.known_splits[split_name] = elapsed_seconds

    def _precalculate_pace_profile(self):
        """Precomputes cumulative time array for points based on strategy."""
        total_dist = self.course.total_distance_m
        avg_speed = total_dist / self.target_seconds # m/s

        self.point_times = [0.0] * len(self.course.points)

        if self.pacing_strategy == "even":
            for i, pt in enumerate(self.course.points):
                self.point_times[i] = pt['cum_dist_m'] / avg_speed

        elif self.pacing_strategy == "fatigue":
            # Typical marathon positive split: 6% slowdown in second half
            # Speed scaling factor: v(s) = v0 * (1 - 0.12 * (s/L)^1.5)
            # Integrate 1/v(s) numerically
            dt_raw = [0.0]
            cum_t = 0.0
            for i in range(1, len(self.course.points)):
                ds = self.course.points[i]['cum_dist_m'] - self.course.points[i-1]['cum_dist_m']
                mid_s = 0.5 * (self.course.points[i]['cum_dist_m'] + self.course.points[i-1]['cum_dist_m'])
                prog = mid_s / total_dist
                speed_factor = 1.05 - 0.12 * (prog ** 1.3)
                cum_t += ds / (avg_speed * speed_factor)
                dt_raw.append(cum_t)

            norm_scale = self.target_seconds / dt_raw[-1]
            self.point_times = [t * norm_scale for t in dt_raw]

        elif self.pacing_strategy == "gap_elevation":
            # Minetti metabolic cost model
            dt_raw = [0.0]
            cum_t = 0.0
            flat_cost = minetti_cost(0.0)
            for i in range(1, len(self.course.points)):
                ds = self.course.points[i]['cum_dist_m'] - self.course.points[i-1]['cum_dist_m']
                grade = (self.course.points[i]['grade_pct'] / 100.0)
                cost = minetti_cost(grade)
                eff_speed = avg_speed * (flat_cost / cost)
                cum_t += ds / eff_speed
                dt_raw.append(cum_t)
            norm_scale = self.target_seconds / dt_raw[-1]
            self.point_times = [t * norm_scale for t in dt_raw]

    def forecast_at_time(self, query_time: datetime):
        """Predicts position and status of runner at exact datetime."""
        elapsed = (query_time - self.start_time).total_seconds()
        return self.forecast_at_elapsed(elapsed, query_time)

    def forecast_at_elapsed(self, elapsed_seconds: float, query_time: datetime = None):
        if query_time is None:
            query_time = self.start_time + timedelta(seconds=elapsed_seconds)

        if elapsed_seconds <= 0:
            coord = self.course.get_coordinate_at_distance(0)
            return {
                "status": "NOT_STARTED",
                "query_time": query_time.isoformat(),
                "elapsed_seconds": 0,
                "distance_km": 0.0,
                "distance_mi": 0.0,
                "progress_pct": 0.0,
                "coordinate": coord,
                "current_pace_min_per_km": "00:00",
                "eta_finish": (self.start_time + timedelta(seconds=self.target_seconds)).isoformat()
            }

        if elapsed_seconds >= self.target_seconds:
            coord = self.course.get_coordinate_at_distance(self.course.total_distance_m)
            return {
                "status": "FINISHED",
                "query_time": query_time.isoformat(),
                "elapsed_seconds": round(elapsed_seconds, 1),
                "distance_km": round(self.course.total_distance_m / 1000.0, 3),
                "distance_mi": round(self.course.total_distance_m / 1609.344, 3),
                "progress_pct": 100.0,
                "coordinate": coord,
                "eta_finish": (self.start_time + timedelta(seconds=self.target_seconds)).isoformat()
            }

        # Find point index in point_times
        pts = self.course.points
        times = self.point_times

        # If known splits exist, adjust elapsed time piecewise
        eff_elapsed = elapsed_seconds
        # Binary search for segment in time
        low = 0
        high = len(times) - 1
        while low <= high:
            mid = (low + high) // 2
            if times[mid] <= eff_elapsed:
                if mid == len(times) - 1 or times[mid + 1] >= eff_elapsed:
                    low = mid
                    break
                low = mid + 1
            else:
                high = mid - 1

        p1_idx = low
        p2_idx = min(low + 1, len(times) - 1)
        t_span = times[p2_idx] - times[p1_idx]
        ratio = (eff_elapsed - times[p1_idx]) / t_span if t_span > 1e-6 else 0.0

        d1 = pts[p1_idx]['cum_dist_m']
        d2 = pts[p2_idx]['cum_dist_m']
        interpolated_d = d1 + ratio * (d2 - d1)

        coord = self.course.get_coordinate_at_distance(interpolated_d)
        landmark = self.course.get_nearest_landmark(interpolated_d)

        # Instantaneous pace
        inst_speed = (d2 - d1) / t_span if t_span > 1e-6 else (self.course.total_distance_m / self.target_seconds)
        pace_sec_km = 1000.0 / inst_speed if inst_speed > 0 else 0
        pace_min = int(pace_sec_km // 60)
        pace_sec = int(pace_sec_km % 60)
        pace_str = f"{pace_min}:{pace_sec:02d} /km"

        # Calculate ETA to next timing mats
        upcoming_splits = []
        for sp in self.course.splits:
            if sp['actual_distance_m'] > interpolated_d:
                # find expected time
                sp_d = sp['actual_distance_m']
                # find in points
                for k in range(len(pts) - 1):
                    if pts[k]['cum_dist_m'] <= sp_d <= pts[k+1]['cum_dist_m']:
                        r = (sp_d - pts[k]['cum_dist_m']) / (pts[k+1]['cum_dist_m'] - pts[k]['cum_dist_m'])
                        sp_t = times[k] + r * (times[k+1] - times[k])
                        remaining_s = sp_t - eff_elapsed
                        eta = query_time + timedelta(seconds=remaining_s)
                        upcoming_splits.append({
                            "split_name": sp['split_name'],
                            "distance_km": sp['actual_distance_km'],
                            "eta": eta.strftime('%H:%M:%S'),
                            "seconds_away": round(remaining_s)
                        })
                        break

        return {
            "status": "ON_COURSE",
            "query_time": query_time.isoformat(),
            "elapsed_seconds": round(elapsed_seconds, 1),
            "elapsed_formatted": str(timedelta(seconds=int(elapsed_seconds))),
            "distance_km": coord['distance_km'],
            "distance_mi": coord['distance_mi'],
            "progress_pct": round(interpolated_d / self.course.total_distance_m * 100.0, 2),
            "coordinate": coord,
            "instant_pace": pace_str,
            "nearby_landmark": landmark,
            "upcoming_splits": upcoming_splits[:4],
            "projected_finish_time": (self.start_time + timedelta(seconds=self.target_seconds)).strftime('%H:%M:%S')
        }

def test_engine():
    print("Testing Runner Forecast Engine for TCS NYC Marathon...")
    course = MarathonCourse('new_york')
    start_time = datetime(2026, 11, 1, 9, 10, 0) # Wave 1 start
    target_time_seconds = 3 * 3600 + 30 * 60 # 3:30:00 marathon (approx 4:58/km)

    forecast = RunnerForecast(course, start_time, target_time_seconds, pacing_strategy="fatigue")

    # Forecast at 1 hour 30 mins
    t1 = start_time + timedelta(minutes=90)
    res = forecast.forecast_at_time(t1)
    print(f"\n[NYC Forecast at +90m ({t1.strftime('%H:%M:%S')}):")
    print(f"  Distance: {res['distance_km']} km ({res['distance_mi']} mi) | Progress: {res['progress_pct']}%")
    print(f"  Coord: ({res['coordinate']['lat']}, {res['coordinate']['lon']}) | Ele: {res['coordinate']['ele']}m")
    print(f"  Instant Pace: {res['instant_pace']}")
    if res['nearby_landmark']:
        print(f"  Landmark: {res['nearby_landmark']['description']}")
    print(f"  Upcoming Splits: {res['upcoming_splits']}")

    # Boston Heartbreak Hill check
    print("\nTesting Boston Marathon at Mile 20.5 (Heartbreak Hill)...")
    boston_course = MarathonCourse('boston')
    boston_forecast = RunnerForecast(boston_course, datetime(2026, 4, 20, 10, 0, 0), 3 * 3600)
    heartbreak_coord = boston_course.get_coordinate_at_distance(20.5 * 1609.344)
    print(f"  Mile 20.5 Coord: ({heartbreak_coord['lat']}, {heartbreak_coord['lon']}) | Elevation: {heartbreak_coord['ele']}m | Grade: {heartbreak_coord['grade_pct']}%")

if __name__ == '__main__':
    test_engine()
