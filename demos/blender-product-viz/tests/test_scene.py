"""
Tests for the parts of the scene builder that do not need Blender.

Blender is not installed here, so `import bpy` fails and the module sets
`bpy = None`. Everything below exercises the pure maths and configuration:
camera placement, presets, argument parsing and the angle table. The modelling
and rendering functions can only be verified by running Blender — see
RENDER_STATUS.md.

Run:  python3 -m unittest discover -s tests -v
"""

import math
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scenes"))

import build_scene as bs  # noqa: E402


class TestCameraMaths(unittest.TestCase):
    def test_front_camera_sits_in_front_of_the_product(self):
        x, y, z = bs.spherical_to_cartesian(0.0, 0.0, 1.0, 0.3)
        self.assertAlmostEqual(x, 0.0, places=6)
        self.assertAlmostEqual(y, -1.0, places=6)
        self.assertAlmostEqual(z, 0.3, places=6)

    def test_ninety_degrees_swings_to_the_side(self):
        x, y, _ = bs.spherical_to_cartesian(90.0, 0.0, 1.0, 0.0)
        self.assertAlmostEqual(x, 1.0, places=6)
        self.assertAlmostEqual(y, 0.0, places=6)

    def test_elevation_raises_the_camera_and_pulls_it_in(self):
        _, y_low, z_low = bs.spherical_to_cartesian(0.0, 0.0, 1.0, 0.0)
        _, y_high, z_high = bs.spherical_to_cartesian(0.0, 60.0, 1.0, 0.0)
        self.assertGreater(z_high, z_low)
        self.assertLess(abs(y_high), abs(y_low))

    def test_distance_is_preserved_from_the_target(self):
        target_z = 0.3
        for az in (-40.0, 0.0, 35.0, 90.0, 180.0):
            for el in (-6.0, 0.0, 28.0, 78.0):
                x, y, z = bs.spherical_to_cartesian(az, el, 1.05, target_z)
                radius = math.sqrt(x * x + y * y + (z - target_z) ** 2)
                self.assertAlmostEqual(radius, 1.05, places=6, msg=f"az={az} el={el}")

    def test_negative_elevation_drops_below_the_target(self):
        _, _, z = bs.spherical_to_cartesian(0.0, -20.0, 1.0, 0.3)
        self.assertLess(z, 0.3)


class TestCameraAngles(unittest.TestCase):
    def test_six_distinct_named_angles(self):
        names = [a[0] for a in bs.CAMERA_ANGLES]
        self.assertEqual(len(names), 6)
        self.assertEqual(len(set(names)), 6)

    def test_every_angle_is_physically_sensible(self):
        for name, az, el, dist, focal in bs.CAMERA_ANGLES:
            self.assertGreater(dist, 0.1, name)
            self.assertLess(dist, 5.0, name)
            self.assertGreaterEqual(focal, 24.0, name)
            self.assertLessEqual(focal, 200.0, name)
            self.assertGreaterEqual(el, -45.0, name)
            self.assertLessEqual(el, 89.0, name)

    def test_detail_shots_are_closer_and_longer_than_the_hero(self):
        by_name = {a[0]: a for a in bs.CAMERA_ANGLES}
        hero = by_name["hero_three_quarter"]
        for detail in ("detail_shade", "detail_base"):
            self.assertLess(by_name[detail][3], hero[3], detail)
            self.assertGreater(by_name[detail][4], hero[4], detail)

    def test_no_camera_is_placed_inside_the_product(self):
        # The lamp is about 0.5m tall and 0.17m wide, so nothing should sit
        # within 0.25m of the centre line.
        for name, az, el, dist, _ in bs.CAMERA_ANGLES:
            x, y, _ = bs.spherical_to_cartesian(az, el, dist, 0.3)
            self.assertGreater(math.hypot(x, y), 0.2, name)


class TestPresets(unittest.TestCase):
    def test_each_preset_defines_every_required_key(self):
        required = {"backdrop", "key_energy", "fill_energy", "rim_energy", "world_strength"}
        for name, preset in bs.PRESETS.items():
            self.assertEqual(required, set(preset), name)

    def test_backdrop_is_a_valid_rgba_colour(self):
        for name, preset in bs.PRESETS.items():
            colour = preset["backdrop"]
            self.assertEqual(len(colour), 4, name)
            for channel in colour:
                self.assertGreaterEqual(channel, 0.0, name)
                self.assertLessEqual(channel, 1.0, name)

    def test_key_light_is_always_the_strongest(self):
        for name, preset in bs.PRESETS.items():
            self.assertGreater(preset["key_energy"], preset["fill_energy"], name)
            self.assertGreater(preset["key_energy"], preset["rim_energy"], name)

    def test_darker_backdrops_use_less_ambient_light(self):
        white = bs.PRESETS["studio_white"]
        charcoal = bs.PRESETS["studio_charcoal"]
        self.assertGreater(sum(white["backdrop"][:3]), sum(charcoal["backdrop"][:3]))
        self.assertGreater(white["world_strength"], charcoal["world_strength"])


class TestArguments(unittest.TestCase):
    def test_defaults(self):
        args = bs.parse_args([])
        self.assertEqual(args.preset, "studio_white")
        self.assertEqual(args.finish, "graphite")
        self.assertEqual(args.samples, 256)
        self.assertFalse(args.render_stills)
        self.assertFalse(args.render_turntable)

    def test_overrides(self):
        args = bs.parse_args(["--preset", "warm_desk", "--finish", "sage", "--samples", "64", "--render-stills"])
        self.assertEqual(args.preset, "warm_desk")
        self.assertEqual(args.finish, "sage")
        self.assertEqual(args.samples, 64)
        self.assertTrue(args.render_stills)

    def test_unknown_preset_is_rejected(self):
        with self.assertRaises(SystemExit):
            bs.parse_args(["--preset", "nope"])


class TestTurntable(unittest.TestCase):
    def test_frame_count_divides_a_full_rotation_evenly(self):
        self.assertEqual(360 % bs.TURNTABLE_FRAMES, 0)
        self.assertEqual(360 / bs.TURNTABLE_FRAMES, 3.0)

    def test_frame_count_suits_common_frame_rates(self):
        for fps in (24, 30, 60):
            self.assertEqual(bs.TURNTABLE_FRAMES % fps, 0, f"{fps}fps would not loop cleanly")


class TestModuleContract(unittest.TestCase):
    def test_imports_without_blender(self):
        self.assertIsNone(bs.bpy, "bpy should be None outside Blender so the module stays importable")

    def test_every_documented_entry_point_exists(self):
        for fn in ("build_product", "assign_materials", "build_lighting", "add_cameras", "add_turntable", "render_stills", "render_turntable", "main"):
            self.assertTrue(callable(getattr(bs, fn, None)), fn)


if __name__ == "__main__":
    unittest.main()
