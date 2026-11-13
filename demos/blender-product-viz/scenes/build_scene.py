"""
Blender scene builder for the Meridian "Aster" desk lamp product shoot.

Run headless:
    blender --background --python scenes/build_scene.py -- --preset studio_white
Or open Blender and run it from the Scripting workspace.

Builds the product, materials, three-point lighting, a seamless backdrop and
six camera angles, then optionally renders stills and a turntable.

Written for Blender 4.2 LTS (Cycles). Nothing here has been rendered by the
author of this file — see RENDER_STATUS.md.
"""

import argparse
import math
import os
import sys

try:
    import bpy
    import mathutils
except ImportError:  # pragma: no cover - importable outside Blender for linting
    bpy = None
    mathutils = None


# ── Presets ─────────────────────────────────────────────────────────────────
PRESETS = {
    "studio_white": {
        "backdrop": (0.92, 0.92, 0.93, 1.0),
        "key_energy": 450.0,
        "fill_energy": 120.0,
        "rim_energy": 300.0,
        "world_strength": 0.35,
    },
    "studio_charcoal": {
        "backdrop": (0.07, 0.075, 0.085, 1.0),
        "key_energy": 520.0,
        "fill_energy": 90.0,
        "rim_energy": 420.0,
        "world_strength": 0.15,
    },
    "warm_desk": {
        "backdrop": (0.76, 0.69, 0.58, 1.0),
        "key_energy": 380.0,
        "fill_energy": 150.0,
        "rim_energy": 240.0,
        "world_strength": 0.45,
    },
}

# Six angles: (name, azimuth degrees, elevation degrees, distance m, focal mm)
CAMERA_ANGLES = [
    ("hero_three_quarter", 35.0, 12.0, 1.05, 85.0),
    ("front_elevation", 0.0, 4.0, 1.10, 105.0),
    ("profile_left", 90.0, 6.0, 1.05, 85.0),
    ("top_down", 0.0, 78.0, 1.20, 50.0),
    ("detail_shade", 48.0, 28.0, 0.55, 135.0),
    ("detail_base", -40.0, -6.0, 0.60, 135.0),
]

TURNTABLE_FRAMES = 120


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras):
        for item in list(block):
            if item.users == 0:
                block.remove(item)


def make_material(name, base_color, roughness, metallic=0.0, emission=None, clearcoat=0.0):
    """Principled BSDF material. Emission is a (colour, strength) pair."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = base_color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = clearcoat
    if emission is not None:
        colour, strength = emission
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = colour
            bsdf.inputs["Emission Strength"].default_value = strength
    return mat


def build_product():
    """
    The Aster desk lamp: weighted base, slim stem, articulated head.
    Dimensions in metres, modelled to the published spec in specs/product-spec.md.
    """
    parts = []

    bpy.ops.mesh.primitive_cylinder_add(radius=0.085, depth=0.018, location=(0, 0, 0.009))
    base = bpy.context.active_object
    base.name = "lamp_base"
    bpy.ops.object.shade_smooth()
    bevel = base.modifiers.new("Bevel", "BEVEL")
    bevel.width = 0.003
    bevel.segments = 4
    parts.append(base)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.009, depth=0.42, location=(0, 0, 0.228))
    stem = bpy.context.active_object
    stem.name = "lamp_stem"
    bpy.ops.object.shade_smooth()
    parts.append(stem)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.016, location=(0, 0, 0.438))
    joint = bpy.context.active_object
    joint.name = "lamp_joint"
    bpy.ops.object.shade_smooth()
    parts.append(joint)

    bpy.ops.mesh.primitive_cone_add(radius1=0.062, radius2=0.030, depth=0.085, location=(0.055, 0, 0.455))
    head = bpy.context.active_object
    head.name = "lamp_head"
    head.rotation_euler = (0, math.radians(118), 0)
    bpy.ops.object.shade_smooth()
    solid = head.modifiers.new("Solidify", "SOLIDIFY")
    solid.thickness = 0.0015
    parts.append(head)

    bpy.ops.mesh.primitive_circle_add(radius=0.029, fill_type="NGON", location=(0.093, 0, 0.425))
    diffuser = bpy.context.active_object
    diffuser.name = "lamp_diffuser"
    diffuser.rotation_euler = (0, math.radians(118), 0)
    parts.append(diffuser)

    return parts


def assign_materials(parts, finish="graphite"):
    palettes = {
        "graphite": ((0.055, 0.058, 0.063, 1.0), (0.72, 0.73, 0.75, 1.0)),
        "sand": ((0.78, 0.72, 0.62, 1.0), (0.85, 0.82, 0.76, 1.0)),
        "sage": ((0.42, 0.52, 0.44, 1.0), (0.80, 0.83, 0.80, 1.0)),
    }
    body_colour, metal_colour = palettes.get(finish, palettes["graphite"])

    body = make_material(f"aster_body_{finish}", body_colour, roughness=0.38, clearcoat=0.25)
    metal = make_material("aster_metal", metal_colour, roughness=0.22, metallic=1.0)
    glow = make_material("aster_diffuser", (1.0, 0.96, 0.90, 1.0), roughness=0.55, emission=((1.0, 0.93, 0.82, 1.0), 14.0))

    by_name = {o.name: o for o in parts}
    for name, mat in (
        ("lamp_base", body),
        ("lamp_stem", metal),
        ("lamp_joint", metal),
        ("lamp_head", body),
        ("lamp_diffuser", glow),
    ):
        obj = by_name.get(name)
        if obj is not None:
            obj.data.materials.clear()
            obj.data.materials.append(mat)


def build_backdrop(colour):
    """Seamless curved sweep, so there is no visible horizon line."""
    bpy.ops.mesh.primitive_plane_add(size=6.0, location=(0, 0, 0))
    floor = bpy.context.active_object
    floor.name = "backdrop"
    mat = make_material("backdrop", colour, roughness=0.9)
    floor.data.materials.append(mat)

    bpy.ops.mesh.primitive_plane_add(size=6.0, location=(0, 2.0, 2.0), rotation=(math.radians(90), 0, 0))
    wall = bpy.context.active_object
    wall.name = "backdrop_wall"
    wall.data.materials.append(mat)
    bevel = wall.modifiers.new("Bevel", "BEVEL")
    bevel.width = 0.8
    bevel.segments = 12
    return floor, wall


def build_lighting(preset):
    """Three-point lighting: key, fill and rim, plus a soft world ambient."""
    lights = []

    bpy.ops.object.light_add(type="AREA", location=(-0.85, -0.95, 1.30))
    key = bpy.context.active_object
    key.name = "key_light"
    key.data.energy = preset["key_energy"]
    key.data.size = 1.1
    key.rotation_euler = (math.radians(48), 0, math.radians(-42))
    lights.append(key)

    bpy.ops.object.light_add(type="AREA", location=(1.15, -0.75, 0.75))
    fill = bpy.context.active_object
    fill.name = "fill_light"
    fill.data.energy = preset["fill_energy"]
    fill.data.size = 1.6
    fill.rotation_euler = (math.radians(68), 0, math.radians(56))
    lights.append(fill)

    bpy.ops.object.light_add(type="AREA", location=(0.35, 1.25, 1.05))
    rim = bpy.context.active_object
    rim.name = "rim_light"
    rim.data.energy = preset["rim_energy"]
    rim.data.size = 0.5
    rim.rotation_euler = (math.radians(118), 0, math.radians(14))
    lights.append(rim)

    world = bpy.context.scene.world
    if world is None:
        world = bpy.data.worlds.new("World")
        bpy.context.scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = preset["world_strength"]

    return lights


def spherical_to_cartesian(azimuth_deg, elevation_deg, distance, target_z):
    az = math.radians(azimuth_deg)
    el = math.radians(elevation_deg)
    x = distance * math.cos(el) * math.sin(az)
    y = -distance * math.cos(el) * math.cos(az)
    z = target_z + distance * math.sin(el)
    return (x, y, z)


def add_cameras(target_z=0.30):
    """One camera per angle, each aimed at the product with a Track To constraint."""
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, target_z))
    target = bpy.context.active_object
    target.name = "camera_target"

    cameras = []
    for name, az, el, dist, focal in CAMERA_ANGLES:
        location = spherical_to_cartesian(az, el, dist, target_z)
        bpy.ops.object.camera_add(location=location)
        cam = bpy.context.active_object
        cam.name = f"cam_{name}"
        cam.data.lens = focal
        cam.data.dof.use_dof = True
        cam.data.dof.focus_object = target
        cam.data.dof.aperture_fstop = 4.0 if "detail" in name else 8.0
        constraint = cam.constraints.new("TRACK_TO")
        constraint.target = target
        constraint.track_axis = "TRACK_NEGATIVE_Z"
        constraint.up_axis = "UP_Y"
        cameras.append(cam)

    bpy.context.scene.camera = cameras[0]
    return cameras, target


def add_turntable(parts, frames=TURNTABLE_FRAMES):
    """Spin the product, not the camera, so the lighting stays consistent."""
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0))
    pivot = bpy.context.active_object
    pivot.name = "turntable_pivot"
    for obj in parts:
        obj.parent = pivot

    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = frames

    pivot.rotation_euler = (0, 0, 0)
    pivot.keyframe_insert("rotation_euler", frame=1)
    pivot.rotation_euler = (0, 0, math.radians(360))
    pivot.keyframe_insert("rotation_euler", frame=frames + 1)

    for fcurve in pivot.animation_data.action.fcurves:
        for kp in fcurve.keyframe_points:
            kp.interpolation = "LINEAR"
    return pivot


def configure_render(samples=256, resolution=(2000, 2500)):
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    scene.render.resolution_x, scene.render.resolution_y = resolution
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = False
    scene.view_settings.view_transform = "AgX"
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    return scene


def render_stills(cameras, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    scene = bpy.context.scene
    for cam in cameras:
        scene.camera = cam
        scene.render.filepath = os.path.join(out_dir, f"{cam.name}.png")
        bpy.ops.render.render(write_still=True)


def render_turntable(out_dir, camera):
    os.makedirs(out_dir, exist_ok=True)
    scene = bpy.context.scene
    scene.camera = camera
    scene.render.filepath = os.path.join(out_dir, "turntable_")
    scene.render.image_settings.file_format = "PNG"
    bpy.ops.render.render(animation=True)


def parse_args(argv):
    parser = argparse.ArgumentParser(description="Build the Aster desk lamp scene.")
    parser.add_argument("--preset", default="studio_white", choices=sorted(PRESETS))
    parser.add_argument("--finish", default="graphite", choices=["graphite", "sand", "sage"])
    parser.add_argument("--samples", type=int, default=256)
    parser.add_argument("--render-stills", action="store_true")
    parser.add_argument("--render-turntable", action="store_true")
    parser.add_argument("--out", default="renders")
    parser.add_argument("--save-blend", default="")
    return parser.parse_args(argv)


def main(argv):
    args = parse_args(argv)
    preset = PRESETS[args.preset]

    clear_scene()
    parts = build_product()
    assign_materials(parts, args.finish)
    build_backdrop(preset["backdrop"])
    build_lighting(preset)
    cameras, _ = add_cameras()
    add_turntable(parts)
    configure_render(samples=args.samples)

    if args.save_blend:
        bpy.ops.wm.save_as_mainfile(filepath=args.save_blend)
    if args.render_stills:
        render_stills(cameras, args.out)
    if args.render_turntable:
        render_turntable(os.path.join(args.out, "turntable"), cameras[0])

    print(f"Scene built: {len(parts)} product parts, {len(cameras)} cameras, preset {args.preset}, finish {args.finish}.")


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    main(argv)
